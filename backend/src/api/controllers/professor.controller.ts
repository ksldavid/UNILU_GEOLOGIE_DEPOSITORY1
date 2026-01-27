import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinaryHelper'
import { sendPushNotifications } from '../../utils/pushNotifications'



export const getProfessorStudents = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { courseCode } = req.query;

        // 0. Récupérer les infos de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const isSuperUser = userRole === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        let filterCourseCodes: string[] = [];
        let courseMap = new Map<string, string>();

        const whereClause = isSuperUser
            ? (courseCode ? { courseCode: String(courseCode) } : {})
            : { userId, ...(courseCode ? { courseCode: String(courseCode) } : {}) };

        if (isSuperUser && !courseCode) {
            // SuperUser viewing all: We'll fill courseMap but filterCourseCodes might be too large
            // We'll handle this cases differently in step 2
            const allCourses = await prisma.course.findMany({ select: { code: true, name: true }, take: 200 });
            allCourses.forEach(c => courseMap.set(c.code, c.name));
        } else {
            const taughtCourses = await prisma.courseEnrollment.findMany({
                where: whereClause,
                select: { courseCode: true, course: { select: { name: true } } },
                distinct: ['courseCode']
            }) as any[];

            filterCourseCodes = taughtCourses.map(tc => tc.courseCode);
            taughtCourses.forEach(tc => courseMap.set(tc.courseCode, tc.course.name));
        }

        // 2. Get students enrolled in these courses
        let studentEnrollments: any[] = [];

        if (isSuperUser && !courseCode) {
            // Fetch students directly for SuperUser view
            const users = await prisma.user.findMany({
                where: { systemRole: 'STUDENT', isArchived: false },
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: {
                    studentCourseEnrollments: {
                        where: { isActive: true },
                        take: 1,
                        include: { course: { include: { academicLevels: true } } }
                    }
                }
            }) as any[];

            studentEnrollments = users.map(u => {
                const enrollment = u.studentCourseEnrollments[0];
                return {
                    user: u,
                    courseCode: enrollment?.courseCode || 'N/A',
                    course: enrollment?.course || { name: 'Non inscrit', academicLevels: [] }
                };
            });
        } else {
            studentEnrollments = await prisma.studentCourseEnrollment.findMany({
                where: {
                    courseCode: { in: filterCourseCodes },
                    isActive: true
                },
                // NO LIMIT when viewing a specific course (needed for full attendance list)
                // Only limit if it's a general view without courseCode
                take: (isSuperUser && !courseCode) ? 100 : undefined,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    course: { include: { academicLevels: true } }
                }
            });
        }

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
                todayStatus: (todayStatus && todayStatus.courseCode === cCode) ? todayStatus.status.toLowerCase() : null
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
        const userRole = req.user?.role;
        // Fetch user context for SuperUser check
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const isSuperUser = userRole === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: isSuperUser ? {} : { userId },
            select: { courseCode: true },
            distinct: ['courseCode']
        });
        const courseCodes = taughtCourses.map(tc => tc.courseCode);

        // Get all schedules for these courses
        const schedules = await prisma.schedule.findMany({
            where: isSuperUser ? {} : { courseCode: { in: courseCodes } },
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
        const userRole = req.user?.role

        // 0. Récupérer les infos du professeur
        const professor = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        if (!professor) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' })
        }

        const isSuperUser = userRole === 'ADMIN' || professor.name.toLowerCase().includes('departement');

        // 1. Récupérer uniquement les CODES des cours (beaucoup plus léger)
        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: isSuperUser ? {} : { userId },
            select: {
                courseCode: true,
                status: true
            },
            distinct: isSuperUser ? ['courseCode'] : undefined
        });

        const courseCodes = taughtCourses.map(tc => tc.courseCode);

        // -- STATS OPTIMISÉES --

        // Compter les cours actifs uniques
        const activeGroup = await prisma.courseEnrollment.groupBy({
            by: ['courseCode'],
            where: {
                ...(isSuperUser ? {} : { userId }),
                status: 'ACTIVE'
            }
        });
        const activeCoursesCount = activeGroup.length;

        // Compter les cours terminés uniques
        const finishedGroup = await prisma.courseEnrollment.groupBy({
            by: ['courseCode'],
            where: {
                ...(isSuperUser ? {} : { userId }),
                status: 'FINISHED'
            }
        });
        const finishedCoursesCount = finishedGroup.length;

        // Count unique students (Corrected logic to avoid duplicates)
        let totalStudents = 0;
        if (isSuperUser) {
            totalStudents = await prisma.user.count({
                where: { systemRole: 'STUDENT', isArchived: false }
            });
        } else {
            const result = await prisma.studentCourseEnrollment.groupBy({
                by: ['userId'],
                where: {
                    courseCode: { in: courseCodes },
                    isActive: true
                }
            });
            totalStudents = result.length;
        }

        // 3. Récupérer les cours de la journée (Planning) - Seulement le nécessaire
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const today = new Date();
        const todayCapitalized = daysFr[today.getDay()]

        const totalTodayCount = await prisma.schedule.count({
            where: isSuperUser
                ? { day: todayCapitalized }
                : { courseCode: { in: courseCodes }, day: todayCapitalized }
        });

        const todaysSchedule = await prisma.schedule.findMany({
            where: isSuperUser
                ? { day: todayCapitalized }
                : { courseCode: { in: courseCodes }, day: todayCapitalized },
            select: {
                id: true,
                courseCode: true,
                room: true,
                startTime: true,
                endTime: true,
                course: { select: { name: true } },
                academicLevel: { select: { name: true, displayName: true } }
            },
            orderBy: { startTime: 'asc' },
            take: 6 // Take 6 to detect if "Voir plus" is needed
        });

        // 4. Fetch Faculty Announcements
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
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, title: true, content: true, createdAt: true, type: true, target: true
            }
        });

        // 5. Récupérer les devoirs récents (Seulement si nécessaire)
        let recentlyExpiredAssignments: any[] = [];
        if (isSuperUser || courseCodes.length > 0) {
            recentlyExpiredAssignments = await prisma.assessment.findMany({
                where: {
                    ...(isSuperUser ? {} : { courseCode: { in: courseCodes } }),
                    type: { in: ['TP', 'TD'] },
                    dueDate: {
                        lt: new Date(),
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    course: { select: { name: true } },
                    _count: { select: { submissions: true } }
                },
                orderBy: { dueDate: 'desc' },
                take: 3
            });
        }

        // 6. Get Unique Academic Levels for these courses
        // This part needs to fetch academic levels based on courseCodes, not from taughtCourses directly anymore.
        // We need to query `Course` table to get academic levels.
        const coursesWithLevels = await prisma.course.findMany({
            where: isSuperUser ? {} : { code: { in: courseCodes } },
            select: {
                academicLevels: {
                    select: { id: true, name: true, displayName: true }
                }
            }
        });

        const levelsMap = new Map();
        coursesWithLevels.forEach(course => {
            course.academicLevels.forEach(al => {
                levelsMap.set(al.id, { id: al.id, name: al.name, displayName: al.displayName });
            });
        });
        const myLevels = Array.from(levelsMap.values());

        res.json({
            professorName: professor?.name,
            stats: {
                studentCount: totalStudents,
                activeCourseCount: activeCoursesCount,
                finishedCourseCount: finishedCoursesCount
            },
            myLevels,
            expiredAssignments: (recentlyExpiredAssignments as any[]).map(a => ({
                id: a.id,
                title: a.title,
                courseName: a.course?.name || 'Inconnu',
                expiredAt: a.dueDate,
                submissionCount: a._count?.submissions || 0
            })),
            todaySchedule: (todaysSchedule as any[]).slice(0, 5).map(s => ({
                id: s.id,
                title: s.course?.name || 'Sans titre',
                courseCode: s.courseCode,
                room: s.room,
                level: s.academicLevel?.displayName || s.academicLevel?.name || 'N/A',
                time: "Aujourd'hui",
                timeDetail: `${s.startTime} - ${s.endTime}`,
                type: 'Cours',
                isUrgent: false
            })),
            hasMoreSchedules: todaysSchedule.length > 5,
            totalTodaySchedules: totalTodayCount,
            announcements: (announcements as any[]).map(a => ({
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
        const userRole = req.user?.role;
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const isSuperUser = userRole === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        const enrollments = await prisma.courseEnrollment.findMany({
            where: isSuperUser ? {} : { userId },
            include: {
                course: {
                    include: {
                        academicLevels: true,
                        schedules: true
                    }
                }
            },
            ...(isSuperUser ? { distinct: ['courseCode'] as const } : {})
        }) as any[];

        const courses = enrollments.map(e => {
            const c = e.course;
            const level = c.academicLevels[0]?.displayName || 'Niveau inconnu';
            const schedule = c.schedules.map((s: any) => `${s.day}: ${s.startTime} - ${s.endTime} (${s.room})`).join('\n') || 'Non défini';

            return {
                id: String(e.id),
                code: c.code,
                name: c.name,
                level: level,
                schedule: schedule,
                location: c.schedules[0]?.room || 'À définir',
                color: 'blue', // Default
                role: e.role === 'PROFESSOR' ? 'Professeur' : 'Assistant',
                status: e.status
            };
        });

        res.json(courses);
    } catch (error) {
        console.error('Erreur cours professeur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const updateCourseStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, status, enrollmentId } = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const isSuperUser = userRole === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (enrollmentId) {
            await prisma.courseEnrollment.update({
                where: { id: Number(enrollmentId) },
                data: { status }
            });
        } else {
            // Fallback to searching by code and year
            const updateWhere = isSuperUser
                ? { courseCode, academicYear: { in: ['2023-2024', '2024-2025', '2025-2026'] } }
                : { userId, courseCode, academicYear: { in: ['2023-2024', '2024-2025', '2025-2026'] } };

            await prisma.courseEnrollment.updateMany({
                where: updateWhere,
                data: { status }
            });
        }

        res.json({ message: `Statut du cours mis à jour en ${status}` });
    } catch (error) {
        console.error('Erreur mise à jour statut cours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const removeCourseAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, enrollmentId } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        if (enrollmentId) {
            await prisma.courseEnrollment.delete({
                where: { id: Number(enrollmentId) }
            });
        } else {
            await prisma.courseEnrollment.deleteMany({
                where: {
                    userId,
                    courseCode,
                    academicYear: { in: ['2023-2024', '2024-2025', '2025-2026'] }
                }
            });
        }

        res.json({ message: 'Cours retiré de votre charge avec succès' });
    } catch (error) {
        console.error('Erreur retrait cours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const saveAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, date, records } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const enrollment = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        const isSuperUser = req.user?.role === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (!enrollment && !isSuperUser) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à gérer ce cours." });
        }

        if (enrollment?.status === 'FINISHED') {
            return res.status(403).json({ message: "Ce cours ne dispose plus de prise de présence vue que il a ete terminer" });
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

        // Verify if professor has access (Admins/Dept have access to all)
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        const isSuperUser = req.user?.role === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (!hasAccess && !isSuperUser) {
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

        // Verify if professor has access (Admins/Dept have access to all)
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        const isSuperUser = req.user?.role === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (!hasAccess && !isSuperUser) {
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

        // Verify if professor has access to this course
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        const isSuperUser = req.user?.role === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (!hasAccess && !isSuperUser) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à créer un devoir pour ce cours." });
        }

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

        // --- ENVOI DES NOTIFICATIONS PUSH POUR LES DEVOIRS ET TESTS ---
        const notifyTypes = ['ASSIGNMENT', 'HOMEWORK', 'TP', 'INTERROGATION', 'QUIZ'];
        if (notifyTypes.includes(type)) {
            console.log(`[Push Assessment] Déclenchement pour type: ${type}, cours: ${courseCode}`);
            try {
                // Récupérer les tokens des étudiants inscrits
                const studentsWithTokens = await prisma.user.findMany({
                    where: {
                        studentCourseEnrollments: {
                            some: { courseCode, isActive: true }
                        },
                        pushToken: { not: null }
                    },
                    select: { pushToken: true, name: true }
                });

                const tokens = studentsWithTokens.map(s => s.pushToken as string);
                console.log(`[Push Assessment] ${tokens.length} étudiants avec tokens trouvés.`);

                if (tokens.length > 0) {
                    const course = await prisma.course.findUnique({
                        where: { code: courseCode },
                        select: { name: true }
                    });

                    const limitDate = dueDate ? new Date(dueDate).toLocaleString('fr-FR', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    }) : "Non spécifiée";

                    await sendPushNotifications(tokens, {
                        title: `📝 Nouveau Devoir : ${course?.name || courseCode}`,
                        body: `Le professeur a mis en ligne le devoir : "${title}". Vous avez jusqu'au ${limitDate} pour soumettre votre travail.`,
                        data: { type: 'NEW_ASSIGNMENT', assessmentId: assessment.id, courseCode }
                    });
                }
            } catch (pushError) {
                console.error('[Push Assignment] Erreur:', pushError);
            }
        }

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

        // Verify if professor owns the assessment (Admins/Dept can modify all)
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId }
        });

        const isSuperUser = req.user?.role === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (!assessment || (assessment.creatorId !== userId && !isSuperUser)) {
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

        // --- ENVOI DES NOTIFICATIONS PUSH POUR LES RESSOURCES ---
        try {
            const studentsWithTokens = await prisma.user.findMany({
                where: {
                    studentCourseEnrollments: {
                        some: { courseCode, isActive: true }
                    },
                    pushToken: { not: null }
                },
                select: { pushToken: true }
            });

            const tokens = studentsWithTokens.map(s => s.pushToken as string);

            if (tokens.length > 0) {
                const course = await prisma.course.findUnique({
                    where: { code: courseCode },
                    select: { name: true }
                });

                const { sendPushNotifications } = require('../../utils/pushNotifications');
                await sendPushNotifications(tokens, {
                    title: `📚 Nouveau document : ${course?.name || courseCode}`,
                    body: `Le support de cours "${resource.title}" vient d'être publié. Consultez-le dans votre section Documents.`,
                    data: { type: 'NEW_RESOURCE', courseCode }
                });
            }
        } catch (pushError) {
            console.error('[Push Resource] Erreur:', pushError);
        }

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

        // --- ENVOI DES NOTIFICATIONS PUSH ---
        try {
            // Récupérer les tokens des étudiants du cours
            const studentsWithTokens = await prisma.user.findMany({
                where: {
                    studentCourseEnrollments: {
                        some: {
                            courseCode: assessment.courseCode,
                            isActive: true
                        }
                    },
                    pushToken: { not: null }
                },
                select: { pushToken: true }
            });

            const tokens = studentsWithTokens.map(s => s.pushToken as string);

            if (tokens.length > 0) {
                // Récupérer le nom du cours pour le message
                const course = await prisma.course.findUnique({
                    where: { code: assessment.courseCode },
                    select: { name: true }
                });

                await sendPushNotifications(tokens, {
                    title: '📊 Publication des résultats',
                    body: `Les résultats de l'épreuve "${assessment.title}" (${course?.name || assessment.courseCode}) ont été publiés. Vas sur uniluhub.com sur ton profil étudiant pour voir tes résultats.`,
                    data: {
                        type: 'GRADE_PUBLISHED',
                        assessmentId: assessment.id,
                        courseCode: assessment.courseCode
                    }
                });
            }
        } catch (pushError) {
            console.error('[Push] Erreur lors de la notification des notes:', pushError);
        }

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

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        const isSuperUser = req.user?.role === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        if (!hasAccess && !isSuperUser) {
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
// Update syncPastAttendance for security and 'Département'
export const syncPastAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const isSuperUser = userRole === 'ADMIN' || user?.name.toLowerCase().includes('departement');

        // Get course codes managed by this professor
        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: isSuperUser ? {} : { userId },
            select: { courseCode: true }
        });
        const courseCodes = taughtCourses.map(tc => tc.courseCode);

        // Get past sessions for managed courses
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pastSessions = await prisma.attendanceSession.findMany({
            where: isSuperUser
                ? { date: { lt: today } }
                : { courseCode: { in: courseCodes }, date: { lt: today } }
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
