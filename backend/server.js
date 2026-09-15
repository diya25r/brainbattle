import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import connectDatabase from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import questionRoutes from './routes/questionRoutes.js'
import battleRoutes from './routes/battleRoutes.js'
import { configureBattleSockets } from './socket/battleSocket.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] } })
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
configureBattleSockets(io)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/battles', battleRoutes)

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
    httpServer.listen(port, () => {
      console.log(`BrainBattle API is running on port ${port}.`)
    })
  } catch {
    console.error('Server startup failed.')
    process.exit(1)
  }
}

startServer()
