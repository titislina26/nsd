import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getDb } from './db/connection.js'
import { initializeSchema } from './db/schema.js'
import { errorHandler } from './middleware/errorHandler.js'

// Route imports
import usersRoutes from './routes/users.js'
import techniciansRoutes from './routes/technicians.js'
import tasksRoutes from './routes/tasks.js'
import expensesRoutes from './routes/expenses.js'
import dashboardRoutes from './routes/dashboard.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Mount API routes
app.use('/api/users', usersRoutes)
app.use('/api/technicians', techniciansRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/expenses', expensesRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Database & Schema initialization middleware (guarantees DB is ready before request execution)
let isDbInitialized = false
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await getDb()
      await initializeSchema()
      isDbInitialized = true
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// Serve static frontend files in production
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*any', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    } else {
      res.status(404).json({ error: 'API route not found' })
    }
  })
}

// Error Handler Middleware
app.use(errorHandler)

// Start Server locally if not running as a Vercel Serverless Function
if (!process.env.VERCEL) {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

export default app

