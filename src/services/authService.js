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
