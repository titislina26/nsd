import { queryAll } from '../db/connection.js'

export async function generateNextId(prefix) {
  let tableName = ''
  if (prefix === 'USR') tableName = 'users'
  else if (prefix === 'TEC') tableName = 'technicians'
  else if (prefix === 'TSK') tableName = 'tasks'
  else if (prefix === 'EXP') tableName = 'carf_expenses'

  if (!tableName) return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`

  // Fetch all IDs to reliably find the maximum number,
  // avoiding duplicate IDs caused by COUNT(*) when records are deleted.
  const rows = await queryAll(`SELECT id FROM ${tableName}`)
  
  let maxNum = 0
  for (const row of rows) {
    if (row.id && row.id.startsWith(prefix)) {
      const parts = row.id.split('-')
      const numStr = parts[parts.length - 1]
      const num = parseInt(numStr, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  }

  const nextNum = maxNum + 1

  if (prefix === 'EXP') {
    const year = new Date().getFullYear()
    const padded = String(nextNum).padStart(4, '0')
    return `EXP-${year}-${padded}`
  } else {
    const padded = String(nextNum).padStart(3, '0')
    return `${prefix}-${padded}`
  }
}
