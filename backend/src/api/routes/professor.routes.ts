import { Router } from 'express'
import {
    getProfessorDashboard,
    getProfessorCourses,
    getProfessorStudents,
    getProfessorSchedule,
    saveAttendance,
    getStudentPerformance,
    unenrollStudent,
    searchStudents,
    enrollStudent,
    createAssessment,
    getCourseAssessments,
    saveGrades,
    uploadCourseResource,
    getCourseResources,
    deleteCourseResource,
    deleteAssessment,
    publishAssessment,
    requestGradeChange,
    getCoursePerformance,
    syncPastAttendance,
    updateCourseStatus,
    removeCourseAssignment
} from '../controllers/professor.controller'
import { getProfessorAttendanceHistory } from '../controllers/professor-history.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

// Dashboard professeur
// Note: Le rôle 'USER' correspond aux professeurs/staff dans le schema actuel
router.get('/dashboard', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getProfessorDashboard)
router.get('/courses', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getProfessorCourses)
router.get('/students', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getProfessorStudents)
router.get('/students/:studentId/performance', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getStudentPerformance)
router.get('/schedule', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getProfessorSchedule)
router.post('/attendance', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), saveAttendance)
router.post('/attendance/sync-past', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), syncPastAttendance)
router.post('/unenroll-student', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), unenrollStudent)
router.get('/search-students', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), searchStudents)
router.post('/enroll-student', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), enrollStudent)
router.post('/assessments', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), createAssessment)
router.delete('/assessments/:id', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), deleteAssessment)
router.post('/save-grades', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), saveGrades)
router.get('/courses/:courseCode/assessments', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getCourseAssessments)
router.post('/assessments/:id/publish', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), publishAssessment)
router.get('/attendance/history', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getProfessorAttendanceHistory)
router.post('/grade-change-request', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), upload.single('file'), requestGradeChange)
router.get('/courses/:courseCode/performance', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getCoursePerformance)

router.post('/courses/update-status', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), updateCourseStatus)
router.post('/courses/remove', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), removeCourseAssignment)

// Ressource management
router.post('/upload-resource', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), upload.single('file'), uploadCourseResource)
router.get('/courses/:courseCode/resources', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), getCourseResources)
router.delete('/resources/:id', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE', 'ACADEMIC_VISITOR']), deleteCourseResource)

export default router
