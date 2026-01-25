
import { useState, useEffect } from "react";
import { Calendar, BookOpen, Clock, MapPin, User as UserIcon, Megaphone, CheckCircle, ChevronRight, X, QrCode, Loader2, SignalHigh, SignalLow, Send } from "lucide-react";
import { motion } from "motion/react";
import { StudentPage } from "./StudentSidebar";
import welcomeImage from '../../assets/slide1.png';
import { studentService } from "../../services/student";
import { attendanceService } from "../../services/attendance";
import { DashboardSkeleton } from "../Skeleton";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";

interface StudentDashboardProps {
  onNavigate: (page: StudentPage) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any>(null);

  // Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Synchroniser les scans en attente
      syncOfflineScans();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineScans = async () => {
    const offlineScans = JSON.parse(localStorage.getItem('offline_attendance_scans') || '[]');
    if (offlineScans.length === 0) return;

    toast.info(`Synchronisation de ${offlineScans.length} présence(s) hors-ligne...`);

    const remainingScans = [];
    for (const scan of offlineScans) {
      try {
        await attendanceService.scanQR(scan.token, scan.lat, scan.lon);
      } catch (_error) {
        remainingScans.push(scan);
      }
    }

    sessionStorage.setItem('offline_attendance_scans', JSON.stringify(remainingScans));
    if (remainingScans.length === 0) {
      toast.success("Toutes les présences ont été synchronisées !");
    } else {
      toast.error(`${remainingScans.length} présence(s) n'ont pas pu être synchronisées.`);
    }
  };

  const geologyMessages = [
    "Ce semestre, vous explorerez la géologie, une science aux applications vastes : mines, génie civil, environnement et hydrogéologie.",
    "La minéralogie que vous étudiez est essentielle pour l'industrie minière du Katanga et la valorisation de nos ressources.",
    "Le cours de Géologie Structurale est fondamental pour comprendre la déformation des roches et localiser les gisements.",
    "L'hydrogéologie vous permettra de maîtriser la gestion des ressources en eau, un enjeu majeur pour le développement durable."
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await studentService.getDashboard();
        console.log('Dashboard data loaded:', dashboardData);
        setData(dashboardData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        // Keep loading state to show skeleton instead of crashing
        setLoading(false);
        setData({
          stats: { attendance: 0, courseCount: 0 },
          todaySchedule: [],
          announcements: []
        });
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % geologyMessages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);

      scanner.render(onScanSuccess, onScanFailure);
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showScanner]);

  const onScanSuccess = async (decodedText: string) => {
    setScanning(true);
    // Demander la position immédiatement lors du scan réussi
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          if (isOffline) {
            // Sauvegarde locale pour synchronisation ultérieure (Simulation)
            const offlineScans = JSON.parse(localStorage.getItem('offline_attendance_scans') || '[]');
            offlineScans.push({ token: decodedText, lat: latitude, lon: longitude, time: new Date() });
            sessionStorage.setItem('offline_attendance_scans', JSON.stringify(offlineScans));
            toast.warning("Mode Hors-Ligne : Présence sauvegardée localement. Elle sera transmise dès le retour de la connexion.");
            setShowScanner(false);
          } else {
            const result = await attendanceService.scanQR(decodedText, latitude, longitude);
            toast.success(result.message);
            setShowScanner(false);
          }
        } catch (error: any) {
          toast.error(error.message || "Erreur lors de la validation");
        } finally {
          setScanning(false);
        }
      },
      (_error) => {
        toast.error("Géolocalisation requise pour valider la présence.");
        setScanning(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const onScanFailure = (_error: any) => {
    // console.warn(`Code scan error = ${_error}`);
  };

  const upcomingCourses = data?.todaySchedule || [];
  const announcements = data?.announcements || [];

  const stats = [
    { label: 'Assiduité', value: data?.stats?.attendance || '-', sub: '%', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Matières en cours', value: data?.stats?.courseCount || '-', sub: 'Cours', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Devoirs à rendre', value: data?.stats?.pendingAssignmentsCount || '0', sub: 'À faire', icon: Send, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getTimeRemaining = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    if (diff <= 0) return "Terminé";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}min`;
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-[1600px] mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={item}
        className="relative h-64 rounded-[40px] overflow-hidden shadow-2xl group"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${welcomeImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent flex flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-white text-5xl font-black mb-4 tracking-tight">
              Bonjour, <span className="text-blue-400">{JSON.parse(sessionStorage.getItem('user') || '{}').name?.split(' ')[0] || 'Étudiant'}</span> 👋
            </h1>
            <div className="h-20">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-gray-200 text-xl font-medium max-w-2xl leading-relaxed"
              >
                {geologyMessages[messageIndex]}
              </motion.p>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-10 right-10 flex gap-4">
          <button
            onClick={() => onNavigate('grades')}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-600/30"
          >
            Voir mes résultats <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={item}
            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="w-2 h-2 rounded-full bg-gray-100" />
            </div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">{stat.value}</span>
                <span className="text-sm font-bold text-gray-400">{stat.sub}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Today's Timeline */}
        <motion.div
          variants={item}
          className="xl:col-span-2 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Planning du jour</h3>
              <p className="text-gray-400 text-sm font-bold">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button
              onClick={() => onNavigate('planning')}
              className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 px-5 py-3 rounded-2xl transition-all"
            >
              Voir le planning complet <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-50">
            {upcomingCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-xl font-bold text-gray-400 italic">Aucun cours aujourd'hui</p>
                <p className="text-sm text-gray-400 mt-2">Profitez de cette journée pour réviser vos cours</p>
              </div>
            ) : upcomingCourses.map((course: any, idx: number) => (
              <div key={idx} className="relative pl-12 group">
                <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10 group-hover:border-blue-500 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course.colorHex }} />
                </div>
                <div
                  onClick={() => setSelectedCourseDetail(course)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white transition-all cursor-pointer group/card"
                >
                  <div className="mb-4 md:mb-0 flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-wider shrink-0">{course.type}</span>
                      <span className="text-sm font-bold text-gray-400 flex items-center gap-1.5 text-end italic shrink-0">
                        <Clock className="w-3.5 h-3.5" /> {course.time}
                      </span>
                    </div>
                    <h4 className={`font-black text-gray-900 mb-1 group-hover/card:text-blue-600 transition-colors uppercase tracking-tight truncate ${course.title.length > 40 ? 'text-base' :
                      course.title.length > 25 ? 'text-lg' : 'text-xl'
                      }`}>{course.title}</h4>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500 font-bold uppercase tracking-widest overflow-hidden">
                      <span className="flex items-center gap-1.5 shrink-0"><MapPin className="w-4 h-4 text-gray-300" /> {course.room}</span>
                      <span className="flex items-center gap-1.5 truncate"><UserIcon className="w-4 h-4 text-gray-300" /> {course.professor}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCourseDetail(course); }}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all active:scale-95 shadow-sm"
                  >
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Active Assignments & Announcements */}
        <div className="space-y-8">
          {/* Active Assignments Block */}
          {data?.pendingAssignments?.length > 0 && (
            <motion.div
              variants={item}
              className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-orange-100/50 transition-colors"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <Send className="w-6 h-6 text-orange-600" />
                    Devoirs en cours
                  </h3>
                  <button
                    onClick={() => onNavigate('courses')}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {data.pendingAssignments.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      onClick={() => onNavigate('courses')}
                      className="p-5 rounded-[28px] bg-gray-50 border border-transparent hover:border-orange-200 hover:bg-white transition-all cursor-pointer group/card"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase tracking-wider">{assignment.type}</span>
                        <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {getTimeRemaining(assignment.dueDate)}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover/card:text-orange-600 transition-colors line-clamp-1 capitalize">{assignment.title}</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{assignment.courseName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={item}
            className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Megaphone className="w-6 h-6 text-teal-400" />
                Dernières Annonces
              </h3>
              <button
                onClick={() => onNavigate('announcements')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {announcements.length === 0 ? <p className="text-gray-400 text-sm">Aucune annonce récente</p> : announcements.map((ann: any, i: number) => (
                <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-gradient-to-r ${ann.color} text-white`}>
                      {ann.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(ann.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1 group-hover:text-blue-400 transition-colors">{ann.title}</h4>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.1em] mb-2">Par {ann.author}</p>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: 'Ressources', icon: BookOpen, color: 'bg-blue-50 text-blue-600', page: 'courses' },
              { label: 'Planning', icon: Calendar, color: 'bg-purple-50 text-purple-600', page: 'planning' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => onNavigate(action.page as StudentPage)}
                className="p-6 bg-white border border-gray-100 rounded-[32px] hover:shadow-xl transition-all group text-left"
              >
                <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-900">{action.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Recent Attendance - New Section connected to API */}
          {data?.recentAttendance?.length > 0 && (
            <motion.div
              variants={item}
              className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                Dernières Présences
              </h3>
              <div className="space-y-4">
                {data.recentAttendance.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${record.status === 'PRESENT' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase truncate max-w-[150px]">{record.courseName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{record.date ? new Date(record.date).toLocaleDateString() : 'Aujourd\'hui'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 bg-white px-3 py-1 rounded-lg border border-gray-100 italic">
                      {record.status === 'LATE' ? 'En retard' : 'Présent'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden relative"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Scanner de Présence</h3>
                  <div className="flex items-center gap-2">
                    {isOffline ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        <SignalLow className="w-3 h-3" /> Hors-ligne
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <SignalHigh className="w-3 h-3" /> Connecté
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="p-3 bg-gray-200 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div id="reader" className="overflow-hidden rounded-3xl border-4 border-gray-100 bg-black aspect-square"></div>

              <div className="mt-8 space-y-4">
                <div className="p-6 bg-teal-50 border border-teal-100 rounded-[32px] flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-teal-800 font-bold leading-relaxed">
                    Votre position sera vérifiée par rapport à celle du professeur (Limite : 200m).
                  </p>
                </div>

                {scanning && (
                  <div className="flex items-center justify-center gap-3 py-4 text-teal-600 font-bold animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validation de la présence en cours...
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex flex-col gap-3">
              <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-black">
                Pointez votre caméra vers le QR Code affiché par le professeur
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Dynamic Color */}
            <div className="h-32 relative flex items-end p-8" style={{ background: selectedCourseDetail.colorHex || '#3b82f6' }}>
              <div
                className="absolute inset-0 opacity-40"
                style={{ background: `linear-gradient(to bottom right, rgba(0,0,0,0.1), rgba(0,0,0,0.3))` }}
              />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 -mr-16 -mt-16 rounded-full blur-2xl" />
              <div className="relative z-10 w-full">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Détails de la séance</span>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white line-clamp-1">{selectedCourseDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <div className="flex items-center gap-3 text-blue-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Horaire</span>
                  </div>
                  <div className="text-lg font-black text-gray-900">{selectedCourseDetail.time}</div>
                </div>

                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <div className="flex items-center gap-3 text-purple-600 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Salle / Local</span>
                  </div>
                  <div className="text-lg font-black text-gray-900">{selectedCourseDetail.room}</div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Professeur Responsable</div>
                    <div className="text-gray-900 font-black truncate">{selectedCourseDetail.professor}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-[24px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
