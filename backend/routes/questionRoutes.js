import { Router } from 'express'
import { createQuestion, deleteQuestion, getBattleQuestions, getQuestions, submitBattle, updateQuestion } from '../controllers/questionController.js'
import protect from '../middleware/authMiddleware.js'
import requireAdmin from '../middleware/adminMiddleware.js'

const router = Router()

router.get('/battle', protect, getBattleQuestions)
router.post('/battle/submit', protect, submitBattle)
router.use(protect, requireAdmin)
router.route('/').post(createQuestion).get(getQuestions)
router.route('/:id').put(updateQuestion).delete(deleteQuestion)

export default router
