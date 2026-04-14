import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import cloudinary from '../../lib/cloudinary'
import { deleteFromCloudinary } from '../../utils/cloudinaryHelper'

// Récupérer tous les utilisateurs filtrés par rôle
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { role, academicLevelId } = req.query as { role?: string, academicLevelId?: string }

        const whereClause: any = {}
        if (role) whereClause.systemRole = role
        if (academicLevelId) {
            whereClause.studentEnrollments = { some: { academicLevelId: Number(academicLevelId) } }
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                systemRole: true,
                createdAt: true,
                isBlocked: true,
                isChefDePromo: true,
                profilePhotoUrl: true,
                studentEnrollments: {
                    take: 1,
                    orderBy: { enrolledAt: 'desc' },
                    select: { academicLevel: { select: { name: true } } }
                },
                studentCourseEnrollments: {
                    select: {
                        course: {
                            select: {
                                name: true, code: true,
                                _count: { select: { attendanceSessions: true } }
                            }
                        }
                    }
                },
                enrollments: {
                    select: {
                        role: true, academicYear: true,
                        course: {
                            select: {
                                code: true, name: true,
                                academicLevels: { select: { displayName: true, code: true } }
                            }
                        }
                    }
                },
                professorProfile: { select: { title: true } },
                academicProfile: { select: { name: true, title: true } }
            },
            orderBy: { name: 'asc' }
        })

        const formattedUsers = users.map((u: any) => {
            if (u.systemRole === 'STUDENT') {
                return {
                    ...u,
                    studentCourseEnrollments: u.studentCourseEnrollments?.map((e: any) => ({ ...e, attendanceRate: 0 })) || [],
                    _debugStudentEnrollments: u.studentEnrollments
                };
            }
            return u;
        });

        res.json(formattedUsers)
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Mettre à jour les informations d'un utilisateur
export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, email, title, isChefDePromo } = req.body

        // Validation du nombre de CP par classe si on tente d'activer le statut
        if (isChefDePromo === true) {
            const userWithClass = await prisma.user.findUnique({
                where: { id },
                include: {
                    studentEnrollments: {
                        orderBy: { enrolledAt: 'desc' },
                        take: 1,
                        include: { academicLevel: true }
                    }
                }
            });

            if (userWithClass?.systemRole === 'STUDENT' && userWithClass.studentEnrollments.length > 0) {
                const classLabel = userWithClass.studentEnrollments[0].academicLevel.name;
                const classId = userWithClass.studentEnrollments[0].academicLevelId;
                
                // Déterminer la limite
                const limit = classLabel.toLowerCase().includes('prescience') ? 4 : 2;

                // Compter les CP actuels dans cette classe (exclure l'utilisateur actuel s'il l'est déjà)
                const currentCPCount = await prisma.user.count({
                    where: {
                        isChefDePromo: true,
                        id: { not: id },
                        studentEnrollments: {
                            some: { academicLevelId: classId }
                        }
                    }
                });

                if (currentCPCount >= limit) {
                    return res.status(400).json({ 
                        message: `Limite de Chefs de Promotion atteinte pour la classe ${classLabel}. Maximum autorisé : ${limit}.` 
                    });
                }
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name, email,
                isChefDePromo,
                professorProfile: title ? {
                    upsert: { create: { id, title }, update: { title } }
                } : undefined
            },
            include: { professorProfile: true }
        })

        res.json({ message: 'Utilisateur mis à jour avec succès', user: updatedUser })
    } catch (error: any) {
        console.error('Erreur updateUser:', error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

// Mettre à jour le jeton de notification push
export const updatePushToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId
        const { pushToken } = req.body

        if (!userId) return res.status(401).json({ message: 'Non authentifié' })

        await prisma.user.update({ where: { id: userId }, data: { pushToken } })
        res.json({ message: 'Push token mis à jour' })
    } catch (error: any) {
        console.error('Erreur push token:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

/**
 * Upload ou remplacement de la photo de profil.
 * Compression automatique Cloudinary : WebP 400x400, qualité 82, crop centré sur le visage.
 * Supprime l'ancienne photo Cloudinary avant d'uploader la nouvelle.
 */
export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Non authentifié' });

        if (!req.file) {
            return res.status(400).json({ message: 'Aucune image fournie.' });
        }

        // Vérifier le type MIME
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                message: 'Format non supporté.',
                rejectionReasons: ['Format de fichier invalide. Utilisez JPG, PNG ou WebP.']
            });
        }

        // Vérifier la taille (max 10 MB)
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                message: 'Image trop volumineuse.',
                rejectionReasons: ['Le fichier dépasse 10 MB. Choisissez une image plus petite.']
            });
        }

        // Récupérer l'ancienne photo pour la supprimer après
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePhotoPublicId: true }
        });

        // Upload Cloudinary avec compression + crop sur visage
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `unilu/profile_photos/${userId}`,
                    public_id: 'avatar',
                    overwrite: true,
                    resource_type: 'image',
                    transformation: [{
                        width: 400,
                        height: 400,
                        crop: 'fill',
                        gravity: 'face',   // Cadrage centré sur le visage (gratuit)
                        quality: 82,
                        fetch_format: 'webp'
                    }]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file!.buffer);
        });

        // Note: la détection de visage via Cloudinary est un add-on payant.
        // On accepte la photo sans validation de visage côté serveur.
        // La validation des règles se fait côté mobile (guide utilisateur).

        // Supprimer l'ancienne photo Cloudinary
        if (user?.profilePhotoPublicId) {
            await deleteFromCloudinary(user.profilePhotoPublicId).catch((err) => {
                console.warn('[Photo] Suppression ancienne photo échouée:', err.message);
            });
        }

        // Sauvegarder en base
        await prisma.user.update({
            where: { id: userId },
            data: {
                profilePhotoUrl: uploadResult.secure_url,
                profilePhotoPublicId: uploadResult.public_id
            }
        });

        console.log(`[ProfilePhoto] ✅ ${userId} → ${uploadResult.secure_url}`);

        res.json({
            message: 'Photo de profil mise à jour avec succès !',
            profilePhotoUrl: uploadResult.secure_url
        });

    } catch (error: any) {
        console.error('Erreur uploadProfilePhoto:', error);
        res.status(500).json({ message: "Erreur lors de l'upload de la photo." });
    }
};

/**
 * Supprime la photo de profil de l'utilisateur connecté.
 */
export const deleteProfilePhoto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Non authentifié' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePhotoPublicId: true }
        });

        if (!user?.profilePhotoPublicId) {
            return res.status(404).json({ message: 'Aucune photo de profil à supprimer.' });
        }

        await deleteFromCloudinary(user.profilePhotoPublicId).catch(() => {});

        await prisma.user.update({
            where: { id: userId },
            data: { profilePhotoUrl: null, profilePhotoPublicId: null }
        });

        res.json({ message: 'Photo de profil supprimée.' });
    } catch (error: any) {
        console.error('Erreur deleteProfilePhoto:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Génère une signature pour l'upload direct vers Cloudinary depuis le frontend.
 * Cela permet de contourner la limite de 4.5 MB des Serverless Functions de Vercel.
 */
export const getCloudinarySignature = async (req: AuthRequest, res: Response) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const { folder } = req.query;

        if (!folder) {
            return res.status(400).json({ message: "Le dossier (folder) est requis." });
        }

        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                folder: folder as string,
            },
            process.env.CLOUDINARY_API_SECRET!
        );

        res.json({
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        });
    } catch (error) {
        console.error('Error generating Cloudinary signature:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la génération de la signature.' });
    }
}
