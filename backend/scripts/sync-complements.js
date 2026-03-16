
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncComplements() {
  console.log('🚀 Starting optimized sync of complements for 2025-2026...');
  const academicYear = "2025-2026";
  
  try {
    // 1. Get all courses with their levels
    const courses = await prisma.course.findMany({
      include: { academicLevels: { select: { id: true } } }
    });
    const courseLevelMap = new Map(courses.map(c => [c.code, c.academicLevels.map(al => al.id)]));

    // 2. Get all student levels for the year
    const studentLevels = await prisma.studentEnrollment.findMany({
      where: { academicYear },
      select: { userId: true, academicLevelId: true }
    });
    const studentLevelMap = new Map(studentLevels.map(sl => [sl.userId, sl.academicLevelId]));
    console.log(`✅ Loaded ${courses.length} courses and ${studentLevels.length} student levels`);

    // 3. Fetch enrollments
    const enrollments = await prisma.studentCourseEnrollment.findMany({
      where: { isActive: true, academicYear },
      select: { id: true, userId: true, courseCode: true, isComplement: true }
    });
    console.log(`📊 Processing ${enrollments.length} enrollments...`);

    let updatedCount = 0;

    for (const enrollment of enrollments) {
      const studentLevelId = studentLevelMap.get(enrollment.userId);
      if (studentLevelId !== undefined) {
        const courseLevels = courseLevelMap.get(enrollment.courseCode) || [];
        const shouldBeComplement = !courseLevels.includes(studentLevelId);
        
        if (enrollment.isComplement !== shouldBeComplement) {
          await prisma.studentCourseEnrollment.update({
            where: { id: enrollment.id },
            data: { isComplement: shouldBeComplement }
          });
          updatedCount++;
          if (updatedCount % 50 === 0) console.log(`🔄 Updated ${updatedCount} records...`);
        }
      }
    }
    
    console.log(`✨ Done! Total updated: ${updatedCount}`);
  } catch (err) {
    console.error('❌ Error during sync:', err);
  }
}

syncComplements().finally(() => prisma.$disconnect());
