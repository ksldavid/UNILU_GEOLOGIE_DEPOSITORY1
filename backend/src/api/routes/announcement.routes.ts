import { Router } from 'express'
import { createAnnouncement, getAnnouncements, getMyAnnouncements, updateAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authenticateToken, createAnnouncement)
router.get('/', authenticateToken, getAnnouncements)
router.get('/my', authenticateToken, getMyAnnouncements)
router.put('/:id', authenticateToken, updateAnnouncement)
router.delete('/:id', authenticateToken, deleteAnnouncement)

export default router
