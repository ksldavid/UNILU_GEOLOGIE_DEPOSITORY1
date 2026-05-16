const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const month = 4; // Mai (0-indexed)
  const levelId = 1; // B1
  const currentYear = new Date().getFullYear();

  const whereClause = {
    session: {
      course: {
        academicLevels: {
          some: { id: levelId }
        }
      },
      date: {
        gte: new Date(currentYear, month, 1),
        lt: new Date(currentYear, month + 1, 1)
      }
    }
  };

  const attendanceCount = await prisma.attendanceRecord.count({
    where: {
      ...whereClause,
      status: { in: ['PRESENT', 'LATE'] }
    }
  });

  const totalRecords = await prisma.attendanceRecord.count({
    where: whereClause
  });

  const absentRecords = await prisma.attendanceRecord.count({
    where: {
      ...whereClause,
      status: 'ABSENT'
    }
  });

  console.log(`B1 Stats for May:`);
  console.log(`Present/Late: ${attendanceCount}`);
  console.log(`Absent: ${absentRecords}`);
  console.log(`Total Records: ${totalRecords}`);
  
  if (totalRecords > 0) {
    console.log(`Calculated %: ${Math.round((attendanceCount / totalRecords) * 100)}%`);
  } else {
    console.log(`No records found.`);
  }

  // Count sessions
  const sessions = await prisma.attendanceSession.count({
    where: {
      course: {
        academicLevels: { some: { id: levelId } }
      },
      date: {
        gte: new Date(currentYear, month, 1),
        lt: new Date(currentYear, month + 1, 1)
      }
    }
  });
  console.log(`Number of sessions: ${sessions}`);

  // Count enrolled students in B1
  const enrolledStudents = await prisma.studentEnrollment.count({
    where: {
      academicLevelId: levelId,
      academicYear: "2025-2026"
    }
  });
  console.log(`Enrolled students in B1: ${enrolledStudents}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
