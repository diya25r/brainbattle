import api from './api.js'

async function userRequest(token, request) {
  try {
    const response = await request({ headers: { Authorization: `Bearer ${token}` } })
    return response.data
  } catch (error) {
    const requestError = new Error(error.response?.data?.message || 'Unable to reach the server. Please try again.')
    requestError.status = error.response?.status
    throw requestError
  }
}

export function getBattleHistory(token) { return userRequest(token, (config) => api.get('/battles/history', config)) }
export function getPerformance(token) { return userRequest(token, (config) => api.get('/users/performance', config)) }
