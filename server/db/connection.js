import pkg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pkg
dotenv.config()

let pool = null

/**
 * Initialize and return the database connection pool.
 */
export async function getDb() {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL is not set. Please add it to your server/.env file.')
  }

  // Clean the connection string to prevent pg-connection-string from overriding our custom SSL configuration
  const cleanConnectionString = connectionString ? connectionString.split('?')[0] : null

  pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: connectionString ? { rejectUnauthorized: false } : false
  })

  // Test the connection
  try {
    const client = await pool.connect()
    console.log('✓ Connected to Supabase PostgreSQL database')
    client.release()
  } catch (err) {
    console.error('❌ Failed to connect to Supabase PostgreSQL database:', err.message)
  }

  return pool
}

/**
 * Save database. No-op for PostgreSQL, provided for backward compatibility.
 */
export function saveDb() {
  // PostgreSQL handles persistence automatically.
}

/**
 * Utility to translate SQLite query placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
 */
function translateSql(sql) {
  let count = 0
  return sql.replace(/\?/g, () => {
    count++
    return `$${count}`
  })
}

/**
 * Helper: run an async query and return all results as an array of objects
 */
export async function queryAll(sql, params = []) {
  const dbPool = await getDb()
  const translatedSql = translateSql(sql)
  const result = await dbPool.query(translatedSql, params)
  return result.rows
}

/**
 * Helper: run an async query and return the first result as an object
 */
export async function queryOne(sql, params = []) {
  const results = await queryAll(sql, params)
  return results[0] || null
}

/**
 * Helper: execute an async write statement (INSERT, UPDATE, DELETE)
 */
export async function execute(sql, params = []) {
  const dbPool = await getDb()
  const translatedSql = translateSql(sql)
  const result = await dbPool.query(translatedSql, params)
  return { changes: result.rowCount || 0 }
}
