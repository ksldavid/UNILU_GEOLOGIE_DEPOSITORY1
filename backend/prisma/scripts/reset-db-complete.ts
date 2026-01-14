
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function reset() {
    console.log('🛑 DÉBUT DU NETTOYAGE COMPLET DE LA BASE DE DONNÉES...')

    const tables = [
        'AttendanceChangeRequest',
        'AttendanceRecord',
        'AttendanceSession',
        'GradeChangeRequest',
        'Grade',
        'Assessment',
        'Schedule',
        'CourseEnrollment',
        'StudentCourseEnrollment',
        'CourseRetake',
        'CourseResource',
        'AnnouncementRead',
        'Announcement',
        'Notification',
        'SupportMessage',
        'SupportTicket',
        'StudentEnrollment',
        'ProfessorProfile',
    ]

    for (const table of tables) {
        try {
            await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany()
            console.log(`✅ Table ${table} vidée.`)
        } catch (e: any) {
            console.warn(`⚠️ Erreur lors du vidage de ${table}: ${e.message}`)
        }
    }

    // Supprimer les étudiants et les profs mais GARDER les admins et academic office
    try {
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                systemRole: {
                    in: ['STUDENT', 'USER']
                }
            }
        })
        console.log(`✅ ${deletedUsers.count} utilisateurs (étudiants/profs) supprimés.`)
    } catch (e: any) {
        console.error(`❌ Erreur lors de la suppression des utilisateurs: ${e.message}`)
    }

    // Supprimer les cours
    try {
        await prisma.course.deleteMany()
        console.log('✅ Tous les cours supprimés.')
    } catch (e: any) {
        console.error(`❌ Erreur lors de la suppression des cours: ${e.message}`)
    }

    console.log('🏁 NETTOYAGE TERMINÉ.')
}

reset()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
