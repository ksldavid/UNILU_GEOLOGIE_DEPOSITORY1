import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_FILE = path.join(process.cwd(), 'prisma/students/bac_trois.csv');

function normalizeWhatsApp(phone: string | null | undefined): string | null {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+243' + cleaned.substring(1);
    else if (cleaned.length === 9) cleaned = '+243' + cleaned;
    else if (cleaned.startsWith('243')) cleaned = '+' + cleaned;
    return cleaned;
}

function cleanPassword(pwd: string): string {
    if (!pwd) return "";
    let cleaned = pwd.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, "");
    return cleaned;
}

async function cleanCSV() {
    console.log("🧹 Début du nettoyage du fichier BAC 3 (bac_trois.csv)...");

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

    const seenEmails = new Set<string>();
    const seenIDs = new Set<string>();
    const seenWhatsApp = new Set<string>();

    const initialCount = records.length;
    const cleaned = [];

    for (const record of records) {
        const name = record['Noms']?.trim();
        const email = record['Email address']?.toLowerCase().trim();
        const studentID = record['ID']?.trim();
        const rawWhatsApp = record['Numero WhatsApp'];

        if (!name && !email && !studentID) continue;

        const whatsapp = normalizeWhatsApp(rawWhatsApp);

        let isDuplicate = false;

        if (email && seenEmails.has(email)) {
            console.log(`🚫 Doublon Email : ${email} (${name})`);
            isDuplicate = true;
        }
        if (studentID && seenIDs.has(studentID)) {
            console.log(`🚫 Doublon student ID : ${studentID} (${name})`);
            isDuplicate = true;
        }
        if (whatsapp && seenWhatsApp.has(whatsapp)) {
            console.log(`🚫 Doublon WhatsApp : ${whatsapp} (${name})`);
            isDuplicate = true;
        }

        if (!isDuplicate) {
            if (email) seenEmails.add(email);
            if (studentID) seenIDs.add(studentID);
            if (whatsapp) seenWhatsApp.add(whatsapp);

            record['Password'] = cleanPassword(record['Password']);
            record['Numero WhatsApp'] = whatsapp;
            record['student ID'] = studentID;

            cleaned.push(record);
        }
    }

    const removedCount = initialCount - cleaned.length;

    if (cleaned.length > 0) {
        const headers = ["Noms", "Email address", "Promotion", "Numero WhatsApp", "Password", "student ID"];
        const csvRows = [headers.map(h => `"${h}"`).join(',')];

        for (const row of cleaned) {
            const values = headers.map(h => {
                const val = row[h] ? row[h].toString().replace(/"/g, '""') : '';
                return `"${val}"`;
            });
            csvRows.push(values.join(','));
        }

        fs.writeFileSync(CSV_FILE, csvRows.join('\n'));
        console.log(`✅ Nettoyage BAC 3 terminé ! ${removedCount} lignes traitées.`);
    }
}

cleanCSV().catch(console.error);
