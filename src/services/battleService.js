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

export async function submitBattle(token, questions) {
  try {
    const response = await api.post('/questions/battle/submit', { questions }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Unable to submit your battle. Please try again.')
  }
}

async function battleRequest(token, request) {
  try {
    const response = await request({ headers: { Authorization: `Bearer ${token}` } })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Unable to reach the battle service. Please try again.')
  }
}

export function createMultiplayerBattle(token, setup) {
  return battleRequest(token, (config) => api.post('/battles', setup, config))
}

export function getAvailableBattles(token) {
  return battleRequest(token, (config) => api.get('/battles/available', config))
}

export function joinMultiplayerBattle(token, battleId) {
  return battleRequest(token, (config) => api.post(`/battles/${battleId}/join`, {}, config))
}

export function joinMultiplayerBattleByCode(token, battleCode) {
  return battleRequest(token, (config) => api.post('/battles/join', { battleCode }, config))
}

export function getMultiplayerBattle(token, battleId) {
  return battleRequest(token, (config) => api.get(`/battles/${battleId}`, config))
}

export function submitMultiplayerAnswer(token, battleId, questionId, answer) {
  return battleRequest(token, (config) => api.post(`/battles/${battleId}/answers`, { questionId, answer }, config))
}

export function getBattleResult(token, battleId) {
  return battleRequest(token, (config) => api.get(`/battles/${battleId}/result`, config))
}
