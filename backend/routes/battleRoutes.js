import { Router } from 'express'
import { createBattle, getAvailableBattles, getBattle, getBattleHistory, getBattleResult, getMyBattles, joinBattle, joinBattleByCode, submitBattleAnswers } from '../controllers/battleController.js'
import protect from '../middleware/authMiddleware.js'

const router = Router()
router.use(protect)
router.post('/', createBattle)
router.post('/join', joinBattleByCode)
router.get('/available', getAvailableBattles)
router.get('/my', getMyBattles)
router.get('/history', getBattleHistory)
router.post('/:battleId/join', joinBattle)
router.post('/:battleId/answers', submitBattleAnswers)
router.get('/:battleId/result', getBattleResult)
router.get('/:battleId', getBattle)

export default router
