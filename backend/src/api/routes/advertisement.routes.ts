
import { Router } from 'express';
import * as adController from '../controllers/advertisement.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public/Student routes
router.get('/active', adController.getActiveAds);
router.post('/:id/click', adController.trackClick);

// Admin/Technical Service routes
router.get('/', authenticateToken, authorizeRole('ADMIN'), adController.getAllAds);
router.post('/', authenticateToken, authorizeRole('ADMIN'), upload.single('image'), adController.createAd);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), adController.updateAd);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), adController.deleteAd);
router.post('/:id/notify', authenticateToken, authorizeRole('ADMIN'), adController.triggerAdNotifications);

export default router;
