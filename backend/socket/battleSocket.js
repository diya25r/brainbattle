import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Battle from '../models/Battle.js'
import User from '../models/User.js'

let ioInstance = null
const roomName = (battleId) => `battle:${battleId}`

function participantConnected(io, battleId, userId) {
  if (!userId) return false
  const sockets = io.sockets.adapter.rooms.get(roomName(battleId)) || new Set()
  return [...sockets].some((socketId) => io.sockets.sockets.get(socketId)?.data.userId === userId.toString())
}

function safeState(battle, io) {
  const battleId = battle._id.toString()
  const creatorId = battle.creator._id.toString()
  const opponentId = battle.opponent?._id?.toString()
  return {
    battleId, status: battle.status,
    creator: { id: creatorId, name: battle.creator.name, connected: participantConnected(io, battleId, creatorId) },
    opponent: battle.opponent ? { id: opponentId, name: battle.opponent.name, connected: participantConnected(io, battleId, opponentId) } : null,
    subject: battle.subject, topic: battle.topic, questionCount: battle.questionCount,
    creatorSubmitted: Boolean(battle.creatorSubmittedAt), opponentSubmitted: Boolean(battle.opponentSubmittedAt),
    creatorAnsweredCount: battle.creatorAnswers.length, opponentAnsweredCount: battle.opponentAnswers.length,
  }
}

async function findBattle(battleId) {
  return Battle.findById(battleId).populate('creator', 'name').populate('opponent', 'name')
}

function isParticipant(battle, userId) {
  return battle.creator._id.toString() === userId || battle.opponent?._id?.toString() === userId
}

function hasOtherConnection(io, room, userId, socketId) {
  const ids = io.sockets.adapter.rooms.get(room) || new Set()
  return [...ids].some((id) => id !== socketId && io.sockets.sockets.get(id)?.data.userId === userId)
}

export function configureBattleSockets(io) {
  ioInstance = io
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token || !process.env.JWT_SECRET) return next(new Error('Authentication is required.'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('name')
      if (!user) return next(new Error('Authentication is invalid.'))
      socket.data.userId = user._id.toString()
      socket.data.userName = user.name
      return next()
    } catch { return next(new Error('Authentication is invalid.')) }
  })

  io.on('connection', (socket) => {
    socket.on('battle:join', async ({ battleId } = {}, acknowledge = () => {}) => {
      try {
        if (!mongoose.isObjectIdOrHexString(battleId)) return acknowledge({ ok: false, message: 'Invalid battle id.' })
        const battle = await findBattle(battleId)
        if (!battle) return acknowledge({ ok: false, message: 'Battle not found.' })
        if (!isParticipant(battle, socket.data.userId)) return acknowledge({ ok: false, message: 'You are not a participant in this battle.' })
        const room = roomName(battleId)
        if (socket.data.battleId && socket.data.battleId !== battleId) socket.leave(roomName(socket.data.battleId))
        socket.data.battleId = battleId
        socket.join(room)
        const state = safeState(battle, io)
        socket.emit('battle:state', state)
        socket.to(room).emit('battle:player_connected', { userId: socket.data.userId })
        acknowledge({ ok: true, state })
      } catch {
        acknowledge({ ok: false, message: 'Unable to join this battle room.' })
      }
    })

    socket.on('disconnecting', () => {
      if (!socket.data.battleId) return
      const room = roomName(socket.data.battleId)
      if (!hasOtherConnection(io, room, socket.data.userId, socket.id)) socket.to(room).emit('battle:player_disconnected', { userId: socket.data.userId })
    })
  })
}

export function emitBattleStarted(battle) {
  if (!ioInstance) return
  const state = safeState(battle, ioInstance)
  ioInstance.to(roomName(battle._id)).emit('battle:opponent_joined', state)
  ioInstance.to(roomName(battle._id)).emit('battle:started', state)
}

export function emitBattleState(battle) {
  if (ioInstance) ioInstance.to(roomName(battle._id)).emit('battle:state', safeState(battle, ioInstance))
}

export function emitPlayerSubmitted(battleId, userId, status) {
  if (!ioInstance) return
  const socketIds = ioInstance.sockets.adapter.rooms.get(roomName(battleId)) || new Set()
  for (const socketId of socketIds) {
    const socket = ioInstance.sockets.sockets.get(socketId)
    if (socket?.data.userId !== userId) socket.emit('battle:player_submitted', { userId, submitted: true, status })
  }
}

export function emitBattleCompleted(battle) {
  if (!ioInstance) return
  ioInstance.to(roomName(battle._id)).emit('battle:completed', { battleId: battle._id.toString(), status: 'completed', completedAt: battle.completedAt })
}
