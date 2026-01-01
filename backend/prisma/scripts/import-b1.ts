import { PrismaClient, SystemRole } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

async function importStudents(filePath: string, levelId: number, levelCode: string, academicYear: string = '2025-2026') {
    console.log(`🚀 Importation des étudiants depuis ${path.basename(filePath)} vers le niveau ${levelCode}...`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable : ${filePath}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as any[];

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
        try {
            const studentID = record["student ID"];
            const name = record["Noms"];
            const email = record["Email address"].toLowerCase().trim();
            const whatsapp = record["Numero WhatsApp"];
            const password = record["Password"];

            if (!studentID || studentID === "") continue;

            // Upsert User
            const user = await prisma.user.upsert({
                where: { id: studentID },
                update: {
                    name,
                    email,
                    whatsapp,
                    password,
                    systemRole: SystemRole.STUDENT,
                },
                create: {
                    id: studentID,
                    email,
                    name,
                    whatsapp,
                    password,
                    systemRole: SystemRole.STUDENT,
                }
            });

            // Enrollment in Promotion
            await prisma.studentEnrollment.upsert({
                where: {
                    userId_academicLevelId_academicYear: {
                        userId: user.id,
                        academicLevelId: levelId,
                        academicYear: academicYear
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    academicLevelId: levelId,
                    academicYear: academicYear
                }
            });

            successCount++;
        } catch (error: any) {
            console.error(`❌ Erreur sur ${record["Noms"]} :`, error.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} étudiants importés/mis à jour.`);
    return successCount;
}

async function start() {
    const b1Path = path.join(process.cwd(), 'prisma/students/back_un.csv');
    await importStudents(b1Path, 1, 'b1');
}

start()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
