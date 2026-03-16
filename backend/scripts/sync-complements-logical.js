
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncComplements() {
  console.log('🚀 Starting logical sync of complements...');
  const academicYear = "2025-2026";
  
  // 1. Get all levels with their orders
  const levels = await prisma.academicLevel.findMany();
  const levelOrderMap = new Map(levels.map(l => [l.id, l.order]));
  console.log(`✅ Loaded ${levels.length} levels`);

  // 2. Get all courses with their level orders
  const courses = await prisma.course.findMany({
    include: { academicLevels: { select: { id: true } } }
  });
  
  const courseMaxOrderMap = new Map();
  courses.forEach(c => {
    const orders = c.academicLevels.map(al => levelOrderMap.get(al.id)).filter(o => o !== undefined);
    const maxOrder = orders.length > 0 ? Math.max(...orders) : -1;
    courseMaxOrderMap.set(c.code, maxOrder);
  });
  console.log(`✅ Loaded ${courses.length} courses`);

  // 3. Get all student actual levels for 2025-2026
  const studentEnrollments = await prisma.studentEnrollment.findMany({
    where: { academicYear },
    select: { userId: true, academicLevelId: true }
  });
  const studentLevelOrderMap = new Map(studentEnrollments.map(se => [se.userId, levelOrderMap.get(se.academicLevelId)]));
  console.log(`✅ Loaded ${studentEnrollments.length} student levels`);

  // 4. Update all enrollments
  const enrollments = await prisma.studentCourseEnrollment.findMany({
    where: { isActive: true, academicYear },
    select: { id: true, userId: true, courseCode: true, isComplement: true }
  });
  console.log(`📊 Processing ${enrollments.length} enrollments...`);

  let updatedCount = 0;
  for (const enrollment of enrollments) {
    const studentOrder = studentLevelOrderMap.get(enrollment.userId);
    const courseMaxOrder = courseMaxOrderMap.get(enrollment.courseCode);

    if (studentOrder !== undefined && courseMaxOrder !== undefined) {
        // Rule: If Student Level Order > any Course Level Order, it's a complement
        const shouldBeComplement = studentOrder > courseMaxOrder;
        
        if (enrollment.isComplement !== shouldBeComplement) {
            await prisma.studentCourseEnrollment.update({
                where: { id: enrollment.id },
                data: { isComplement: shouldBeComplement }
            });
            updatedCount++;
        }
    }
  }
  
  console.log(`✨ Done! Total updated: ${updatedCount}`);
}

syncComplements().catch(console.error).finally(() => prisma.$disconnect());
