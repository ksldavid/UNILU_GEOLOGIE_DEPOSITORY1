
import { QrCode, Save, Search, ArrowLeft, X, Loader2, RefreshCw, History, Calendar, Users, ChevronRight, FileText, AlertCircle, Download, Clock, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { attendanceService } from "../../services/attendance";
import { QRCodeCanvas } from "qrcode.react";

interface AttendanceManagementProps {
  course: Course;
  onBack: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saveTrigger?: number;
}

export function AttendanceManagement({ course, onBack, onDirtyChange, saveTrigger }: AttendanceManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<{ [key: string]: 'present' | 'absent' | 'late' }>({});
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'late'>('all');

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [maxSessionToday, setMaxSessionToday] = useState(1);
  const [qrExpiresIn, setQrExpiresIn] = useState(1440); // Minutes
  const [qrExpirationActual, setQrExpirationActual] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const nowStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const isPastDate = selectedDate < nowStr;

  // Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<any | null>(null);
  const [deletionPassword, setDeletionPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Prevention de perte de données (Refresh/Fermeture onglet)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Standard browser message
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // IMPORTANT: Pass course code, session number AND selected date
        const courseStudents = await professorService.getStudents(course.code, sessionNumber, selectedDate);
        setStudents(courseStudents);

        const initialStatus: { [key: string]: 'present' | 'absent' | 'late' } = {};
        courseStudents.forEach((student: any) => {
          if (student.todayStatus) {
            initialStatus[student.id] = student.todayStatus as 'present' | 'absent' | 'late';
          }
        });
        setSelectedStatus(initialStatus);

      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [course, sessionNumber, selectedDate]);

  // Détecter les sessions existantes aujourd'hui pour mettre à jour maxSessionToday
  useEffect(() => {
    const checkTodaySessions = async () => {
      try {
        const data = await professorService.getAttendanceHistory(course.code);
        const todayStr = selectedDate;

        const todaySessions = data.filter((s: any) => s.date.startsWith(todayStr));
        if (todaySessions.length > 0) {
          const max = Math.max(...todaySessions.map((s: any) => s.sessionNumber || 1));
          setMaxSessionToday(max);
        }
      } catch (e) {
        console.error("Error checking sessions:", e);
      }
    };
    if (course?.code) checkTodaySessions();
  }, [course, selectedDate]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Automatic sync before fetching history to ensure counts are correct
      await professorService.syncPastAttendance();
      const data = await professorService.getAttendanceHistory(course.code);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Timer pour l'expiration du QR Code
  useEffect(() => {
    if (!qrExpirationActual) return;

    const timer = setInterval(() => {
      const now = new Date();
      const expiration = new Date(qrExpirationActual);
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("EXPIRÉ");
        setQrToken(null);
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [qrExpirationActual]);

  const handleSyncPastRecords = async () => {
    setIsRefreshing(true);
    try {
      const result = await professorService.syncPastAttendance();
      alert(`${result.recordsCreated} absences ont été synchronisées pour vos sessions passées.`);
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Erreur lors de la synchronisation.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, course.code]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const courseStudents = await professorService.getStudents(course.code, sessionNumber);
      setStudents(courseStudents);

      // Sync the attendance status with what's on the server (scanned via QR)
      const updatedStatus: { [key: string]: 'present' | 'absent' | 'late' } = { ...selectedStatus };
      courseStudents.forEach((student: any) => {
        if (student.todayStatus) {
          updatedStatus[student.id] = student.todayStatus as 'present' | 'absent' | 'late';
        }
      });
      setSelectedStatus(updatedStatus);

    } catch (error) {
      console.error("Error refreshing students:", error);
      alert("Erreur lors du rafraîchissement des données");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setSelectedStatus(prev => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Check status filter
    let matchesStatus = true;
    const currentStatus = selectedStatus[s.id];

    if (filterStatus === 'present') matchesStatus = currentStatus === 'present';
    else if (filterStatus === 'absent') matchesStatus = currentStatus === 'absent';
    else if (filterStatus === 'late') matchesStatus = currentStatus === 'late';

    return matchesSearch && matchesStatus;
  });

  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    setLocationError(null);
    setQrToken(""); // Reset pour montrer l'état de chargement
    setShowQRModal(true);

    try {
      // On envoie le délai d'expiration choisi
      const result = await attendanceService.generateQR(course.code, sessionNumber, qrExpiresIn);
      setQrToken(result.qrToken);
      if (result.expiresAt) {
        setQrExpirationActual(new Date(result.expiresAt));
      }
      if (sessionNumber > maxSessionToday) setMaxSessionToday(sessionNumber);
      setGeneratingQR(false);
    } catch (error: any) {
      setLocationError(error.message || "Erreur de connexion au serveur.");
      setGeneratingQR(false);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `QR_Presence_${course.name}_${new Date().toLocaleDateString()}.png`;
      link.href = url;
      link.click();
    }
  };
  const handleSave = async (silent = false) => {
    try {
      const records = Object.entries(selectedStatus).map(([studentId, status]) => ({
        studentId,
        status
      }));

      if (records.length === 0) {
        if (!silent) alert("Veuillez marquer la présence pour au moins un étudiant.");
        return false;
      }

      await professorService.saveAttendance({
        courseCode: course.code,
        date: selectedDate,
        sessionNumber: sessionNumber,
        records: records
      });

      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      if (!silent) alert("Présences enregistrées avec succès !");
      return true;
    } catch (error) {
      console.error(error);
      if (!silent) alert("Erreur lors de l'enregistrement.");
      return false;
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete || !deletionPassword) return;

    setIsDeleting(true);
    try {
      await attendanceService.deleteSession(sessionToDelete.id, deletionPassword);

      // Mettre à jour l'historique local
      setHistory(prev => prev.filter(s => s.id !== sessionToDelete.id));

      setShowPasswordModal(false);
      setSessionToDelete(null);
      setDeletionPassword("");
      alert("Session supprimée avec succès.");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (saveTrigger && saveTrigger > 0 && isDirty) {
      handleSave(true).then(success => {
        if (success) {
          // Internal navigation logic is handled by App.tsx since isDirty becomes false
        }
      });
    }
  }, [saveTrigger]);



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Chargement de la liste des étudiants...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à {course.name}
        </button>

        <h1 className="text-4xl font-semibold text-gray-900 mb-3">
          Prise de Présence
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Gérez les présences pour le cours de{' '}
          <span className="font-semibold text-teal-600">{course.name}</span>{' '}
          <span className="text-gray-500">({course.code})</span>.
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'current'
              ? 'bg-white text-teal-600 shadow-md transform scale-105'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <QrCode className="w-5 h-5" />
            Session en cours
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'history'
              ? 'bg-white text-teal-600 shadow-md transform scale-105'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <History className="w-5 h-5" />
            Historique complet
          </button>
        </div>
      </div>

      {course.status === 'FINISHED' && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-[32px] p-8 flex items-center gap-6 animate-in slide-in-from-top duration-500">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">Accès Restreint</h3>
            <p className="text-amber-800 font-bold opacity-80 leading-relaxed italic">
              Ce cours ne dispose plus de prise de présence vue que il a ete terminer. Vous pouvez toujours consulter l'historique complet ci-dessous.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'current' ? (
        <>
          {/* Date and QR Code Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date de la séance :
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm font-bold text-teal-900"
                    />
                    {isPastDate && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-black uppercase tracking-widest animate-pulse">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verrouillé
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-l border-gray-200 pl-6 space-y-2">
                  <div className="flex items-center gap-3">
                    {[...Array(maxSessionToday)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSessionNumber(i + 1)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${sessionNumber === i + 1
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                      >
                        Session {i + 1}
                      </button>
                    ))}
                    {!isPastDate && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Une session existe déjà pour aujourd'hui. Voulez-vous créer une nouvelle session de présence (Session ${maxSessionToday + 1}) ?`)) {
                            setSessionNumber(maxSessionToday + 1);
                            setMaxSessionToday(maxSessionToday + 1);
                          }
                        }}
                        className="px-4 py-2 bg-white border border-teal-200 text-teal-600 rounded-xl font-bold hover:bg-teal-50 transition-all flex items-center gap-2"
                      >
                        <X className="w-4 h-4 rotate-45" /> Ajouter
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {sessionNumber === 1 ? "Session principale (Matin)" : `Session Additionnelle n°${sessionNumber}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQR || course.status === 'FINISHED' || isPastDate}
                  className="flex items-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-2xl transition-all shadow-xl shadow-teal-600/30 font-bold text-lg w-full md:w-auto group active:scale-95"
                >
                  {generatingQR ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                  {generatingQR ? "Localisation..." : "Générer le QR code de présence"}
                </button>

                {!qrToken && (
                  <div className="flex flex-col items-end gap-2 mt-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3 text-teal-600" /> Validité du QR Code :
                    </label>
                    <div className="flex gap-2">
                      {[5, 10, 20, 30, 1440].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setQrExpiresIn(mins)}
                          disabled={generatingQR}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${qrExpiresIn === mins
                            ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-teal-200'
                            }`}
                        >
                          {mins === 1440 ? '24h' : `${mins} min`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {qrToken && timeLeft && (
                  <div className={`mt-4 px-6 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-right duration-500 border ${timeLeft === 'EXPIRÉ' ? 'bg-red-50 border-red-100' : 'bg-teal-50 border-teal-100 shadow-lg shadow-teal-600/10'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${timeLeft === 'EXPIRÉ' ? 'bg-red-100 text-red-600' : 'bg-white text-teal-600'}`}>
                      <Clock className={`w-5 h-5 ${timeLeft !== 'EXPIRÉ' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-teal-800/50 uppercase tracking-[0.2em] leading-none mb-1">Expiration</span>
                      <span className={`text-xl font-black tabular-nums tracking-tighter ${timeLeft === 'EXPIRÉ' ? 'text-red-600' : 'text-teal-700'}`}>
                        {timeLeft}
                      </span>
                    </div>
                    {timeLeft !== 'EXPIRÉ' && (
                      <div className="ml-4 border-l border-teal-200 pl-4">
                        <button
                          onClick={handleGenerateQR}
                          className="text-[10px] font-black text-teal-600 uppercase hover:text-teal-700"
                        >
                          Renouveler
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {generatingQR && (
                  <div className="flex items-center gap-3 mt-4 bg-teal-50/50 border border-teal-100/50 px-4 py-3 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 bg-teal-400/20 blur-sm rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-teal-800 uppercase tracking-[0.15em]">
                        Sécurisation de la position...
                      </p>
                      <p className="text-[9px] text-teal-600/70 font-bold uppercase tracking-widest">
                        Génération du jeton dynamique
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-gray-400 text-xs italic">
                  Le QR Code capturera votre position pour sécuriser la zone de présence (200m).
                </p>
                {locationError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">
                        Erreur de Localisation
                      </p>
                      <p className="text-xs text-red-600 font-medium leading-relaxed">
                        {locationError}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Modal (Overlay) */}
          {showQRModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative border border-gray-100 flex flex-col">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-6 text-center">
                  <div className="mb-4 flex flex-col items-center">
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-2">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">QR Code de Présence</h2>
                    <p className="text-gray-500 text-sm font-medium">{course.name}</p>
                  </div>

                  <div className="bg-white p-4 border-2 border-dashed border-teal-200 rounded-2xl mb-4 shadow-sm inline-block min-w-[232px] min-h-[232px] flex items-center justify-center relative overflow-hidden">
                    {qrToken ? (
                      <div className="animate-in fade-in zoom-in duration-500 relative">
                        <QRCodeCanvas
                          value={`${window.location.protocol}//${window.location.host}/scan?t=${qrToken}`}
                          size={200}
                          level="H"
                          includeMargin={true}
                          className="rounded-lg"
                        />
                        {timeLeft === 'EXPIRÉ' && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex items-center justify-center p-4">
                            <div className="text-center">
                              <X className="w-12 h-12 text-red-500 mx-auto mb-2" />
                              <p className="text-sm font-black text-red-600 uppercase">Code Expiré</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center p-6">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                          <div className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                            {generatingQR ? "Sécurisation..." : "Échec"}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            {locationError ? "Localisation requise" : "Vérification de la zone..."}
                          </p>
                        </div>
                        {locationError && (
                          <button
                            onClick={handleGenerateQR}
                            className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                          >
                            Réessayer
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {locationError ? (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-left">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-rose-600 font-medium leading-tight">
                          {locationError}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center justify-between gap-2 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${timeLeft === 'EXPIRÉ' ? 'text-red-500' : 'text-teal-600 animate-pulse'}`} />
                          <p className={`text-[11px] font-bold ${timeLeft === 'EXPIRÉ' ? 'text-red-600' : 'text-teal-800'}`}>
                            {timeLeft === 'EXPIRÉ' ? 'QR Code expiré' : `Expire dans : ${timeLeft || '...'}`}
                          </p>
                        </div>
                        {timeLeft !== 'EXPIRÉ' && qrToken && (
                          <span className="text-[9px] bg-white px-2 py-0.5 rounded-full text-teal-600 font-black border border-teal-100">
                            SÉCURISÉ
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {qrToken
                        ? (timeLeft === 'EXPIRÉ' ? "Générez un nouveau code" : `Vérification locale active (400m)`)
                        : "Veuillez patienter..."
                      }
                    </p>

                    {!qrToken && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Délai souhaité :</p>
                        <div className="flex justify-center gap-2">
                          {[5, 10, 20, 30].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => setQrExpiresIn(mins)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${qrExpiresIn === mins
                                ? 'bg-teal-50 border-teal-200 text-teal-700'
                                : 'bg-white border-gray-200 text-gray-400 hover:border-teal-200'
                                }`}
                            >
                              {mins} min
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col gap-3">
                  {qrToken && (
                    <button
                      onClick={handleDownloadQR}
                      className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-3 italic"
                    >
                      <Download className="w-5 h-5" />
                      TÉLÉCHARGER LE QR CODE
                    </button>
                  )}
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl font-bold text-base transition-all active:scale-95"
                  >
                    Fermer l'affichage
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPastDate && (
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top duration-300">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-slate-600 font-bold italic text-sm">
                Mode lecture seule : Cette séance est passée. Les modifications ne sont plus autorisées pour garantir l'intégrité des rapports.
              </p>
            </div>
          )}

          {/* Summary Card and Actions */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-900">Résumé de la séance</h3>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rafraîchir pour voir les nouvelles présences"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualisation...' : 'Rafraîchir'}
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={course.status === 'FINISHED' || isPastDate}
                  className="flex items-center gap-3 px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-lg transition-colors font-semibold shadow-md translate-y-0 active:translate-y-0.5"
                >
                  <Save className="w-4 h-4" />
                  {isPastDate ? 'Verrouillé' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {students.length}
                </div>
                <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Total inscrits</div>
              </div>

              <button
                onClick={() => setFilterStatus('present')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'present' ? 'border-emerald-500 ring-2 ring-emerald-500 ring-opacity-50 shadow-md' : 'border-emerald-100 shadow-sm hover:border-emerald-400'}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-600">
                    {Object.values(selectedStatus).filter(s => s === 'present').length}
                  </span>
                  <span className="text-emerald-300 font-bold">/ {students.length}</span>
                </div>
                <div className="text-gray-600 font-bold uppercase tracking-wider text-[10px]">Présents</div>
              </button>

              <button
                onClick={() => setFilterStatus('late')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'late' ? 'border-amber-500 ring-2 ring-amber-500 ring-opacity-50 shadow-md' : 'border-amber-100 shadow-sm hover:border-amber-400'}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-amber-600">
                    {Object.values(selectedStatus).filter(s => s === 'late').length}
                  </span>
                  <span className="text-amber-300 font-bold">/ {students.length}</span>
                </div>
                <div className="text-gray-600 font-bold uppercase tracking-wider text-[10px]">En retard</div>
              </button>

              <button
                onClick={() => setFilterStatus('absent')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'absent' ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50 shadow-md' : 'border-red-100 shadow-sm hover:border-red-400'}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-red-600">
                    {students.length - Object.values(selectedStatus).filter(s => s === 'present' || s === 'late').length}
                  </span>
                  <span className="text-red-300 font-bold">/ {students.length}</span>
                </div>
                <div className="text-gray-600 font-bold uppercase tracking-wider text-[10px]">Absents</div>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>


          {/* Students Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-24">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    N° Matricule
                  </th>
                  <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Nom de l'étudiant
                  </th>
                  <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Promotion
                  </th>
                  <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-6 text-center text-gray-500">
                      Aucun étudiant trouvé pour ce cours.
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6 text-gray-900 font-medium">
                      {student.id}
                    </td>
                    <td className="px-8 py-6 text-gray-900 font-medium">
                      {student.name}
                    </td>
                    <td className="px-8 py-6 text-gray-500">
                      {student.academicLevel || '-'}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => !isPastDate && handleStatusChange(student.id, 'present')}
                          disabled={isPastDate}
                          className={`px-5 py-2 rounded-lg font-medium transition-all ${selectedStatus[student.id] === 'present'
                            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                            } ${isPastDate ? 'cursor-default' : 'active:scale-95'}`}
                        >
                          Présent
                        </button>
                        <button
                          onClick={() => !isPastDate && handleStatusChange(student.id, 'absent')}
                          disabled={isPastDate}
                          className={`px-5 py-2 rounded-lg font-medium transition-all ${selectedStatus[student.id] === 'absent'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                            } ${isPastDate ? 'cursor-default' : 'active:scale-95'}`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => !isPastDate && handleStatusChange(student.id, 'late')}
                          disabled={isPastDate}
                          className={`px-5 py-2 rounded-lg font-medium transition-all ${selectedStatus[student.id] === 'late'
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                            } ${isPastDate ? 'cursor-default' : 'active:scale-95'}`}
                        >
                          En Retard
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 italic">Historique des Sessions</h3>
            <button
              onClick={handleSyncPastRecords}
              disabled={isRefreshing || loadingHistory}
              className="flex items-center gap-2 px-4 py-2 bg-white text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Synchronisation...' : 'Synchroniser les absences'}
            </button>
          </div>
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Chargement de l'historique...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-10">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune session enregistrée</h3>
              <p className="text-gray-500 max-w-sm">Vous n'avez pas encore de sessions de présence pour ce cours dans l'historique.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.map((session) => (
                <div key={session.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                        <Calendar className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {new Date(session.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                          {(session.sessionNumber && session.sessionNumber > 0) && (
                            <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md border border-teal-100 uppercase tracking-tighter">
                              Session {session.sessionNumber}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <Users className="w-4 h-4" />
                            {session.present} Présents
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500 font-medium">
                            Taux: {Math.round((session.present / (session.totalStudents || 1)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSessionToDelete(session);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Supprimer la session"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedHistorySession(session)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-teal-600 text-gray-600 hover:text-white rounded-xl font-bold transition-all active:scale-95 group-hover:translate-x-1"
                      >
                        Voir détails
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Détails Historique */}
      {selectedHistorySession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full h-[85vh] overflow-hidden relative border border-gray-100 flex flex-col">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Détails du {new Date(selectedHistorySession.date).toLocaleDateString('fr-FR')}
                    {selectedHistorySession.sessionNumber && ` - Session ${selectedHistorySession.sessionNumber}`}
                  </h2>
                  <p className="text-gray-500 font-medium">{course.name} ({course.code})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistorySession(null)}
                className="p-2.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 p-8 bg-white text-center">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">Présents</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-emerald-700">{selectedHistorySession.present}</span>
                  <span className="text-emerald-300 font-bold">/ {selectedHistorySession.totalStudents}</span>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl">
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-2">En retard</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-orange-700">{selectedHistorySession.late}</span>
                  <span className="text-orange-300 font-bold">/ {selectedHistorySession.totalStudents}</span>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2">Absents</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-red-700">{selectedHistorySession.absent}</span>
                  <span className="text-red-300 font-bold">/ {selectedHistorySession.totalStudents}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              <table className="w-full border-separate border-spacing-y-2">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <th className="px-6 py-4">Étudiant</th>
                    <th className="px-6 py-4">Matricule</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                    <th className="px-6 py-4 text-right">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedHistorySession.records || [])
                    .sort((a: any, b: any) => (a.studentName || "").localeCompare(b.studentName || ""))
                    .map((record: any) => (
                      <tr key={record.studentId} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                        <td className="px-6 py-4 rounded-l-2xl">
                          <span className="font-bold text-gray-900">{record.studentName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-gray-500 text-sm">{record.studentId}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'LATE' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right rounded-r-2xl">
                          <span className="text-gray-400 font-medium">
                            {new Date(record.markedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setSelectedHistorySession(null)}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-[0.98]"
              >
                Fermer les détails
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression - Etape 1 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-4 italic">Attention !</h3>
            <p className="text-gray-600 text-center mb-8 leading-relaxed font-medium">
              Êtes-vous sûr de vouloir supprimer cette session ? <br />
              Toutes les données récoltées ainsi que les présences du <span className="text-red-600 font-bold">{sessionToDelete && new Date(sessionToDelete.date).toLocaleDateString('fr-FR')}</span> pour le cours <span className="text-red-600 font-bold">{course.name}</span> seront définitivement supprimées.
              <br /><span className="text-xs text-gray-400 mt-2 block italic">Cette action est irréversible.</span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setShowPasswordModal(true);
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-600/20 active:scale-95 transition-all"
              >
                Continuer vers la confirmation
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSessionToDelete(null);
                }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl font-bold transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mot de passe - Etape 2 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2 italic">Dernière étape</h3>
            <p className="text-gray-500 text-center mb-8 font-medium">Veuillez entrer votre mot de passe pour confirmer la suppression définitive.</p>

            <div className="mb-6">
              <input
                type="password"
                value={deletionPassword}
                onChange={(e) => setDeletionPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-center text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deletionPassword && !isDeleting) handleDeleteSession();
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteSession}
                disabled={isDeleting || !deletionPassword}
                className="w-full py-4 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                {isDeleting ? "Suppression en cours..." : "Confirmer la suppression"}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setDeletionPassword("");
                  setSessionToDelete(null);
                }}
                className="w-full py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

