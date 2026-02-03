import * as fs from 'fs';
import * as path from 'path';

const COURSES_DIR = path.join(process.cwd(), 'prisma/courses/data');
const SCRIPTS_DIR = path.join(process.cwd(), 'prisma/scripts');

async function updateYear() {
    console.log("📅 Mise à jour globale vers l'année 2025-2026...");

    // 1. Mise à jour des CSV de cours
    const csvFiles = fs.readdirSync(COURSES_DIR).filter(f => f.endsWith('.csv'));
    for (const file of csvFiles) {
        const filePath = path.join(COURSES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/2025-2026/g, '2025-2026');
        fs.writeFileSync(filePath, content);
        console.log(`✅ CSV mis à jour : ${file}`);
    }

    // 2. Mise à jour des scripts TS
    const scriptFiles = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.ts'));
    for (const file of scriptFiles) {
        const filePath = path.join(SCRIPTS_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('2025-2026')) {
            content = content.replace(/2025-2026/g, '2025-2026');
            fs.writeFileSync(filePath, content);
            console.log(`✅ Script mis à jour : ${file}`);
        }
    }

    console.log("\n✨ Tous les fichiers ont été mis à jour vers 2025-2026.");
}

updateYear().catch(console.error);
