/**
 * Validateurs pour garantir l'intégrité des données
 * 
 * Ce fichier contient des fonctions de validation à appeler AVANT les opérations
 * sur la base de données pour garantir l'intégrité métier.
 * 
 * Validations implémentées :
 * 1. Grade : Vérifie que l'étudiant est inscrit au cours
 * 2. AttendanceRecord : Vérifie que l'étudiant est inscrit au cours
 * 3. GradeChangeRequest : Vérifie que le demandeur est professeur du cours
 * 4. AttendanceChangeRequest : Vérifie que le demandeur est ACADEMIC_OFFICE
 * 5. Grade : Vérifie que 0 <= score <= maxPoints
 * 
 * Utilisation :
 *   import { validateGradeCreation } from './middleware/prisma-validators'
 *   
 *   // Avant de créer une note
 *   await validateGradeCreation(prisma, { assessmentId, studentId, score })
 */

import { PrismaClient, SystemRole, CourseRole } from '@prisma/client'

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

// ========================================================================
// VALIDATION 1 : Grade - L'étudiant doit être inscrit au cours
// ========================================================================

interface GradeData {
    assessmentId: number
    studentId: number
    score: number
}

export async function validateGradeCreation(
    prisma: PrismaClient,
    data: GradeData
): Promise<void> {
    // Récupérer l'assessment pour obtenir le courseId et maxPoints
    const assessment = await prisma.assessment.findUnique({
        where: { id: data.assessmentId },
        select: { courseId: true, maxPoints: true, title: true }
    })

    if (!assessment) {
        throw new ValidationError(`Assessment ${data.assessmentId} introuvable`)
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await prisma.studentCourseEnrollment.findFirst({
        where: {
            userId: data.studentId,
            courseId: assessment.courseId,
            isActive: true
        }
    })

    if (!enrollment) {
        const student = await prisma.user.findUnique({
            where: { id: data.studentId },
            select: { firstName: true, lastName: true, email: true }
        })

        const course = await prisma.course.findUnique({
            where: { id: assessment.courseId },
            select: { code: true, name: true }
        })

        throw new ValidationError(
            `L'étudiant ${student?.firstName} ${student?.lastName} ` +
            `(${student?.email}) n'est PAS inscrit au cours ${course?.code} - ${course?.name}. ` +
            `Impossible de créer une note pour un étudiant non inscrit au cours.`
        )
    }

    // Vérifier que 0 <= score <= maxPoints
    if (data.score < 0) {
        throw new ValidationError(
            `La note (${data.score}) ne peut pas être négative.`
        )
    }

    if (data.score > assessment.maxPoints) {
        throw new ValidationError(
            `La note (${data.score}) dépasse le maximum autorisé (${assessment.maxPoints}) ` +
            `pour l'évaluation "${assessment.title}".`
        )
    }
}

// ========================================================================
// VALIDATION 2 : AttendanceRecord - L'étudiant doit être inscrit au cours
// ========================================================================

interface AttendanceData {
    sessionId: number
    studentId: number
}

export async function validateAttendanceRecord(
    prisma: PrismaClient,
    data: AttendanceData
): Promise<void> {
    // Récupérer la session pour obtenir le courseId
    const session = await prisma.attendanceSession.findUnique({
        where: { id: data.sessionId },
        select: { courseId: true, date: true }
    })

    if (!session) {
        throw new ValidationError(`Session de présence ${data.sessionId} introuvable`)
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await prisma.studentCourseEnrollment.findFirst({
        where: {
            userId: data.studentId,
            courseId: session.courseId,
            isActive: true
        }
    })

    if (!enrollment) {
        const student = await prisma.user.findUnique({
            where: { id: data.studentId },
            select: { firstName: true, lastName: true, email: true }
        })

        const course = await prisma.course.findUnique({
            where: { id: session.courseId },
            select: { code: true, name: true }
        })

        throw new ValidationError(
            `L'étudiant ${student?.firstName} ${student?.lastName} ` +
            `(${student?.email}) n'est PAS inscrit au cours ${course?.code} - ${course?.name}. ` +
            `Impossible de prendre la présence pour un étudiant non inscrit au cours.`
        )
    }
}

// ========================================================================
// VALIDATION 3 : GradeChangeRequest - Le demandeur doit être professeur
// ========================================================================

interface GradeChangeRequestData {
    gradeId: number
    requesterId: number
}

export async function validateGradeChangeRequest(
    prisma: PrismaClient,
    data: GradeChangeRequestData
): Promise<void> {
    // Récupérer la note pour obtenir l'assessment
    const grade = await prisma.grade.findUnique({
        where: { id: data.gradeId },
        include: {
            assessment: {
                select: { courseId: true, title: true }
            }
        }
    })

    if (!grade) {
        throw new ValidationError(`Note ${data.gradeId} introuvable`)
    }

    const courseId = grade.assessment.courseId

    // Vérifier que le demandeur est professeur de ce cours
    const isProfessor = await prisma.courseEnrollment.findFirst({
        where: {
            userId: data.requesterId,
            courseId: courseId,
            role: CourseRole.PROFESSOR
        }
    })

    if (!isProfessor) {
        const requester = await prisma.user.findUnique({
            where: { id: data.requesterId },
            select: { firstName: true, lastName: true, email: true }
        })

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { code: true, name: true }
        })

        throw new ValidationError(
            `${requester?.firstName} ${requester?.lastName} ` +
            `(${requester?.email}) n'est PAS professeur du cours ${course?.code} - ${course?.name}. ` +
            `Seuls les professeurs du cours peuvent demander des modifications de notes.`
        )
    }
}

// ========================================================================
// VALIDATION 4 : AttendanceChangeRequest - Demandeur = ACADEMIC_OFFICE
// ========================================================================

interface AttendanceChangeRequestData {
    requesterId: number
}

export async function validateAttendanceChangeRequest(
    prisma: PrismaClient,
    data: AttendanceChangeRequestData
): Promise<void> {
    // Vérifier que le demandeur a le rôle ACADEMIC_OFFICE
    const requester = await prisma.user.findUnique({
        where: { id: data.requesterId },
        select: { systemRole: true, firstName: true, lastName: true, email: true }
    })

    if (!requester) {
        throw new ValidationError(`Utilisateur ${data.requesterId} introuvable`)
    }

    if (requester.systemRole !== SystemRole.ACADEMIC_OFFICE) {
        throw new ValidationError(
            `${requester.firstName} ${requester.lastName} ` +
            `(${requester.email}) n'a PAS le rôle ACADEMIC_OFFICE (rôle actuel: ${requester.systemRole}). ` +
            `Seuls les membres du bureau académique peuvent demander des modifications de présence.`
        )
    }
}

// ========================================================================
// FONCTIONS UTILITAIRES
// ========================================================================

/**
 * Vérifie si un étudiant est inscrit à un cours
 */
export async function isStudentEnrolledInCourse(
    prisma: PrismaClient,
    studentId: number,
    courseId: number,
    academicYear?: string
): Promise<boolean> {
    const where: any = {
        userId: studentId,
        courseId: courseId,
        isActive: true
    }

    if (academicYear) {
        where.academicYear = academicYear
    }

    const enrollment = await prisma.studentCourseEnrollment.findFirst({ where })
    return enrollment !== null
}

/**
 * Vérifie si un utilisateur est professeur d'un cours
 */
export async function isProfessorOfCourse(
    prisma: PrismaClient,
    userId: number,
    courseId: number
): Promise<boolean> {
    const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
            userId: userId,
            courseId: courseId,
            role: CourseRole.PROFESSOR
        }
    })
    return enrollment !== null
}

/**
 * Vérifie si un utilisateur a le rôle ACADEMIC_OFFICE
 */
export async function isAcademicOffice(
    prisma: PrismaClient,
    userId: number
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { systemRole: true }
    })
    return user?.systemRole === SystemRole.ACADEMIC_OFFICE
}

/**
 * Récupère tous les étudiants inscrits à un cours
 */
export async function getStudentsInCourse(
    prisma: PrismaClient,
    courseId: number,
    academicYear?: string
) {
    const where: any = {
        courseId: courseId,
        isActive: true
    }

    if (academicYear) {
        where.academicYear = academicYear
    }

    return await prisma.studentCourseEnrollment.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: {
            user: {
                lastName: 'asc'
            }
        }
    })
}

/**
 * Récupère tous les cours d'un étudiant
 */
export async function getStudentCourses(
    prisma: PrismaClient,
    studentId: number,
    academicYear?: string
) {
    const where: any = {
        userId: studentId,
        isActive: true
    }

    if (academicYear) {
        where.academicYear = academicYear
    }

    return await prisma.studentCourseEnrollment.findMany({
        where,
        include: {
            course: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    credits: true,
                    academicLevelCode: true
                }
            }
        },
        orderBy: {
            course: {
                code: 'asc'
            }
        }
    })
}
