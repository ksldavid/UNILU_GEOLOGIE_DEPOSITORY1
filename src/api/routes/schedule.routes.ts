import { Router } from 'express'
import { getSchedule, saveSchedule } from '../controllers/schedule.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticateToken, getSchedule)
router.post('/', authenticateToken, saveSchedule)

export default router
