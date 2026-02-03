import { Router } from 'express'
import { getCourses, getAcademicLevels } from '../controllers/course.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticateToken, getCourses)
router.get('/levels', authenticateToken, getAcademicLevels)

export default router
