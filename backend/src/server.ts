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
import adminRoutes from './api/routes/admin.routes'
import databaseRoutes from './api/routes/database.routes'
import infrastructureRoutes from './api/routes/server-management.routes'
import studentRoutes from './api/routes/student.routes'
import professorRoutes from './api/routes/professor.routes'
import announcementRoutes from './api/routes/announcement.routes'
import attendanceRoutes from './api/routes/attendance.routes'


import { captureLog } from './api/controllers/stats.controller'

// ... (other imports)

// Charger les variables d'environnement
dotenv.config()

const app = express()
// On change le port par défaut à 3001 pour éviter les conflits avec d'autres processus
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors()) // Autorise le Frontend à parler au Backend
app.use(express.json()) // Permet de lire le JSON dans les requêtes

// Logging Middleware pour le dashboard technique
app.use(captureLog);

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
app.use('/api/admin', adminRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);


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
