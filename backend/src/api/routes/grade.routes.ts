import { Router } from 'express'
import { getGradeChangeRequests, updateGradeChangeRequestStatus, getGradesStats, getCourseGrades } from '../controllers/grade.controller'

const router = Router()

router.get('/requests', getGradeChangeRequests)
router.patch('/requests/:id/status', updateGradeChangeRequestStatus)
router.get('/stats', getGradesStats)
router.get('/pv', getCourseGrades)

export default router
