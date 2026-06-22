import { queryOne } from '../db/connection.js'

export async function generateNextId(prefix) {
  let tableName = ''
  if (prefix === 'USR') tableName = 'users'
  else if (prefix === 'TEC') tableName = 'technicians'
  else if (prefix === 'TSK') tableName = 'tasks'
  else if (prefix === 'EXP') tableName = 'carf_expenses'

  if (!tableName) return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`

  const result = await queryOne(`SELECT COUNT(*) as count FROM ${tableName}`)
  const count = (result ? Number(result.count) : 0) + 1
  
  if (prefix === 'EXP') {
    const year = new Date().getFullYear()
    const padded = String(count).padStart(4, '0')
    return `EXP-${year}-${padded}`
  } else {
    const padded = String(count).padStart(3, '0')
    return `${prefix}-${padded}`
  }
}
