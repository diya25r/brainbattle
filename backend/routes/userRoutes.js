import { Router } from 'express'
import { getPerformance, getProfile } from '../controllers/userController.js'
import protect from '../middleware/authMiddleware.js'

const router = Router()

router.get('/profile', protect, getProfile)
router.get('/performance', protect, getPerformance)

export default router
