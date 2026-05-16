
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDuplicateStudents() {
    try {
        console.log("Checking for duplicate students or test accounts...");
        
        const students = await prisma.user.findMany({
            where: { systemRole: 'STUDENT' },
            select: { name: true, id: true }
        });

        const nameCounts = {};
        const duplicates = [];

        students.forEach(s => {
            const name = s.name.trim().toLowerCase();
            if (nameCounts[name]) {
                nameCounts[name].push(s.id);
            } else {
                nameCounts[name] = [s.id];
            }
        });

        for (const name in nameCounts) {
            if (nameCounts[name].length > 1) {
                duplicates.push({ name, count: nameCounts[name].length, ids: nameCounts[name] });
            }
        }

        console.log(`\n--- Duplicates Found: ${duplicates.length} ---`);
        duplicates.forEach(d => {
            console.log(`- "${d.name}": ${d.count} occurrences (IDs: ${d.ids.join(', ')})`);
        });

        console.log(`\n--- Potential Test Accounts ---`);
        const testAccounts = students.filter(s => 
            s.name.toLowerCase().includes('test') || 
            s.name.toLowerCase().includes('admin') ||
            s.name.toLowerCase().includes('user')
        );
        testAccounts.forEach(s => console.log(`- ${s.name} (${s.id})`));

    } catch (error) {
        console.error("Error finding duplicates:", error);
    } finally {
        await prisma.$disconnect();
    }
}

findDuplicateStudents();
