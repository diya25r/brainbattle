export const CORRECT_ANSWER_POINTS = 10
export const XP_PER_CORRECT_ANSWER = 10
export const WIN_XP = 100
export const LOSS_XP = 50
export const DRAW_XP = 75
export const XP_PER_LEVEL = 500

export const scoreAnswers = (answers = []) => answers.filter(({ isCorrect }) => isCorrect).length * CORRECT_ANSWER_POINTS
export const accuracyFor = (answers = [], questionCount) => questionCount ? Math.round((answers.filter(({ isCorrect }) => isCorrect).length / questionCount) * 100) : 0
export const levelForXp = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1

export function xpForResult(correctAnswers, result) {
  const outcomeXp = result === 'draw' ? DRAW_XP : result === 'win' ? WIN_XP : LOSS_XP
  return outcomeXp + (correctAnswers * XP_PER_CORRECT_ANSWER)
}
