import { Router } from 'express'
import { getDatabaseStats, executeRawQuery } from '../controllers/database.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticateToken)
router.use(authorizeRole(['ADMIN']))

router.get('/stats', getDatabaseStats)
router.post('/query', executeRawQuery)

export default router
