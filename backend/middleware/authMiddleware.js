import jwt from 'jsonwebtoken'
import User from '../models/User.js'

async function protect(request, response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null

  if (!token) {
    return response.status(401).json({ success: false, message: 'Authentication is required.' })
  }

  if (!process.env.JWT_SECRET) {
    return response.status(500).json({ success: false, message: 'Authentication is not configured.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return response.status(401).json({ success: false, message: 'Authentication is invalid.' })
    }

    request.user = user
    return next()
  } catch {
    return response.status(401).json({ success: false, message: 'Authentication is invalid or expired.' })
  }
}

export default protect
