
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const matricule = "0125010764";
    const courseCode = "GEOL206A";
    
    const enrollment = await prisma.studentCourseEnrollment.findFirst({
        where: { userId: matricule, courseCode: courseCode }
    });
    
    if (enrollment) {
        await prisma.studentCourseEnrollment.update({
            where: { id: enrollment.id },
            data: { isComplement: true, academicYear: "2025-2026" }
        });
        console.log(`✅ Success: Naomie (${matricule}) is now marked as COMPLEMENT for ${courseCode}`);
    } else {
        console.log("❌ Enrollment not found");
    }
}
main().finally(() => prisma.$disconnect());
