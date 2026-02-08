import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

// Créer un ticket de support
export const createTicket = async (req: Request, res: Response) => {
    try {
        const { id: userId } = (req as any).user
        const { subject, category, priority, message, metadata } = req.body

        const ticket = await prisma.supportTicket.create({
            data: {
                subject,
                category,
                priority: priority || 'MEDIUM',
                userId,
                metadata: metadata || null,
                messages: {
                    create: {
                        senderId: userId,
                        content: message
                    }
                }
            },
            include: {
                messages: true
            }
        })

        res.status(201).json(ticket)
    } catch (error) {
        console.error('Erreur creation ticket:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les tickets de l'utilisateur
export const getMyTickets = async (req: Request, res: Response) => {
    try {
        const { id: userId } = (req as any).user
        const tickets = await prisma.supportTicket.findMany({
            where: { userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        })
        res.json(tickets)
    } catch (error) {
        console.error('Erreur tickets:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les détails d'un ticket (avec messages)
export const getTicketDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        })
        res.json(ticket)
    } catch (error) {
        console.error('Erreur détails ticket:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Ajouter un message à un ticket
export const addMessage = async (req: Request, res: Response) => {
    try {
        const { id: userId } = (req as any).user
        const { ticketId, content, isAdmin } = req.body

        const message = await prisma.supportMessage.create({
            data: {
                ticketId,
                senderId: userId,
                content,
                isAdmin: isAdmin || false
            }
        })

        // Si l'admin répond, on crée une notification pour l'utilisateur
        if (isAdmin) {
            const ticket = await prisma.supportTicket.findUnique({
                where: { id: ticketId },
                select: { userId: true, subject: true }
            })

            if (ticket) {
                await prisma.notification.create({
                    data: {
                        userId: ticket.userId,
                        title: 'Réponse du Support Technique',
                        message: `Nouvelle réponse pour votre ticket : ${ticket.subject}`,
                        type: 'SUPPORT',
                        linkTo: '/dashboard/support' // Ajuster selon le front
                    }
                })
            }
        }

        res.status(201).json(message)
    } catch (error) {
        console.error('Erreur message ticket:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les notifications de l'utilisateur
export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const { id: userId } = (req as any).user
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        })
        res.json(notifications)
    } catch (error) {
        console.error('Erreur notifications:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Marquer une notification comme lue
export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        })
        res.json({ message: 'Ok' })
    } catch (error) {
        console.error('Erreur lecture notification:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// --- ADMIN / SUPPORT FUNCTIONS ---

// Récupérer TOUS les tickets (Admin uniquement)
export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        systemRole: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(tickets)
    } catch (error) {
        console.error('Erreur getAllTickets:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Mettre à jour le statut d'un ticket
export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: { status },
            include: { user: true }
        })

        // On peut notifier l'utilisateur du changement de statut
        await prisma.notification.create({
            data: {
                userId: ticket.userId,
                title: 'Mise à jour de votre ticket',
                message: `Le statut de votre ticket "${ticket.subject}" est passé à : ${status}`,
                type: 'SUPPORT',
                linkTo: '/dashboard/support'
            }
        })

        res.json(ticket)
    } catch (error) {
        console.error('Erreur updateTicketStatus:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}
