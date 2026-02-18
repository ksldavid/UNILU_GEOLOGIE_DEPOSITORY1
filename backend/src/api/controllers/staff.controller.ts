import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { CourseRole } from '@prisma/client';

export const assignStaff = async (req: Request, res: Response) => {
    try {
        const { userId, courseCode, role, academicYear } = req.body;

        if (!userId || !courseCode || !role || !academicYear) {
            res.status(400).json({ message: "Données incomplètes" });
            return; // Ensure void return
        }

        // Vérifier les limites de capacité pour le cours
        const currentCount = await prisma.courseEnrollment.count({
            where: {
                courseCode,
                academicYear,
                role: role as CourseRole,
                NOT: { userId } // Ne pas compter si on met à jour la même personne
            }
        });

        if (role === 'PROFESSOR' && currentCount >= 5) {
            res.status(400).json({ message: "Limite atteinte : maximum 5 titulaires autorisés pour ce cours." });
            return;
        }

        if (role === 'ASSISTANT' && currentCount >= 10) {
            res.status(400).json({ message: "Limite atteinte : maximum 10 assistants autorisés pour ce cours." });
            return;
        }

        // Upsert l'inscription
        const assignment = await prisma.courseEnrollment.upsert({
            where: {
                userId_courseCode_academicYear: {
                    userId,
                    courseCode,
                    academicYear
                }
            },
            update: {
                role: role as CourseRole
            },
            create: {
                userId,
                courseCode,
                role: role as CourseRole,
                academicYear
            },
            include: {
                user: {
                    include: {
                        professorProfile: true
                    }
                },
                course: true
            }
        });

        // S'assurer que le profil professeur existe
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { professorProfile: true } });
        if (user && !user.professorProfile) {
            await prisma.professorProfile.create({
                data: {
                    id: userId,
                    userId: userId,
                    title: 'Enseignant' // Titre par défaut
                }
            });
        }

        res.json(assignment);
    } catch (error: any) {
        console.error("Erreur assignStaff:", error);
        res.status(500).json({ message: "Erreur lors de l'affectation", error: error.message });
    }
};

export const removeStaff = async (req: Request, res: Response) => {
    try {
        const { userId, courseCode, academicYear } = req.body;

        await prisma.courseEnrollment.delete({
            where: {
                userId_courseCode_academicYear: {
                    userId,
                    courseCode,
                    academicYear
                }
            }
        });

        res.json({ success: true, message: "Affectation retirée" });
    } catch (error: any) {
        console.error("Erreur removeStaff:", error);
        res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
};

export const getStaffAssignments = async (req: Request, res: Response) => {
    try {
        const { academicYear, role } = req.query;

        const where: any = {};
        if (academicYear) where.academicYear = academicYear as string;
        if (role) where.role = role as any;

        const assignments = await prisma.courseEnrollment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        professorProfile: {
                            select: {
                                title: true
                            }
                        }
                    }
                },
                course: {
                    select: {
                        code: true,
                        name: true,
                        academicLevels: {
                            select: {
                                displayName: true,
                                code: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { academicYear: 'desc' },
                { courseCode: 'asc' }
            ]
        });

        // Formater pour coller au besoin du front si nécessaire
        // Mais ici on peut retourner les objets Prisma et laisser le front faire le mapping final
        // pour rester flexible.
        res.json(assignments);
    } catch (error: any) {
        console.error("Erreur getStaffAssignments:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des affectations" });
    }
};

export const getAvailableStaff = async (req: Request, res: Response) => {
    try {
        // Récupère tous les utilisateurs éligibles (Professeurs, Assistants, même Administratifs si besoin)
        const staff = await prisma.user.findMany({
            where: {
                OR: [
                    { systemRole: 'USER' }, // Profs/Assistants standards
                    { systemRole: 'ADMIN' }, // Parfois admin peut enseigner
                    { systemRole: 'ACADEMIC_OFFICE' }
                ],
                isBlocked: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                professorProfile: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(staff);
    } catch (error: any) {
        res.status(500).json({ message: "Erreur récupération personnel" });
    }
};
