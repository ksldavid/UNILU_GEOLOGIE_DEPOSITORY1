import { Router } from 'express'
import { generateQRToken, scanQRToken, getCourseAttendanceSessions, overrideAttendance } from '../controllers/attendance.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Routes protégées par authentification
router.post('/generate', authenticateToken, generateQRToken)
router.post('/scan', authenticateToken, scanQRToken)

// Routes réservées au Service Académique et à l'Admin
const adminOnly = [authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE'])]
router.get('/sessions/:courseCode', ...adminOnly, getCourseAttendanceSessions)
router.post('/override', ...adminOnly, overrideAttendance)

export default router
