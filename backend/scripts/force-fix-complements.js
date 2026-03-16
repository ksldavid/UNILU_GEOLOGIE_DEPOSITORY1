
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceFix() {
    // 1. Fix Naomie's specific enrollment
    await prisma.studentCourseEnrollment.update({
        where: { id: 132438 },
        data: { isComplement: true, academicYear: "2025-2026" }
    });
    console.log("✅ Fixed Naomie's enrollment (Code GEOL206A set to Complement + 2025-2026)");

    // 2. Global fix for all enrollments that should be complements
    console.log("🚀 Starting global fix for complements...");
    
    // Get all student current levels (ignoring year for now to be safe and catch all)
    const studentLevels = await prisma.studentEnrollment.findMany({
        include: { academicLevel: true }
    });
    
    // Map of userId -> Set of levelIds they belong to
    const studentLevelMap = new Map();
    studentLevels.forEach(sl => {
        if (!studentLevelMap.has(sl.userId)) studentLevelMap.set(sl.userId, new Set());
        studentLevelMap.get(sl.userId).add(sl.academicLevelId);
    });

    const courses = await prisma.course.findMany({
        include: { academicLevels: true }
    });
    const courseLevelMap = new Map(courses.map(c => [c.code, c.academicLevels.map(al => al.id)]));

    const enrollments = await prisma.studentCourseEnrollment.findMany({
        where: { isActive: true }
    });

    let count = 0;
    for (const enrollment of enrollments) {
        const studentLevelIds = studentLevelMap.get(enrollment.userId);
        if (studentLevelIds) {
            const courseLevelIds = courseLevelMap.get(enrollment.courseCode) || [];
            // If the student doesn't have ANY of the course's levels, it's a complement
            const isComplement = !courseLevelIds.some(id => studentLevelIds.has(id));
            
            if (enrollment.isComplement !== isComplement) {
                await prisma.studentCourseEnrollment.update({
                    where: { id: enrollment.id },
                    data: { isComplement, academicYear: "2025-2026" } // Align with current year
                });
                count++;
            }
        }
    }
    console.log(`✨ Global update finished. ${count} records updated.`);
}

forceFix().catch(console.error).finally(() => prisma.$disconnect());
