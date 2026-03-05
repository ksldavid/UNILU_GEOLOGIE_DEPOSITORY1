
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, API_TIMEOUT } from './config';

// Re-export pour la compatibilité avec le code existant
export { BASE_URL };

/**
 * Récupère le token d'authentification stocké
 */
export const getAuthToken = async (): Promise<string | null> => {
    try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
            const { token } = JSON.parse(session);
            return token;
        }
        return null;
    } catch (error) {
        console.error('[API] Erreur lors de la récupération du token:', error);
        return null;
    }
};

/**
 * Interface pour les options de requête
 */
interface FetchOptions extends RequestInit {
    timeout?: number;
    skipAuth?: boolean;
}

/**
 * Classe d'erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Fonction principale pour les appels API avec gestion d'erreurs robuste
 */
export const apiFetch = async <T = any>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> => {
    const { timeout = API_TIMEOUT, skipAuth = false, ...fetchOptions } = options;

    // Récupérer le token si nécessaire
    const token = skipAuth ? null : await getAuthToken();

    // Construire les headers
    const headers: any = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
    };

    // Si le body n'est pas du FormData, on ajoute le Content-Type par défaut
    if (!(fetchOptions.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Créer un AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Gérer les différents codes de réponse
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Messages d'erreur personnalisés selon le code
            let message = errorData.message || 'Une erreur est survenue';

            switch (response.status) {
                case 401:
                    if (!errorData.message) message = 'Session expirée. Veuillez vous reconnecter.';
                    break;
                case 403:
                    if (!errorData.message) message = 'Accès non autorisé.';
                    break;
                case 404:
                    if (!errorData.message) message = 'Ressource non trouvée.';
                    break;
                case 429:
                    if (!errorData.message) message = 'Trop de requêtes. Veuillez patienter.';
                    break;
                case 500:
                    if (!errorData.message) message = 'Erreur serveur. Veuillez réessayer plus tard.';
                    break;
            }

            throw new ApiError(message, response.status, errorData);
        }

        // Traiter les réponses vides (204 No Content)
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();

    } catch (error: any) {
        clearTimeout(timeoutId);

        // Gérer les erreurs de timeout
        if (error.name === 'AbortError') {
            throw new ApiError(
                'La requête a pris trop de temps. Vérifiez votre connexion.',
                0
            );
        }

        // Gérer les erreurs réseau
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
            throw new ApiError(
                'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
                0
            );
        }

        // Retransmettre les erreurs API
        if (error instanceof ApiError) {
            throw error;
        }

        // Erreur générique
        throw new ApiError(
            error.message || 'Une erreur inattendue est survenue',
            0
        );
    }
};

/**
 * Raccourcis pour les méthodes HTTP courantes
 */
export const api = {
    get: <T = any>(endpoint: string, options?: FetchOptions) =>
        apiFetch<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
        apiFetch<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
        apiFetch<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    patch: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
        apiFetch<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: <T = any>(endpoint: string, options?: FetchOptions) =>
        apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
