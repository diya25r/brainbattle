import mongoose from 'mongoose'
import { randomBytes } from 'node:crypto'
import Battle from '../models/Battle.js'
import Question from '../models/Question.js'
import User from '../models/User.js'
import { subjectTopics } from './questionController.js'
import { emitBattleCompleted, emitBattleStarted, emitBattleState, emitPlayerSubmitted } from '../socket/battleSocket.js'
import { accuracyFor, levelForXp, scoreAnswers, xpForResult } from '../utils/scoring.js'

const difficulties = ['Easy', 'Medium', 'Hard']
const safeQuestionFields = 'subject topic difficulty question options'
const safeUserFields = 'name'
const battleCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateBattleCode() {
  const bytes = randomBytes(6)
  return [...bytes].map((byte) => battleCodeAlphabet[byte % battleCodeAlphabet.length]).join('')
}

function normalizeBattleCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function validateSetup({ subject, topic, difficulty, questionCount }) {
  const count = Number(questionCount)
  if (!subjectTopics[subject] || !subjectTopics[subject].includes(topic) || !difficulties.includes(difficulty) || !Number.isInteger(count) || count < 1 || count > 20) return null
  return count
}

function isParticipant(battle, userId) {
  return battle.creator._id.toString() === userId || battle.opponent?._id?.toString() === userId
}

function participant(user) {
  return user ? { _id: user._id.toString(), name: user.name } : null
}

function safeBattle(battle, userId, includeQuestions = false) {
  const result = {
    _id: battle._id.toString(), creator: participant(battle.creator), opponent: participant(battle.opponent),
    subject: battle.subject, topic: battle.topic, difficulty: battle.difficulty, questionCount: battle.questionCount,
    status: battle.status, createdAt: battle.createdAt, updatedAt: battle.updatedAt,
    creatorSubmitted: Boolean(battle.creatorSubmittedAt), opponentSubmitted: Boolean(battle.opponentSubmittedAt),
    creatorAnsweredCount: battle.creatorAnswers.length, opponentAnsweredCount: battle.opponentAnswers.length,
  }
  if (isParticipant(battle, userId)) result.battleCode = battle.battleCode
  if (includeQuestions) result.questions = battle.questions.map((question) => ({ _id: question._id.toString(), subject: question.subject, topic: question.topic, difficulty: question.difficulty, question: question.question, options: question.options }))
  if (battle.creator._id.toString() === userId) result.myAnswers = battle.creatorAnswers
  if (battle.opponent?._id?.toString() === userId) result.myAnswers = battle.opponentAnswers
  return result
}

async function grantRewards(battle) {
  const claimed = await Battle.findOneAndUpdate({ _id: battle._id, rewardsGranted: false }, { $set: { rewardsGranted: true } }, { returnDocument: 'after' })
  if (!claimed) return Battle.findById(battle._id)
  const creatorCorrect = claimed.creatorAnswers.filter(({ isCorrect }) => isCorrect).length
  const opponentCorrect = claimed.opponentAnswers.filter(({ isCorrect }) => isCorrect).length
  const creatorResult = !claimed.winner ? 'draw' : claimed.winner.toString() === claimed.creator.toString() ? 'win' : 'loss'
  const opponentResult = !claimed.winner ? 'draw' : claimed.winner.toString() === claimed.opponent.toString() ? 'win' : 'loss'
  const creatorXp = xpForResult(creatorCorrect, creatorResult)
  const opponentXp = xpForResult(opponentCorrect, opponentResult)
  await Battle.updateOne({ _id: claimed._id }, { $set: { creatorXpEarned: creatorXp, opponentXpEarned: opponentXp } })
  const addXp = async (id, xp) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const user = await User.findById(id).select('xp')
      if (!user) throw new Error('Battle participant no longer exists.')
      const nextXp = user.xp + xp
      const updated = await User.updateOne({ _id: id, xp: user.xp }, { $set: { xp: nextXp, level: levelForXp(nextXp) } })
      if (updated.modifiedCount === 1) return
    }
    throw new Error('Unable to update player XP safely.')
  }
  await Promise.all([addXp(claimed.creator, creatorXp), addXp(claimed.opponent, opponentXp)])
  return Battle.findById(claimed._id)
}

async function completeIfReady(battleId) {
  const current = await Battle.findById(battleId)
  if (!current || current.status !== 'active' || current.creatorAnswers.length !== current.questionCount || current.opponentAnswers.length !== current.questionCount) return null
  const creatorScore = scoreAnswers(current.creatorAnswers)
  const opponentScore = scoreAnswers(current.opponentAnswers)
  const winner = creatorScore === opponentScore ? null : creatorScore > opponentScore ? current.creator : current.opponent
  const completed = await Battle.findOneAndUpdate(
    { _id: current._id, status: 'active' },
    { $set: { status: 'completed', creatorScore, opponentScore, winner, completedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!completed) return null
  return grantRewards(completed)
}

async function loadBattle(id, populateQuestions = false) {
  let query = Battle.findById(id).populate('creator', safeUserFields).populate('opponent', safeUserFields)
  if (populateQuestions) query = query.populate('questions', safeQuestionFields)
  return query
}

export async function createBattle(request, response, next) {
  try {
    const count = validateSetup(request.body)
    if (!count) return response.status(400).json({ success: false, message: 'Choose a valid subject, topic, difficulty, and question count.' })
    const { subject, topic, difficulty } = request.body
    const filter = { subject, topic, difficulty }
    const available = await Question.countDocuments(filter)
    if (available < count) return response.status(422).json({ success: false, message: `Only ${available} matching questions are available for this setup.`, available })
    const questions = await Question.aggregate([{ $match: filter }, { $sample: { size: count } }, { $project: { _id: 1 } }])
    let battle
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        battle = await Battle.create({ battleCode: generateBattleCode(), creator: request.user._id, questions: questions.map(({ _id }) => _id), subject, topic, difficulty, questionCount: count })
        break
      } catch (error) {
        if (error?.code !== 11000 || attempt === 4) throw error
      }
    }
    const populatedBattle = await loadBattle(battle._id)
    return response.status(201).json({ success: true, battle: safeBattle(populatedBattle, request.user._id.toString()) })
  } catch (error) { return next(error) }
}

export async function joinBattle(request, response, next) {
  try {
    const { battleId } = request.params
    if (!mongoose.isObjectIdOrHexString(battleId)) return response.status(400).json({ success: false, message: 'Invalid battle id.' })
    const battle = await Battle.findOneAndUpdate(
      { _id: battleId, status: 'waiting', opponent: null, creator: { $ne: request.user._id } },
      { $set: { opponent: request.user._id, status: 'active' } },
      { returnDocument: 'after' },
    )
    if (!battle) {
      const existing = await Battle.findById(battleId)
      if (!existing) return response.status(404).json({ success: false, message: 'Battle not found.' })
      if (existing.creator.toString() === request.user._id.toString()) return response.status(403).json({ success: false, message: 'You cannot join your own battle.' })
      return response.status(409).json({ success: false, message: `This battle is no longer available (${existing.status}).` })
    }
    const populatedBattle = await loadBattle(battle._id)
    emitBattleStarted(populatedBattle)
    return response.status(200).json({ success: true, battle: safeBattle(populatedBattle, request.user._id.toString()) })
  } catch (error) { return next(error) }
}

export async function joinBattleByCode(request, response, next) {
  try {
    const battleCode = normalizeBattleCode(request.body?.battleCode)
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(battleCode)) return response.status(400).json({ success: false, message: 'Please enter a valid 6-character battle code.' })
    const battle = await Battle.findOneAndUpdate(
      { battleCode, status: 'waiting', opponent: null, creator: { $ne: request.user._id } },
      { $set: { opponent: request.user._id, status: 'active' } },
      { returnDocument: 'after' },
    )
    if (!battle) {
      const existing = await Battle.findOne({ battleCode })
      if (!existing) return response.status(404).json({ success: false, message: 'Battle not found. Check the code and try again.' })
      if (existing.creator.toString() === request.user._id.toString()) return response.status(403).json({ success: false, message: 'You cannot join your own battle.' })
      if (existing.status === 'active') return response.status(409).json({ success: false, message: 'This battle has already started.' })
      return response.status(409).json({ success: false, message: 'This battle is no longer available.' })
    }
    const populatedBattle = await loadBattle(battle._id)
    emitBattleStarted(populatedBattle)
    return response.status(200).json({ success: true, battle: safeBattle(populatedBattle, request.user._id.toString()) })
  } catch (error) { return next(error) }
}

export async function getAvailableBattles(request, response, next) {
  try {
    const battles = await Battle.find({ status: 'waiting', opponent: null, creator: { $ne: request.user._id } }).sort({ createdAt: -1 }).populate('creator', safeUserFields)
    return response.status(200).json({ success: true, battles: battles.map((battle) => safeBattle(battle, request.user._id.toString())) })
  } catch (error) { return next(error) }
}

export async function getMyBattles(request, response, next) {
  try {
    const battles = await Battle.find({ $or: [{ creator: request.user._id }, { opponent: request.user._id }] }).sort({ updatedAt: -1 }).populate('creator', safeUserFields).populate('opponent', safeUserFields)
    return response.status(200).json({ success: true, battles: battles.map((battle) => safeBattle(battle, request.user._id.toString())) })
  } catch (error) { return next(error) }
}

export async function getBattleHistory(request, response, next) {
  try {
    const userId = request.user._id
    const battles = await Battle.find({ status: 'completed', $or: [{ creator: userId }, { opponent: userId }] })
      .sort({ completedAt: -1, createdAt: -1 }).populate('creator', safeUserFields).populate('opponent', safeUserFields)
    const history = battles.map((battle) => {
      const isCreator = battle.creator._id.equals(userId)
      const myScore = isCreator ? battle.creatorScore : battle.opponentScore
      const opponentScore = isCreator ? battle.opponentScore : battle.creatorScore
      const result = !battle.winner ? 'DRAW' : battle.winner.equals(userId) ? 'WIN' : 'LOSS'
      const opponent = isCreator ? battle.opponent : battle.creator
      return { _id: battle._id.toString(), battleCode: battle.battleCode, subject: battle.subject, topic: battle.topic, difficulty: battle.difficulty, questionCount: battle.questionCount, opponent: participant(opponent), myScore, opponentScore, result, status: battle.status, createdAt: battle.createdAt, completedAt: battle.completedAt }
    })
    return response.json({ success: true, battles: history })
  } catch (error) { return next(error) }
}

export async function getBattle(request, response, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(request.params.battleId)) return response.status(400).json({ success: false, message: 'Invalid battle id.' })
    const battle = await loadBattle(request.params.battleId, true)
    if (!battle) return response.status(404).json({ success: false, message: 'Battle not found.' })
    if (!isParticipant(battle, request.user._id.toString())) return response.status(403).json({ success: false, message: 'You are not a participant in this battle.' })
    return response.status(200).json({ success: true, battle: safeBattle(battle, request.user._id.toString(), true) })
  } catch (error) { return next(error) }
}

export async function submitBattleAnswers(request, response, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(request.params.battleId)) return response.status(400).json({ success: false, message: 'Invalid battle id.' })
    const battle = await Battle.findById(request.params.battleId).populate('questions', 'options correctAnswer')
    if (!battle) return response.status(404).json({ success: false, message: 'Battle not found.' })
    const userId = request.user._id.toString()
    const isCreator = battle.creator.toString() === userId
    const isOpponent = battle.opponent?.toString() === userId
    if (!isCreator && !isOpponent) return response.status(403).json({ success: false, message: 'You are not a participant in this battle.' })
    if (battle.status !== 'active') return response.status(409).json({ success: false, message: 'Answers can only be submitted while a battle is active.' })
    const { questionId, answer } = request.body
    if (!mongoose.isObjectIdOrHexString(questionId)) return response.status(400).json({ success: false, message: 'Invalid question id.' })
    const question = battle.questions.find((item) => item._id.toString() === questionId)
    if (!question) return response.status(400).json({ success: false, message: 'Question does not belong to this battle.' })
    if (typeof answer !== 'string' || !question.options.includes(answer)) return response.status(400).json({ success: false, message: 'Submitted answer is not a valid option.' })
    const answerField = isCreator ? 'creatorAnswers' : 'opponentAnswers'
    const submittedField = isCreator ? 'creatorSubmittedAt' : 'opponentSubmittedAt'
    const answerRecord = { questionId: question._id, answer, isCorrect: answer === question.correctAnswer, answeredAt: new Date() }
    const updated = await Battle.findOneAndUpdate(
      { _id: battle._id, status: 'active', [`${answerField}.questionId`]: { $ne: question._id } },
      { $push: { [answerField]: answerRecord } }, { returnDocument: 'after' },
    )
    if (!updated) return response.status(409).json({ success: false, message: 'Question already answered or battle is no longer active.' })
    if (updated[answerField].length === updated.questionCount) await Battle.updateOne({ _id: updated._id, [submittedField]: null }, { $set: { [submittedField]: new Date() } })
    const completedBattle = await completeIfReady(updated._id)
    const freshBattle = await Battle.findById(updated._id)
    emitPlayerSubmitted(updated._id.toString(), userId, freshBattle.status)
    const broadcastBattle = await loadBattle(updated._id)
    emitBattleState(broadcastBattle)
    if (completedBattle) emitBattleCompleted(completedBattle)
    return response.status(200).json({ success: true, status: freshBattle.status, answeredCount: freshBattle[answerField].length, message: 'Answer submitted successfully.' })
  } catch (error) { return next(error) }
}

export async function getBattleResult(request, response, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(request.params.battleId)) return response.status(400).json({ success: false, message: 'Invalid battle id.' })
    const battle = await loadBattle(request.params.battleId)
    if (!battle) return response.status(404).json({ success: false, message: 'Battle not found.' })
    const userId = request.user._id.toString()
    if (!isParticipant(battle, userId)) return response.status(403).json({ success: false, message: 'You are not a participant in this battle.' })
    if (battle.status !== 'completed') return response.status(409).json({ success: false, message: 'Battle results are not ready yet.' })
    const player = (user, answers, score) => ({ id: user._id.toString(), name: user.name, score, accuracy: accuracyFor(answers, battle.questionCount) })
    return response.json({ success: true, result: { battleId: battle._id.toString(), creator: player(battle.creator, battle.creatorAnswers, battle.creatorScore), opponent: player(battle.opponent, battle.opponentAnswers, battle.opponentScore), winner: battle.winner?.toString() || null, questionCount: battle.questionCount, xpEarned: battle.creator._id.toString() === userId ? battle.creatorXpEarned : battle.opponentXpEarned, completedAt: battle.completedAt } })
  } catch (error) { return next(error) }
}
