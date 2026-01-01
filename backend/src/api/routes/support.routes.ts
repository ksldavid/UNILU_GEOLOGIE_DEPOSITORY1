import { Router } from 'express'
import {
    createTicket, getMyTickets, getTicketDetails,
    addMessage, getMyNotifications, markNotificationRead
} from '../controllers/support.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Toutes les routes support nécessitent d'être authentifié
router.use(authenticateToken)

router.post('/tickets', createTicket)
router.get('/tickets', getMyTickets)
router.get('/tickets/:id', getTicketDetails)
router.post('/messages', addMessage)

router.get('/notifications', getMyNotifications)
router.put('/notifications/:id/read', markNotificationRead)

export default router
