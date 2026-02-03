import { Router } from 'express'
import { getUsers, updateUser, updatePushToken } from '../controllers/user.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Toutes les routes utilisateurs nécessitent une authentification
router.use(authenticateToken)

// Notification Push Token
router.post('/push-token', updatePushToken)

// Route pour récupérer les utilisateurs (Admin et Service Académique uniquement)
router.get('/', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getUsers)

// Route pour mettre à jour un utilisateur (Admin uniquement)
router.put('/:id', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), updateUser)

export default router
