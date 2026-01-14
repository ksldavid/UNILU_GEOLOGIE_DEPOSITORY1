import cloudinary from '../lib/cloudinary';
import { Readable } from 'stream';

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string, fileName?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const options: any = {
            folder: folder,
            resource_type: 'raw',
            access_mode: 'public',
        };

        if (fileName) {
            // Pour le mode 'raw', l'extension DOIT faire partie du public_id
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
                    console.log('✅ UPLOAD RÉUSSI:', result.secure_url);
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
        cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
            if (error) {
                console.error('❌ ERREUR SUPPRESSION CLOUDINARY:', error);
                return reject(error);
            }
            console.log('✅ SUPPRESSION RÉUSSIE:', publicId);
            resolve(result);
        });
    });
};
