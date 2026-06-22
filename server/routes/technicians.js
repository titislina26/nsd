import express from 'express'
import { queryAll, queryOne, execute } from '../db/connection.js'
import { generateNextId } from '../utils/id.js'
import { upload } from '../middleware/upload.js'
import { uploadToSupabase } from '../db/storage.js'

const router = express.Router()

// GET /api/technicians/search
router.get('/search', async (req, res, next) => {
  try {
    const { name } = req.query
    if (!name) {
      return res.status(400).json({ error: 'Name query parameter is required' })
    }
    const technicians = await queryAll(
      'SELECT * FROM technicians WHERE LOWER(name) LIKE ?',
      [`%${name.toLowerCase()}%`]
    )
    res.json(technicians)
  } catch (error) {
    next(error)
  }
})

// GET /api/technicians
router.get('/', async (req, res, next) => {
  try {
    const { verification_status } = req.query
    let sql = 'SELECT * FROM technicians WHERE 1=1'
    const params = []

    if (verification_status) {
      sql += ' AND verification_status = ?'
      params.push(verification_status)
    }

    sql += ' ORDER BY id ASC'
    const technicians = await queryAll(sql, params)
    res.json(technicians)
  } catch (error) {
    next(error)
  }
})

// GET /api/technicians/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tech = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    if (!tech) {
      return res.status(404).json({ error: 'Technician not found' })
    }
    res.json(tech)
  } catch (error) {
    next(error)
  }
})

// POST /api/technicians
router.post('/', async (req, res, next) => {
  try {
    const {
      name, ktp_number, bank_name, bank_account_number,
      bank_account_owner_name, is_third_party_account,
      third_party_relation, notes
    } = req.body

    if (!name || !bank_name || !bank_account_number || !bank_account_owner_name) {
      return res.status(400).json({ error: 'Required fields missing' })
    }

    if (ktp_number) {
      const existing = await queryOne('SELECT COUNT(*) as count FROM technicians WHERE ktp_number = ?', [ktp_number])
      if (existing && Number(existing.count) > 0) {
        return res.status(400).json({ error: 'KTP number already registered' })
      }
    }

    const id = await generateNextId('TEC')

    await execute(
      `INSERT INTO technicians (
        id, name, ktp_number, ktp_image_url, bank_name,
        bank_account_number, bank_account_owner_name,
        is_third_party_account, third_party_relation,
        verification_status, notes
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 'UNVERIFIED', ?)`,
      [
        id, name, ktp_number || null, bank_name, bank_account_number,
        bank_account_owner_name, is_third_party_account ? 1 : 0,
        third_party_relation || null, notes || null
      ]
    )

    const newTech = await queryOne('SELECT * FROM technicians WHERE id = ?', [id])
    res.status(201).json(newTech)
  } catch (error) {
    next(error)
  }
})

// PUT /api/technicians/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      name, ktp_number, bank_name, bank_account_number,
      bank_account_owner_name, is_third_party_account,
      third_party_relation, notes
    } = req.body

    const tech = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    if (!tech) {
      return res.status(404).json({ error: 'Technician not found' })
    }

    if (ktp_number && ktp_number !== tech.ktp_number) {
      const existing = await queryOne(
        'SELECT COUNT(*) as count FROM technicians WHERE ktp_number = ? AND id != ?',
        [ktp_number, req.params.id]
      )
      if (existing && Number(existing.count) > 0) {
        return res.status(400).json({ error: 'KTP number already registered' })
      }
    }

    await execute(
      `UPDATE technicians SET 
        name = ?, ktp_number = ?, bank_name = ?, bank_account_number = ?,
        bank_account_owner_name = ?, is_third_party_account = ?,
        third_party_relation = ?, notes = ?
      WHERE id = ?`,
      [
        name || tech.name,
        ktp_number !== undefined ? (ktp_number ? ktp_number : null) : tech.ktp_number,
        bank_name || tech.bank_name,
        bank_account_number || tech.bank_account_number,
        bank_account_owner_name || tech.bank_account_owner_name,
        is_third_party_account !== undefined ? (is_third_party_account ? 1 : 0) : tech.is_third_party_account,
        third_party_relation !== undefined ? third_party_relation : tech.third_party_relation,
        notes !== undefined ? notes : tech.notes,
        req.params.id
      ]
    )

    const updated = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/technicians/:id/verify
router.patch('/:id/verify', async (req, res, next) => {
  try {
    const { status, notes } = req.body
    if (!status || !['UNVERIFIED', 'VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' })
    }

    const tech = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    if (!tech) {
      return res.status(404).json({ error: 'Technician not found' })
    }

    await execute(
      'UPDATE technicians SET verification_status = ?, notes = ? WHERE id = ?',
      [status, notes !== undefined ? notes : tech.notes, req.params.id]
    )

    const updated = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// POST /api/technicians/:id/ktp
router.post('/:id/ktp', upload.single('ktp'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' })
    }

    const tech = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    if (!tech) {
      return res.status(404).json({ error: 'Technician not found' })
    }

    // Upload memory buffer to Supabase Storage
    const publicUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, 'ktp')

    await execute(
      'UPDATE technicians SET ktp_image_url = ? WHERE id = ?',
      [publicUrl, req.params.id]
    )

    res.json({
      message: 'KTP uploaded successfully',
      ktp_image_url: publicUrl
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/technicians/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const tech = await queryOne('SELECT * FROM technicians WHERE id = ?', [req.params.id])
    if (!tech) {
      return res.status(404).json({ error: 'Technician not found' })
    }

    await execute('DELETE FROM technicians WHERE id = ?', [req.params.id])
    res.json({ message: 'Technician deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
