/**
 * Utilitaire de débogage pour l'authentification
 * Permet de diagnostiquer les problèmes de token JWT
 */

export const authDebug = {
    /**
     * Vérifie si un token JWT est présent dans localStorage
     */
    hasToken(): boolean {
        const token = localStorage.getItem('token');
        return token !== null && token !== '';
    },

    /**
     * Récupère le token et affiche des infos de debug
     */
    getTokenInfo() {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('❌ Aucun token trouvé dans localStorage');
            return null;
        }

        try {
            // Décoder le payload JWT (partie centrale du token)
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('❌ Token JWT malformé (devrait avoir 3 parties)');
                return null;
            }

            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp && payload.exp < now;

            const info = {
                userId: payload.userId,
                role: payload.role,
                issuedAt: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A',
                expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A',
                isExpired,
                timeUntilExpiry: payload.exp ? Math.floor((payload.exp - now) / 60) : null
            };

            console.log('✅ Token JWT Info:', info);

            if (isExpired) {
                console.error('⚠️ Le token a expiré !');
                console.error(`Expiré le: ${info.expiresAt}`);
            } else {
                console.log(`✅ Token valide pour encore ${info.timeUntilExpiry} minutes`);
            }

            return info;
        } catch (error) {
            console.error('❌ Erreur lors du décodage du token:', error);
            return null;
        }
    },

    /**
     * Efface le token et les données utilisateur
     */
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('🗑️ Token et données utilisateur effacés');
    },

    /**
     * Test rapide d'une requête API
     */
    async testAPICall(endpoint: string) {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('❌ Impossible de tester: aucun token trouvé');
            return;
        }

        console.log(`🧪 Test API: ${endpoint}`);

        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📊 Statut de la réponse: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Réponse réussie:', data);
            } else {
                const error = await response.text();
                console.error('❌ Erreur:', error);
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
        }
    }
};

// Exposer globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
    (window as any).authDebug = authDebug;
    console.log('🔍 authDebug disponible! Tapez `authDebug.getTokenInfo()` dans la console pour diagnostiquer.');
}
