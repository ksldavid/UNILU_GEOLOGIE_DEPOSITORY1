
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function globalSync() {
    console.log("🚀 Starting global synchronization in chunks...");
    const currentYear = "2025-2026";
    
    const studentLevels = await prisma.studentEnrollment.findMany({
        where: { academicYear: currentYear },
        select: { userId: true, academicLevelId: true }
    });
    const studentLevelMap = new Map(studentLevels.map(sl => [sl.userId, sl.academicLevelId]));

    const courses = await prisma.course.findMany({
        include: { academicLevels: { select: { id: true } } }
    });
    const courseLevelMap = new Map(courses.map(c => [c.code, c.academicLevels.map(al => al.id)]));

    const totalCount = await prisma.studentCourseEnrollment.count({ where: { isActive: true } });
    console.log(`📊 Processing ${totalCount} active enrollments in batches of 500...`);

    let processed = 0;
    let updatedCount = 0;
    const batchSize = 500;

    while (processed < totalCount) {
        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: { isActive: true },
            skip: processed,
            take: batchSize,
            orderBy: { id: 'asc' }
        });

        for (const enrollment of enrollments) {
            const studentLevelId = studentLevelMap.get(enrollment.userId);
            if (studentLevelId !== undefined) {
                const courseLevelIds = courseLevelMap.get(enrollment.courseCode) || [];
                const isComplement = !courseLevelIds.includes(studentLevelId);
                
                if (enrollment.isComplement !== isComplement || enrollment.academicYear !== currentYear) {
                    await prisma.studentCourseEnrollment.update({
                        where: { id: enrollment.id },
                        data: { isComplement: isComplement, academicYear: currentYear }
                    });
                    updatedCount++;
                }
            }
        }
        processed += enrollments.length;
        console.log(`✅ Processed ${processed}/${totalCount}... (Updated so far: ${updatedCount})`);
    }
    
    console.log(`✨ DONE! Updated ${updatedCount} enrollments.`);
}

globalSync().catch(console.error).finally(() => prisma.$disconnect());
