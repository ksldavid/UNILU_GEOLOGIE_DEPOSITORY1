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
 * Génère un ID étudiant unique au format 012501XXXX
 */
export async function generateUniqueStudentId(): Promise<string> {
    const base = "012501";
    let isUnique = false;
    let newId = "";

    // On récupère le dernier ID de ce type pour essayer d'incrémenter intelligemment
    const lastUser = await prisma.user.findFirst({
        where: {
            id: {
                startsWith: base
            }
        },
        orderBy: {
            id: 'desc'
        }
    });

    let currentSeq = 1;
    if (lastUser) {
        const seqPart = lastUser.id.substring(6);
        if (!isNaN(parseInt(seqPart))) {
            currentSeq = parseInt(seqPart) + 1;
        }
    }

    while (!isUnique) {
        newId = `${base}${currentSeq.toString().padStart(4, '0')}`;
        const existing = await prisma.user.findUnique({ where: { id: newId } });
        if (!existing) {
            isUnique = true;
        } else {
            currentSeq++;
        }
    }

    return newId;
}

/**
 * Génère un ID professeur unique au format UNIXXXX
 */
export async function generateUniqueProfessorId(): Promise<string> {
    const base = "UNI";
    let isUnique = false;
    let newId = "";

    const lastUser = await prisma.user.findFirst({
        where: {
            id: {
                startsWith: base
            }
        },
        orderBy: {
            id: 'desc'
        }
    });

    let currentSeq = 1;
    if (lastUser) {
        const seqPart = lastUser.id.substring(3);
        if (!isNaN(parseInt(seqPart))) {
            currentSeq = parseInt(seqPart) + 1;
        }
    }

    while (!isUnique) {
        newId = `${base}${currentSeq.toString().padStart(4, '0')}`;
        const existing = await prisma.user.findUnique({ where: { id: newId } });
        if (!existing) {
            isUnique = true;
        } else {
            currentSeq++;
        }
    }

    return newId;
}
