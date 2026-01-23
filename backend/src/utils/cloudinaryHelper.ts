import cloudinary from '../lib/cloudinary';
import { Readable } from 'stream';

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string, fileName?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const options: any = {
            folder: folder,
            resource_type: 'auto', // Cloudinary détectera automatiquement (image pour PDF, raw pour zip/etc)
            access_mode: 'public',
        };

        if (fileName) {
            // Pour le mode 'auto', on garde l'extension pour faciliter l'accès, 
            // surtout si Cloudinary le classe en 'raw'
            options.public_id = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.error('❌ ERREUR CLOUDINARY:', error);
                    return reject(error);
                }
                if (result) {
                    console.log('✅ UPLOAD RÉUSSI:', result.secure_url, `(${result.resource_type})`);
                }
                resolve(result);
            }
        );

        const stream = new Readable();
        stream.push(fileBuffer);
        stream.push(null);
        stream.pipe(uploadStream);
    });
};

export const deleteFromCloudinary = (publicId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const extension = publicId.split('.').pop()?.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
        const primaryType = imageExtensions.includes(extension || '') ? 'image' : 'raw';

        cloudinary.uploader.destroy(publicId, { resource_type: primaryType }, (error, result) => {
            if (error) return reject(error);

            // Si non trouvé avec le type primaire, essayer l'autre type au cas où (pour compatibilité avec vieux uploads)
            if (result && result.result === 'not found') {
                const secondaryType = primaryType === 'image' ? 'raw' : 'image';
                cloudinary.uploader.destroy(publicId, { resource_type: secondaryType }, (err2, res2) => {
                    if (err2) return reject(err2);
                    resolve(res2);
                });
            } else {
                resolve(result);
            }
        });
    });
};
