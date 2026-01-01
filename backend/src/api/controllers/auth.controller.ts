import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'unilu_super_secret_key_2025'

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        // 1. Trouver l'utilisateur
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { id: email } // Permet de se connecter avec l'email ou le matricule
                ]
            }
        })

        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides' })
        }

        // 2. Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Identifiants invalides' })
        }

        // 3. Vérifier si l'utilisateur est bloqué
        if (user.isBlocked) {
            return res.status(403).json({
                message: 'Votre compte est bloqué',
                reason: user.blockReason
            })
        }

        // 4. Générer le JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.systemRole
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        // 5. Réponse
        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.systemRole
            }
        })

    } catch (error) {
        console.error('Erreur Login:', error)
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' })
    }
}
