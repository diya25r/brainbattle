import Battle from '../models/Battle.js'
import User from '../models/User.js'
import { XP_PER_LEVEL } from '../utils/scoring.js'

export function getProfile(request, response) {
  const { _id, name, email, xp, level, role } = request.user

  response.status(200).json({
    success: true,
    user: { id: _id.toString(), name, email, xp, level, role },
  })
}

const completedForUser = (userId) => ({ status: 'completed', $or: [{ creator: userId }, { opponent: userId }] })
const percentage = (numerator, denominator) => denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0

export async function getPerformance(request, response, next) {
  try {
    const userId = request.user._id
    const battles = await Battle.find(completedForUser(userId)).select('creator opponent winner creatorAnswers opponentAnswers')
    let wins = 0; let draws = 0; let totalQuestions = 0; let totalCorrect = 0
    for (const battle of battles) {
      const myAnswers = battle.creator.equals(userId) ? battle.creatorAnswers : battle.opponentAnswers
      totalQuestions += myAnswers.length
      totalCorrect += myAnswers.filter(({ isCorrect }) => isCorrect).length
      if (!battle.winner) draws += 1
      else if (battle.winner.equals(userId)) wins += 1
    }
    const totalBattles = battles.length
    const losses = totalBattles - wins - draws
    const currentLevelXP = request.user.xp % XP_PER_LEVEL
    return response.json({ success: true, performance: { totalBattles, wins, losses, draws, winRate: percentage(wins, totalBattles), totalQuestions, totalCorrect, accuracy: percentage(totalCorrect, totalQuestions), totalXP: request.user.xp, level: request.user.level, currentLevelXP, nextLevelXP: XP_PER_LEVEL - currentLevelXP } })
  } catch (error) { return next(error) }
}

export async function getLeaderboard(request, response, next) {
  try {
    const userId = request.user._id
    const pipeline = [
      { $lookup: { from: 'battles', let: { userId: '$_id' }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$status', 'completed'] }, { $or: [{ $eq: ['$creator', '$$userId'] }, { $eq: ['$opponent', '$$userId'] }] }] } } }, { $project: { winner: 1 } }], as: 'completedBattles' } },
      { $set: { totalBattles: { $size: '$completedBattles' }, wins: { $size: { $filter: { input: '$completedBattles', as: 'battle', cond: { $eq: ['$$battle.winner', '$_id'] } } } } } },
      { $setWindowFields: { sortBy: { xp: -1, wins: -1, name: 1 }, output: { rank: { $documentNumber: {} } } } },
      { $project: { _id: 1, name: 1, xp: 1, level: 1, wins: 1, totalBattles: 1, rank: 1 } },
      { $facet: { leaderboard: [{ $limit: 50 }], currentUser: [{ $match: { _id: userId } }] } },
    ]
    const [data] = await User.aggregate(pipeline)
    const mapEntry = (entry) => ({ rank: entry.rank, userId: entry._id.toString(), name: entry.name, xp: entry.xp, level: entry.level, wins: entry.wins, totalBattles: entry.totalBattles })
    return response.json({ success: true, leaderboard: data.leaderboard.map(mapEntry), currentUser: data.currentUser[0] ? mapEntry(data.currentUser[0]) : null })
  } catch (error) { return next(error) }
}
