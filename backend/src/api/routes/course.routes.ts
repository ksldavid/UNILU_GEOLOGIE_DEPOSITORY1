import { Router } from 'express'
import { getCourses, getAcademicLevels, createCourse, updateCourse } from '../controllers/course.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticateToken, getCourses)
router.get('/levels', authenticateToken, getAcademicLevels)
router.post('/', authenticateToken, createCourse)
router.patch('/:code', authenticateToken, updateCourse)

export default router
