import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './api/routes/auth.routes' // Assurons-nous que le chemin est correct
import userRoutes from './api/routes/user.routes'
import statsRoutes from './api/routes/stats.routes'
import scheduleRoutes from './api/routes/schedule.routes'
import courseRoutes from './api/routes/course.routes'
import gradeRoutes from './api/routes/grade.routes'
import supportRoutes from './api/routes/support.routes'
import staffRoutes from './api/routes/staff.routes'

// Charger les variables d'environnement
dotenv.config()

const app = express()
// On change le port par défaut à 3001 pour éviter les conflits avec d'autres processus
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors()) // Autorise le Frontend à parler au Backend
app.use(express.json()) // Permet de lire le JSON dans les requêtes

// Logging Middleware - Pour voir toutes les tentatives d'appel
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
console.log('🔄 Chargement des routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/staff', staffRoutes);

// Route de diagnostic
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Serveur UNILU API opérationnel !',
        time: new Date().toISOString()
    });
});

// Route de test racine
app.get('/', (req, res) => {
    res.send('Serveur UNILU API opérationnel ! 🚀');
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`
╔═════════════════════════════════════════════════════╗
║                                                     ║
║   🚀 SERVEUR UNILU API DÉMARRÉ                      ║
║   🌐 URL: http://localhost:${PORT}                  ║
║                                                     ║
╚═════════════════════════════════════════════════════╝
    `)
})
