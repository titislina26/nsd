import express from 'express'
import { queryAll, queryOne, execute } from '../db/connection.js'
import { generateNextId } from '../utils/id.js'
import { upload } from '../middleware/upload.js'
import { uploadToSupabase } from '../db/storage.js'

const router = express.Router()

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const { status_document, status_disbursement } = req.query
    let sql = 'SELECT * FROM carf_expenses WHERE 1=1'
    const params = []

    if (status_document) {
      sql += ' AND status_document = ?'
      params.push(status_document)
    }
    if (status_disbursement) {
      sql += ' AND status_disbursement = ?'
      params.push(status_disbursement)
    }

    sql += ' ORDER BY created_at DESC, document_number DESC'
    const expenses = await queryAll(sql, params)
    res.json(expenses)
  } catch (error) {
    next(error)
  }
})

// GET /api/expenses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    res.json(expense)
  } catch (error) {
    next(error)
  }
})

// POST /api/expenses
router.post('/', async (req, res, next) => {
  try {
    const {
      document_number, request_date, requestor_id, requestor_name, task_id, technician_id, technician_name,
      expense_category, description, description_other, amount, status_document, status_disbursement,
      pengajuan_number
    } = req.body

    if (!document_number || !request_date || !description) {
      return res.status(400).json({ error: 'Required fields missing' })
    }

    // Check unique document_number
    const checkDoc = await queryOne('SELECT COUNT(*) as count FROM carf_expenses WHERE document_number = ?', [document_number])
    if (checkDoc && Number(checkDoc.count) > 0) {
      return res.status(400).json({ error: 'Document number already exists' })
    }

    const id = await generateNextId('EXP')
    const createdAt = new Date().toISOString().split('T')[0]

    // Resolve IDs
    let resolvedTechId = technician_id || null
    if (!resolvedTechId && technician_name) {
      const foundTech = await queryOne('SELECT id FROM technicians WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [technician_name])
      if (foundTech) resolvedTechId = foundTech.id
    }
    let resolvedReqId = requestor_id || null
    if (!resolvedReqId && requestor_name) {
      const foundUser = await queryOne('SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [requestor_name])
      if (foundUser) resolvedReqId = foundUser.id
    }

    await execute(
      `INSERT INTO carf_expenses (
        id, document_number, request_date, requestor_id, requestor_name, task_id, technician_id, technician_name,
        division, expense_category, description, description_other, amount, status_document,
        status_disbursement, disbursement_date, transfer_receipt_url, created_at, pengajuan_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NSO', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
      [
        id, document_number, request_date, resolvedReqId, requestor_name || null, task_id || null, resolvedTechId, technician_name || null,
        expense_category || 'Lain-lain', description, description_other || null, Number(amount) || 0,
        status_document || 'NOT_YET', status_disbursement || 'UNPAID', createdAt, pengajuan_number || null
      ]
    )

    const newExpense = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [id])
    res.status(201).json(newExpense)
  } catch (error) {
    next(error)
  }
})

// POST /api/expenses/bulk
router.post('/bulk', async (req, res, next) => {
  try {
    const expenses = req.body
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Body must be an array of expenses' })
    }

    const inserted = []
    const createdAt = new Date().toISOString().split('T')[0]

    for (const exp of expenses) {
      let techId = exp.technician_id || null
      if (!techId && exp.technician_name) {
        const foundTech = await queryOne(
          'SELECT id FROM technicians WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [exp.technician_name]
        )
        if (foundTech) {
          techId = foundTech.id
        }
      }

      let reqId = exp.requestor_id || null
      if (!reqId && exp.requestor_name) {
        const foundUser = await queryOne(
          'SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [exp.requestor_name]
        )
        if (foundUser) {
          reqId = foundUser.id
        }
      }

      let docNum = exp.document_number
      const checkDoc = await queryOne('SELECT COUNT(*) as count FROM carf_expenses WHERE document_number = ?', [docNum])
      if (checkDoc && Number(checkDoc.count) > 0) {
        // Generate suffix
        docNum = `${docNum}-${Math.floor(10 + Math.random() * 90)}`
      }

      const id = await generateNextId('EXP')

      await execute(
        `INSERT INTO carf_expenses (
          id, document_number, request_date, requestor_id, requestor_name, task_id, technician_id, technician_name,
          division, expense_category, description, description_other, amount, status_document,
          status_disbursement, disbursement_date, transfer_receipt_url, created_at, pengajuan_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NSO', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, docNum, exp.request_date, reqId, exp.requestor_name || null, exp.task_id || null, techId, exp.technician_name || null,
          exp.expense_category || 'Lain-lain', exp.description, exp.description_other || null, Number(exp.amount) || 0,
          exp.status_document || 'NOT_YET', exp.status_disbursement || 'UNPAID',
          exp.disbursement_date || null, exp.transfer_receipt_url || null, createdAt, exp.pengajuan_number || null
        ]
      )

      inserted.push(await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [id]))
    }

    res.status(201).json(inserted)
  } catch (error) {
    next(error)
  }
})

// PUT /api/expenses/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      document_number, request_date, requestor_id, requestor_name, task_id, technician_id, technician_name,
      expense_category, description, description_other, amount, status_document, status_disbursement,
      disbursement_date, pengajuan_number
    } = req.body

    const expense = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    if (document_number && document_number !== expense.document_number) {
      const checkDoc = await queryOne(
        'SELECT COUNT(*) as count FROM carf_expenses WHERE document_number = ? AND id != ?',
        [document_number, req.params.id]
      )
      if (checkDoc && Number(checkDoc.count) > 0) {
        return res.status(400).json({ error: 'Document number already exists' })
      }
    }

    let resolvedTechId = technician_id || expense.technician_id
    if (technician_name && technician_name !== expense.technician_name) {
      const foundTech = await queryOne('SELECT id FROM technicians WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [technician_name])
      resolvedTechId = foundTech ? foundTech.id : null
    }
    let resolvedReqId = requestor_id || expense.requestor_id
    if (requestor_name && requestor_name !== expense.requestor_name) {
      const foundUser = await queryOne('SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [requestor_name])
      resolvedReqId = foundUser ? foundUser.id : null
    }

    await execute(
      `UPDATE carf_expenses SET
        document_number = ?, request_date = ?, requestor_id = ?, requestor_name = ?, task_id = ?, technician_id = ?, technician_name = ?,
        expense_category = ?, description = ?, description_other = ?, amount = ?, status_document = ?, status_disbursement = ?,
        disbursement_date = ?, pengajuan_number = ?
      WHERE id = ?`,
      [
        document_number || expense.document_number,
        request_date || expense.request_date,
        resolvedReqId,
        requestor_name !== undefined ? requestor_name : expense.requestor_name,
        task_id !== undefined ? task_id : expense.task_id,
        resolvedTechId,
        technician_name !== undefined ? technician_name : expense.technician_name,
        expense_category || expense.expense_category,
        description || expense.description,
        description_other !== undefined ? description_other : expense.description_other,
        amount !== undefined ? Number(amount) : expense.amount,
        status_document || expense.status_document,
        status_disbursement || expense.status_disbursement,
        disbursement_date !== undefined ? disbursement_date : expense.disbursement_date,
        pengajuan_number !== undefined ? pengajuan_number : expense.pengajuan_number,
        req.params.id
      ]
    )

    const updated = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/expenses/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status_document, status_disbursement } = req.body
    const expense = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    const nextDocStatus = status_document !== undefined ? status_document : expense.status_document
    const nextDisbStatus = status_disbursement !== undefined ? status_disbursement : expense.status_disbursement
    
    let disbDate = expense.disbursement_date
    if (status_disbursement === 'PAID') {
      disbDate = new Date().toISOString().split('T')[0]
    } else if (status_disbursement === 'UNPAID') {
      disbDate = null
    }

    await execute(
      'UPDATE carf_expenses SET status_document = ?, status_disbursement = ?, disbursement_date = ? WHERE id = ?',
      [nextDocStatus, nextDisbStatus, disbDate, req.params.id]
    )

    const updated = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// POST /api/expenses/:id/receipt
router.post('/:id/receipt', upload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt file uploaded' })
    }

    const expense = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    // Upload memory buffer to Supabase Storage
    const publicUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, 'receipts')

    await execute(
      'UPDATE carf_expenses SET transfer_receipt_url = ? WHERE id = ?',
      [publicUrl, req.params.id]
    )

    res.json({
      message: 'Receipt uploaded successfully',
      transfer_receipt_url: publicUrl
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/expenses/delete-bulk
router.post('/delete-bulk', async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' })
    }
    const placeholders = ids.map(() => '?').join(',')
    await execute(`DELETE FROM carf_expenses WHERE id IN (${placeholders})`, ids)
    res.json({ message: 'Expenses deleted successfully', deletedCount: ids.length })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await queryOne('SELECT * FROM carf_expenses WHERE id = ?', [req.params.id])
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    await execute('DELETE FROM carf_expenses WHERE id = ?', [req.params.id])
    res.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
