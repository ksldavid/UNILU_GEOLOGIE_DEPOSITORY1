import { PrismaClient, SystemRole } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Configuration des chemins
const CSV_FILE = path.join(process.cwd(), 'prisma/students/prescience.csv')

/**
 * Normalise le numéro WhatsApp au format +243XXXXXXXXX
 */
function normalizeWhatsApp(phone: string | null | undefined): string | null {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+243')) {
        const suffix = cleaned.substring(4);
        if (suffix.length === 9) return cleaned;
        if (suffix.length > 9) return '+243' + suffix.substring(suffix.length - 9);
    }
    if (cleaned.startsWith('243')) {
        const suffix = cleaned.substring(3);
        if (suffix.length === 9) return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
        const suffix = cleaned.substring(1);
        if (suffix.length === 9) return '+243' + suffix;
    }
    if (cleaned.length === 9) {
        return '+243' + cleaned;
    }
    if (cleaned.length > 9) {
        const last9 = cleaned.substring(cleaned.length - 9);
        return '+243' + last9;
    }
    return null;
}

async function main() {
    console.log("🚀 Lancement de l'importation (V2 : StudentID as Primary Key)...");

    if (!fs.existsSync(CSV_FILE)) {
        console.error(`❌ Fichier introuvable : ${CSV_FILE}`);
        return;
    }

    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    const prescienceLevel = await prisma.academicLevel.upsert({
        where: { code: 'prescience' },
        update: {
            id: 0,
            order: 0,
        },
        create: {
            id: 0, // <--- ON FORCE L'ID À 0
            code: 'prescience',
            name: 'Prescience',
            displayName: 'Presciences / Géologie',
            order: 0,
            isActive: true
        }
    });

    let successCount = 0;
    let errorCount = 0;

    for (const record of records as any[]) {
        try {
            const studentID = record["student ID"]; // C'est maintenant notre ID principal (PK)
            const name = record["Noms"];
            const email = record["Email address"].toLowerCase().trim();
            const rawWhatsApp = record["Numero WhatsApp"];
            const password = record["Password"];

            if (!studentID || studentID === "") continue;

            // Normalisation WhatsApp
            const whatsapp = normalizeWhatsApp(rawWhatsApp);

            // Hachage du mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Upsert User
            const user = await prisma.user.upsert({
                where: { id: studentID }, // Recherche par studentID
                update: {
                    name,
                    email,
                    whatsapp,
                    password: hashedPassword,
                    systemRole: SystemRole.STUDENT,
                },
                create: {
                    id: studentID, // On force l'ID à être le matricule
                    email,
                    name,
                    whatsapp,
                    password: hashedPassword,
                    systemRole: SystemRole.STUDENT,
                }
            });

            // Enrollment
            await prisma.studentEnrollment.upsert({
                where: {
                    userId_academicLevelId_academicYear: {
                        userId: user.id,
                        academicLevelId: prescienceLevel.id,
                        academicYear: '2025-2026'
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    academicLevelId: prescienceLevel.id,
                    academicYear: '2025-2026'
                }
            });

            successCount++;
        } catch (error: any) {
            console.error(`❌ Erreur sur ${record["Noms"]} :`, error.message);
            errorCount++;
        }
    }

    console.log(`✅ Terminé ! ${successCount} étudiants importés avec le matricule comme ID.`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
