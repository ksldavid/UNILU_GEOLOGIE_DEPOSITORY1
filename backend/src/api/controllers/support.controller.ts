import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

// Créer un ticket de support (authentifié)
export const createTicket = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user
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
            }
        })

        res.status(201).json(ticket)
    } catch (error) {
        console.error('Erreur creation ticket:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Créer un ticket de support PUBLIC (non authentifié)
export const createPublicTicket = async (req: Request, res: Response) => {
    try {
        const { subject, category, message, studentName, studentId, studentClass, whatsapp } = req.body

        // On cherche si l'utilisateur existe déjà par son matricule/ID
        let user = await prisma.user.findUnique({
            where: { id: studentId }
        });

        // Si l'utilisateur n'existe pas (cas rare car normalement tous les étudiants sont pré-chargés), 
        // on refuse car on a besoin d'un lien User dans le schéma Prisma pour SupportTicket chargé.
        // Mais ici, on va supposer que l'ID étudiant fourni dans le formulaire de login est leur Matricule (User.id)
        if (!user) {
            return res.status(404).json({ message: "ID étudiant non reconnu. Veuillez vérifier votre ID ou contacter le service académique." });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                subject: subject || "Aide à la connexion",
                category: category || "Technique",
                priority: 'HIGH',
                userId: user.id,
                metadata: {
                    source: 'public_login_form',
                    studentName,
                    studentClass,
                    whatsapp,
                    submittedAt: new Date().toISOString()
                },
                messages: {
                    create: {
                        senderId: user.id, // On simule que c'est l'étudiant qui envoie
                        content: `[MESSAGE PUBLIC] ${message}`
                    }
                }
            }
        })

        res.status(201).json({ message: "Votre demande a été envoyée avec succès.", ticketId: ticket.id })
    } catch (error) {
        console.error('Erreur creation ticket public:', error)
        res.status(500).json({ message: 'Erreur serveur lors de l\'envoi du message' })
    }
}

// Récupérer les tickets de l'utilisateur
export const getMyTickets = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user
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
        const id = req.params.id as string
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        profilePhotoUrl: true,
                        systemRole: true
                    }
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
        const { userId } = (req as any).user
        const { ticketId, content, isAdmin } = req.body

        const message = await prisma.supportMessage.create({
            data: {
                ticketId,
                senderId: userId,
                content,
                isAdmin: isAdmin || false
            }
        });

        // Mettre à jour la date de modification du ticket
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId }
        });

        if (ticket) {
            const updateData: any = { updatedAt: new Date() };

            // Si l'utilisateur répond à un ticket RESOLVED, on le réouvre
            if (!isAdmin && ticket.status === 'RESOLVED') {
                updateData.status = 'IN_PROGRESS';
            }

            await prisma.supportTicket.update({
                where: { id: ticketId },
                data: updateData
            });

            // Si l'admin répond, on crée une notification pour l'utilisateur
            if (isAdmin) {
                await prisma.notification.create({
                    data: {
                        userId: ticket.userId,
                        title: 'Réponse du Support',
                        message: `Nouvelle réponse pour votre ticket : ${ticket.subject}`,
                        type: 'SUPPORT',
                        linkTo: '/dashboard/support'
                    }
                });
            }
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Erreur message ticket:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les notifications de l'utilisateur
export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user
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
        const id = req.params.id as string
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
                        profilePhotoUrl: true,
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

// Supprimer un ticket (seulement par son auteur)
export const deleteTicket = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user
        const { id } = req.params as { id: string }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket non trouvé' })
        }

        if (ticket.userId !== userId) {
            return res.status(403).json({ message: 'Action interdite : vous n\'êtes pas l\'auteur de ce ticket' })
        }

        await prisma.supportTicket.delete({
            where: { id }
        })

        res.json({ message: 'Ticket supprimé avec succès' })
    } catch (error) {
        console.error('Erreur suppression ticket:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Mettre à jour le statut d'un ticket
export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }
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
