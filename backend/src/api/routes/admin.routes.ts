import { Router } from 'express'
import { getAllUsers, createAdminUser, updateUserStatus, resetUserPassword, deleteUser, suggestNextUserCredentials, updateUserAcademicLevel, updateUserName, enrollStudentInCourse, unenrollStudentFromCourse } from '../controllers/admin.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Toutes les routes ici nécessitent d'être ADMIN
router.use(authenticateToken)
router.use(authorizeRole(['ADMIN']))

router.get('/users', getAllUsers)
router.get('/credentials/suggest', suggestNextUserCredentials)
router.post('/users', createAdminUser)
router.patch('/users/:id/status', updateUserStatus)
router.patch('/users/:id/password', resetUserPassword)
router.patch('/users/:id/academic-level', updateUserAcademicLevel)
router.patch('/users/:id/name', updateUserName)
router.post('/users/:id/enroll', enrollStudentInCourse)
router.post('/users/:id/unenroll', unenrollStudentFromCourse)
router.delete('/users/:id', deleteUser)

export default router
