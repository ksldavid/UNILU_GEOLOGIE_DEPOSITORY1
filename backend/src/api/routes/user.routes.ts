import { Router } from 'express'
import { getUsers, updateUser } from '../controllers/user.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Route pour récupérer les utilisateurs
router.get('/', authenticateToken, getUsers)

// Route pour mettre à jour un utilisateur
router.put('/:id', authenticateToken, updateUser)

export default router
