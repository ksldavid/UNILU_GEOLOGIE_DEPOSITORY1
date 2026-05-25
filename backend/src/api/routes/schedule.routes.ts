import { Router } from 'express'
import { getSchedule, saveSchedule } from '../controllers/schedule.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticateToken, getSchedule)
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), saveSchedule)

export default router
