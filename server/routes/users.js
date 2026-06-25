import express from 'express'
import { queryAll, queryOne, execute } from '../db/connection.js'
import { generateNextId } from '../utils/id.js'

const router = express.Router()

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const { role, area } = req.query
    let sql = 'SELECT * FROM users WHERE 1=1'
    const params = []
    
    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }
    if (area) {
      sql += ' AND area = ?'
      params.push(area)
    }
    
    sql += ' ORDER BY created_at DESC'
    const users = await queryAll(sql, params)
    res.json(users)
  } catch (error) {
    next(error)
  }
})

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
})

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const { name, email, role, area } = req.body
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' })
    }
    
    const countResult = await queryOne('SELECT COUNT(*) as count FROM users WHERE email = ?', [email])
    if (countResult && Number(countResult.count) > 0) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const id = await generateNextId('USR')
    const createdAt = new Date().toISOString().split('T')[0]
    
    await execute(
      'INSERT INTO users (id, name, email, role, area, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, role, area || null, createdAt]
    )
    
    const newUser = await queryOne('SELECT * FROM users WHERE id = ?', [id])
    res.status(201).json(newUser)
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, role, area } = req.body
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    if (email && email !== user.email) {
      const countResult = await queryOne('SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?', [email, req.params.id])
      if (countResult && Number(countResult.count) > 0) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }
    
    await execute(
      'UPDATE users SET name = ?, email = ?, role = ?, area = ? WHERE id = ?',
      [name || user.name, email || user.email, role || user.role, area !== undefined ? area : user.area, req.params.id]
    )
    
    const updated = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    await execute('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
})

// POST /api/users/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email])
    if (!user) {
      return res.status(404).json({ error: 'Email tidak terdaftar' })
    }
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Password salah' })
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
})

// POST /api/users/:id/password
router.post('/:id/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword) {
      return res.status(400).json({ error: 'Password baru wajib diisi' })
    }
    
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }
    
    // If the user already has a password set, verify it
    if (user.password && user.password !== currentPassword) {
      return res.status(400).json({ error: 'Password saat ini salah' })
    }
    
    await execute('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.params.id])
    res.json({ message: 'Password berhasil diubah' })
  } catch (error) {
    next(error)
  }
})

export default router
