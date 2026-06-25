import { execute, queryOne } from './connection.js'

export async function initializeSchema() {
  // 1. Users table (Requestor & Admin/Finance)
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN_FINANCE', 'REQUESTOR')),
      area TEXT,
      created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD'),
      password TEXT DEFAULT 'password'
    );
  `)

  // Migrate existing databases to have the password column
  try {
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'password';")
  } catch (err) {
    console.error('Failed to migrate password column on users:', err)
  }

  // 2. Technicians table (Data Teknisi & Rekening)
  await execute(`
    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ktp_number TEXT UNIQUE,
      ktp_image_url TEXT,
      bank_name TEXT NOT NULL,
      bank_account_number TEXT NOT NULL,
      bank_account_owner_name TEXT NOT NULL,
      is_third_party_account INTEGER DEFAULT 0,
      third_party_relation TEXT,
      verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'REJECTED')),
      notes TEXT
    );
  `)

  // 3. Tasks table (Penugasan Lapangan)
  await execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      task_type TEXT NOT NULL CHECK (task_type IN ('INSTALLATION', 'MIGRATION', 'DISMANTLE', 'RELOCATION')),
      area TEXT NOT NULL CHECK (area IN ('JAWA', 'PAPUA', 'SUMATERA', 'KALIMANTAN', 'SULAWESI', 'BALI_NUSA', 'MALUKU')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      description TEXT
    );
  `)

  // 4. CARF Expenses table (Pencatatan CARF & Dana)
  await execute(`
    CREATE TABLE IF NOT EXISTS carf_expenses (
      id TEXT PRIMARY KEY,
      document_number TEXT UNIQUE NOT NULL,
      request_date TEXT NOT NULL,
      requestor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      requestor_name TEXT,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      technician_id TEXT REFERENCES technicians(id) ON DELETE SET NULL,
      technician_name TEXT,
      division TEXT DEFAULT 'NSO',
      expense_category TEXT NOT NULL,
      description TEXT NOT NULL,
      description_other TEXT,
      amount REAL NOT NULL DEFAULT 0,
      status_document TEXT DEFAULT 'NOT_YET' CHECK (status_document IN ('NOT_YET', 'APPROVED', 'DONE')),
      status_disbursement TEXT DEFAULT 'UNPAID' CHECK (status_disbursement IN ('UNPAID', 'PAID')),
      disbursement_date TEXT,
      transfer_receipt_url TEXT,
      created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD'),
      pengajuan_number TEXT
    );
  `)

  // Indexes for common queries
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_expenses_status_doc ON carf_expenses(status_document)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_status_dis ON carf_expenses(status_disbursement)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_requestor ON carf_expenses(requestor_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_technician ON carf_expenses(technician_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_task ON carf_expenses(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(verification_status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_area ON tasks(area)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type)'
  ]

  for (const indexSql of indexes) {
    try {
      await execute(indexSql)
    } catch (err) {
      // Ignore if index already exists or has issues in older Postgres versions
    }
  }

  // Ensure Titis M. (Admin Intern) exists in users
  try {
    const result = await queryOne('SELECT COUNT(*) as count FROM users WHERE email = ?', ['titis@nso.co.id'])
    const count = result ? Number(result.count) : 0
    
    if (count === 0) {
      const today = new Date().toISOString().split('T')[0]
      await execute(
        "INSERT INTO users (id, name, email, role, area, created_at) VALUES ('USR-008', 'Titis M.', 'titis@nso.co.id', 'ADMIN_FINANCE', 'Intern', ?)",
        [today]
      )
      console.log('✓ Added Titis M. (Admin Intern) to users table')
    }
  } catch (err) {
    console.error('Failed to auto-insert Titis M.:', err)
  }

  console.log('✓ Database schema initialized')
}
