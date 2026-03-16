
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const id = 132438;
        await prisma.studentCourseEnrollment.update({
            where: { id: id },
            data: { 
                isComplement: true, 
                academicYear: "2025-2026" 
            }
        });
        console.log(`✅ Success: Updated enrollment ${id} to Complement and 2025-2026`);
    } catch (e) {
        console.error("❌ Error:", e);
    }
}
main().finally(() => prisma.$disconnect());
