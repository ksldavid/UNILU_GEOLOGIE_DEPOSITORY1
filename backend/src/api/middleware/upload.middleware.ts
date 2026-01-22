import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

// Types de fichiers autorisés avec leurs MIME types
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
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
    // Archives (optionnel)
    'application/zip': ['.zip'],
};

// Tailles maximales par type (en bytes)
const MAX_FILE_SIZES: Record<string, number> = {
    'document': 10 * 1024 * 1024,  // 10MB pour les documents
    'image': 5 * 1024 * 1024,       // 5MB pour les images
    'archive': 25 * 1024 * 1024,    // 25MB pour les archives
    'default': 10 * 1024 * 1024     // 10MB par défaut
};

const getFileType = (mimetype: string): string => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('application/zip')) return 'archive';
    return 'document';
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limite absolue (vérifié ensuite par type)
        files: 1, // Maximum 1 fichier par requête
    },
    fileFilter: (req: Request, file, cb) => {
        // Vérifier le type MIME
        if (!ALLOWED_MIME_TYPES[file.mimetype]) {
            return cb(new Error(
                `Format "${file.mimetype}" non autorisé. Formats acceptés: PDF, DOC(X), XLS(X), PPT(X), JPG, PNG, GIF, WEBP, ZIP`
            ));
        }

        // Vérifier l'extension du fichier (double vérification de sécurité)
        const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
        const allowedExtensions = ALLOWED_MIME_TYPES[file.mimetype];

        if (!allowedExtensions.includes(fileExtension)) {
            return cb(new Error(
                `Extension "${fileExtension}" ne correspond pas au type de fichier déclaré.`
            ));
        }

        // Vérifier les noms de fichiers suspects (sécurité)
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
export { ALLOWED_MIME_TYPES, MAX_FILE_SIZES };
