import dns from 'node:dns'
import mongoose from 'mongoose'

// Use a public DNS resolver for MongoDB Atlas SRV lookups before connecting.
dns.setServers(['8.8.8.8'])

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    console.warn('MongoDB connection skipped: MONGO_URI is not configured.')
    return false
  }

  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected.')
    return true
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

export default connectDatabase
