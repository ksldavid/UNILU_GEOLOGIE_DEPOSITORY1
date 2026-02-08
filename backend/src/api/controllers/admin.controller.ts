import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import bcrypt from 'bcrypt'
import { generateStudentIdSuggestions, generateProfessorIdSuggestions, generateUniqueStudentId, generateUniqueProfessorId, generatePassword } from '../../utils/idGenerator'

// Récupérer tous les utilisateurs avec filtres et pagination (Admin seulement)
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { search, role, status, className, page = '1', limit = '50' } = req.query as {
            search?: string,
            role?: string,
            status?: string,
            className?: string,
            page?: string,
            limit?: string
        }

        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const skip = (pageNum - 1) * limitNum

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (role && role !== 'Tous les Rôles') {
            const roleMap: any = {
                'Admin Technique': 'ADMIN',
                'Professeur': 'USER',
                'Étudiant': 'STUDENT',
                'Service Académique': 'ACADEMIC_OFFICE'
            }
            where.systemRole = roleMap[role] || role
        }

        if (status && status !== 'Tous les Statuts') {
            where.isBlocked = status !== 'Actif'
        }

        if (className && className !== 'Toutes les Classes') {
            where.studentEnrollments = {
                some: {
                    academicLevel: {
                        name: className
                    }
                }
            }
        }

        // Get total count for pagination
        const totalUsers = await prisma.user.count({ where })

        const users = await prisma.user.findMany({
            where,
            skip,
            take: limitNum,
            select: {
                id: true,
                name: true,
                email: true,
                systemRole: true,
                isBlocked: true,
                createdAt: true,
                studentEnrollments: {
                    take: 1,
                    orderBy: { enrolledAt: 'desc' },
                    select: {
                        academicLevel: {
                            select: { name: true }
                        }
                    }
                },
                professorProfile: {
                    select: { title: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formattedUsers = users.map(u => {
            let userRole = 'Utilisateur'
            let userColor = 'slate'
            let userClass = 'N/A'

            if (u.systemRole === 'ADMIN') {
                userRole = 'Admin Technique'
                userColor = 'blue'
                userClass = 'Infrastructure'
            } else if (u.systemRole === 'STUDENT') {
                userRole = 'Étudiant'
                userColor = 'emerald'
                userClass = (u as any).studentEnrollments[0]?.academicLevel?.name || 'Non inscrit'
            } else if (u.systemRole === 'USER' && (u as any).professorProfile) {
                userRole = 'Professeur'
                userColor = 'indigo'
                userClass = 'Corps Académique'
            } else if (u.systemRole === 'ACADEMIC_OFFICE') {
                userRole = 'Service Académique'
                userColor = 'orange'
                userClass = 'Administration'
            }

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: userRole,
                status: u.isBlocked ? 'Inactif' : 'Actif',
                color: userColor,
                class: userClass,
                avatar: u.name.charAt(0).toUpperCase(),
                lastLogin: 'En ligne'
            }
        })

        res.json({
            users: formattedUsers,
            pagination: {
                total: totalUsers,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalUsers / limitNum)
            }
        })
    } catch (error) {
        console.error('Error fetching all users:', error)
        res.status(500).json({ error: 'Failed to fetch users' })
    }
}



// Suggérer le prochain ID et mot de passe (Admin seulement)
export const suggestNextUserCredentials = async (req: Request, res: Response) => {
    try {
        const { role, name, year } = req.query as { role: string, name?: string, year?: string }

        let suggestions: string[] = []
        if (role === 'student') {
            const targetYear = year ? parseInt(year) : undefined;
            suggestions = await generateStudentIdSuggestions(5, targetYear)
        } else if (role === 'prof') {
            suggestions = await generateProfessorIdSuggestions(5)
        } else {
            return res.status(400).json({ error: 'Rôle non supporté pour la génération automatique.' })
        }

        const password = name ? generatePassword(name) : ""

        res.json({
            id: suggestions[0],
            suggestions,
            password
        })
    } catch (error) {
        console.error('Error suggesting credentials:', error)
        res.status(500).json({ error: 'Failed to suggest credentials' })
    }
}

// Créer un utilisateur (Admin seulement)
export const createAdminUser = async (req: Request, res: Response) => {
    try {
        let { id, name, email, password, role, studentClass, academicYear } = req.body

        // Attribution automatique si manquant
        if (!id) {
            if (role === 'student') id = await generateUniqueStudentId()
            else if (role === 'prof') id = await generateUniqueProfessorId()
            else id = `USER-${Date.now().toString().slice(-6)}`
        }

        if (!password) {
            password = generatePassword(name)
        }

        const existingUser = await prisma.user.findUnique({ where: { id } })
        if (existingUser) {
            // Si l'ID généré existe déjà (cas rare avec la boucle sequence), on peut retenter ou erreur
            return res.status(400).json({ error: 'Cet identifiant existe déjà.' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const roleMap: any = {
            'student': 'STUDENT',
            'prof': 'USER',
            'admin': 'ADMIN',
            'academic': 'ACADEMIC_OFFICE'
        }

        const newUser = await prisma.user.create({
            data: {
                id,
                name,
                email: email || `${id.toLowerCase()}@unilu.ac.cd`,
                password: hashedPassword,
                systemRole: roleMap[role] || 'STUDENT',
                isBlocked: false,
                // Si c'est un prof, on crée son profil
                professorProfile: role === 'prof' ? {
                    create: {
                        id,
                        title: 'Professeur'
                    }
                } : undefined
            }
        })

        // Si c'est un étudiant, on l'inscrit à son niveau
        if (role === 'student' && studentClass) {
            const level = await prisma.academicLevel.findFirst({
                where: { name: studentClass }
            })
            if (level) {
                await prisma.studentEnrollment.create({
                    data: {
                        userId: newUser.id,
                        academicLevelId: level.id,
                        academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
                    }
                })
            }
        }

        res.json({ message: 'Utilisateur créé avec succès', user: newUser })
    } catch (error) {
        console.error('Error creating user:', error)
        res.status(500).json({ error: 'Failed to create user' })
    }
}

// Mettre à jour le statut (Bloquer/Débloquer)
export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }
        const { status } = req.body // 'Actif' or 'Inactif'

        await prisma.user.update({
            where: { id },
            data: { isBlocked: status !== 'Actif' }
        })

        res.json({ message: `Utilisateur ${status === 'Actif' ? 'débloqué' : 'bloqué'} avec succès` })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user status' })
    }
}

// Réinitialiser le mot de passe
export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }
        const { password } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        })

        res.json({ message: 'Mot de passe réinitialisé avec succès' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' })
    }
}

// Supprimer un utilisateur
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }

        // On vérifie qu'on ne se supprime pas soi-même
        if (id === (req as any).user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' })
        }

        await prisma.user.delete({ where: { id } })
        res.json({ message: 'Utilisateur supprimé avec succès' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' })
    }
}
