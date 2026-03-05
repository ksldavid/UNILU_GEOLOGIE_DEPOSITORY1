/**
 * Configuration API pour l'application mobile UNILU
 * 
 * Ce fichier gère les URLs de l'API selon l'environnement (dev/prod)
 */

// Détection de l'environnement
const isDevelopment = __DEV__ ?? true;

// ============================================================
// CONFIGURATION DES URLs DE L'API
// ============================================================
// 
// INSTRUCTIONS POUR LE DÉPLOIEMENT :
// 1. Déploie ton backend sur Vercel, Railway, ou Render
// 2. Copie l'URL fournie par le service (ex: https://unilu-api.railway.app)
// 3. Remplace l'URL de production ci-dessous
// 4. Rebuild l'application mobile avec: npx expo build
//
const API_URLS = {
    // URL de développement (IP locale - change-la selon ton réseau WiFi)
    development: 'http://192.168.43.226:3001/api',

    // URL de production (Mise à jour pour correspondre au backend Vercel actuel)
    production: 'https://unilu-geologie-depository-1-a6kx.vercel.app/api',
};

// URL active (FORCÉE sur PRODUCTION pour connexion directe au serveur)
export const BASE_URL = API_URLS.production;

// Timeout par défaut pour les requêtes (en ms)
export const API_TIMEOUT = 30000; // 30 secondes

// Configuration des endpoints
export const ENDPOINTS = {
    // Authentification
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
    },
    // Étudiant
    STUDENT: {
        DASHBOARD: '/student/dashboard',
        COURSES: '/student/courses',
        SCHEDULE: '/student/schedule',
        GRADES: '/student/grades',
        PROFILE: '/student/profile',
        ANNOUNCEMENTS: '/student/announcements',
        SUBMIT_ASSIGNMENT: '/student/submit-assignment',
    },
    // Professeur
    PROFESSOR: {
        DASHBOARD: '/professor/dashboard',
        COURSES: '/professor/courses',
        STUDENTS: '/professor/students',
        SCHEDULE: '/professor/schedule',
        ATTENDANCE: '/professor/attendance',
    },
    // Présence
    ATTENDANCE: {
        GENERATE_QR: '/attendance/generate',
        SCAN_QR: '/attendance/scan',
    },
    // Health check
    HEALTH: '/health',
};

// Export pour les logs de debug (seulement en dev)
if (isDevelopment) {
    console.log(`[API Config] Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`[API Config] Base URL: ${BASE_URL}`);
}
