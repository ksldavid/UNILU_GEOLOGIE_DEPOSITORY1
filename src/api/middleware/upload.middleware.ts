import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

// Extensions de fichiers autorisées (approche plus fiable que MIME type seul)
const ALLOWED_EXTENSIONS = {
    // Documents
    '.pdf': true,
    '.doc': true,
    '.docx': true,
    '.xls': true,
    '.xlsx': true,
    '.ppt': true,
    '.pptx': true,
    // Images
    '.jpg': true,
    '.jpeg': true,
    '.png': true,
    '.gif': true,
    '.webp': true,
    // Archives
    '.zip': true,
};

// MIME types attendus (pour information, mais non bloquant car parfois incorrects)
const EXPECTED_MIME_TYPES: Record<string, string[]> = {
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    // Archives
    'application/zip': ['.zip'],
    // MIME types alternatifs parfois envoyés par les navigateurs
    'application/octet-stream': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'],
    'text/html': ['.pdf'], // Certains navigateurs envoient ça pour les PDFs malheureusement
};

// Tailles maximales par type (en bytes)
const MAX_FILE_SIZES: Record<string, number> = {
    'document': 4.5 * 1024 * 1024,  // 4.5MB limite Vercel
    'image': 4.5 * 1024 * 1024,      // 4.5MB limite Vercel
    'archive': 4.5 * 1024 * 1024,    // 4.5MB limite Vercel
    'default': 4.5 * 1024 * 1024     // 4.5MB limite Vercel
};

const getFileType = (mimetype: string): string => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('application/zip')) return 'archive';
    return 'document';
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limite absolue
        files: 1, // Maximum 1 fichier par requête
    },
    fileFilter: (req: Request, file, cb) => {
        // PRIORITÉ 1: Vérifier l'extension (plus fiable que MIME type)
        const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();

        if (!ALLOWED_EXTENSIONS[fileExtension as keyof typeof ALLOWED_EXTENSIONS]) {
            return cb(new Error(
                `Extension "${fileExtension}" non autorisée. Formats acceptés: PDF, DOC(X), XLS(X), PPT(X), JPG, PNG, GIF, WEBP, ZIP`
            ));
        }

        // PRIORITÉ 2: Vérifier les noms de fichiers suspects (sécurité)
        const suspiciousPatterns = [
            /\.\./,           // Path traversal
            /^\.+$/,          // Fichiers cachés uniquement
            /[<>:"|?*]/,      // Caractères Windows interdits
            /\.exe$/i,        // Exécutables
            /\.bat$/i,        // Batch files
            /\.sh$/i,         // Shell scripts
            /\.php$/i,        // PHP
            /\.js$/i,         // JavaScript (côté serveur)
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(file.originalname)) {
                return cb(new Error('Nom de fichier non autorisé pour des raisons de sécurité.'));
            }
        }

        // PRIORITÉ 3: Validation MIME type (warning seulement, on accepte quand même si extension OK)
        // Car les navigateurs envoient parfois des MIME types incorrects
        const expectedExtensions = EXPECTED_MIME_TYPES[file.mimetype];
        if (!expectedExtensions || !expectedExtensions.includes(fileExtension)) {
            console.warn(`⚠️ MIME type mismatch: "${file.mimetype}" pour "${fileExtension}" (fichier: ${file.originalname})`);
            // On n'arrête PAS le process - l'extension prime sur le MIME type
        }

        cb(null, true);
    },
});

// Export pour les images uniquement (profils, preuves photo, etc.)
export const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max pour les images
        files: 1,
    },
    fileFilter: (req: Request, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedImageTypes.includes(file.mimetype)) {
            return cb(new Error('Seules les images (JPG, PNG, GIF, WEBP) sont autorisées.'));
        }

        cb(null, true);
    },
});

// Export les constantes pour utilisation externe
export { EXPECTED_MIME_TYPES, MAX_FILE_SIZES, ALLOWED_EXTENSIONS };
