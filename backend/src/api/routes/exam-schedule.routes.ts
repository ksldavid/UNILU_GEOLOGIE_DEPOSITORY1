import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import {
    createExamSchedule,
    getExamSchedules,
    deleteExamSchedule
} from '../controllers/exam-schedule.controller'

const router = Router();

// Routes pour le service académique et les profs
router.post('/', authenticateToken, createExamSchedule);
router.delete('/:id', authenticateToken, deleteExamSchedule);

// Accessible à tout le monde
router.get('/', authenticateToken, getExamSchedules);

export default router;
