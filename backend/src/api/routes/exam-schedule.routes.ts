import { Router } from 'express'
import { authenticateUser } from '../middleware/auth'
import { 
    createExamSchedule, 
    getExamSchedules, 
    deleteExamSchedule 
} from '../controllers/exam-schedule.controller'

const router = Router();

// Routes pour le service académique et les profs
router.post('/', authenticateUser, createExamSchedule);
router.delete('/:id', authenticateUser, deleteExamSchedule);

// Accessible à tout le monde
router.get('/', authenticateUser, getExamSchedules);

export default router;
