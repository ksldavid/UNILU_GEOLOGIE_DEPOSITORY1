import { Router } from 'express'
import { getAcademicStats, getRecentActivities, getAttendanceStatsByLevel, getCourseAttendance } from '../controllers/stats.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Route pour récupérer les statistiques du service académique
// Sécurité : Il faut être ADMIN ou ACADEMIC_OFFICE
router.get('/academic', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getAcademicStats)
router.get('/recent-activities', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getRecentActivities)
router.get('/attendance-stats', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getAttendanceStatsByLevel)
router.get('/course-attendance', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getCourseAttendance)

export default router
