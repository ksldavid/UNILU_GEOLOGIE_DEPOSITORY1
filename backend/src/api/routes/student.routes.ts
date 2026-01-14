import { Router } from 'express'
import { getStudentDashboard, getStudentCourses, getStudentCourseDetails, getStudentSchedule, getStudentGrades, getStudentAnnouncements, getStudentProfile, getStudentCourseManagement, toggleCourseActive, submitAssignment } from '../controllers/student.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

// Dashboard étudiant
router.get('/dashboard', authenticateToken, authorizeRole('STUDENT'), getStudentDashboard)
router.get('/courses', authenticateToken, authorizeRole('STUDENT'), getStudentCourses)
router.get('/courses-management', authenticateToken, authorizeRole('STUDENT'), getStudentCourseManagement)
router.put('/courses/toggle-active', authenticateToken, authorizeRole('STUDENT'), toggleCourseActive)
router.get('/courses/:courseCode', authenticateToken, authorizeRole('STUDENT'), getStudentCourseDetails)
router.get('/schedule', authenticateToken, authorizeRole('STUDENT'), getStudentSchedule)
router.get('/grades', authenticateToken, authorizeRole('STUDENT'), getStudentGrades)
router.get('/announcements', authenticateToken, authorizeRole('STUDENT'), getStudentAnnouncements)
router.get('/profile', authenticateToken, authorizeRole('STUDENT'), getStudentProfile)

// Assignment submission
router.post('/submit-assignment', authenticateToken, authorizeRole('STUDENT'), upload.single('file'), submitAssignment)

export default router
