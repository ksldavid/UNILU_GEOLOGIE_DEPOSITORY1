import { Router } from 'express'
import {
    getStudentDashboard,
    getStudentCourses,
    getStudentCourseDetails,
    getStudentSchedule,
    getStudentGrades,
    getStudentAnnouncements,
    getStudentProfile,
    updateStudentProfile,
    getStudentCourseManagement,
    toggleCourseActive,
    submitAssignment,
    markAnnouncementAsRead,
    getStudentExams,
    getAvailableCourses,
    enrollInCourse,
    unenrollFromCourse
} from '../controllers/student.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

// Dashboard étudiant
router.get('/dashboard', authenticateToken, authorizeRole('STUDENT'), getStudentDashboard)
router.get('/courses', authenticateToken, authorizeRole('STUDENT'), getStudentCourses)
router.get('/courses-management', authenticateToken, authorizeRole('STUDENT'), getStudentCourseManagement)
router.get('/courses/available', authenticateToken, authorizeRole('STUDENT'), getAvailableCourses)
router.post('/courses/enroll', authenticateToken, authorizeRole('STUDENT'), enrollInCourse)
router.post('/courses/unenroll', authenticateToken, authorizeRole('STUDENT'), unenrollFromCourse)
router.put('/courses/toggle-active', authenticateToken, authorizeRole('STUDENT'), toggleCourseActive)
router.get('/courses/:courseCode', authenticateToken, authorizeRole('STUDENT'), getStudentCourseDetails)
router.get('/schedule', authenticateToken, authorizeRole('STUDENT'), getStudentSchedule)
router.get('/exams', authenticateToken, authorizeRole('STUDENT'), getStudentExams)
router.get('/grades', authenticateToken, authorizeRole('STUDENT'), getStudentGrades)
router.get('/announcements', authenticateToken, authorizeRole('STUDENT'), getStudentAnnouncements)
router.get('/profile', authenticateToken, authorizeRole('STUDENT'), getStudentProfile)
router.put('/profile', authenticateToken, authorizeRole('STUDENT'), updateStudentProfile)

// Assignment submission
router.post('/submit-assignment', authenticateToken, authorizeRole('STUDENT'), upload.single('file'), submitAssignment)

// Announcements
router.post('/announcements/:id/read', authenticateToken, authorizeRole('STUDENT'), markAnnouncementAsRead)

export default router
