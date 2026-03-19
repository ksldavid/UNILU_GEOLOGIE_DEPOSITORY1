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
                whatsapp: true,
                birthday: true,
                nationality: true,
                sex: true,
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
                },
                studentCourseEnrollments: {
                    where: { isActive: true },
                    include: {
                        course: {
                            select: { name: true, code: true }
                        }
                    }
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
                whatsapp: u.whatsapp,
                birthday: u.birthday,
                nationality: u.nationality,
                sex: u.sex,
                role: userRole,
                status: u.isBlocked ? 'Inactif' : 'Actif',
                color: userColor,
                class: userClass,
                avatar: u.name.charAt(0).toUpperCase(),
                lastLogin: 'En ligne',
                studentCourseEnrollments: u.studentCourseEnrollments
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
        let { id, name, email, password, role, studentClass, academicYear, whatsapp, sex, birthday, nationality } = req.body

        // Attribution automatique si manquant
        // ... (existing code for id/password generation)
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
            return res.status(400).json({ error: 'Cet identifiant existe déjà.' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const roleMap: any = {
            'student': 'STUDENT',
            'prof': 'USER',
            'admin': 'ADMIN',
            'academic': 'ACADEMIC_OFFICE'
        }

/**
 * Utility to get current academic year (Session)
 * If we are before October, the session started in the previous calendar year.
 * e.g. March 2026 -> "2025-2026"
 */
const getCurrentAcademicYear = (): string => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    if (currentMonth < 10) {
        return `${currentYear - 1}-${currentYear}`
    }
    return `${currentYear}-${currentYear + 1}`
}
        const newUser = await prisma.user.create({
            data: {
                id,
                name,
                email: email || `${id.toLowerCase()}@unilu.ac.cd`,
                password: hashedPassword,
                systemRole: roleMap[role] || 'STUDENT',
                isBlocked: false,
                whatsapp: whatsapp || null,
                sex: sex || null,
                birthday: birthday ? new Date(birthday) : null,
                nationality: nationality || null,
                // Si c'est un prof, on crée son profil
                professorProfile: role === 'prof' ? {
                    create: {
                        id,
                        title: 'Professeur'
                    }
                } : undefined
            }
        })

        // Si c'est un étudiant, on l'inscrit à son niveau et à tous ses cours
        if (role === 'student' && studentClass) {
            const level = await prisma.academicLevel.findFirst({
                where: { name: studentClass },
                include: { courses: { select: { code: true } } }
            })

            if (level) {
                const year = academicYear || getCurrentAcademicYear()


                // 1. Inscription au niveau académique
                await prisma.studentEnrollment.create({
                    data: {
                        userId: newUser.id,
                        academicLevelId: level.id,
                        academicYear: year
                    }
                })

                // 2. Inscription automatique à tous les cours rattachés à ce niveau
                if (level.courses.length > 0) {
                    await prisma.studentCourseEnrollment.createMany({
                        data: level.courses.map(course => ({
                            userId: newUser.id,
                            courseCode: course.code,
                            academicYear: year,
                            isActive: true
                        })),
                        skipDuplicates: true
                    })
                }
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

// Supprimer un utilisateur (Nettoyage complet des relations)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }

        if (id === (req as any).user.userId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' })
        }

        // Utilisation d'une transaction pour supprimer toutes les dépendances
        await prisma.$transaction([
            // Relations Étudiant
            prisma.studentEnrollment.deleteMany({ where: { userId: id } }),
            prisma.studentCourseEnrollment.deleteMany({ where: { userId: id } }),
            prisma.courseRetake.deleteMany({ where: { userId: id } }),
            prisma.attendanceRecord.deleteMany({ where: { studentId: id } }),
            prisma.grade.deleteMany({ where: { studentId: id } }),
            prisma.submission.deleteMany({ where: { studentId: id } }),

            // Relations Communication / Système
            prisma.announcementRead.deleteMany({ where: { userId: id } }),
            prisma.notification.deleteMany({ where: { userId: id } }),
            prisma.supportMessage.deleteMany({ where: { senderId: id } }),
            prisma.supportTicket.deleteMany({ where: { userId: id } }),

            // Profils spécifiques (Gérés par Cascade dans le schéma, mais sécurité supplémentaire)
            prisma.professorProfile.deleteMany({ where: { userId: id } }),
            prisma.academicProfile.deleteMany({ where: { userId: id } }),
            prisma.adminProfile.deleteMany({ where: { userId: id } }),

            // L'utilisateur lui-même
            prisma.user.delete({ where: { id } })
        ])

        res.json({ message: 'Utilisateur et toutes ses données supprimés avec succès' })
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error)
        res.status(500).json({ error: 'Erreur lors de la suppression : l\'utilisateur possède probablement trop de dépendances actives.' })
    }
}
// Mettre à jour le niveau académique d'un étudiant
export const updateUserAcademicLevel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }
        const { studentClass, academicYear } = req.body

        // 1. Vérifier si l'utilisateur est un étudiant
        const user = await prisma.user.findUnique({
            where: { id },
            select: { systemRole: true }
        })

        if (!user || user.systemRole !== 'STUDENT') {
            return res.status(400).json({ error: "Cette action n'est possible que pour les comptes étudiants." })
        }

        // 2. Trouver le niveau académique correspondant
        const level = await prisma.academicLevel.findFirst({
            where: { name: studentClass },
            include: { courses: { select: { code: true } } }
        })

        if (!level) {
            return res.status(404).json({ error: "Niveau académique non trouvé." })
        }

        const year = academicYear || getCurrentAcademicYear()


        // 3. Mettre à jour l'inscription au niveau académique (Upsert)
        await prisma.studentEnrollment.upsert({
            where: {
                userId_academicLevelId_academicYear: {
                    userId: id,
                    academicLevelId: level.id,
                    academicYear: year
                }
            },
            update: {
                academicLevelId: level.id
            },
            create: {
                userId: id,
                academicLevelId: level.id,
                academicYear: year
            }
        })

        // On nettoie éventuellement les autres inscriptions de cette année pour éviter les doublons de niveau
        await prisma.studentEnrollment.deleteMany({
            where: {
                userId: id,
                academicYear: year,
                academicLevelId: { not: level.id }
            }
        })

        // 4. Mettre à jour les cours rattachés au nouveau niveau
        if (level.courses.length > 0) {
            // On supprime les anciennes inscriptions aux cours de cette année 
            // pour éviter d'accumuler les cours de deux promotions différentes
            await prisma.studentCourseEnrollment.deleteMany({
                where: {
                    userId: id,
                    academicYear: year
                }
            })

            await prisma.studentCourseEnrollment.createMany({
                data: level.courses.map(course => ({
                    userId: id,
                    courseCode: course.code,
                    academicYear: year,
                    isActive: true
                })),
                skipDuplicates: true
            })
        }

        res.json({ message: `Le niveau académique a été mis à jour vers : ${studentClass}` })
    } catch (error) {
        console.error('Error updating academic level:', error)
        res.status(500).json({ error: 'Failed to update academic level' })
    }
}

// Mettre à jour le nom de l'utilisateur
export const updateUserName = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }
        const { name } = req.body

        if (!name || name.trim().length < 3) {
            return res.status(400).json({ error: 'Le nom est trop court ou invalide.' })
        }

        await prisma.user.update({
            where: { id },
            data: { name: name.trim() }
        })

        res.json({ message: 'Nom de l\'utilisateur mis à jour avec succès' })
    } catch (error) {
        console.error('Error updating user name:', error)
        res.status(500).json({ error: 'Failed to update user name' })
    }
}

// Inscrire un étudiant à un cours spécifique
export const enrollStudentInCourse = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.params as { id: string }
        const { courseCode, academicYear } = req.body

        if (!courseCode) {
            return res.status(400).json({ error: 'Le code du cours est requis.' })
        }

        // 1. Vérifier si l'étudiant existe
        const student = await prisma.user.findFirst({
            where: { id: userId, systemRole: 'STUDENT' },
            include: {
                studentEnrollments: {
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!student) {
            return res.status(404).json({ error: "Étudiant non trouvé." })
        }

        // 2. Vérifier si le cours existe
        const course = await prisma.course.findUnique({
            where: { code: courseCode }
        })

        if (!course) {
            return res.status(404).json({ error: "Cours non trouvé." })
        }

        const year = academicYear || student.studentEnrollments[0]?.academicYear || getCurrentAcademicYear()


        // 3. Créer ou activer l'inscription
        const enrollment = await prisma.studentCourseEnrollment.upsert({
            where: {
                userId_courseCode_academicYear: {
                    userId,
                    courseCode,
                    academicYear: year
                }
            },
            update: {
                isActive: true
            },
            create: {
                userId,
                courseCode,
                academicYear: year,
                isActive: true
            }
        })

        res.json({ message: `L'étudiant ${student.name} a été inscrit au cours ${course.name} avec succès.`, enrollment })
    } catch (error) {
        console.error('Error enrolling student in course:', error)
        res.status(500).json({ error: 'Failed to enroll student in course' })
    }
}

// Désinscrire un étudiant d'un cours spécifique
export const unenrollStudentFromCourse = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.params as { id: string }
        const { courseCode, academicYear } = req.body

        if (!courseCode) {
            return res.status(400).json({ error: 'Le code du cours est requis.' })
        }

        // On ne supprime pas forcément, on peut juste désactiver ou supprimer l'entrée
        // Pour une désinscription administrative, on peut supprimer si aucune note n'est liée.
        
        const hasGrades = await prisma.grade.findFirst({
            where: {
                studentId: userId,
                assessment: {
                    courseCode: courseCode
                }
            }
        })

        if (hasGrades) {
            // Si des notes existent, on désactive juste l'inscription
            await prisma.studentCourseEnrollment.update({
                where: {
                    userId_courseCode_academicYear: {
                        userId,
                        courseCode,
                        academicYear: academicYear || '2025-2026' // Par défaut si non fourni
                    }
                },
                data: { isActive: false }
            })
            return res.json({ message: "L'étudiant a des notes pour ce cours. L'accès a été désactivé mais les données sont conservées." })
        }

        // Sinon on supprime l'inscription
        await prisma.studentCourseEnrollment.delete({
            where: {
                userId_courseCode_academicYear: {
                    userId,
                    courseCode,
                    academicYear: academicYear || '2025-2026'
                }
            }
        })

        res.json({ message: "L'étudiant a été désinscrit du cours avec succès." })
    } catch (error) {
        console.error('Error unenrolling student from course:', error)
        res.status(500).json({ error: 'Failed to unenroll student from course' })
    }
}
