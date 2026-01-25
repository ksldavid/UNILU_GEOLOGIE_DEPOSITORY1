import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinaryHelper'



export const getProfessorStudents = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { courseCode } = req.query;

        // 1. Get courses taught by professor
        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: {
                userId,
                ...(courseCode ? { courseCode: String(courseCode) } : {})
            },
            select: { courseCode: true, course: { select: { name: true } } }
        });

        const filterCourseCodes = taughtCourses.map(tc => tc.courseCode);
        const courseMap = new Map(taughtCourses.map(tc => [tc.courseCode, tc.course.name] as [string, string]));

        // 2. Get students enrolled in these courses
        const studentEnrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                courseCode: { in: filterCourseCodes },
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

        // 3. Get Attendance Stats
        const sessions = await prisma.attendanceSession.findMany({
            where: { courseCode: { in: filterCourseCodes } },
            select: { id: true, courseCode: true }
        });
        const sessionIds = sessions.map(s => s.id);

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: { sessionId: { in: sessionIds } }
        });

        // 4. Get Grades
        const grades = await prisma.grade.findMany({
            where: { assessment: { courseCode: { in: filterCourseCodes } } },
            include: { assessment: true }
        });

        // 5. Get today's attendance records for all courses
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await prisma.attendanceRecord.findMany({
            where: {
                session: {
                    courseCode: { in: filterCourseCodes },
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

        // Create a map of studentId -> attendance status for today
        const todayAttendanceMap = new Map<string, { status: string, courseCode: string }>();
        todayAttendance.forEach(record => {
            todayAttendanceMap.set(record.studentId, {
                status: record.status,
                courseCode: record.session.courseCode
            });
        });

        // 6. Format response with stats
        const students = studentEnrollments.map(enrollment => {
            const studentId = enrollment.user.id;
            const cCode = enrollment.courseCode;

            // Attendance for this student/course
            const courseSessions = sessions.filter(s => s.courseCode === cCode);
            const courseSessionIds = courseSessions.map(s => s.id);
            const studentRecords = attendanceRecords.filter(r =>
                r.studentId === studentId && courseSessionIds.includes(r.sessionId)
            );
            const presentCount = studentRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
            const attendanceRate = courseSessions.length > 0
                ? Math.round((presentCount / courseSessions.length) * 100)
                : 0;

            // Average grade for this student/course (normalized to 10)
            const studentGrades = grades.filter(g =>
                g.studentId === studentId && g.assessment.courseCode === cCode
            );
            let averageGrade = 0;
            if (studentGrades.length > 0) {
                const totalNormalized = studentGrades.reduce((acc, g) => acc + (g.score / g.assessment.maxPoints) * 10, 0);
                averageGrade = parseFloat((totalNormalized / studentGrades.length).toFixed(1));
            }

            const level = enrollment.course.academicLevels[0]?.name || 'Niveau Inconnu';
            const todayStatus = todayAttendanceMap.get(studentId);

            return {
                id: studentId,
                name: enrollment.user.name,
                courseCode: cCode,
                courseName: courseMap.get(cCode) || cCode,
                academicLevel: level,
                attendance: attendanceRate,
                grade: averageGrade,
                totalSessions: courseSessions.length,
                presentCount,
                todayStatus: todayStatus?.courseCode === cCode ? todayStatus.status.toLowerCase() : null
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

        // 0. Récupérer les infos du professeur
        const professor = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

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
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const today = new Date();
        const todayCapitalized = daysFr[today.getDay()]

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

        // 5. Récupérer les devoirs qui viennent de se terminer (derniers 7 jours)
        const recentlyExpiredAssignments = await prisma.assessment.findMany({
            where: {
                courseCode: { in: courseCodes },
                type: { in: ['TP', 'TD'] },
                dueDate: {
                    lt: new Date(),
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
                }
            },
            include: {
                course: { select: { name: true } },
                _count: { select: { submissions: true } }
            },
            orderBy: { dueDate: 'desc' },
            take: 3
        }) as any[];

        // 6. Get Unique Academic Levels for these courses
        const levelsMap = new Map();
        taughtCourses.forEach(tc => {
            tc.course.academicLevels?.forEach((al: any) => {
                levelsMap.set(al.id, { id: al.id, name: al.name, displayName: al.displayName });
            });
        });
        const myLevels = Array.from(levelsMap.values());

        res.json({
            professorName: professor?.name,
            stats: {
                studentCount: totalStudents,
                courseCount: activeCoursesCount
            },
            myLevels,
            expiredAssignments: recentlyExpiredAssignments.map(a => ({
                id: a.id,
                title: a.title,
                courseName: a.course.name,
                expiredAt: a.dueDate,
                submissionCount: a._count.submissions
            })),
            todaySchedule: todaysSchedule.map(s => ({
                id: s.id,
                title: s.course.name,
                courseCode: s.courseCode,
                room: s.room,
                level: s.academicLevel.displayName || s.academicLevel.name,
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

        // Get all enrolled students for this course
        const enrolledStudents = await prisma.studentCourseEnrollment.findMany({
            where: {
                courseCode,
                isActive: true
            },
            select: {
                userId: true
            }
        });

        const enrolledStudentIds = enrolledStudents.map(e => e.userId);

        // Create a map of records provided by the professor
        const recordsMap = new Map<string, string>(
            (records || []).map((r: any) => [String(r.studentId), String(r.status)])
        );

        const statusMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {
            'present': 'PRESENT',
            'absent': 'ABSENT',
            'late': 'LATE'
        };

        // Prepare upsert operations for all enrolled students
        const upsertOperations = enrolledStudentIds.map((studentId) => {
            // If professor provided a status, use it; otherwise mark as ABSENT
            const providedStatus = recordsMap.get(studentId);
            const finalStatus: 'PRESENT' | 'ABSENT' | 'LATE' = providedStatus
                ? (statusMap[providedStatus] || 'ABSENT')
                : 'ABSENT';

            return prisma.attendanceRecord.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId: session!.id,
                        studentId: studentId
                    }
                },
                update: {
                    status: finalStatus,
                    modifiedBy: userId
                },
                create: {
                    sessionId: session!.id,
                    studentId: studentId,
                    status: finalStatus,
                    modifiedBy: userId
                }
            });
        });

        await prisma.$transaction(upsertOperations);

        res.json({
            message: 'Présences enregistrées avec succès',
            sessionId: session.id,
            totalStudents: enrolledStudentIds.length,
            recordedStudents: records.length
        });

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
        const { courseCode, title, instructions, type, maxPoints, date, weight, dueDate } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const assessment = await prisma.assessment.create({
            data: {
                courseCode,
                creatorId: userId,
                title,
                instructions,
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

        // Upload réussi - log minimal

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
    } catch (error: any) {
        console.error('Erreur upload ressource:', error);
        res.status(500).json({ message: error.message || 'Erreur lors de l\'envoi du fichier' });
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
export const deleteAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const assessment = await prisma.assessment.findUnique({
            where: { id: parseInt(id) }
        });

        if (!assessment) return res.status(404).json({ message: 'Évaluation non trouvée' });

        // Vérifier si le professeur est le créateur
        if (assessment.creatorId !== userId) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette évaluation." });
        }

        // 1. Récupérer tous les IDs des notes liées à cette épreuve
        const grades = await prisma.grade.findMany({
            where: { assessmentId: parseInt(id) },
            select: { id: true }
        });
        const gradeIds = grades.map(g => g.id);

        // 2. Supprimer en cascade manuellement pour éviter les erreurs de contrainte
        await prisma.$transaction([
            // Supprimer les demandes de modif de notes
            prisma.gradeChangeRequest.deleteMany({
                where: { gradeId: { in: gradeIds } }
            }),
            // Supprimer les notes
            prisma.grade.deleteMany({
                where: { assessmentId: parseInt(id) }
            }),
            // Supprimer les soumissions (fichiers)
            prisma.submission.deleteMany({
                where: { assessmentId: parseInt(id) }
            }),
            // Supprimer l'épreuve elle-même
            prisma.assessment.delete({
                where: { id: parseInt(id) }
            })
        ]);

        res.json({ message: 'Évaluation supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression évaluation:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
}

export const publishAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const assessment = await prisma.assessment.findUnique({
            where: { id: parseInt(id) },
        });

        if (!assessment) return res.status(404).json({ message: 'Évaluation non trouvée' });

        // 1. Mark as published
        await prisma.assessment.update({
            where: { id: parseInt(id) },
            data: { isPublished: true }
        });

        // 2. Fetch all students enrolled in the course
        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                courseCode: assessment.courseCode,
                isActive: true
            },
            select: { userId: true }
        });

        // 3. For each student, find if they have a grade, if not, create one with 0
        const upsertPromises = enrollments.map(e => {
            return prisma.grade.upsert({
                where: {
                    assessmentId_studentId: {
                        assessmentId: assessment.id,
                        studentId: e.userId
                    }
                },
                update: {}, // Don't change existing grades
                create: {
                    assessmentId: assessment.id,
                    studentId: e.userId,
                    score: 0,
                    feedback: 'Note automatique (0) lors de la publication'
                }
            });
        });

        await Promise.all(upsertPromises);

        res.json({ message: 'Évaluation publiée avec succès' });
    } catch (error) {
        console.error('Erreur publication épreuve:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const requestGradeChange = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { studentId, assessmentId, newScore, reason } = req.body;
        const file = req.file;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Trouver la note existante
        const grade = await prisma.grade.findUnique({
            where: {
                assessmentId_studentId: {
                    assessmentId: parseInt(assessmentId),
                    studentId: studentId
                }
            }
        });

        if (!grade) {
            return res.status(404).json({ message: "Note non trouvée. L'étudiant doit avoir une note avant de demander une modification." });
        }

        // Vérifier s'il y a déjà une demande en cours pour cet étudiant et cet examen
        const existingRequest = await prisma.gradeChangeRequest.findFirst({
            where: {
                gradeId: grade.id,
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                message: "Une demande de modification est déjà en cours pour cet étudiant et cet examen."
            });
        }

        let proofImageUrl = null;
        if (file) {
            const uploadResult = await uploadToCloudinary(file.buffer, `grade-proofs/${assessmentId}`, file.originalname);
            proofImageUrl = uploadResult.secure_url;
        }

        const request = await prisma.gradeChangeRequest.create({
            data: {
                gradeId: grade.id,
                requesterId: userId,
                newScore: parseFloat(newScore),
                reason,
                proofImageUrl,
                status: 'PENDING'
            }
        });

        res.json({ message: 'Demande de modification envoyée avec succès', request });

    } catch (error) {
        console.error('Erreur demande modif grade:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de la demande' });
    }
}

export const getCoursePerformance = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode } = req.params;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        if (!hasAccess) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const assessments = await prisma.assessment.findMany({
            where: { courseCode },
            include: {
                grades: true
            }
        });

        const enrolledStudentsCount = await prisma.studentCourseEnrollment.count({
            where: { courseCode, isActive: true }
        });

        const examStats = await Promise.all(assessments.map(async (exam) => {
            const allGrades = exam.grades;
            const totalCount = allGrades.length;

            const successGrades = allGrades.filter(g => g.score >= (exam.maxPoints / 2));
            const failureGrades = allGrades.filter(g => g.score < (exam.maxPoints / 2));

            const successCount = successGrades.length;
            const failureCount = totalCount - successCount;
            const sumScores = allGrades.reduce((sum, g) => sum + g.score, 0);

            // Fetch names for these students to make stats "real"
            const studentIds = exam.grades.map(g => g.studentId);
            const students = await prisma.user.findMany({
                where: { id: { in: studentIds } },
                select: { id: true, name: true }
            });
            const studentMap = new Map(students.map(s => [s.id, s.name]));

            return {
                id: exam.id,
                title: exam.title,
                success: totalCount > 0 ? parseFloat(((successCount / totalCount) * 100).toFixed(2)) : 0,
                failure: totalCount > 0 ? parseFloat(((failureCount / totalCount) * 100).toFixed(2)) : 0,
                avg: totalCount > 0 ? parseFloat((sumScores / totalCount).toFixed(2)) : 0,
                total: totalCount,
                enrolled: enrolledStudentsCount,
                successList: successGrades.map(g => ({ id: g.studentId, name: studentMap.get(g.studentId), score: g.score })),
                failureList: failureGrades.map(g => ({ id: g.studentId, name: studentMap.get(g.studentId), score: g.score }))
            };
        }));

        // Calculate global stats based only on assessments that have at least one grade
        // to avoid watering down semester averages with empty assessments
        const gradedExams = examStats.filter(s => s.total > 0);

        let globalSuccess = 0;
        let globalFailure = 0;
        let globalAvg = 0;
        let globalTotal = 0;

        if (gradedExams.length > 0) {
            globalSuccess = parseFloat((gradedExams.reduce((sum, s) => sum + s.success, 0) / gradedExams.length).toFixed(2));
            globalFailure = parseFloat((gradedExams.reduce((sum, s) => sum + s.failure, 0) / gradedExams.length).toFixed(2));
            globalAvg = parseFloat((gradedExams.reduce((sum, s) => sum + s.avg, 0) / gradedExams.length).toFixed(2));
            globalTotal = Math.round(gradedExams.reduce((sum, s) => sum + s.total, 0) / gradedExams.length);
        } else if (examStats.length > 0) {
            // If NO exams are graded yet, still show 0 instead of NaN
            globalTotal = 0;
        }

        const response = [
            {
                id: 0,
                title: "Vue Globale (Semestre)",
                success: globalSuccess,
                failure: globalFailure,
                avg: globalAvg,
                total: globalTotal,
                enrolled: enrolledStudentsCount
            },
            ...examStats
        ];

        res.json(response);
    } catch (error) {
        console.error('Erreur stats performance cours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

/**
 * Synchronise les absences pour les sessions passées
 * Marque automatiquement comme ABSENT tous les étudiants inscrits
 * qui n'ont pas d'enregistrement de présence pour les sessions passées
 */
export const syncPastAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Get all past sessions (before today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pastSessions = await prisma.attendanceSession.findMany({
            where: {
                date: {
                    lt: today
                }
            }
        });

        let totalSynced = 0;
        const operations = [];

        for (const session of pastSessions) {
            // Get all enrolled students for this course
            const enrolledStudents = await prisma.studentCourseEnrollment.findMany({
                where: {
                    courseCode: session.courseCode,
                    isActive: true
                },
                select: {
                    userId: true
                }
            });

            const enrolledStudentIds = enrolledStudents.map((e: any) => e.userId);

            // Get students who already have a record
            const existingRecords = await prisma.attendanceRecord.findMany({
                where: {
                    sessionId: session.id
                },
                select: {
                    studentId: true
                }
            });

            const recordedStudentIds = new Set(existingRecords.map((r: any) => r.studentId));

            // Find students without a record
            const missingStudentIds = enrolledStudentIds.filter((id: string) => !recordedStudentIds.has(id));

            // Create ABSENT records for missing students
            for (const studentId of missingStudentIds) {
                operations.push(
                    prisma.attendanceRecord.create({
                        data: {
                            sessionId: session.id,
                            studentId: studentId,
                            status: 'ABSENT',
                            modifiedBy: 'SYSTEM' // Marqué par le système
                        }
                    })
                );
                totalSynced++;
            }
        }

        // Execute all operations in a transaction
        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        res.json({
            message: 'Synchronisation terminée',
            sessionsProcessed: pastSessions.length,
            recordsCreated: totalSynced
        });

    } catch (error) {
        console.error('Erreur sync présences passées:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
