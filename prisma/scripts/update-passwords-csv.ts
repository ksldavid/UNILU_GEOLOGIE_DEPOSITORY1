import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_FILE = path.join(process.cwd(), 'prisma/students/prescience.csv');

function cleanPassword(pwd: string): string {
    if (!pwd) return "";
    // 1. Normalisation des accents (remplace É par E, Ï par I, etc.)
    let cleaned = pwd.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Suppression de TOUT ce qui n'est pas une lettre ou un chiffre (espaces, apostrophes, tirets...)
    cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, "");

    return cleaned;
}

async function updateCSV() {
    console.log("🧹 Mise à jour des mots de passe dans le fichier CSV...");

    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true }) as any[];

    const headers = Object.keys(records[0]);
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    for (const r of records) {
        // Nettoyage du mot de passe
        r['Password'] = cleanPassword(r['Password']);

        const values = headers.map(h => {
            const val = r[h] ? r[h].toString().replace(/"/g, '""') : '';
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    }

    fs.writeFileSync(CSV_FILE, csvRows.join('\n'));
    console.log("✅ CSV mis à jour avec succès.");
}

updateCSV().catch(console.error);
