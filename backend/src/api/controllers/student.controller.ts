import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import { uploadToCloudinary } from '../../utils/cloudinaryHelper'

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' })
        }

        // 1. Récupérer les infos de l'étudiant
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    include: { academicLevel: true },
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                },
                studentCourseEnrollments: {
                    where: { isActive: true },
                    include: { course: true }
                }
            }
        }) as any

        if (!student) {
            return res.status(404).json({ message: 'Étudiant non trouvé' })
        }

        const currentEnrollment = student.studentEnrollments[0]
        const currentLevelId = currentEnrollment?.academicLevelId
        const levelName = currentEnrollment?.academicLevel?.name || 'Non défini'

        // 2. Récupérer les statistiques par cours
        const courseStats = await Promise.all(
            student.studentCourseEnrollments.map(async (enrollment: any) => {
                const courseCode = enrollment.courseCode

                // Get all sessions for this course
                const sessions = await prisma.attendanceSession.findMany({
                    where: { courseCode }
                })

                // Get student's attendance records for these sessions
                const records = await prisma.attendanceRecord.findMany({
                    where: {
                        studentId: userId,
                        sessionId: { in: sessions.map(s => s.id) }
                    }
                })

                const totalCount = sessions.length
                const presentCount = records.filter(r => r.status === 'PRESENT').length
                const lateCount = records.filter(r => r.status === 'LATE').length
                const attendedCount = presentCount + (lateCount * 0.5)
                const percentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 100

                // Assign colors based on percentage
                let color = '#10b981' // green
                if (percentage < 50) color = '#ef4444' // red
                else if (percentage < 75) color = '#f59e0b' // orange
                else if (percentage < 85) color = '#0284c7' // blue

                return {
                    id: courseCode,
                    name: enrollment.course.name,
                    percentage,
                    totalCount,
                    attendedCount: Math.round(attendedCount),
                    color
                }
            })
        )

        // 3. Récupérer l'historique récent (derniers 10 scans)
        const recentAttendance = await prisma.attendanceRecord.findMany({
            where: { studentId: userId },
            include: {
                session: {
                    include: { course: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        const formattedHistory = recentAttendance.map((record: any) => ({
            id: record.id,
            courseName: record.session.course.name,
            date: record.session.date,
            time: record.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status: record.status
        }))

        // Calculate overall attendance
        const totalSessions = courseStats.reduce((sum, course) => sum + course.totalCount, 0);
        const totalAttended = courseStats.reduce((sum, course) => sum + course.attendedCount, 0);
        const overallAttendance = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

        // Get active course codes for the student
        const activeCourseCodes = student.studentCourseEnrollments.map((e: any) => e.courseCode);

        // 4. Récupérer le planning du jour
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const today = new Date();
        const dayOfWeek = daysFr[today.getDay()];
        const academicYear = currentEnrollment?.academicYear;

        const todaySchedule = await prisma.schedule.findMany({
            where: {
                academicLevelId: currentLevelId,
                day: dayOfWeek,
                courseCode: { in: activeCourseCodes },
                academicYear: academicYear
            },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { role: 'PROFESSOR' },
                            include: { user: { select: { name: true } } },
                            take: 1
                        }
                    }
                }
            }
        });

        // Map course codes to specific hex colors for consistency
        const dashboardColors = [
            '#3b82f6', '#a855f7', '#ec4899', '#f97316',
            '#22c55e', '#6366f1', '#ef4444', '#06b6d4'
        ];

        const formattedSchedule = todaySchedule.map((schedule: any) => {
            const courseIdx = activeCourseCodes.indexOf(schedule.courseCode);
            const color = dashboardColors[courseIdx !== -1 ? courseIdx % dashboardColors.length : 0];

            return {
                id: schedule.id,
                title: schedule.course.name,
                code: schedule.courseCode,
                time: `${schedule.startTime} - ${schedule.endTime}`,
                room: schedule.room,
                professor: schedule.course.enrollments[0]?.user.name || 'À définir',
                type: 'Cours',
                colorHex: color // Use hex for direct control
            };
        });

        // 5. Récupérer les annonces
        const announcements = await prisma.announcement.findMany({
            where: {
                OR: [
                    { target: 'GLOBAL' },
                    { target: 'ALL_STUDENTS' },
                    { target: 'ACADEMIC_LEVEL', academicLevelId: currentLevelId },
                    { target: 'COURSE_STUDENTS', courseCode: { in: activeCourseCodes } },
                    { target: 'SPECIFIC_USER', targetUserId: userId }
                ],
                isActive: true
            },
            include: {
                author: { select: { name: true } },
                readReceipts: {
                    where: { userId }
                }
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
        });

        const formattedAnnouncements = announcements.map((ann: any) => ({
            ...ann,
            isRead: ann.readReceipts.length > 0,
            date: ann.createdAt,
            author: ann.author.name,
            color: ann.type === 'SCHEDULE' ? 'from-orange-500 to-orange-600' :
                ann.type === 'RESOURCE' ? 'from-blue-500 to-blue-600' :
                    ann.type === 'REMINDER' ? 'from-purple-500 to-purple-600' : 'from-teal-500 to-teal-600'
        }));

        // 6. Récupérer les devoirs en cours (TP/TD non soumis)
        const pendingAssignments = await prisma.assessment.findMany({
            where: {
                courseCode: { in: activeCourseCodes },
                type: { in: ['TP', 'TD'] },
                submissions: {
                    none: { studentId: userId }
                }
            },
            include: {
                course: {
                    select: { name: true }
                }
            },
            orderBy: { dueDate: 'asc' },
            take: 1
        }) as any[];

        res.json({
            student: {
                name: student.name,
                level: levelName
            },
            stats: {
                attendance: overallAttendance,
                courseCount: courseStats.length,
                courses: courseStats,
                pendingAssignmentsCount: pendingAssignments.length
            },
            todaySchedule: formattedSchedule,
            recentAttendance: formattedHistory,
            pendingAssignments: pendingAssignments.map(a => ({
                id: a.id,
                title: a.title,
                courseName: a.course?.name || 'Inconnu',
                dueDate: a.dueDate,
                type: a.type
            })),
            announcements: formattedAnnouncements
        })

    } catch (error) {
        console.error('Erreur dashboard étudiant:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const getStudentCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // Get student's academic level
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    include: { academicLevel: true },
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        }) as any;

        if (!student) {
            return res.status(404).json({ message: 'Étudiant non trouvé' });
        }

        const academicLevel = student.studentEnrollments?.[0]?.academicLevel?.name || 'Étudiant';

        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                userId,
                isActive: true
            },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { role: 'PROFESSOR' },
                            include: { user: true },
                            take: 1
                        },
                        schedules: {
                            orderBy: { day: 'asc' }
                        },
                        _count: {
                            select: { resources: true }
                        },
                        assessments: {
                            where: {
                                type: { in: ['TP', 'TD'] },
                                submissions: {
                                    none: { studentId: userId }
                                }
                            }
                        },
                        attendanceSessions: {
                            include: {
                                records: {
                                    where: { studentId: userId }
                                }
                            }
                        }
                    }
                }
            }
        }) as any[];

        // Color palette for courses (hex values for inline styles)
        const colors = [
            { from: '#3b82f6', to: '#2563eb' },    // blue
            { from: '#a855f7', to: '#9333ea' },    // purple
            { from: '#ec4899', to: '#db2777' },    // pink
            { from: '#f97316', to: '#ea580c' },    // orange
            { from: '#22c55e', to: '#16a34a' },    // green
            { from: '#6366f1', to: '#4f46e5' },    // indigo
            { from: '#ef4444', to: '#dc2626' },    // red
            { from: '#06b6d4', to: '#0891b2' }     // cyan
        ];

        const courses = enrollments.map((e, index) => {
            const c = e.course;
            const prof = c.enrollments[0]?.user.name || 'À définir';
            const schedule = c.schedules.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join('\n');
            const room = c.schedules[0]?.room || 'Campus Kasapa';

            // Calculate real attendance statistics
            const totalSessions = c.attendanceSessions.length;
            const attendedSessions = c.attendanceSessions.filter((session: any) =>
                session.records.length > 0 &&
                (session.records[0].status === 'PRESENT' || session.records[0].status === 'LATE')
            ).length;

            const percentage = totalSessions > 0
                ? Math.round((attendedSessions / totalSessions) * 100)
                : 0;

            const colorPalette = colors[index % colors.length];

            return {
                id: c.code,
                code: c.code,
                name: c.name,
                professor: prof,
                schedule: schedule || 'Horaire non défini',
                room: room,
                colorFrom: colorPalette.from,
                colorTo: colorPalette.to,
                nextSession: 'À venir',
                materials: c._count.resources,
                assignments: c.assessments.length,
                attendedCount: attendedSessions,
                totalCount: totalSessions,
                percentage: percentage,
                attendance: percentage
            };
        });

        res.json({
            academicLevel,
            courses
        });
    } catch (error) {
        console.error('Erreur cours étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getStudentCourseDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { courseCode } = req.params;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // 1. Course Info & Prof
        const course = await prisma.course.findUnique({
            where: { code: courseCode },
            include: {
                enrollments: {
                    where: { role: 'PROFESSOR' },
                    include: { user: true },
                    take: 1
                },
                schedules: true,
                resources: true,
                assessments: {
                    where: {
                        OR: [
                            { isPublished: true },
                            { type: { in: ['TP', 'TD'] } }
                        ]
                    },
                    include: {
                        submissions: {
                            where: { studentId: userId }
                        }
                    },
                    orderBy: { date: 'desc' }
                }
            }
        }) as any;

        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        // 2. Attendance Stats for this course
        const sessions = await prisma.attendanceSession.findMany({
            where: { courseCode },
            select: { id: true }
        });
        const sessionIds = sessions.map(s => s.id);

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                studentId: userId,
                sessionId: { in: sessionIds }
            }
        });

        const totalSessions = sessions.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

        // NEW: Get the color for this course (consistent with the list)
        const allEnrollments = await prisma.studentCourseEnrollment.findMany({
            where: { userId, isActive: true },
            orderBy: { enrolledAt: 'asc' }
        });
        const courseIndex = allEnrollments.findIndex(e => e.courseCode === courseCode);

        const colors = [
            { from: '#3b82f6', to: '#2563eb' },    // blue
            { from: '#a855f7', to: '#9333ea' },    // purple
            { from: '#ec4899', to: '#db2777' },    // pink
            { from: '#f97316', to: '#ea580c' },    // orange
            { from: '#22c55e', to: '#16a34a' },    // green
            { from: '#6366f1', to: '#4f46e5' },    // indigo
            { from: '#ef4444', to: '#dc2626' },    // red
            { from: '#06b6d4', to: '#0891b2' }     // cyan
        ];
        const colorPalette = colors[courseIndex !== -1 ? courseIndex % colors.length : 0];

        // 3. Transform data for frontend
        res.json({
            code: course.code,
            name: course.name,
            professor: course.enrollments[0]?.user.name || 'À définir',
            room: course.schedules[0]?.room || 'Campus Kasapa',
            schedule: course.schedules.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ') || 'Horaire non défini',
            attendance: attendanceRate,
            colorFrom: colorPalette.from,
            colorTo: colorPalette.to,
            resources: course.resources.map((r: any) => ({
                id: r.id,
                title: r.title,
                url: r.url,
                date: r.uploadedAt
            })),
            assignments: course.assessments.map((a: any) => ({
                id: a.id,
                title: a.title,
                instructions: a.instructions,
                type: a.type,
                dueDate: a.dueDate,
                submitted: a.submissions.length > 0,
                submittedAt: a.submissions[0]?.submittedAt,
                submissionUrl: a.submissions[0]?.fileUrl,
                status: a.isPublished ? 'PUBLISHED' : 'LAUNCHED'
            }))
        });

    } catch (error) {
        console.error('Erreur détails cours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getStudentSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Get student's current enrollment to know their level
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        }) as any;

        if (!student || student.studentEnrollments.length === 0) {
            return res.status(404).json({ message: 'Inscription non trouvée' });
        }

        const enrollment = student.studentEnrollments[0];

        // Get active course codes for the student
        const activeEnrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                userId,
                isActive: true
            },
            select: { courseCode: true }
        });
        const activeCourseCodes = activeEnrollments.map(e => e.courseCode);

        // Fetch all schedules for this level and year, filtered by active courses
        const schedules = await prisma.schedule.findMany({
            where: {
                academicLevelId: enrollment.academicLevelId,
                academicYear: enrollment.academicYear,
                courseCode: { in: activeCourseCodes }
            },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { role: 'PROFESSOR' },
                            include: { user: true },
                            take: 1
                        }
                    }
                }
            }
        });

        // Group by day for easier frontend consumption
        const groupedSchedule: any = {
            'Lundi': [],
            'Mardi': [],
            'Mercredi': [],
            'Jeudi': [],
            'Vendredi': [],
            'Samedi': []
        };

        schedules.forEach((s: any) => {
            const day = s.day; // Assuming day is "Lundi", "Mardi", etc.
            if (groupedSchedule[day]) {
                groupedSchedule[day].push({
                    id: s.id,
                    time: `${s.startTime}-${s.endTime}`,
                    course: s.course.name,
                    professor: s.course.enrollments[0]?.user.name || 'À définir',
                    room: s.room,
                    color: s.courseCode.includes('TP') ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-blue-100 border-blue-300 text-blue-700'
                });
            }
        });

        res.json(groupedSchedule);

    } catch (error) {
        console.error('Erreur planning étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getStudentGrades = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // 1. Trouver le niveau de l'étudiant
        const currentEnrollment = await prisma.studentEnrollment.findFirst({
            where: { userId },
            orderBy: { enrolledAt: 'desc' },
            select: { academicLevelId: true }
        });

        if (!currentEnrollment) return res.status(404).json({ message: 'Niveau académique non trouvé' });

        // 2. Récupérer tous les étudiants du même niveau
        const peers = await prisma.studentEnrollment.findMany({
            where: { academicLevelId: currentEnrollment.academicLevelId },
            select: { userId: true }
        });

        const peerIds = peers.map(p => p.userId);

        // 3. Récupérer TOUTES les notes publiées pour ces étudiants
        const allGrades = await prisma.grade.findMany({
            where: {
                studentId: { in: peerIds },
                assessment: { isPublished: true }
            },
            include: { assessment: true }
        });

        // 4. Fonction pour calculer la moyenne d'un étudiant (Base 10)
        const calculateStudentAvg = (studentId: string) => {
            const sGrades = allGrades.filter(g => g.studentId === studentId);
            if (sGrades.length === 0) return 0;

            const courseGrades: any = {};
            sGrades.forEach(g => {
                const code = g.assessment.courseCode;
                if (!courseGrades[code]) courseGrades[code] = { tp: null, exam: null, maxPoints: g.assessment.maxPoints };

                if (g.assessment.type === 'EXAM') courseGrades[code].exam = (g.score / g.assessment.maxPoints) * 10;
                else courseGrades[code].tp = (g.score / g.assessment.maxPoints) * 10;
            });

            const finalScores = Object.values(courseGrades).map((c: any) => {
                let sum = 0, count = 0;
                if (c.tp !== null) { sum += c.tp; count++; }
                if (c.exam !== null) { sum += c.exam; count++; }
                return count > 0 ? (sum / count) : 0;
            });

            return finalScores.length > 0 ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : 0;
        };

        // 5. Calculer le classement
        const rankings = peerIds.map(id => ({
            id,
            avg: calculateStudentAvg(id)
        })).sort((a, b) => b.avg - a.avg);

        const studentRank = rankings.findIndex(r => r.id === userId) + 1;

        // 6. Formater les notes pour l'étudiant actuel (Même logique que l'original mais sur notes publiées)
        const myGrades = allGrades.filter(g => g.studentId === userId);
        const formattedGradesMap: any = {};

        // Récupérer aussi les noms des cours pour être propre
        const courses = await prisma.course.findMany({
            where: { code: { in: myGrades.map(g => g.assessment.courseCode) } }
        });

        myGrades.forEach(g => {
            const code = g.assessment.courseCode;
            if (!formattedGradesMap[code]) {
                const course = courses.find(c => c.code === code);
                formattedGradesMap[code] = {
                    code,
                    course: course?.name || 'Inconnu',
                    tp: null,
                    exam: null,
                    final: 0,
                    coefficient: 3,
                    color: 'from-blue-500 to-blue-600'
                };
            }

            const c = formattedGradesMap[code];
            const score10 = (g.score / g.assessment.maxPoints) * 10;
            if (g.assessment.type === 'EXAM') c.exam = parseFloat(score10.toFixed(2));
            else {
                // Si plusieurs TP, on peut faire une moyenne, ici on prend la dernière pour simplifier
                c.tp = parseFloat(score10.toFixed(2));
            }
        });

        const finalizedGrades = Object.values(formattedGradesMap).map((c: any) => {
            let sum = 0, count = 0;
            if (c.tp !== null) { sum += c.tp; count++; }
            if (c.exam !== null) { sum += c.exam; count++; }
            c.final = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
            return c;
        });

        res.json({
            grades: finalizedGrades,
            stats: {
                rank: studentRank,
                totalStudents: peerIds.length
            }
        });

    } catch (error) {
        console.error('Erreur notes étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getStudentAnnouncements = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Get student's current level
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        }) as any;

        const currentLevelId = student?.studentEnrollments[0]?.academicLevelId;

        // Get student's active courses
        const activeEnrollments = await prisma.studentCourseEnrollment.findMany({
            where: { userId, isActive: true },
            select: { courseCode: true }
        });
        const activeCourseCodes = activeEnrollments.map(e => e.courseCode);

        // Fetch announcements
        const announcements = await prisma.announcement.findMany({
            where: {
                OR: [
                    { target: 'GLOBAL' },
                    { target: 'ALL_STUDENTS' },
                    {
                        target: 'ACADEMIC_LEVEL',
                        academicLevelId: currentLevelId
                    },
                    {
                        target: 'COURSE_STUDENTS',
                        courseCode: { in: activeCourseCodes }
                    },
                    {
                        target: 'SPECIFIC_USER',
                        targetUserId: userId
                    }
                ],
                isActive: true
            },
            include: {
                author: { select: { name: true } },
                course: { select: { name: true } },
                readReceipts: {
                    where: { userId }
                }
            },
            orderBy: { createdAt: 'desc' }
        }) as any[];

        res.json(announcements.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            type: a.type,
            date: a.createdAt,
            author: a.author.name,
            course: a.course?.name || 'Général',
            isRead: a.readReceipts.length > 0,
            color: a.type === 'SCHEDULE' ? 'from-orange-500 to-orange-600' :
                a.type === 'RESOURCE' ? 'from-blue-500 to-blue-600' :
                    a.type === 'REMINDER' ? 'from-purple-500 to-purple-600' : 'from-teal-500 to-teal-600'
        })));

    } catch (error) {
        console.error('Erreur annonces étudiant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}


export const getStudentProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    include: { academicLevel: true },
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        }) as any;

        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });

        const enrollment = student.studentEnrollments[0];

        const academicLevel = enrollment?.academicLevel?.name || 'Non défini';

        res.json({
            id: student.id,
            idNumber: student.id, // Use the actual ID as the matricule
            name: student.name,
            email: student.email,
            sex: student.sex,
            birthday: student.birthday,
            nationality: student.nationality,
            whatsapp: student.whatsapp,
            academicLevel: academicLevel,
            academicYear: enrollment?.academicYear || '-',
            campus: 'Campus Kasapa',
            faculty: `FACULTÉ DE SCIENCE ET TECHNOLOGIE / DÉPARTEMENT DE GÉOLOGIE - ${academicLevel.toUpperCase()}`
        });
    } catch (error) {
        console.error('Erreur profile:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const updateStudentProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { sex, birthday, nationality, whatsapp } = req.body;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                sex,
                birthday: birthday ? new Date(birthday) : null,
                nationality,
                whatsapp
            }
        });

        res.json({
            message: 'Profil mis à jour avec succès',
            sex: updated.sex,
            birthday: updated.birthday,
            nationality: updated.nationality,
            whatsapp: updated.whatsapp
        });
    } catch (error) {
        console.error('Erreur update profile:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
    }
}

/**
 * Active ou désactive un cours pour un étudiant (permet d'éliminer les cours réussis)
 */
export const toggleCourseActive = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { courseCode, isActive } = req.body;

        if (!userId) return res.status(401).json({ message: 'Non authentifié' });

        // Trouver l'inscription la plus récente pour ce cours
        const enrollment = await prisma.studentCourseEnrollment.findFirst({
            where: {
                userId,
                courseCode
            },
            orderBy: {
                enrolledAt: 'desc'
            }
        });

        if (!enrollment) {
            return res.status(404).json({ message: "Inscription au cours non trouvée." });
        }

        // Mettre à jour l'état du cours
        const updated = await prisma.studentCourseEnrollment.update({
            where: { id: enrollment.id },
            data: { isActive }
        });

        res.json({
            message: isActive ? "Cours réactivé" : "Cours marqué comme éliminé",
            courseCode,
            isActive: updated.isActive
        });

    } catch (error) {
        console.error('Erreur toggle course:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du cours' });
    }
}

/**
 * Récupère tous les cours du niveau de l'étudiant pour gestion (actifs et inactifs)
 */
export const getStudentCourseManagement = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // 1. Trouver le niveau actuel de l'étudiant
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        }) as any;

        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        const currentLevelId = student.studentEnrollments[0]?.academicLevelId;

        // 2. Récupérer toutes les inscriptions (actives et inactives)
        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: { userId },
            include: {
                course: true
            }
        });

        res.json(enrollments.map(e => ({
            code: e.courseCode,
            name: e.course.name,
            isActive: e.isActive
        })));

    } catch (error) {
        console.error('Erreur management cours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const submitAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { assessmentId } = req.body;
        const userId = req.user?.userId;
        const file = req.file;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });
        if (!file) return res.status(400).json({ message: 'Aucun fichier fourni' });

        // 1. Vérifier si l'évaluation existe et si la date limite n'est pas passée
        const assessment = await prisma.assessment.findUnique({
            where: { id: parseInt(assessmentId) }
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Évaluation non trouvée' });
        }

        if (assessment.dueDate && new Date() > new Date(assessment.dueDate)) {
            return res.status(403).json({ message: 'La date limite pour ce travail est passée.' });
        }

        // 2. Vérifier si l'étudiant est inscrit au cours de cette évaluation
        const isEnrolled = await prisma.studentCourseEnrollment.findFirst({
            where: {
                userId,
                courseCode: assessment.courseCode,
                isActive: true
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({ message: 'Vous n\'êtes pas inscrit à ce cours.' });
        }

        // 3. Upload vers Cloudinary
        const uploadResult = await uploadToCloudinary(file.buffer, `assignments/${assessment.courseCode}/${assessmentId}/${userId}`, file.originalname);

        // 4. Enregistrer ou mettre à jour la soumission
        const submission = await prisma.submission.upsert({
            where: {
                assessmentId_studentId: {
                    assessmentId: parseInt(assessmentId),
                    studentId: userId
                }
            },
            update: {
                fileUrl: uploadResult.secure_url,
                fileName: file.originalname,
                publicId: uploadResult.public_id,
                submittedAt: new Date()
            },
            create: {
                assessmentId: parseInt(assessmentId),
                studentId: userId,
                fileUrl: uploadResult.secure_url,
                fileName: file.originalname,
                publicId: uploadResult.public_id
            }
        });

        res.json({ message: 'Votre travail a été transmis avec succès', submission });
    } catch (error: any) {
        console.error('Erreur soumission travail:', error);
        res.status(500).json({ message: error.message || 'Erreur lors de l\'envoi de votre travail' });
    }
}

export const markAnnouncementAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        await prisma.announcementRead.upsert({
            where: {
                announcementId_userId: {
                    announcementId: parseInt(id),
                    userId
                }
            },
            update: {
                readAt: new Date()
            },
            create: {
                announcementId: parseInt(id),
                userId
            }
        });

        res.json({ message: 'Annonce marquée comme lue' });
    } catch (error) {
        console.error('Erreur markAnnouncementAsRead:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

