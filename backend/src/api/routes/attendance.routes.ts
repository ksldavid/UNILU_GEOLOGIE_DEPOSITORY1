import { Router } from 'express'
import { generateQRToken, scanQRToken, getCourseAttendanceSessions, overrideAttendance, deleteAttendanceSession, getOfflineToken, scanQRTokenOffline, rotateOfflineToken } from '../controllers/attendance.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Routes protégées par authentification
router.post('/generate', authenticateToken, generateQRToken)
router.post('/scan', authenticateToken, scanQRToken)

// === Routes Offline Token ===
// Récupérer le token offline actif (chaque étudiant lors de sa connexion)
router.get('/offline-token', authenticateToken, getOfflineToken)
// Synchroniser une présence prise hors-ligne
router.post('/scan-offline', authenticateToken, scanQRTokenOffline)
// Générer un nouveau token offline (Admin seulement)
router.post('/offline-token/rotate', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), rotateOfflineToken)

// Routes réservées au Service Académique et à l'Admin
const adminOnly = [authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE'])]
router.get('/sessions/:courseCode', ...adminOnly, getCourseAttendanceSessions)
router.post('/override', ...adminOnly, overrideAttendance)
router.delete('/session/:sessionId', authenticateToken, deleteAttendanceSession)

export default router
