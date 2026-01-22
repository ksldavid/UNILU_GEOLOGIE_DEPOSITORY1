/**
 * Configuration API pour l'interface web UNILU
 * 
 * Détecte automatiquement l'environnement (dev/prod) et utilise la bonne URL
 */

// Détection de l'environnement
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URLs de l'API selon l'environnement
const API_URLS = {
    development: 'http://localhost:3001/api',
    production: 'https://unilu-geologie-depository-1-a6kx.vercel.app/api',
};

// URL active
export const API_URL = isDevelopment ? API_URLS.development : API_URLS.production;

// Log en dev uniquement
if (isDevelopment) {
    console.log(`[API Config] Mode: DEVELOPMENT`);
    console.log(`[API Config] API URL: ${API_URL}`);
}

export default API_URL;
