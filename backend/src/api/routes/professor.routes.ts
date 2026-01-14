import { Router } from 'express'
import { getProfessorDashboard, getProfessorCourses, getProfessorStudents, getProfessorSchedule, saveAttendance, getStudentPerformance, unenrollStudent, searchStudents, enrollStudent, createAssessment, getCourseAssessments, saveGrades, uploadCourseResource, getCourseResources, deleteCourseResource } from '../controllers/professor.controller'
import { getProfessorAttendanceHistory } from '../controllers/professor-history.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

// Dashboard professeur
// Note: Le rôle 'USER' correspond aux professeurs/staff dans le schema actuel
router.get('/dashboard', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getProfessorDashboard)
router.get('/courses', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getProfessorCourses)
router.get('/students', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getProfessorStudents)
router.get('/students/:studentId/performance', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getStudentPerformance)
router.get('/schedule', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getProfessorSchedule)
router.post('/attendance', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), saveAttendance)
router.post('/unenroll-student', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), unenrollStudent)
router.get('/search-students', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), searchStudents)
router.post('/enroll-student', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), enrollStudent)
router.post('/assessments', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), createAssessment)
router.post('/save-grades', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), saveGrades)
router.get('/courses/:courseCode/assessments', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getCourseAssessments)
router.get('/attendance/history', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getProfessorAttendanceHistory)

// Ressource management
router.post('/upload-resource', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), upload.single('file'), uploadCourseResource)
router.get('/courses/:courseCode/resources', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), getCourseResources)
router.delete('/resources/:id', authenticateToken, authorizeRole(['USER', 'ADMIN', 'ACADEMIC_OFFICE']), deleteCourseResource)

export default router
