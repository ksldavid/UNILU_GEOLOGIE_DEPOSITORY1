import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'unilu_super_secret_key_2025'

export const login = async (req: Request, res: Response) => {
    try {
        const { email, idNumber, password } = req.body
        const identifier = email || idNumber;

        // 1. Trouver l'utilisateur
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { id: identifier } // Permet de se connecter avec l'email ou le matricule
                ]
            }
        })

        if (!user) {
            // Log générique sans exposer l'identifiant tenté
            return res.status(401).json({ message: 'Identifiants invalides' })
        }

        // 2. Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password)
        // Note: Ne pas logger les résultats de validation pour éviter l'énumération

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Identifiants invalides' })
        }

        // 3. Vérifier si l'utilisateur est bloqué
        if (user.isBlocked) {
            return res.status(403).json({
                message: `L'accès de l'étudiant(e) ${user.name} a été restreint par le Service Académique suite à des motifs d'ordre administratif, financier ou un contentieux universitaire. Si vous estimez qu'il s'agit d'une erreur, veuillez contacter immédiatement le Service Académique pour régulariser votre situation.`,
                reason: user.blockReason
            })
        }

        // 4. Générer le JWT
        const { platform } = req.body
        const isMobile = platform === 'mobile'

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.systemRole
            },
            JWT_SECRET,
            { expiresIn: isMobile ? '36500d' : '24h' } // 36500 days = 100 years
        )

        // 5. Envoyer une notification de sécurité si un pushToken existe
        if (user.pushToken) {
            try {
                const { sendPushNotifications } = require('../../utils/pushNotifications');
                sendPushNotifications([user.pushToken], {
                    title: '🔐 Alerte de sécurité',
                    body: "Une personne vient de se connecter à votre compte étudiant. Si ce n'est pas vous, contactez immédiatement le service technique au risque de violation des termes et conditions ce qui pourra mener à une suspension de votre compte étudiant.",
                    data: { type: 'SECURITY_LOGIN', timestamp: new Date().toISOString() }
                });
            } catch (pushError) {
                console.error('[Security Push] Erreur:', pushError);
            }
        }

        // 6. Réponse
        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.systemRole,
                isChefDePromo: user.isChefDePromo
            }
        })

    } catch (error) {
        console.error('Erreur Login:', error)
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' })
    }
}
