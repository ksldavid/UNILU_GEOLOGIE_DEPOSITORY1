import API_URL from './config';

export const cloudinaryService = {
    async getSignature(folder: string) {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/cloudinary-signature?folder=${folder}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Impossible de générer la signature de sécurité.');
        }
        
        return response.json();
    },

    async uploadDirect(file: File, folder: string) {
        // 1. Get Signature
        const { signature, timestamp, apiKey, cloudName } = await this.getSignature(folder);

        // 2. Prepare FormData for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        // 3. Upload to Cloudinary directly
        console.log(`☁️ [Cloudinary] Début de l'upload direct (${file.name}, ${Math.round(file.size / 1024)} KB)`);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ [Cloudinary] Erreur upload:', error);
            throw new Error(error.error?.message || "Échec de l'upload direct vers Cloudinary");
        }

        const result = await response.json();
        console.log('✅ [Cloudinary] Upload réussi:', result.secure_url);
        return result; // contains secure_url, public_id, etc.
    }
};
