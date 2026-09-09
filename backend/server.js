import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import connectDatabase from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', (request, response) => {
  response.status(200).json({
    success: true,
    message: 'BrainBattle API is running',
  })
})

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: 'API route not found',
  })
})

app.use((error, request, response, _next) => {
  console.error('Server error:', error.message)
  response.status(500).json({
    success: false,
    message: 'Something went wrong on the server.',
  })
})

async function startServer() {
  try {
    await connectDatabase()
    app.listen(port, () => {
      console.log(`BrainBattle API is running on port ${port}.`)
    })
  } catch {
    console.error('Server startup failed.')
    process.exit(1)
  }
}

startServer()
