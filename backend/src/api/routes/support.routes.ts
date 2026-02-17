import { Router } from 'express'
import {
    createTicket, getMyTickets, getTicketDetails,
    addMessage, getMyNotifications, markNotificationRead,
    getAllTickets, updateTicketStatus, deleteTicket
} from '../controllers/support.controller'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// Toutes les routes support nécessitent d'être authentifié
router.use(authenticateToken)

// Routes utilisateur standard
router.post('/tickets', createTicket)
router.get('/tickets', getMyTickets)
router.get('/tickets/:id', getTicketDetails)
router.post('/messages', addMessage)
router.delete('/tickets/:id', deleteTicket)

router.get('/notifications', getMyNotifications)
router.put('/notifications/:id/read', markNotificationRead)

// Routes ADMIN / SERVICE TECHNIQUE / ACADEMIQUE
router.get('/admin/tickets', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), getAllTickets)
router.put('/admin/tickets/:id/status', authorizeRole(['ADMIN', 'ACADEMIC_OFFICE']), updateTicketStatus)

export default router
