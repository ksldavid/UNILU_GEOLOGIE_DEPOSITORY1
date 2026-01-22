import { Router } from 'express'
import { getAcademicStats, getRecentActivities, getAttendanceStatsByLevel, getCourseAttendance, getTechnicalStats, getApiLogs, restartServer, clearCache, getStudentDemographics, getDemographicFilters } from '../controllers/stats.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Route pour récupérer les statistiques du service académique
// Sécurité : Il faut être ADMIN ou ACADEMIC_OFFICE
router.get('/academic', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getAcademicStats)
router.get('/recent-activities', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getRecentActivities)
router.get('/attendance-stats', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getAttendanceStatsByLevel)
router.get('/course-attendance', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getCourseAttendance)
router.get('/student-demographics', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getStudentDemographics)
router.get('/student-demographics-filters', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getDemographicFilters)

// Route technique (ADMIN uniquement)
router.get('/technical', authenticateToken, authorizeRole(['ADMIN']), getTechnicalStats)
router.get('/api-logs', authenticateToken, authorizeRole(['ADMIN']), getApiLogs)
router.post('/restart', authenticateToken, authorizeRole(['ADMIN']), restartServer)
router.post('/clear-cache', authenticateToken, authorizeRole(['ADMIN']), clearCache)

export default router
