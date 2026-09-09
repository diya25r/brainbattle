import api from './api.js'

async function requestAuth(path, payload) {
  try {
    const response = await api.post(path, payload)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Unable to reach the server. Please try again.')
  }
}

export function registerUser(userDetails) {
  return requestAuth('/auth/register', userDetails)
}

export function loginUser(credentials) {
  return requestAuth('/auth/login', credentials)
}

export async function getUserProfile(token) {
  try {
    const response = await api.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } })
    return response.data.user
  } catch (error) {
    const requestError = new Error(error.response?.data?.message || 'Unable to reach the server. Please try again.')
    requestError.status = error.response?.status
    throw requestError
  }
}
