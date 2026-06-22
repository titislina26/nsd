import express from 'express'
import { queryAll, queryOne } from '../db/connection.js'

const router = express.Router()

router.get('/summary', async (req, res, next) => {
  try {
    // 1. Total expense amount
    const totalAmountRes = await queryOne('SELECT SUM(amount) as total FROM carf_expenses')
    const totalExpenseAmount = totalAmountRes ? Number(totalAmountRes.total || 0) : 0

    // 2. Pending count (unpaid or not done)
    const pendingRes = await queryOne("SELECT COUNT(*) as count FROM carf_expenses WHERE status_document != 'DONE' OR status_disbursement = 'UNPAID'")
    const pendingCount = pendingRes ? Number(pendingRes.count || 0) : 0

    // 3. Pekerjaan selesai (status_document = 'DONE') & Total disbursed (status_disbursement = 'PAID')
    const totalCountRes = await queryOne('SELECT COUNT(*) as count FROM carf_expenses')
    const totalCount = totalCountRes ? Number(totalCountRes.count || 0) : 0

    const paidRes = await queryOne("SELECT SUM(amount) as total FROM carf_expenses WHERE status_disbursement = 'PAID'")
    const totalDisbursed = paidRes ? Number(paidRes.total || 0) : 0

    const doneRes = await queryOne("SELECT COUNT(*) as count FROM carf_expenses WHERE status_document = 'DONE'")
    const doneCount = doneRes ? Number(doneRes.count || 0) : 0
    const paidPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

    // 4. Expenses by Area (adjusted GROUP BY for Postgres strictness)
    const expensesByAreaRaw = await queryAll(`
      SELECT COALESCE(t.area, 'UNKNOWN') as area, SUM(e.amount) as total, COUNT(e.id) as count
      FROM carf_expenses e
      LEFT JOIN tasks t ON e.task_id = t.id
      GROUP BY t.area
      ORDER BY total DESC
    `)
    const expensesByArea = expensesByAreaRaw.map(row => ({
      area: row.area,
      total: Number(row.total || 0),
      count: Number(row.count || 0)
    }))

    // 5. Top Requestors (adjusted GROUP BY for Postgres strictness)
    const topRequestorsRaw = await queryAll(`
      SELECT e.requestor_id as id, COALESCE(u.name, e.requestor_id) as name, COUNT(e.id) as count, COALESCE(u.area, '-') as area
      FROM carf_expenses e
      LEFT JOIN users u ON e.requestor_id = u.id
      GROUP BY e.requestor_id, u.name, u.area
      ORDER BY count DESC
      LIMIT 5
    `)
    const topRequestors = topRequestorsRaw.map(row => ({
      id: row.id,
      name: row.name,
      count: Number(row.count || 0),
      area: row.area
    }))

    res.json({
      totalExpenseAmount,
      pendingCount,
      paidPercentage,
      totalDisbursed,
      doneCount,
      totalCount,
      expensesByArea,
      topRequestors
    })
  } catch (error) {
    next(error)
  }
})

export default router
