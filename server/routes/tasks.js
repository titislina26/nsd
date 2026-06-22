import express from 'express'
import { queryAll, queryOne, execute } from '../db/connection.js'
import { generateNextId } from '../utils/id.js'

const router = express.Router()

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { task_type, area } = req.query
    let sql = 'SELECT * FROM tasks WHERE 1=1'
    const params = []

    if (task_type) {
      sql += ' AND task_type = ?'
      params.push(task_type)
    }
    if (area) {
      sql += ' AND area = ?'
      params.push(area)
    }

    sql += ' ORDER BY start_date DESC'
    const tasks = await queryAll(sql, params)
    res.json(tasks)
  } catch (error) {
    next(error)
  }
})

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    res.json(task)
  } catch (error) {
    next(error)
  }
})

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const { task_type, area, start_date, end_date, description } = req.body
    if (!task_type || !area || !start_date || !end_date) {
      return res.status(400).json({ error: 'Required fields missing' })
    }

    const id = await generateNextId('TSK')
    await execute(
      'INSERT INTO tasks (id, task_type, area, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id, task_type, area, start_date, end_date, description || null]
    )

    const newTask = await queryOne('SELECT * FROM tasks WHERE id = ?', [id])
    res.status(201).json(newTask)
  } catch (error) {
    next(error)
  }
})

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { task_type, area, start_date, end_date, description } = req.body
    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    await execute(
      `UPDATE tasks SET 
        task_type = ?, area = ?, start_date = ?, end_date = ?, description = ?
      WHERE id = ?`,
      [
        task_type || task.task_type,
        area || task.area,
        start_date || task.start_date,
        end_date || task.end_date,
        description !== undefined ? description : task.description,
        req.params.id
      ]
    )

    const updated = await queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    await execute('DELETE FROM tasks WHERE id = ?', [req.params.id])
    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
