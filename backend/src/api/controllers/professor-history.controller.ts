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
                        code: true
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
        const history = sessions.map((session: any) => ({
            id: session.id,
            date: session.date,
            courseCode: session.course.code,
            courseName: session.course.name,
            totalStudents: session.records.length,
            present: session.records.filter((r: any) => r.status === 'PRESENT').length,
            absent: session.records.filter((r: any) => r.status === 'ABSENT').length,
            late: session.records.filter((r: any) => r.status === 'LATE').length,
            records: session.records.map((record: any) => ({
                studentId: record.student.id,
                studentName: record.student.name,
                status: record.status,
                markedAt: record.createdAt
            }))
        }));

        res.json(history);
    } catch (error) {
        console.error('Erreur historique présences:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
