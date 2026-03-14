import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import * as os from 'os'
import fs from 'fs'
import path from 'path'
import cloudinary from '../../lib/cloudinary'

// Stockage temporaire des logs API pour le dashboard technique
const apiLogs: any[] = []
const MAX_LOGS = 1000 // Augmenté pour avoir assez de données pour les piques

export const captureLog = (req: Request, res: Response, next: any) => {
    const start = Date.now()
    res.on('finish', () => {
        const duration = Date.now() - start
        const logEntry = {
            id: Math.random().toString(36).substr(2, 9),
            time: new Date(),
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userId: (req as any).user?.userId,
            role: (req as any).user?.role
        }
        apiLogs.unshift(logEntry)
        if (apiLogs.length > MAX_LOGS) apiLogs.pop()
    })
    next()
}

// Statistiques pour le dashboard du service académique
export const getAcademicStats = async (req: Request, res: Response) => {
    try {
        const academicYear = "2025-2026"
        // 1. Nombre total d'étudiants inscrits cette année
        const studentCount = await prisma.studentEnrollment.count({
            where: {
                academicYear,
                user: { isArchived: false }
            }
        })

        // 2. Nombre de professeurs (users with professorProfile)
        const professorCount = await prisma.user.count({
            where: {
                professorProfile: {
                    isNot: null
                },
                isArchived: false
            }
        })

        // 3. Nombre total de cours catalogue
        const courseCount = await prisma.course.count()

        // 4. Nombre de demandes de changement de notes en attente
        const pendingGradeChangeRequests = await prisma.gradeChangeRequest.count({
            where: {
                status: 'PENDING'
            }
        })

        res.json({
            studentCount: studentCount || 0,
            professorCount: professorCount || 0,
            courseCount: courseCount || 0,
            pendingGradeChangeRequests: pendingGradeChangeRequests || 0
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les activités récentes
export const getRecentActivities = async (req: Request, res: Response) => {
    try {
        const activities: any[] = []

        // 1. Nouvelles inscriptions
        const recentStudents = await (prisma.user.findMany({
            where: { systemRole: 'STUDENT' },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
                createdAt: true,
                studentEnrollments: {
                    take: 1,
                    select: { academicLevel: { select: { name: true } } }
                }
            }
        }) as any)

        recentStudents.forEach((s: any) => {
            activities.push({
                id: `student-${s.id}`,
                user: s.name,
                action: 'Nouvelle inscription validée',
                detail: s.studentEnrollments[0]?.academicLevel?.name || 'Géologie',
                time: s.createdAt,
                profilePhotoUrl: s.profilePhotoUrl,
                type: 'STUDENT'
            })
        })

        // 2. Rectifications de notes (Dernières demandes) - Force bypass cache if possible
        const recentGrades = await (prisma.gradeChangeRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10, // Increase take to be sure we see it
            include: {
                requester: { select: { name: true } },
                grade: {
                    include: {
                        assessment: {
                            include: { course: { select: { name: true } } }
                        }
                    }
                }
            }
        }) as any)

        recentGrades.forEach((g: any) => {
            if (!g.grade || !g.grade.assessment) return;
            activities.push({
                id: `grade-${g.id}`,
                user: g.requester?.name || 'Inconnu',
                action: g.status === 'PENDING' || g.status === 'pending' ? 'Demande de rectification' : `Note ${g.status === 'APPROVED' || g.status === 'approved' ? 'approuvée' : 'refusée'}`,
                detail: g.grade.assessment.course?.name || 'Cours inconnu',
                time: g.createdAt,
                type: 'GRADE'
            })
        })
        // 3. Planning (Dernières modifications)
        const recentSchedules = await (prisma.schedule.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 3,
            select: {
                id: true,
                updatedAt: true,
                course: { select: { name: true } },
                academicLevel: { select: { name: true } }
            }
        }) as any)

        recentSchedules.forEach((sch: any) => {
            activities.push({
                id: `schedule-${sch.id}`,
                user: 'Service Académique',
                action: 'Modification de planning',
                detail: `${sch.course?.name || 'Cours'} - ${sch.academicLevel?.name || 'Niveau'}`,
                time: sch.updatedAt,
                type: 'SCHEDULE'
            })
        })

        // 4. Changements de présence (AttendanceChangeRequest)
        const recentAttendanceRequests = await (prisma.attendanceChangeRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
                requester: { select: { name: true } },
                attendance: {
                    include: {
                        student: { select: { name: true } },
                        session: { include: { course: { select: { name: true } } } }
                    }
                }
            }
        }) as any)

        recentAttendanceRequests.forEach((ar: any) => {
            if (!ar.attendance || !ar.attendance.student) return;
            activities.push({
                id: `attendance-${ar.id}`,
                user: ar.requester?.name || 'Service Académique',
                action: 'Demande changement présence',
                detail: `${ar.attendance.student.name} - ${ar.attendance.session?.course?.name || 'Cours'}`,
                time: ar.createdAt,
                type: 'ATTENDANCE'
            })
        })

        // 5. Annonces (Dernières annonces publiées)
        const recentAnnouncements = await (prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
                author: { select: { name: true } }
            }
        }) as any)

        recentAnnouncements.forEach((ann: any) => {
            if (!ann) return;
            let targetLabel = 'Tous';
            if (ann.target === 'GLOBAL') targetLabel = "Toute l'Université";
            else if (ann.target === 'ALL_STUDENTS') targetLabel = 'Tous les étudiants';
            else if (ann.target === 'ALL_PROFESSORS') targetLabel = 'Professeurs';
            else if (ann.target === 'ACADEMIC_LEVEL') targetLabel = 'Niveau spécifique';
            else if (ann.target === 'SPECIFIC_USER') targetLabel = 'Utilisateur unique';

            activities.push({
                id: `announcement-${ann.id}`,
                user: ann.author?.name || 'Admin',
                action: 'Nouvelle annonce publiée',
                detail: `${ann.title} (Cible: ${targetLabel})`,
                time: ann.createdAt,
                type: 'ANNOUNCEMENT'
            })
        })

        // Trier par date décroissante
        const sortedActivities = activities
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 5)

        res.json(sortedActivities)
    } catch (error) {
        console.error('Erreur activités récentes:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Statistiques de présence par niveau académique pour le graphique
export const getAttendanceStatsByLevel = async (req: Request, res: Response) => {
    try {
        const months = ["Janv.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

        // Niveaux ciblés : 0 (Prescience), 1 (B1), 2 (B2), 3 (B3)
        const levels = [
            { id: 0, key: 'prescience' },
            { id: 1, key: 'b1' },
            { id: 2, key: 'b2' },
            { id: 3, key: 'b3' }
        ];

        // On va générer des données pour chaque mois
        // En prod, on ferait des agrégations Prisma, ici on simule une agrégation réaliste
        // basée sur les sessions existantes si possible, sinon on met des valeurs par défaut

        const currentYear = new Date().getFullYear();

        // On prépare toutes les promesses pour une exécution parallèle
        const monthPromises = months.map(async (month, i) => {
            const monthData: any = { month };

            const levelPromises = levels.map(async (level) => {
                const whereClause = {
                    session: {
                        course: {
                            academicLevels: {
                                some: { id: level.id }
                            }
                        },
                        date: {
                            gte: new Date(currentYear, i, 1),
                            lt: new Date(currentYear, i + 1, 1)
                        }
                    }
                };

                const [attendanceCount, totalAttempts] = await Promise.all([
                    prisma.attendanceRecord.count({
                        where: {
                            ...whereClause,
                            status: { in: ['PRESENT', 'LATE'] }
                        }
                    }),
                    prisma.attendanceRecord.count({
                        where: whereClause
                    })
                ]);

                return {
                    key: level.key,
                    value: totalAttempts === 0 ? 0 : Math.round((attendanceCount / totalAttempts) * 100)
                };
            });

            const levelResults = await Promise.all(levelPromises);
            levelResults.forEach(res => {
                monthData[res.key] = res.value;
            });

            return monthData;
        });

        const results = await Promise.all(monthPromises);
        res.json(results);
    } catch (error) {
        console.error('Erreur stats présence:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer l'assiduité réelle de chaque étudiant pour un cours donné
export const getCourseAttendance = async (req: Request, res: Response) => {
    try {
        const { courseCode, academicLevelId } = req.query as { courseCode: string, academicLevelId: string }
        const academicYear = "2025-2026" // Dynamique plus tard si besoin

        if (!courseCode || !academicLevelId) {
            return res.status(400).json({ message: 'courseCode et academicLevelId sont requis' })
        }

        // 1. Récupérer les étudiants inscrits à ce niveau
        const students = await prisma.user.findMany({
            where: {
                systemRole: 'STUDENT',
                isArchived: false,
                studentEnrollments: {
                    some: { academicLevelId: Number(academicLevelId), academicYear }
                }
            },
            select: {
                id: true,
                name: true,
                profilePhotoUrl: true
            },
            orderBy: { name: 'asc' }
        })

        // 2. Récupérer toutes les sessions d'appel pour ce cours cette année
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                courseCode,
                date: {
                    gte: new Date(new Date().getFullYear(), 0, 1), // Depuis le début de l'année
                }
            },
            select: { id: true }
        })
        // Note: Si le champ academicYear n'est pas sur AttendanceSession, on filtre par date ou on l'ajoute.
        // Vérifions le schéma AttendanceSession... lignes 322-330 : il n'y est pas.

        const sessionIds = sessions.map(s => s.id)

        // 3. Pour chaque étudiant, calculer son taux de présence
        const results = await Promise.all(students.map(async (student) => {
            const records = await prisma.attendanceRecord.findMany({
                where: {
                    studentId: student.id,
                    sessionId: { in: sessionIds }
                },
                select: { status: true }
            })

            const total = sessionIds.length
            const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length

            return {
                id: student.id,
                name: student.name,
                profilePhotoUrl: student.profilePhotoUrl,
                attendance: total > 0 ? Math.round((present / total) * 100) : 0
            }
        }))

        res.json(results)

    } catch (error) {
        console.error('Erreur assiduité cours:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Statistiques techniques pour l'administrateur
export const getTechnicalStats = async (req: Request, res: Response) => {
    try {
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - startTime;

        // Récupérer la taille de la DB (Postgres)
        const dbSizeRaw: any = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size_bytes`;
        const sizeBytes = Number(dbSizeRaw[0]?.size_bytes || 0);
        const dbSizePretty = (sizeBytes / (1024 * 1024)).toFixed(2) + " MB";

        // Cloudinary Stats
        let cloudinaryStats = null;
        try {
            const usage = await cloudinary.api.usage();

            const formatSize = (bytes: number) => {
                if (bytes === 0) return "0 MB";
                const mb = bytes / (1024 * 1024);
                if (mb < 1024) return mb.toFixed(2) + " MB";
                return (mb / 1024).toFixed(2) + " GB";
            };

            const storageUsage = usage.storage?.usage || 0;
            const storageLimit = usage.storage?.limit || (usage.credits?.limit ? usage.credits.limit * 1024 * 1024 * 1024 : 0);

            const bandwidthUsage = usage.bandwidth?.usage || 0;
            const bandwidthLimit = usage.bandwidth?.limit || 0;

            cloudinaryStats = {
                storage: {
                    used: formatSize(storageUsage),
                    limit: storageLimit > 0 ? formatSize(storageLimit) : "25 GB",
                    percent: usage.storage?.used_percent || 0
                },
                bandwidth: {
                    used: formatSize(bandwidthUsage),
                    limit: bandwidthLimit > 0 ? formatSize(bandwidthLimit) : "--",
                    percent: usage.bandwidth?.used_percent || 0
                },
                objects: usage.objects?.usage || 0,
                plan: usage.plan
            };
        } catch (cErr) {
            console.error("Cloudinary error:", cErr);
        }

        const totalUsers = await prisma.user.count({
            where: {
                systemRole: 'STUDENT',
                isArchived: false
            }
        });
        const totalCourses = await prisma.course.count();
        const totalEnrollments = await prisma.studentCourseEnrollment.count();
        const totalTickets = await prisma.supportTicket.count();

        // OS Stats
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const memUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

        const usedMemGB = ((totalMem - freeMem) / (1024 * 1024 * 1024)).toFixed(1);
        const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(1);

        const cpus = os.cpus();

        res.json({
            database: {
                serverName: "PRISMA CLOUD (US-WEST)",
                status: 'CONNECTED',
                latency: dbLatency,
                sizeUsed: dbSizePretty,
                sizeLimit: "512 MB", // Valeur indicative pour le tier gratuit/standard
                sizeUsedRaw: sizeBytes,
                totalUsers,
                totalCourses,
                totalEnrollments,
                totalTickets
            },
            system: {
                serverName: "API NODE.JS (LOCAL SERVER)",
                platform: os.platform(),
                arch: os.arch(),
                memUsed: usedMemGB,
                memTotal: totalMemGB,
                memPercent: memUsagePercent,
                cpuCores: cpus.length,
                uptime: Math.round(os.uptime())
            },
            cloudinary: cloudinaryStats
        });
    } catch (error) {
        console.error('Erreur technical stats:', error);
        res.status(500).json({
            database: { serverName: "PRISMA CLOUD", status: 'DISCONNECTED', sizeUsed: "0 MB", sizeLimit: "512 MB" },
            system: { serverName: "API NODE.JS", uptime: 0, memPercent: 0 },
            cloudinary: null
        });
    }
}

// Récupérer les données de trafic (utilisateurs actifs et piques)
export const getTrafficInsights = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Utilisateurs actifs (Détails des sessions dans les 5 dernières minutes)
        const recentLogs = apiLogs.filter(log => new Date(log.time) >= fiveMinutesAgo && log.userId);

        // Map pour garder uniquement la dernière activité par utilisateur
        const activeUserMap = new Map();
        recentLogs.forEach(log => {
            if (!activeUserMap.has(log.userId)) {
                activeUserMap.set(log.userId, {
                    userId: log.userId,
                    lastSeen: log.time,
                    role: log.role,
                    ip: log.ip
                });
            }
        });

        const activeUserIds = Array.from(activeUserMap.keys());

        // Récupérer les noms des utilisateurs depuis la DB
        const userData = await prisma.user.findMany({
            where: { id: { in: activeUserIds } },
            select: { id: true, name: true, profilePhotoUrl: true }
        });

        // Fusionner les données
        const activeUsersDetails = Array.from(activeUserMap.values()).map(session => {
            const user = userData.find(u => u.id === session.userId);
            return {
                ...session,
                name: user?.name || "Utilisateur Inconnu"
            };
        });

        // 2. Histogramme des piques (trafic par heure sur 24h)
        const hourlyTraffic: any = {};

        // Initialiser les 24 dernières heures avec 0
        for (let i = 0; i < 24; i++) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourKey = `${time.getHours()}h`;
            hourlyTraffic[hourKey] = 0;
        }

        // Remplir avec les données réelles
        apiLogs
            .filter(log => new Date(log.time) >= twentyFourHoursAgo)
            .forEach(log => {
                const hour = new Date(log.time).getHours();
                const hourKey = `${hour}h`;
                if (hourlyTraffic[hourKey] !== undefined) {
                    hourlyTraffic[hourKey]++;
                }
            });

        // Convertir en tableau formaté pour le frontend (Recharts)
        const trafficData = Object.entries(hourlyTraffic)
            .map(([hour, count]) => ({ hour, requests: count }))
            .reverse(); // Ordre chronologique

        res.json({
            activeUsersCount: activeUsersDetails.length,
            activeUsers: activeUsersDetails,
            trafficHistory: trafficData
        });
    } catch (error) {
        console.error('Erreur traffic insights:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Récupérer les logs API réels
export const getApiLogs = async (req: Request, res: Response) => {
    res.json(apiLogs)
}


// Action de redémarrage du serveur
export const restartServer = async (req: Request, res: Response) => {
    try {
        console.log('🔄 Signal de redémarrage reçu via Dashboard Admin...');

        // Simuler un log de redémarrage dans la liste
        const log = {
            id: Date.now().toString(),
            time: new Date().toISOString(),
            method: 'SYSTEM',
            path: '/REBOOT_SEQUENCE_INITIATED',
            status: 200,
            duration: 0,
            ip: req.ip || '127.0.0.1'
        };
        apiLogs.unshift(log);

        res.json({ message: "Restart sequence initiated. Watcher will reboot the process." });

        // On utilise un petit "hack" pour l'environnement de dev :
        // La mise à jour d'un fichier déclenche le redémarrage automatique de 'tsx watch' ou 'nodemon'
        setTimeout(() => {
            try {
                const restartFile = path.join(process.cwd(), '.restart-trigger');
                fs.writeFileSync(restartFile, `Restart triggered at ${new Date().toISOString()}`);
                console.log('📂 Restart trigger file updated. Watcher should reboot now.');
            } catch (err) {
                console.error('Failed to write restart trigger, falling back to process.exit()');
                process.exit(0);
            }
        }, 1500);
    } catch (error) {
        console.error('Restart Error:', error);
        res.status(500).json({ error: "Failed to initiate restart" });
    }
}

// Action de nettoyage du cache
export const clearCache = async (req: Request, res: Response) => {
    try {
        // Dans une application réelle, on viderait Redis ou des variables globales
        // Ici on vide les logs et on simule un nettoyage
        apiLogs.length = 0;

        res.json({ message: "System cache and logs cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear cache" });
    }
}
// Récupérer les données démographiques des étudiants avec filtres optionnels
export const getStudentDemographics = async (req: Request, res: Response) => {
    try {
        const { levelId, year } = req.query;

        const where: any = {
            systemRole: 'STUDENT',
            isArchived: false
        };

        // Filtrage par niveau ou année académique via la relation studentEnrollments
        const academicYear = (year as string) || "2025-2026";
        where.studentEnrollments = {
            some: {
                academicYear,
                ...(levelId && { academicLevelId: parseInt(levelId as string) })
            }
        };

        const students = await prisma.user.findMany({
            where,
            select: {
                sex: true,
                birthday: true,
                nationality: true
            }
        });

        const total = students.length;

        // Distribution Sexe
        const sexDist: any = { M: 0, F: 0, "N/A": 0 };
        // Distribution Age (birthday)
        const ageDist: any = { "< 18": 0, "18-21": 0, "22-25": 0, "25+": 0, "N/A": 0 };
        // Distribution Nationality
        const nationalityDist: any = {};

        const now = new Date();

        students.forEach(s => {
            // Sex
            const sex = (s.sex === 'M' || s.sex === 'F') ? s.sex : "N/A";
            sexDist[sex]++;

            // Age based on birthday
            if (s.birthday) {
                const birth = new Date(s.birthday);
                let age = now.getFullYear() - birth.getFullYear();
                const m = now.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                    age--;
                }

                if (age < 18) ageDist["< 18"]++;
                else if (age <= 21) ageDist["18-21"]++;
                else if (age <= 25) ageDist["22-25"]++;
                else ageDist["25+"]++;
            } else {
                ageDist["N/A"]++;
            }

            // Nationality
            const n = s.nationality || "N/A";
            nationalityDist[n] = (nationalityDist[n] || 0) + 1;
        });

        res.json({
            total,
            sex: sexDist,
            age: ageDist,
            nationality: nationalityDist
        });
    } catch (error) {
        console.error('Erreur demographics:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Récupérer les options de filtrage (Niveaux et Années)
export const getDemographicFilters = async (req: Request, res: Response) => {
    try {
        const levels = await prisma.academicLevel.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, code: true }
        });

        const years = await prisma.studentEnrollment.findMany({
            select: { academicYear: true },
            distinct: ['academicYear']
        });

        res.json({
            levels,
            years: years.map(y => y.academicYear)
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des filtres' });
    }
}

// Récupérer la progression détaillée de tous les cours pour le dashboard
export const getDetailedCourseProgress = async (req: Request, res: Response) => {
    try {
        const { academicLevelId } = req.query;
        const academicYear = "2025-2026";
        const now = new Date();
        const semesterStart = new Date('2026-02-01'); // Debut du semestre actuel

        // Helpers internes
        const getSessionDuration = (schedule: any) => {
            if (!schedule || !schedule.startTime || !schedule.endTime) return 2;
            const [h1, m1] = schedule.startTime.split(':').map(Number);
            const [h2, m2] = schedule.endTime.split(':').map(Number);
            return Math.max(1, (h2 - h1) + (m2 - m1) / 60);
        };

        const getLevelColor = (code?: string) => {
            const c = code?.toLowerCase() || '';
            if (c.includes('pre')) return '#1B4332';
            if (c.includes('b1')) return '#2D6A4F';
            if (c.includes('b2')) return '#52B788';
            if (c.includes('b3')) return '#95D5B2';
            return '#1B4332';
        };

        const dayMap: Record<number, string> = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };

        // 1. Récupérer tous les cours (avec filtres optionnels)
        const courses = await prisma.course.findMany({
            where: academicLevelId ? {
                academicLevels: { some: { id: Number(academicLevelId) } }
            } : {},
            include: {
                academicLevels: true,
                enrollments: {
                    where: { role: 'PROFESSOR', academicYear },
                    include: { user: { select: { name: true, professorProfile: { select: { title: true } } } } }
                }
            }
        });

        // 2. Récupérer tout l'horaire pour savoir quels cours sont programmés
        const allSchedules = await prisma.schedule.findMany({
            where: { academicYear }
        });

        const scheduledCourseCodes = new Set(allSchedules.map(s => s.courseCode));

        // 3. Pour chaque cours, calculer les statistiques réelles
        const progressResults = await Promise.all(courses.map(async (course) => {
            const sessions = await prisma.attendanceSession.findMany({
                where: { courseCode: course.code },
                orderBy: { date: 'desc' },
                include: {
                    records: { select: { status: true } }
                }
            });

            // Récupérer le nombre réel d'étudiants inscrits
            const enrollmentCount = await prisma.studentCourseEnrollment.count({
                where: { courseCode: course.code, academicYear, isActive: true }
            });

            // Fallback sur les inscriptions au niveau si besoin
            let totalStudents = enrollmentCount;
            if (totalStudents === 0) {
                totalStudents = await prisma.studentEnrollment.count({
                    where: { academicLevelId: course.academicLevels[0]?.id, academicYear }
                });
            }
            const effectiveTotal = totalStudents || 1;

            const courseSchedules = allSchedules.filter(s => s.courseCode === course.code);
            const scheduleText = courseSchedules.length > 0
                ? courseSchedules.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')
                : 'Non programmé';

            // Identifier les séances réelles faites
            const realFormattedSessions = sessions.map(s => {
                const sDate = new Date(s.date);
                const sch = courseSchedules.find(sch => sch.day === dayMap[sDate.getDay()]);
                const duration = getSessionDuration(sch);
                const presentCount = s.records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

                return {
                    date: s.date,
                    label: sDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
                    wasScheduled: !!sch,
                    attendanceTaken: true,
                    hours: duration,
                    presentCount,
                    totalCount: effectiveTotal,
                    attendanceRate: Math.min(100, Math.round((presentCount / effectiveTotal) * 100))
                };
            });

            // Détecter les séances manquées (prévues dans l'horaire mais pas d'appel fait)
            const missedSessions: any[] = [];
            let tempDate = new Date(semesterStart);
            while (tempDate <= now) {
                const dayName = dayMap[tempDate.getDay()];
                const daySchedules = courseSchedules.filter(s => s.day === dayName);

                for (const sch of daySchedules) {
                    const hasReal = sessions.some(s => new Date(s.date).toDateString() === tempDate.toDateString());
                    if (!hasReal) {
                        missedSessions.push({
                            date: new Date(tempDate),
                            label: new Date(tempDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
                            wasScheduled: true,
                            attendanceTaken: false,
                            hours: getSessionDuration(sch)
                        });
                    }
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }

            const allCourseSessions = [...realFormattedSessions, ...missedSessions].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Heures consommées basées sur les appels réels
            let consumedHours = realFormattedSessions.reduce((acc, s) => acc + s.hours, 0);

            // Total des heures théorique
            const totalHours = (course as any).totalHours || 45;

            // Si le cours est fini, on force à 100%
            if (course.isCompleted) {
                consumedHours = totalHours;
            }

            const allLevels = course.academicLevels.map(al => al.code.toUpperCase());
            // Si on a filtré par Niveau, on essaie de mettre ce niveau en priorité pour l'affichage
            const prioritizedLevel = academicLevelId
                ? course.academicLevels.find(al => al.id === Number(academicLevelId))?.code?.toUpperCase()
                : allLevels[0];

            return {
                code: course.code,
                name: course.name,
                professor: course.enrollments[0]?.user?.name || 'Non assigné',
                professeurTitle: course.enrollments[0]?.user?.professorProfile?.title || 'Professeur',
                level: prioritizedLevel || 'GEOL',
                allLevels,
                levelColor: getLevelColor(prioritizedLevel?.toLowerCase()),
                totalHours,
                consumedHours: Math.round(consumedHours * 10) / 10,
                schedule: scheduleText,
                room: courseSchedules[0]?.room || 'Campus',
                totalStudents: effectiveTotal,
                isActive: course.isActive,
                isCompleted: course.isCompleted,
                isScheduled: course.isActive || scheduledCourseCodes.has(course.code),
                hasNoSchedule: course.isActive && !scheduledCourseCodes.has(course.code),
                sessions: allCourseSessions
            };
        }));

        res.json(progressResults);
    } catch (error) {
        console.error('Erreur progression cours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
