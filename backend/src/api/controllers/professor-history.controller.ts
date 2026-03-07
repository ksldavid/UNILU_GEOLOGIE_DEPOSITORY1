import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'

export const getProfessorAttendanceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { courseCode } = req.query;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });

        // Build where clause — if courseCode is provided, use it directly (fastest path)
        let whereClause: any = {};

        if (courseCode) {
            // Direct course lookup — no need to resolve professor courses
            whereClause = { courseCode: courseCode as string };
        } else {
            // Check if admin/superuser
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            const isSuperUser = userRole === 'ADMIN' || userRole === 'ACADEMIC_OFFICE' || user?.name?.toLowerCase()?.includes('departement');

            if (isSuperUser) {
                // SuperUser: return last 60 sessions across all courses
                whereClause = {};
            } else {
                // Get courses taught by professor
                const taughtCourses = await prisma.courseEnrollment.findMany({
                    where: { userId },
                    select: { courseCode: true }
                });
                const courseCodes = taughtCourses.map(tc => tc.courseCode);
                whereClause = { courseCode: { in: courseCodes } };
            }
        }

        // Get attendance sessions with records — limit to 60 to avoid timeout
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
            },
            take: 60  // Limit to avoid Vercel timeout
        });

        // Format the response
        const history = sessions.map((session: any) => {
            const enrolledStudents = session.course.studentCourseEnrollments;
            const totalEnrolled = enrolledStudents.length;

            // Map of existing records
            const recordsMap = new Map();
            session.records.forEach((r: any) => {
                recordsMap.set(r.studentId, r);
            });

            // All enrolled students with their real or default ABSENT status
            const allRecords = enrolledStudents.map((enrollment: any) => {
                const record = recordsMap.get(enrollment.userId);
                return {
                    studentId: enrollment.userId,
                    studentName: record ? record.student.name : (enrollment.user?.name || "Étudiant"),
                    status: record ? record.status : 'ABSENT',
                    markedAt: record ? record.createdAt : null
                };
            });

            // If no enrolled students but there are records (e.g. QR scan created them)
            // Add records for students not in enrollments
            if (enrolledStudents.length === 0 && session.records.length > 0) {
                session.records.forEach((r: any) => {
                    if (!recordsMap.has(r.studentId)) return;
                    allRecords.push({
                        studentId: r.studentId,
                        studentName: r.student?.name || 'Étudiant',
                        status: r.status,
                        markedAt: r.createdAt
                    });
                });
            }

            const present = allRecords.filter((r: any) => r.status === 'PRESENT').length;
            // Also count LATE as present for display
            const late = allRecords.filter((r: any) => r.status === 'LATE').length;
            const absent = allRecords.filter((r: any) => r.status === 'ABSENT').length;

            // If no enrolled students, use records count directly
            const effectiveTotal = totalEnrolled > 0 ? totalEnrolled : session.records.length;

            return {
                id: session.id,
                date: session.date,
                sessionNumber: session.sessionNumber,
                courseCode: session.course.code,
                courseName: session.course.name,
                totalStudents: effectiveTotal,
                present: present + late,  // Late counts as present in summary
                absent: absent,
                late: late,
                records: allRecords.sort((a: any, b: any) => a.studentName.localeCompare(b.studentName))
            };
        });

        res.json(history);
    } catch (error) {
        console.error('Erreur historique présences:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
