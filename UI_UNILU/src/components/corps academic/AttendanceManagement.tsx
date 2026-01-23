
import { QrCode, Save, Search, ArrowLeft, X, MapPin, Loader2, RefreshCw, History, Calendar, Users, ChevronRight, FileText, Download } from "lucide-react";
import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { attendanceService } from "../../services/attendance";
import { QRCodeSVG } from "qrcode.react";

interface AttendanceManagementProps {
  course: Course;
  onBack: () => void;
}

export function AttendanceManagement({ course, onBack }: AttendanceManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<{ [key: string]: 'present' | 'absent' | 'late' }>({});
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'late'>('all');

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const allStudents = await professorService.getStudents();
        // Filter students for the current course
        const courseStudents = allStudents.filter((s: any) => s.courseCode === course.code || s.courseName === course.name);
        setStudents(courseStudents);

        // Initialize status with today's attendance from QR scans
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
  }, [course]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await professorService.getAttendanceHistory(course.code);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
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
      const allStudents = await professorService.getStudents();
      const courseStudents = allStudents.filter((s: any) => s.courseCode === course.code || s.courseName === course.name);
      setStudents(courseStudents);
    } catch (error) {
      console.error("Error refreshing students:", error);
      alert("Erreur lors du rafraîchissement des données");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setSelectedStatus(prev => ({ ...prev, [studentId]: status }));
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

    // 1. Demander la géolocalisation
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
      setGeneratingQR(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationError(null); // Nettoyer l'erreur si on réussit enfin
          const { latitude, longitude } = position.coords;
          const result = await attendanceService.generateQR(course.code, latitude, longitude);
          setQrToken(result.qrToken);
          setShowQRModal(true);
        } catch (error: any) {
          alert(error.message || "Erreur lors de la génération du QR Code");
        } finally {
          setGeneratingQR(false);
        }
      },
      (error) => {
        let msg = "Erreur de géolocalisation : ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Accès refusé. Veuillez autoriser la localisation dans les paramètres de votre navigateur et de Windows.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Position indisponible. Vérifiez que votre GPS ou Wifi est activé.";
            break;
          case error.TIMEOUT:
            msg = "Délai d'attente dépassé. Réessayez dans un endroit avec une meilleure réception.";
            break;
          default:
            msg = "Impossible de récupérer votre position. Vérifiez les paramètres de confidentialité de Windows.";
            break;
        }
        setLocationError(msg);
        setGeneratingQR(false);
      },
      { enableHighAccuracy: true, timeout: 15000 } // Augmenté le timeout à 15s pour plus de stabilité
    );
  };

  const handleSave = async () => {
    try {
      // Get the date from the input (simple way for now, or using state)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

      const records = Object.entries(selectedStatus).map(([studentId, status]) => ({
        studentId,
        status
      }));

      if (records.length === 0) {
        alert("Veuillez marquer la présence pour au moins un étudiant.");
        return;
      }

      await professorService.saveAttendance({
        courseCode: course.code,
        date: date,
        records: records
      });

      alert("Présences enregistrées avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const handleDownloadCSV = () => {
    if (students.length === 0) return;

    const headers = ["Matricule", "Nom", "Promotion", "Statut"];
    const rows = students.map(s => [
      s.id,
      s.name,
      s.academicLevel || "-",
      selectedStatus[s.id] || "Absent"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Presence_${course.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]} // Use today's date
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="flex items-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-2xl transition-all shadow-xl shadow-teal-600/30 font-bold text-lg w-full md:w-auto group active:scale-95"
                >
                  {generatingQR ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                  {generatingQR ? "Localisation..." : "Générer le QR code de présence"}
                </button>
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

                  <div className="bg-white p-4 border-2 border-dashed border-teal-200 rounded-2xl mb-4 shadow-sm inline-block">
                    <QRCodeSVG
                      value={qrToken}
                      size={200}
                      level="H"
                      includeMargin={true}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                      <p className="text-[11px] text-teal-800 text-left leading-tight">
                        Zone de sécurité : Étudiants à moins de <b>200m</b> uniquement.
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Expire à la fin de la journée
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-base transition-all shadow-lg active:scale-95"
                  >
                    Fermer l'affichage
                  </button>
                </div>
              </div>
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
                  onClick={() => setSelectedStatus({})}
                  className="px-4 py-2 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <button
                onClick={() => setFilterStatus('all')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'all' ? 'border-teal-500 ring-2 ring-teal-500 ring-opacity-50 shadow-md' : 'border-gray-200 shadow-sm hover:border-teal-300'}`}
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {students.length}
                </div>
                <div className="text-gray-600 font-medium">Total étudiants</div>
              </button>

              <button
                onClick={() => setFilterStatus('present')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'present' ? 'border-emerald-500 ring-2 ring-emerald-500 ring-opacity-50 shadow-md' : 'border-emerald-200 shadow-sm hover:border-emerald-400'}`}
              >
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {Object.values(selectedStatus).filter(s => s === 'present').length}
                </div>
                <div className="text-gray-600 font-medium">Présents</div>
              </button>

              <button
                onClick={() => setFilterStatus('absent')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'absent' ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50 shadow-md' : 'border-red-200 shadow-sm hover:border-red-400'}`}
              >
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {Object.values(selectedStatus).filter(s => s === 'absent').length}
                </div>
                <div className="text-gray-600 font-medium">Absents</div>
              </button>

              <button
                onClick={() => setFilterStatus('late')}
                className={`text-left bg-white rounded-xl p-6 border transition-all ${filterStatus === 'late' ? 'border-amber-500 ring-2 ring-amber-500 ring-opacity-50 shadow-md' : 'border-amber-200 shadow-sm hover:border-amber-400'}`}
              >
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {Object.values(selectedStatus).filter(s => s === 'late').length}
                </div>
                <div className="text-gray-600 font-medium">En retard</div>
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
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-5 py-2 rounded-lg font-medium transition-all ${selectedStatus[student.id] === 'present'
                            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                        >
                          Présent
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-5 py-2 rounded-lg font-medium transition-all ${selectedStatus[student.id] === 'absent'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`px-5 py-2 rounded-lg font-medium transition-all ${selectedStatus[student.id] === 'late'
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                            }`}
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
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(session.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
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
                    <button
                      onClick={() => setSelectedHistorySession(session)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-teal-600 text-gray-600 hover:text-white rounded-xl font-bold transition-all active:scale-95 group-hover:translate-x-1"
                    >
                      Voir détails
                      <ChevronRight className="w-5 h-5" />
                    </button>
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

            <div className="grid grid-cols-3 gap-6 p-8 bg-white">
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-1">Présents</p>
                <p className="text-3xl font-black text-emerald-700">{selectedHistorySession.present}</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                <p className="text-orange-600 text-sm font-bold uppercase tracking-wider mb-1">En retard</p>
                <p className="text-3xl font-black text-orange-700">{selectedHistorySession.late}</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-5 rounded-2xl">
                <p className="text-red-600 text-sm font-bold uppercase tracking-wider mb-1">Absents</p>
                <p className="text-3xl font-black text-red-700">{selectedHistorySession.absent}</p>
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
                  {(selectedHistorySession.records || []).map((record: any) => (
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
    </div>
  );
}
