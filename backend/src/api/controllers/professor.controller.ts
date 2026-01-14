import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinaryHelper'



export const getProfessorStudents = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // 1. Get courses taught by professor
        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: { userId },
            select: { courseCode: true, course: { select: { name: true } } }
        });

        const courseCodes = taughtCourses.map(tc => tc.courseCode);
        const courseMap = new Map(taughtCourses.map(tc => [tc.courseCode, tc.course.name] as [string, string]));

        // 2. Get students enrolled in these courses
        const studentEnrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                courseCode: { in: courseCodes },
                isActive: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    include: {
                        academicLevels: true
                    }
                }
            }
        });

        // 3. Get today's attendance records for all courses
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await prisma.attendanceRecord.findMany({
            where: {
                session: {
                    courseCode: { in: courseCodes },
                    date: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            },
            include: {
                session: {
                    select: {
                        courseCode: true
                    }
                }
            }
        });

        // Create a map of studentId -> attendance status
        const attendanceMap = new Map<string, { status: string, courseCode: string }>();
        todayAttendance.forEach(record => {
            attendanceMap.set(record.studentId, {
                status: record.status,
                courseCode: record.session.courseCode
            });
        });

        // 4. Format response with attendance status
        const students = studentEnrollments.map(enrollment => {
            const level = enrollment.course.academicLevels[0]?.name || 'Niveau Inconnu';
            const attendance = attendanceMap.get(enrollment.user.id);

            return {
                id: enrollment.user.id, // Matricule/Student ID
                name: enrollment.user.name,
                courseCode: enrollment.courseCode,
                courseName: courseMap.get(enrollment.courseCode) || enrollment.courseCode,
                academicLevel: level,
                // Add today's attendance status if exists
                todayStatus: attendance?.courseCode === enrollment.courseCode ? attendance.status.toLowerCase() : null
            };
        });

        res.json(students);
    } catch (error) {
        console.error('Erreur étudiants professeur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getProfessorSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: { userId },
            select: { courseCode: true }
        });
        const courseCodes = taughtCourses.map(tc => tc.courseCode);

        // Get all schedules for these courses
        const schedules = await prisma.schedule.findMany({
            where: {
                courseCode: { in: courseCodes }
            },
            include: {
                course: true,
                academicLevel: true
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
        }) as any[];

        res.json(schedules.map(s => ({
            day: s.day,
            title: s.course.name,
            location: `${s.room} - ${s.academicLevel.name}`,
            startTime: s.startTime,
            endTime: s.endTime,
            color: 'text-blue-600' // Default color, logic could be more complex
        })));

    } catch (error) {
        console.error('Erreur planning professeur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Update Dashboard to include announcements
export const getProfessorDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' })
        }

        // 1. Récupérer les cours enseignés par ce professeur
        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: {
                userId: userId
            },
            include: {
                course: {
                    include: {
                        studentCourseEnrollments: true,
                        academicLevels: true
                    }
                }
            }
        }) as any[]

        const courseCodes = taughtCourses.map(tc => tc.courseCode)
        const activeCoursesCount = taughtCourses.length

        // 2. Compter le nombre total d'étudiants (uniques)
        const uniqueStudentIds = new Set<string>()
        taughtCourses.forEach(tc => {
            tc.course.studentCourseEnrollments.forEach((enrollment: any) => {
                if (enrollment.isActive) {
                    uniqueStudentIds.add(enrollment.userId)
                }
            })
        })
        const totalStudents = uniqueStudentIds.size

        // 3. Récupérer les cours de la journée (Planning)
        const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' })
        const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

        const todaysSchedule = await prisma.schedule.findMany({
            where: {
                courseCode: { in: courseCodes },
                day: todayCapitalized
            },
            include: {
                course: true,
                academicLevel: true
            },
            orderBy: { startTime: 'asc' }
        }) as any[]

        // 4. Fetch Faculty Announcements (Targeting ALL or ALL_PROFESSORS, assuming logic)
        // Since we don't have explicit professor target in schema from limited view, 
        // we'll fetch 'ALL' or 'ALL_STUDENTS' (often meant as everyone) or create a convention.
        // Let's assume generic announcements for now.
        const announcements = await prisma.announcement.findMany({
            where: {
                OR: [
                    { target: 'GLOBAL' },
                    { target: 'ALL_PROFESSORS' },
                    { target: 'SPECIFIC_USER', targetUserId: userId }
                ],
                isActive: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        // 5. Get Unique Academic Levels for these courses
        const levelsMap = new Map();
        taughtCourses.forEach(tc => {
            tc.course.academicLevels?.forEach((al: any) => {
                levelsMap.set(al.id, { id: al.id, name: al.name, displayName: al.displayName });
            });
        });
        const myLevels = Array.from(levelsMap.values());

        res.json({
            stats: {
                studentCount: totalStudents,
                courseCount: activeCoursesCount
            },
            myLevels, // Added for announcement targeting
            todaySchedule: todaysSchedule.map(s => ({
                id: s.id,
                title: s.course.name,
                code: `${s.room} - ${s.academicLevel.name}`,
                time: "Aujourd'hui",
                timeDetail: `${s.startTime} - ${s.endTime}`,
                type: 'Cours',
                isUrgent: false
            })),
            announcements: announcements.map(a => ({
                id: a.id,
                title: a.title,
                content: a.content,
                date: a.createdAt,
                type: a.type,
                target: a.target
            }))
        })

    } catch (error) {
        console.error('Erreur dashboard professeur:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const getProfessorCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        academicLevels: true,
                        schedules: true
                    }
                }
            }
        });

        const courses = enrollments.map(e => {
            const c = e.course;
            const level = c.academicLevels[0]?.displayName || 'Niveau inconnu';
            const schedule = c.schedules.map((s: any) => `${s.day}: ${s.startTime} - ${s.endTime} (${s.room})`).join('\n') || 'Non défini';

            return {
                id: c.code,
                code: c.code,
                name: c.name,
                level: level,
                schedule: schedule,
                location: c.schedules[0]?.room || 'À définir',
                color: 'blue', // Default
                role: e.role === 'PROFESSOR' ? 'Professeur' : 'Assistant'
            };
        });

        res.json(courses);
    } catch (error) {
        console.error('Erreur cours professeur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const saveAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, date, records } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        if (!hasAccess) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à gérer ce cours." });
        }

        const sessionDate = new Date(date);
        const startOfDay = new Date(sessionDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(sessionDate.setHours(23, 59, 59, 999));

        let session = await prisma.attendanceSession.findFirst({
            where: {
                courseCode,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (!session) {
            session = await prisma.attendanceSession.create({
                data: {
                    courseCode,
                    date: new Date(date)
                }
            });
        }

        if (!session) throw new Error("Impossible de créer la session");

        const upsertOperations = records.map((record: any) => {
            const statusMap: any = {
                'present': 'PRESENT',
                'absent': 'ABSENT',
                'late': 'LATE'
            };

            return prisma.attendanceRecord.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId: session!.id,
                        studentId: record.studentId
                    }
                },
                update: {
                    status: statusMap[record.status] || 'ABSENT',
                    modifiedBy: userId
                },
                create: {
                    sessionId: session!.id,
                    studentId: record.studentId,
                    status: statusMap[record.status] || 'ABSENT',
                    modifiedBy: userId
                }
            });
        });

        await prisma.$transaction(upsertOperations);

        res.json({ message: 'Présences enregistrées avec succès', sessionId: session.id });

    } catch (error) {
        console.error('Erreur sauvegarde présence:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getStudentPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId } = req.params;
        const { courseCode } = req.query;

        if (!courseCode) {
            return res.status(400).json({ message: "Code de cours requis" });
        }

        // 1. Get Attendance Stats
        const sessions = await prisma.attendanceSession.findMany({
            where: { courseCode: String(courseCode) },
            select: { id: true }
        });

        const sessionIds = sessions.map(s => s.id);
        const totalSessions = sessions.length;

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                studentId,
                sessionId: { in: sessionIds }
            }
        });

        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

        // 2. Get Grades
        const grades = await prisma.grade.findMany({
            where: {
                studentId,
                assessment: { courseCode: String(courseCode) }
            },
            include: {
                assessment: true
            },
            orderBy: {
                assessment: { date: 'desc' }
            }
        }) as any[];

        res.json({
            attendanceRate,
            totalSessions,
            presentCount,
            grades: grades.map(g => ({
                id: g.id,
                title: g.assessment.title,
                score: g.score,
                maxPoints: g.assessment.maxPoints,
                date: g.assessment.date
            }))
        });
    } catch (error) {
        console.error('Erreur performance étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const unenrollStudent = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, courseCode } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Verify if professor has access to this course
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        if (!hasAccess) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à gérer ce cours." });
        }

        // Set isActive to false instead of deleting the record to preserve attendance history
        await prisma.studentCourseEnrollment.updateMany({
            where: {
                userId: studentId,
                courseCode: courseCode,
                isActive: true
            },
            data: {
                isActive: false,
                withdrawnAt: new Date()
            }
        });

        res.json({ message: 'Étudiant désinscrit avec succès' });
    } catch (error) {
        console.error('Erreur désinscription étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const searchStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        if (!query || String(query).length < 2) {
            return res.json([]);
        }

        const students = await prisma.user.findMany({
            where: {
                systemRole: 'STUDENT',
                OR: [
                    { name: { contains: String(query), mode: 'insensitive' } },
                    { id: { contains: String(query), mode: 'insensitive' } }
                ],
                isArchived: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                studentEnrollments: {
                    include: {
                        academicLevel: true
                    },
                    orderBy: {
                        academicYear: 'desc'
                    },
                    take: 1
                }
            },
            take: 10
        }) as any[];

        res.json(students.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            academicLevel: s.studentEnrollments[0]?.academicLevel.name || 'Non défini'
        })));
    } catch (error) {
        console.error('Erreur recherche étudiants:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const enrollStudent = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, courseCode } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Verify if professor has access to this course
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        if (!hasAccess) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à gérer ce cours." });
        }

        // Current academic year (should be dynamic)
        const academicYear = "2024-2025";

        const enrollment = await prisma.studentCourseEnrollment.upsert({
            where: {
                userId_courseCode_academicYear: {
                    userId: studentId,
                    courseCode,
                    academicYear
                }
            },
            update: {
                isActive: true,
                withdrawnAt: null
            },
            create: {
                userId: studentId,
                courseCode,
                academicYear,
                isActive: true
            }
        });

        res.json({ message: 'Étudiant inscrit avec succès', enrollment });
    } catch (error) {
        console.error('Erreur inscription étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const createAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, title, type, maxPoints, date, weight, dueDate } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const assessment = await prisma.assessment.create({
            data: {
                courseCode,
                creatorId: userId,
                title,
                type,
                maxPoints: parseFloat(maxPoints),
                date: new Date(date),
                dueDate: dueDate ? new Date(dueDate) : null,
                weight: weight ? parseFloat(weight) : 1.0,
                isPublished: false
            }
        });

        res.json({ message: 'Évaluation créée avec succès', assessment });
    } catch (error) {
        console.error('Erreur création évaluation:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getCourseAssessments = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode } = req.params;
        const assessments = await prisma.assessment.findMany({
            where: { courseCode },
            include: {
                grades: true,
                submissions: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        res.json(assessments);
    } catch (error) {
        console.error('Erreur récupération évaluations:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const saveGrades = async (req: AuthRequest, res: Response) => {
    try {
        const { assessmentId, grades } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Verify if professor owns the assessment
        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId }
        });

        if (!assessment || assessment.creatorId !== userId) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ces notes" });
        }

        // Save each grade
        const savedGrades = await Promise.all(grades.map((g: any) =>
            prisma.grade.upsert({
                where: {
                    assessmentId_studentId: {
                        assessmentId,
                        studentId: g.studentId
                    }
                },
                update: {
                    score: parseFloat(g.score),
                    modifiedBy: userId
                },
                create: {
                    assessmentId,
                    studentId: g.studentId,
                    score: parseFloat(g.score),
                    modifiedBy: userId
                }
            })
        ));

        res.json({ message: 'Notes enregistrées avec succès', savedGrades });
    } catch (error) {
        console.error('Erreur enregistrement notes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const uploadCourseResource = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, title } = req.body;
        const userId = req.user?.userId;
        const file = req.file;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });
        if (!file) return res.status(400).json({ message: 'Aucun fichier fourni' });

        // Vérifier si le professeur enseigne ce cours
        const enrollment = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        if (!enrollment) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à ajouter des ressources pour ce cours." });
        }

        // Upload vers Cloudinary en mode RAW pour les documents
        const uploadResult = await uploadToCloudinary(file.buffer, `courses/${courseCode}/resources`, file.originalname);

        console.log('Fichier uploadé avec succès:', uploadResult.secure_url);

        // Enregistrer dans la DB
        const resource = await prisma.courseResource.create({
            data: {
                courseCode,
                title: title || file.originalname,
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id
            }
        });

        res.json({ message: 'Document partagé avec succès', resource });
    } catch (error) {
        console.error('Erreur upload ressource:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du fichier' });
    }
}

export const getCourseResources = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode } = req.params;
        const resources = await prisma.courseResource.findMany({
            where: { courseCode },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json(resources);
    } catch (error) {
        console.error('Erreur récup ressources:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
export const deleteCourseResource = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const resource = await prisma.courseResource.findUnique({
            where: { id: parseInt(id) }
        });

        if (!resource) return res.status(404).json({ message: 'Ressource non trouvée' });

        // Vérifier si le professeur enseigne ce cours
        const enrollment = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode: resource.courseCode }
        });

        if (!enrollment) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette ressource." });
        }

        // Supprimer de Cloudinary si we have a publicId
        if (resource.publicId) {
            await deleteFromCloudinary(resource.publicId);
        }

        // Supprimer de la DB
        await prisma.courseResource.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Ressource supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression ressource:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
}
