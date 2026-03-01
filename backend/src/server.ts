import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

// Routes imports
import authRoutes from './api/routes/auth.routes'
import userRoutes from './api/routes/user.routes'
import statsRoutes from './api/routes/stats.routes'
import scheduleRoutes from './api/routes/schedule.routes'
import courseRoutes from './api/routes/course.routes'
import gradeRoutes from './api/routes/grade.routes'
import supportRoutes from './api/routes/support.routes'
import staffRoutes from './api/routes/staff.routes'
import adminRoutes from './api/routes/admin.routes'
import databaseRoutes from './api/routes/database.routes'
import infrastructureRoutes from './api/routes/server-management.routes'
import studentRoutes from './api/routes/student.routes'
import professorRoutes from './api/routes/professor.routes'
import announcementRoutes from './api/routes/announcement.routes'
import attendanceRoutes from './api/routes/attendance.routes'
import advertisementRoutes from './api/routes/advertisement.routes'
import diagnosticRoutes from './api/routes/diagnostic.routes'
import examScheduleRoutes from './api/routes/exam-schedule.routes'

import { captureLog } from './api/controllers/stats.controller'

// Charger les variables d'environnement EN PREMIER
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// Activer le trust proxy pour Vercel (indispensable pour express-rate-limit)
app.set('trust proxy', 1)

// ============================================================
// 🔒 SÉCURITÉ - MIDDLEWARES DE PROTECTION
// ============================================================

// 1. Helmet - Ajoute des headers HTTP de sécurité
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour permettre les ressources externes
    crossOriginEmbedderPolicy: false
}))

// 2. Compression - Réduit la taille des réponses
app.use(compression())

// 3. Rate Limiting - Protection contre le brute force et DDoS
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Maximum 500 requêtes par IP par fenêtre
    message: {
        status: 429,
        message: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
})

// Rate limiter plus strict pour l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Maximum 10 tentatives de login par IP
    message: {
        status: 429,
        message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
})

// Appliquer le rate limiting général
app.use(generalLimiter)

// 4. CORS - Configuration sécurisée
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = [
            'https://uniluhub.com',
            'https://www.uniluhub.com',
            'https://unilu-geologie-depository-1-qtz2.vercel.app',
            'https://unilu-geologie.vercel.app',
            'https://unilu-geologie-depository-1-a6kx.vercel.app'
        ];

        // Autoriser si :
        // 1. Pas d'origine (cas des applications mobiles natives ou outils comme Postman/Curl)
        // 2. L'origine est dans notre liste de confiance
        // 3. On est en développement (localhost)
        if (!origin || allowedOrigins.includes(origin) || !isProduction) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 heures de cache pour les preflight requests
}
app.use(cors(corsOptions))

// 5. Limite de taille des requêtes (15MB max pour Vercel Pro)
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

// 6. Logging Middleware pour le dashboard technique
app.use(captureLog)

// ============================================================
// 📍 ROUTES
// ============================================================

console.log('🔄 Chargement des routes...')

// Route d'authentification avec rate limiting strict
app.use('/api/auth', authLimiter, authRoutes)

// Routes protégées
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/database', databaseRoutes)
app.use('/api/infrastructure', infrastructureRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/professor', professorRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/ads', advertisementRoutes)
app.use('/api/diagnostic', diagnosticRoutes)
app.use('/api/exam-schedules', examScheduleRoutes)

// Route de diagnostic (santé du serveur)
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Serveur UNILU API opérationnel !',
        time: new Date().toISOString(),
        environment: isProduction ? 'production' : 'development'
    })
})

// Route racine
app.get('/', (req: Request, res: Response) => {
    res.send('Serveur UNILU API opérationnel ! 🚀')
})

// ============================================================
// ❌ GESTION DES ERREURS GLOBALE
// ============================================================

// 404 - Route non trouvée
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 404,
        message: `Route ${req.method} ${req.path} non trouvée`
    })
})

// Gestionnaire d'erreurs global - IMPORTANT pour éviter les crashes
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log l'erreur (en production, utiliser un service de logging comme Winston)
    console.error('❌ Erreur serveur:', {
        message: err.message,
        stack: isProduction ? undefined : err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    })

    // Ne pas exposer les détails de l'erreur en production
    res.status(500).json({
        status: 500,
        message: isProduction
            ? 'Une erreur interne est survenue. Veuillez réessayer plus tard.'
            : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    })
})

// ============================================================
// 🚀 DÉMARRAGE DU SERVEUR
// ============================================================

// Démarrer les services de background
import { startAdScheduler } from './services/adScheduler';

app.listen(PORT, () => {
    startAdScheduler();
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 SERVEUR UNILU API DÉMARRÉ                            ║
║   🌐 URL: http://localhost:${PORT}                         ║
║   🔒 Mode: ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}                          ║
║   ✅ Sécurité: Rate Limiting, Helmet, CORS                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `)
})

// Export pour Vercel
export default app

// Gestion des erreurs non attrapées (évite les crashes silencieux)
process.on('uncaughtException', (error) => {
    console.error('❌ Exception non attrapée:', error)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason)
})
