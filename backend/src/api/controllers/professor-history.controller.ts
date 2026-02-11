import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'

export const getProfessorAttendanceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { courseCode } = req.query;

        // Get courses taught by professor
        const taughtCourses = await prisma.courseEnrollment.findMany({
            where: { userId },
            select: { courseCode: true }
        });

        const courseCodes = taughtCourses.map(tc => tc.courseCode);

        // Build where clause
        const whereClause: any = {
            courseCode: courseCode ? courseCode as string : { in: courseCodes }
        };

        // Get all attendance sessions with records
        const sessions = await (prisma as any).attendanceSession.findMany({
            where: whereClause,
            include: {
                course: {
                    select: {
                        name: true,
                        code: true,
                        studentCourseEnrollments: {
                            where: { isActive: true },
                            select: {
                                userId: true,
                                user: { select: { name: true } }
                            }
                        }
                    }
                },
                records: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Format the response
        const history = sessions.map((session: any) => {
            const enrolledStudents = session.course.studentCourseEnrollments;
            const totalEnrolled = enrolledStudents.length;

            // Créer une map des records existants
            const recordsMap = new Map();
            session.records.forEach((r: any) => {
                recordsMap.set(r.studentId, r);
            });

            // Liste de tous les inscrits avec leur statut réel ou ABSENT par défaut
            const allRecords = enrolledStudents.map((enrollment: any) => {
                const record = recordsMap.get(enrollment.userId);
                return {
                    studentId: enrollment.userId,
                    studentName: record ? record.student.name : (enrollment.user?.name || "Étudiant"),
                    status: record ? record.status : 'ABSENT',
                    markedAt: record ? record.createdAt : null
                };
            });

            const present = allRecords.filter((r: any) => r.status === 'PRESENT').length;
            const late = allRecords.filter((r: any) => r.status === 'LATE').length;
            const absent = allRecords.filter((r: any) => r.status === 'ABSENT').length;

            return {
                id: session.id,
                date: session.date,
                courseCode: session.course.code,
                courseName: session.course.name,
                totalStudents: totalEnrolled,
                present: present,
                absent: absent,
                late: late,
                records: allRecords.sort((a, b) => a.studentName.localeCompare(b.studentName))
            };
        });

        res.json(history);
    } catch (error) {
        console.error('Erreur historique présences:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
