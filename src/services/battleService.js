import api from './api.js'

export async function getBattleQuestions(token, setup) {
  try {
    const response = await api.get('/questions/battle', {
      headers: { Authorization: `Bearer ${token}` },
      params: setup,
    })
    return response.data.questions
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Unable to prepare your battle. Please try again.')
  }
}
