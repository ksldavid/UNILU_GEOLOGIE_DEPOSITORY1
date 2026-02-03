import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_FILE = path.join(process.cwd(), 'prisma/students/prescience.csv');

function normalizeWhatsApp(phone: string | null | undefined): string | null {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+243' + cleaned.substring(1);
    else if (cleaned.length === 9) cleaned = '+243' + cleaned;
    else if (cleaned.startsWith('243')) cleaned = '+' + cleaned;
    return cleaned;
}

async function cleanCSV() {
    console.log("🧹 Début du nettoyage du fichier CSV...");

    if (!fs.existsSync(CSV_FILE)) {
        console.error("❌ Erreur : Fichier CSV introuvable à", CSV_FILE);
        return;
    }

    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as any[];

    if (records.length === 0) {
        console.log("Fichier vide.");
        return;
    }

    const seenEmails = new Set<string>();
    const seenIDs = new Set<string>();
    const seenWhatsApp = new Set<string>();

    const initialCount = records.length;
    const cleaned = [];

    for (const record of records) {
        const email = record['Email address']?.toLowerCase().trim();
        const studentID = record['student ID']?.trim();
        const rawWhatsApp = record['Numero WhatsApp'];
        const whatsapp = normalizeWhatsApp(rawWhatsApp);

        let isDuplicate = false;

        if (email && seenEmails.has(email)) {
            console.log(`🚫 Doublon Email : ${email} (${record['Noms']})`);
            isDuplicate = true;
        }
        if (studentID && seenIDs.has(studentID)) {
            console.log(`🚫 Doublon student ID : ${studentID} (${record['Noms']})`);
            isDuplicate = true;
        }
        if (whatsapp && seenWhatsApp.has(whatsapp)) {
            console.log(`🚫 Doublon WhatsApp : ${whatsapp} (${record['Noms']})`);
            isDuplicate = true;
        }

        if (!isDuplicate) {
            if (email) seenEmails.add(email);
            if (studentID) seenIDs.add(studentID);
            if (whatsapp) seenWhatsApp.add(whatsapp);
            cleaned.push(record);
        }
    }

    const removedCount = initialCount - cleaned.length;

    if (removedCount > 0) {
        // Formater manuellement le CSV pour éviter d'installer csv-stringify
        const headers = Object.keys(cleaned[0]);
        const csvRows = [headers.map(h => `"${h}"`).join(',')];

        for (const row of cleaned) {
            const values = headers.map(h => {
                const val = row[h] ? row[h].toString().replace(/"/g, '""') : '';
                return `"${val}"`;
            });
            csvRows.push(values.join(','));
        }

        fs.writeFileSync(CSV_FILE, csvRows.join('\n'));
        console.log(`✅ Nettoyage terminé ! ${removedCount} lignes supprimées.`);
    } else {
        console.log("✨ Aucun doublon trouvé.");
    }
}

cleanCSV().catch(console.error);
