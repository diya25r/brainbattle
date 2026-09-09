import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toSafeUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, xp: user.xp, level: user.level }
}

function createToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.')
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export async function register(request, response, next) {
  try {
    const { name, email, password } = request.body
    const normalizedEmail = email?.trim().toLowerCase()
    if (!name?.trim() || !normalizedEmail || !password) return response.status(400).json({ success: false, message: 'Name, email, and password are required.' })
    if (!emailPattern.test(normalizedEmail)) return response.status(400).json({ success: false, message: 'Please provide a valid email address.' })
    if (password.length < 6) return response.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' })

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) return response.status(409).json({ success: false, message: 'An account with this email already exists.' })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword })
    return response.status(201).json({ success: true, message: 'Registration successful', token: createToken(user._id.toString()), user: toSafeUser(user) })
  } catch (error) {
    return next(error)
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail || !password) return response.status(400).json({ success: false, message: 'Email and password are required.' })

    const user = await User.findOne({ email: normalizedEmail })
    const isPasswordCorrect = user && await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) return response.status(401).json({ success: false, message: 'Invalid email or password.' })

    return response.status(200).json({ success: true, message: 'Login successful', token: createToken(user._id.toString()), user: toSafeUser(user) })
  } catch (error) {
    return next(error)
  }
}
