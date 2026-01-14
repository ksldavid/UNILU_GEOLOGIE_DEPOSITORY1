import { Router } from 'express'
import { getGradeChangeRequests, getMyGradeChangeRequests, updateGradeChangeRequestStatus, getGradesStats, getCourseGrades } from '../controllers/grade.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

router.get('/requests', getGradeChangeRequests)
router.get('/my-requests', authenticateToken, getMyGradeChangeRequests)
router.patch('/requests/:id/status', updateGradeChangeRequestStatus)
router.get('/stats', getGradesStats)
router.get('/pv', getCourseGrades)

export default router
