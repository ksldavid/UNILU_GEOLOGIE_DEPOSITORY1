import { Router } from 'express';
import * as diagnosticController from '../controllers/diagnostic.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Route publique (authentifiée par l'étudiant) pour soumettre ses coordonnées
router.post('/location', authenticateToken, diagnosticController.submitLocationDiagnostic);

// Routes admin pour voir les diagnostics
router.get('/locations', authenticateToken, authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), diagnosticController.getLocationDiagnostics);
router.delete('/locations', authenticateToken, authorizeRole(['ADMIN']), diagnosticController.clearDiagnostics);

export default router;
