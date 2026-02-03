import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'unilu_super_secret_key_2025'

export interface AuthRequest extends Request {
    user?: {
        userId: string
        role: string
    }
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // On attend "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé, token manquant' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré' })
    }
}

// Middleware pour vérifier les rôles (ex: Admin uniquement)
export const authorizeRole = (roles: string | string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé : vous n'avez pas les droits nécessaires" })
        }
        next()
    }
}
