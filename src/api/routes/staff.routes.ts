import { Router } from 'express';
import { assignStaff, removeStaff, getAvailableStaff, getStaffAssignments } from '../controllers/staff.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/assignments', authenticateToken, getStaffAssignments);
router.post('/assign', authenticateToken, assignStaff);
router.post('/remove', authenticateToken, removeStaff);
router.get('/available', authenticateToken, getAvailableStaff);

export default router;
