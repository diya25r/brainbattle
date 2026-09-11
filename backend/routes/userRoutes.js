import { Router } from 'express'
import { getLeaderboard, getPerformance, getProfile } from '../controllers/userController.js'
import protect from '../middleware/authMiddleware.js'

const router = Router()

router.get('/profile', protect, getProfile)
router.get('/performance', protect, getPerformance)
router.get('/leaderboard', protect, getLeaderboard)

export default router
