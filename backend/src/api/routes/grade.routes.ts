import { Router } from 'express'
import { getGradeChangeRequests, getMyGradeChangeRequests, updateGradeChangeRequestStatus, getGradesStats, getCourseGrades } from '../controllers/grade.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Toutes les routes de notes nécessitent une authentification
router.use(authenticateToken)

// Routes pour les demandes de modification de notes
router.get('/requests', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getGradeChangeRequests)
router.get('/my-requests', getMyGradeChangeRequests)
router.patch('/requests/:id/status', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), updateGradeChangeRequestStatus)

// Routes pour les statistiques et le PV
router.get('/stats', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getGradesStats)
router.get('/pv', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE', 'USER', 'ACADEMIC_VISITOR']), getCourseGrades)

export default router
