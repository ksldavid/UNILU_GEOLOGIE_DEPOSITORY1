
import { Router } from 'express'
import { generateQRToken, scanQRToken } from '../controllers/attendance.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Routes protégées par authentification
router.post('/generate', authenticateToken, generateQRToken)
router.post('/scan', authenticateToken, scanQRToken)

export default router
