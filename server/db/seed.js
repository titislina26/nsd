import { execute, saveDb } from './connection.js'
import { initializeSchema } from './schema.js'

const MOCK_USERS = [
  { id: 'USR-001', name: 'Syarif Hidayatullah', email: 'syarif@nso.co.id', role: 'ADMIN_FINANCE', area: null, created_at: '2026-01-15' },
  { id: 'USR-002', name: 'Dewi Anggraini', email: 'dewi@nso.co.id', role: 'ADMIN_FINANCE', area: null, created_at: '2026-02-01' },
  { id: 'USR-003', name: 'Bambang Hartono', email: 'bambang@nso.co.id', role: 'REQUESTOR', area: 'JAWA', created_at: '2026-01-20' },
  { id: 'USR-004', name: 'Rina Wulandari', email: 'rina@nso.co.id', role: 'REQUESTOR', area: 'PAPUA', created_at: '2026-02-10' },
  { id: 'USR-005', name: 'Agus Prasetyo', email: 'agus@nso.co.id', role: 'REQUESTOR', area: 'SUMATERA', created_at: '2026-03-01' },
  { id: 'USR-006', name: 'Fitri Rahmawati', email: 'fitri@nso.co.id', role: 'REQUESTOR', area: 'KALIMANTAN', created_at: '2026-03-15' },
  { id: 'USR-007', name: 'Hendra Gunawan', email: 'hendra@nso.co.id', role: 'REQUESTOR', area: 'SULAWESI', created_at: '2026-04-01' },
  { id: 'USR-008', name: 'Titis M.', email: 'titis@nso.co.id', role: 'ADMIN_FINANCE', area: 'Intern', created_at: '2026-06-21' },
]

const MOCK_TECHNICIANS = [
  {
    id: 'TEC-001', name: 'Yusup Ubaidillah', ktp_number: '3201150302880001',
    ktp_image_url: null, bank_name: 'BCA', bank_account_number: '8720345612',
    bank_account_owner_name: 'Siti Aminah', is_third_party_account: 1,
    third_party_relation: 'Saudara Kandung', verification_status: 'VERIFIED',
    notes: 'Yusup tidak punya rekening, pakai rekening saudaranya Siti Aminah'
  },
  {
    id: 'TEC-002', name: 'Ahmad Fauzan', ktp_number: '3502140810950002',
    ktp_image_url: null, bank_name: 'Mandiri', bank_account_number: '1310024567890',
    bank_account_owner_name: 'Ahmad Fauzan', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'VERIFIED', notes: null
  },
  {
    id: 'TEC-003', name: 'Rudi Hermawan', ktp_number: '3271020504870003',
    ktp_image_url: null, bank_name: 'BNI', bank_account_number: '0456789123',
    bank_account_owner_name: 'Rudi Hermawan', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'VERIFIED', notes: null
  },
  {
    id: 'TEC-004', name: 'Deni Saputra', ktp_number: '9101012301900004',
    ktp_image_url: null, bank_name: 'BRI', bank_account_number: '034501028765432',
    bank_account_owner_name: 'Deni Saputra', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'UNVERIFIED', notes: null
  },
  {
    id: 'TEC-005', name: 'Wahyu Setiawan', ktp_number: '6401011506880005',
    ktp_image_url: null, bank_name: 'BCA', bank_account_number: '3456789012',
    bank_account_owner_name: 'Nurul Hidayah', is_third_party_account: 1,
    third_party_relation: 'Istri', verification_status: 'UNVERIFIED',
    notes: 'Wahyu menggunakan rekening istrinya'
  },
  {
    id: 'TEC-006', name: 'Eko Prasetyo', ktp_number: '3573012005910006',
    ktp_image_url: null, bank_name: 'Mandiri', bank_account_number: '1560024890123',
    bank_account_owner_name: 'Eko Prasetyo', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'VERIFIED', notes: null
  },
  {
    id: 'TEC-007', name: 'Irfan Maulana', ktp_number: '7301012302930007',
    ktp_image_url: null, bank_name: 'BSI', bank_account_number: '7890123456',
    bank_account_owner_name: 'Irfan Maulana', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'REJECTED',
    notes: 'Data KTP tidak sesuai, perlu verifikasi ulang'
  },
  {
    id: 'TEC-008', name: 'Slamet Riyadi', ktp_number: '3301011507860008',
    ktp_image_url: null, bank_name: 'BNI', bank_account_number: '0567890234',
    bank_account_owner_name: 'Slamet Riyadi', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'VERIFIED', notes: null
  },
  {
    id: 'TEC-009', name: 'Fajar Nugroho', ktp_number: '1571012003940009',
    ktp_image_url: null, bank_name: 'BRI', bank_account_number: '045601039876543',
    bank_account_owner_name: 'Mulyono', is_third_party_account: 1,
    third_party_relation: 'Ayah', verification_status: 'UNVERIFIED',
    notes: 'Fajar belum punya rekening sendiri, pakai rekening ayahnya'
  },
  {
    id: 'TEC-010', name: 'Budi Santoso', ktp_number: '3201152508870010',
    ktp_image_url: null, bank_name: 'BCA', bank_account_number: '4567890123',
    bank_account_owner_name: 'Budi Santoso', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'VERIFIED', notes: null
  },
  {
    id: 'TEC-011', name: 'Hasan Abdullah', ktp_number: '9171011209910011',
    ktp_image_url: null, bank_name: 'Mandiri', bank_account_number: '1670025012345',
    bank_account_owner_name: 'Hasan Abdullah', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'UNVERIFIED', notes: null
  },
  {
    id: 'TEC-012', name: 'Rizki Ramadhan', ktp_number: '7171012508920012',
    ktp_image_url: null, bank_name: 'CIMB Niaga', bank_account_number: '800456789',
    bank_account_owner_name: 'Rizki Ramadhan', is_third_party_account: 0,
    third_party_relation: null, verification_status: 'VERIFIED', notes: null
  },
]

const MOCK_TASKS = [
  { id: 'TSK-001', task_type: 'INSTALLATION', area: 'JAWA', start_date: '2026-06-01', end_date: '2026-06-15', description: 'Instalasi perangkat BTS di Bandung Barat' },
  { id: 'TSK-002', task_type: 'MIGRATION', area: 'PAPUA', start_date: '2026-06-10', end_date: '2026-07-10', description: 'Migrasi jaringan fiber optic Jayapura-Sentani' },
  { id: 'TSK-003', task_type: 'INSTALLATION', area: 'SUMATERA', start_date: '2026-06-15', end_date: '2026-07-01', description: 'Instalasi tower telekomunikasi Medan Timur' },
  { id: 'TSK-004', task_type: 'DISMANTLE', area: 'JAWA', start_date: '2026-07-01', end_date: '2026-07-10', description: 'Pembongkaran peralatan lama site Surabaya' },
  { id: 'TSK-005', task_type: 'RELOCATION', area: 'KALIMANTAN', start_date: '2026-07-05', end_date: '2026-07-25', description: 'Relokasi perangkat dari Balikpapan ke Samarinda' },
  { id: 'TSK-006', task_type: 'INSTALLATION', area: 'SULAWESI', start_date: '2026-07-10', end_date: '2026-08-05', description: 'Instalasi jaringan baru Makassar Selatan' },
  { id: 'TSK-007', task_type: 'MIGRATION', area: 'BALI_NUSA', start_date: '2026-08-01', end_date: '2026-08-20', description: 'Migrasi sistem komunikasi Denpasar' },
  { id: 'TSK-008', task_type: 'INSTALLATION', area: 'PAPUA', start_date: '2026-08-10', end_date: '2026-09-15', description: 'Instalasi perangkat radio link Merauke' },
  { id: 'TSK-009', task_type: 'DISMANTLE', area: 'SUMATERA', start_date: '2026-09-01', end_date: '2026-09-10', description: 'Dismantle site lama Palembang' },
  { id: 'TSK-010', task_type: 'RELOCATION', area: 'MALUKU', start_date: '2026-09-05', end_date: '2026-09-30', description: 'Relokasi infrastruktur jaringan Ambon' },
]

const MOCK_EXPENSES = [
  { id: 'EXP-2026-0001', document_number: 'CARF/NSO/2026/06/001', request_date: '2026-06-01', requestor_id: 'USR-003', task_id: 'TSK-001', technician_id: 'TEC-002', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Bandung PP untuk instalasi BTS', amount: 1250000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-03', transfer_receipt_url: null, created_at: '2026-06-01' },
  { id: 'EXP-2026-0002', document_number: 'CARF/NSO/2026/06/002', request_date: '2026-06-02', requestor_id: 'USR-004', task_id: 'TSK-002', technician_id: 'TEC-001', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Jayapura untuk migrasi fiber optic', amount: 8500000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-04', transfer_receipt_url: null, created_at: '2026-06-02' },
  { id: 'EXP-2026-0003', document_number: 'CARF/NSO/2026/06/003', request_date: '2026-06-03', requestor_id: 'USR-004', task_id: 'TSK-002', technician_id: 'TEC-004', division: 'NSO', expense_category: 'Akomodasi', description: 'Hotel 30 hari di Jayapura untuk tim migrasi', amount: 15000000, status_document: 'APPROVED', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-03' },
  { id: 'EXP-2026-0004', document_number: 'CARF/NSO/2026/06/004', request_date: '2026-06-05', requestor_id: 'USR-003', task_id: 'TSK-001', technician_id: 'TEC-003', division: 'NSO', expense_category: 'Sewa Mobil', description: 'Sewa mobil operasional Bandung 15 hari', amount: 5250000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-07', transfer_receipt_url: null, created_at: '2026-06-05' },
  { id: 'EXP-2026-0005', document_number: 'CARF/NSO/2026/06/005', request_date: '2026-06-06', requestor_id: 'USR-005', task_id: 'TSK-003', technician_id: 'TEC-006', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Medan PP instalasi tower', amount: 3200000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-08', transfer_receipt_url: null, created_at: '2026-06-06' },
  { id: 'EXP-2026-0006', document_number: 'CARF/NSO/2026/06/006', request_date: '2026-06-07', requestor_id: 'USR-005', task_id: 'TSK-003', technician_id: 'TEC-006', division: 'NSO', expense_category: 'Akomodasi', description: 'Penginapan tim di Medan 15 hari', amount: 7500000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-07' },
  { id: 'EXP-2026-0007', document_number: 'CARF/NSO/2026/06/007', request_date: '2026-06-08', requestor_id: 'USR-006', task_id: 'TSK-005', technician_id: 'TEC-005', division: 'NSO', expense_category: 'Sewa Mobil', description: 'Sewa mobil untuk relokasi perangkat Kalimantan', amount: 12000000, status_document: 'APPROVED', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-08' },
  { id: 'EXP-2026-0008', document_number: 'CARF/NSO/2026/06/008', request_date: '2026-06-09', requestor_id: 'USR-003', task_id: 'TSK-004', technician_id: 'TEC-008', division: 'NSO', expense_category: 'Transportasi Lokal', description: 'Transport lokal tim dismantle Surabaya', amount: 2100000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-09' },
  { id: 'EXP-2026-0009', document_number: 'CARF/NSO/2026/06/010', request_date: '2026-06-10', requestor_id: 'USR-007', task_id: 'TSK-006', technician_id: 'TEC-010', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Makassar PP instalasi jaringan', amount: 4800000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-12', transfer_receipt_url: null, created_at: '2026-06-10' },
  { id: 'EXP-2026-0010', document_number: 'CARF/NSO/2026/06/011', request_date: '2026-06-10', requestor_id: 'USR-007', task_id: 'TSK-006', technician_id: 'TEC-010', division: 'NSO', expense_category: 'Akomodasi', description: 'Hotel di Makassar 25 hari', amount: 10000000, status_document: 'APPROVED', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-10' },
  { id: 'EXP-2026-0011', document_number: 'CARF/NSO/2026/06/012', request_date: '2026-06-11', requestor_id: 'USR-003', task_id: 'TSK-001', technician_id: 'TEC-002', division: 'NSO', expense_category: 'Bensin', description: 'BBM operasional kendaraan Bandung', amount: 1500000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-13', transfer_receipt_url: null, created_at: '2026-06-11' },
  { id: 'EXP-2026-0012', document_number: 'CARF/NSO/2026/06/013', request_date: '2026-06-12', requestor_id: 'USR-004', task_id: 'TSK-002', technician_id: 'TEC-001', division: 'NSO', expense_category: 'Sewa Mobil', description: 'Sewa kendaraan lapangan Papua 30 hari', amount: 18000000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-12' },
  { id: 'EXP-2026-0013', document_number: 'CARF/NSO/2026/06/014', request_date: '2026-06-12', requestor_id: 'USR-005', task_id: 'TSK-003', technician_id: 'TEC-009', division: 'NSO', expense_category: 'Bensin', description: 'BBM operasional Medan', amount: 2000000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-12' },
  { id: 'EXP-2026-0014', document_number: 'CARF/NSO/2026/06/015', request_date: '2026-06-13', requestor_id: 'USR-006', task_id: 'TSK-005', technician_id: 'TEC-005', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Balikpapan PP relokasi', amount: 5600000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-15', transfer_receipt_url: null, created_at: '2026-06-13' },
  { id: 'EXP-2026-0015', document_number: 'CARF/NSO/2026/06/016', request_date: '2026-06-13', requestor_id: 'USR-006', task_id: 'TSK-005', technician_id: 'TEC-005', division: 'NSO', expense_category: 'Akomodasi', description: 'Penginapan tim di Balikpapan 20 hari', amount: 8000000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-13' },
  { id: 'EXP-2026-0016', document_number: 'CARF/NSO/2026/06/017', request_date: '2026-06-14', requestor_id: 'USR-003', task_id: 'TSK-004', technician_id: 'TEC-008', division: 'NSO', expense_category: 'Peralatan Teknis', description: 'Peralatan dismantle site Surabaya', amount: 3500000, status_document: 'APPROVED', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-14' },
  { id: 'EXP-2026-0017', document_number: 'CARF/NSO/2026/06/018', request_date: '2026-06-14', requestor_id: 'USR-007', task_id: 'TSK-006', technician_id: 'TEC-012', division: 'NSO', expense_category: 'Sewa Mobil', description: 'Sewa mobil operasional Makassar 25 hari', amount: 9500000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-14' },
  { id: 'EXP-2026-0018', document_number: 'CARF/NSO/2026/06/019', request_date: '2026-06-15', requestor_id: 'USR-004', task_id: 'TSK-008', technician_id: 'TEC-011', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Merauke PP instalasi radio link', amount: 1250000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-15' },
  { id: 'EXP-2026-0019', document_number: 'CARF/NSO/2026/06/020', request_date: '2026-06-15', requestor_id: 'USR-005', task_id: 'TSK-009', technician_id: 'TEC-003', division: 'NSO', expense_category: 'Transportasi Lokal', description: 'Transport lokal dismantle Palembang', amount: 1800000, status_document: 'APPROVED', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-15' },
  { id: 'EXP-2026-0020', document_number: 'CARF/NSO/2026/06/021', request_date: '2026-06-16', requestor_id: 'USR-003', task_id: 'TSK-010', technician_id: 'TEC-007', division: 'NSO', expense_category: 'Tiket Pesawat', description: 'Tiket Jakarta-Ambon PP relokasi infrastruktur', amount: 7200000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-16' },
  { id: 'EXP-2026-0021', document_number: 'CARF/NSO/2026/06/022', request_date: '2026-06-03', requestor_id: 'USR-003', task_id: 'TSK-001', technician_id: 'TEC-003', division: 'NSO', expense_category: 'Makan', description: 'Uang makan tim instalasi Bandung 15 hari', amount: 3375000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-05', transfer_receipt_url: null, created_at: '2026-06-03' },
  { id: 'EXP-2026-0022', document_number: 'CARF/NSO/2026/06/023', request_date: '2026-06-04', requestor_id: 'USR-004', task_id: 'TSK-002', technician_id: 'TEC-004', division: 'NSO', expense_category: 'Peralatan Teknis', description: 'Splicer dan OTDR rental Papua', amount: 6500000, status_document: 'DONE', status_disbursement: 'PAID', disbursement_date: '2026-06-06', transfer_receipt_url: null, created_at: '2026-06-04' },
  { id: 'EXP-2026-0023', document_number: 'CARF/NSO/2026/06/024', request_date: '2026-06-11', requestor_id: 'USR-007', task_id: 'TSK-006', technician_id: 'TEC-012', division: 'NSO', expense_category: 'Bensin', description: 'BBM operasional Makassar', amount: 2400000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-11' },
  { id: 'EXP-2026-0024', document_number: 'CARF/NSO/2026/06/025', request_date: '2026-06-09', requestor_id: 'USR-006', task_id: 'TSK-005', technician_id: 'TEC-005', division: 'NSO', expense_category: 'Bensin', description: 'BBM operasional relokasi Kalimantan', amount: 3200000, status_document: 'APPROVED', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-09' },
  { id: 'EXP-2026-0025', document_number: 'CARF/NSO/2026/06/026', request_date: '2026-06-16', requestor_id: 'USR-005', task_id: 'TSK-009', technician_id: 'TEC-006', division: 'NSO', expense_category: 'Akomodasi', description: 'Penginapan tim dismantle Palembang', amount: 2250000, status_document: 'NOT_YET', status_disbursement: 'UNPAID', disbursement_date: null, transfer_receipt_url: null, created_at: '2026-06-16' },
]

async function seed() {
  console.log('Starting DB Seeding on PostgreSQL...')
  
  // Initialize schema first
  await initializeSchema()
  
  // Clear tables
  await execute('DELETE FROM carf_expenses')
  await execute('DELETE FROM tasks')
  await execute('DELETE FROM technicians')
  await execute('DELETE FROM users')
  
  console.log('✓ Tables cleared')

  // Seed Users
  for (const user of MOCK_USERS) {
    await execute(
      'INSERT INTO users (id, name, email, role, area, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, user.role, user.area, user.created_at]
    )
  }
  console.log(`✓ Seeded ${MOCK_USERS.length} users`)

  // Seed Technicians
  for (const tech of MOCK_TECHNICIANS) {
    await execute(
      `INSERT INTO technicians (
        id, name, ktp_number, ktp_image_url, bank_name, 
        bank_account_number, bank_account_owner_name, 
        is_third_party_account, third_party_relation, 
        verification_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tech.id, tech.name, tech.ktp_number, tech.ktp_image_url, tech.bank_name,
        tech.bank_account_number, tech.bank_account_owner_name,
        tech.is_third_party_account, tech.third_party_relation,
        tech.verification_status, tech.notes
      ]
    )
  }
  console.log(`✓ Seeded ${MOCK_TECHNICIANS.length} technicians`)

  // Seed Tasks
  for (const task of MOCK_TASKS) {
    await execute(
      'INSERT INTO tasks (id, task_type, area, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [task.id, task.task_type, task.area, task.start_date, task.end_date, task.description]
    )
  }
  console.log(`✓ Seeded ${MOCK_TASKS.length} tasks`)

  // Seed Expenses
  for (const exp of MOCK_EXPENSES) {
    await execute(
      `INSERT INTO carf_expenses (
        id, document_number, request_date, requestor_id, task_id, technician_id,
        division, expense_category, description, amount, status_document,
        status_disbursement, disbursement_date, transfer_receipt_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exp.id, exp.document_number, exp.request_date, exp.requestor_id, exp.task_id, exp.technician_id,
        exp.division, exp.expense_category, exp.description, exp.amount, exp.status_document,
        exp.status_disbursement, exp.disbursement_date, exp.transfer_receipt_url, exp.created_at
      ]
    )
  }
  console.log(`✓ Seeded ${MOCK_EXPENSES.length} expenses`)
  
  saveDb()
  console.log('✓ Seeding complete!')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
