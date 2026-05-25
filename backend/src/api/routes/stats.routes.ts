import { Router } from 'express'
import {
    getAcademicStats, getRecentActivities, getAttendanceStatsByLevel,
    getCourseAttendance, getTechnicalStats, getApiLogs,
    restartServer, clearCache, getStudentDemographics,
    getDemographicFilters, getTrafficInsights, getDetailedCourseProgress,
    getIndividualStudentAttendance
} from '../controllers/stats.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

router.get('/academic', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getAcademicStats)
router.get('/recent-activities', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getRecentActivities)
router.get('/attendance-stats', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getAttendanceStatsByLevel)
router.get('/course-attendance', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getCourseAttendance)
router.get('/student-demographics', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getStudentDemographics)
router.get('/student-demographics-filters', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getDemographicFilters)
router.get('/course-progress', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getDetailedCourseProgress)
router.get('/student/:userId/attendance', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getIndividualStudentAttendance)

// Route technique (ADMIN uniquement)
router.get('/technical', authenticateToken, authorizeRole(['ADMIN']), getTechnicalStats)
router.get('/traffic-insights', authenticateToken, authorizeRole(['ADMIN']), getTrafficInsights)
router.get('/api-logs', authenticateToken, authorizeRole(['ADMIN']), getApiLogs)
router.post('/restart', authenticateToken, authorizeRole(['ADMIN']), restartServer)
router.post('/clear-cache', authenticateToken, authorizeRole(['ADMIN']), clearCache)

export default router
