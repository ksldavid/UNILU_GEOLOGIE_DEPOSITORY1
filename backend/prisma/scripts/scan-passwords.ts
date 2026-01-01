import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_FILE = path.join(process.cwd(), 'prisma/students/prescience.csv');

function cleanPassword(pwd: string): string {
    if (!pwd) return "";
    // 1. Normalisation des accents (remplace É par E, etc.)
    let cleaned = pwd.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Suppression des caractères spéciaux (espaces, apostrophes, etc.)
    cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, "");

    return cleaned;
}

async function scan() {
    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true }) as any[];

    const affected = [];

    for (const r of records) {
        const original = r['Password'];
        const proposed = cleanPassword(original);

        if (original !== proposed) {
            affected.push({
                nom: r['Noms'],
                original: original,
                propose: proposed
            });
        }
    }

    console.log(`\n🔍 --- LISTE DES MOTS DE PASSE À MODIFIER ---`);
    if (affected.length === 0) {
        console.log("✨ Aucun mot de passe ne nécessite de modification.");
    } else {
        affected.forEach(a => {
            console.log(`👤 ${a.nom.padEnd(30)} | Ancien: "${a.original.padEnd(10)}" -> Nouveau: "${a.propose}"`);
        });
        console.log(`\n📢 Total : ${affected.length} étudiants concernés.`);
    }
}

scan().catch(console.error);
