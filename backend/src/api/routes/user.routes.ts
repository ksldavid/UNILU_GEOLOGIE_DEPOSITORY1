import { Router } from 'express'
import multer from 'multer'
import { getUsers, updateUser, updatePushToken, uploadProfilePhoto, deleteProfilePhoto } from '../controllers/user.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Toutes les routes utilisateurs nécessitent une authentification
router.use(authenticateToken)

// Notification Push Token
router.post('/push-token', updatePushToken)

// Photo de profil
router.post('/profile-photo', upload.single('photo'), uploadProfilePhoto)
router.delete('/profile-photo', deleteProfilePhoto)

// Route pour récupérer les utilisateurs (Admin et Service Académique uniquement)
router.get('/', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getUsers)

// Route pour mettre à jour un utilisateur (Admin uniquement)
router.put('/:id', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), updateUser)

export default router
