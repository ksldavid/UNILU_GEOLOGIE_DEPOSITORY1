import { Router } from 'express'
import { getServersStatus, toggleServerPower } from '../controllers/server-management.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticateToken)
router.use(authorizeRole(['ADMIN']))

router.get('/status', getServersStatus)
router.post('/:id/power', toggleServerPower)

export default router
