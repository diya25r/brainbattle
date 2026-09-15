import Battle from '../models/Battle.js'
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
