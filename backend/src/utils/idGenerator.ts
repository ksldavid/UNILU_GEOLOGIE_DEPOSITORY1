import prisma from '../lib/prisma';

/**
 * Supprime les accents d'une chaîne de caractères
 */
export function removeAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Génère un mot de passe basé sur le nom : 3 premières lettres (SANS ACCENT) + 5 chiffres
 */
export function generatePassword(name: string): string {
    const cleanName = removeAccents(name).replace(/[^a-zA-Z]/g, "").toUpperCase();
    const prefix = cleanName.substring(0, 3).padEnd(3, 'X');
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    return `${prefix}${randomDigits}`;
}

/**
 * Génère une liste d'IDs étudiants suggérés (format 012501XXXX)
 */
export async function generateStudentIdSuggestions(limit: number = 5, year?: number): Promise<string[]> {
    const targetYear = year || new Date().getFullYear();
    const yearPart = targetYear.toString().slice(-2);
    const base = `01${yearPart}01`;
    const suggestions: string[] = [];

    // On récupère le dernier ID de ce type
    const lastUser = await prisma.user.findFirst({
        where: { id: { startsWith: base } },
        orderBy: { id: 'desc' }
    });

    let currentSeq = 1;
    if (lastUser) {
        const seqPart = lastUser.id.substring(6);
        if (!isNaN(parseInt(seqPart))) {
            currentSeq = parseInt(seqPart) + 1;
        }
    }

    while (suggestions.length < limit) {
        const potentialId = `${base}${currentSeq.toString().padStart(4, '0')}`;
        const existing = await prisma.user.findUnique({ where: { id: potentialId } });
        if (!existing) {
            suggestions.push(potentialId);
        }
        currentSeq++;

        // Sécurité pour éviter une boucle infinie si trop de recherches
        if (currentSeq > 20000) break;
    }

    return suggestions;
}

/**
 * Génère un ID étudiant unique au format 012501XXXX
 */
export async function generateUniqueStudentId(): Promise<string> {
    const suggestions = await generateStudentIdSuggestions(1);
    return suggestions[0] || "0125019999";
}

/**
 * Génère une liste d'IDs professeurs suggérés (format UNIXXXX)
 */
export async function generateProfessorIdSuggestions(limit: number = 5): Promise<string[]> {
    const base = "UNI";
    const suggestions: string[] = [];

    const lastUser = await prisma.user.findFirst({
        where: { id: { startsWith: base } },
        orderBy: { id: 'desc' }
    });

    let currentSeq = 1;
    if (lastUser) {
        const seqPart = lastUser.id.substring(3);
        if (!isNaN(parseInt(seqPart))) {
            currentSeq = parseInt(seqPart) + 1;
        }
    }

    while (suggestions.length < limit) {
        const potentialId = `${base}${currentSeq.toString().padStart(4, '0')}`;
        const existing = await prisma.user.findUnique({ where: { id: potentialId } });
        if (!existing) {
            suggestions.push(potentialId);
        }
        currentSeq++;
        if (currentSeq > 20000) break;
    }

    return suggestions;
}

/**
 * Génère un ID professeur unique au format UNIXXXX
 */
export async function generateUniqueProfessorId(): Promise<string> {
    const suggestions = await generateProfessorIdSuggestions(1);
    return suggestions[0] || "UNI9999";
}
