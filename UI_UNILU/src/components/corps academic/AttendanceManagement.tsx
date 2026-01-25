import { QrCode, Save, Search, ArrowLeft, X, MapPin, Loader2, RefreshCw, History, Calendar, Users, ChevronRight, FileText, Download, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { attendanceService } from "../../services/attendance";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";

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

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const allStudents = await professorService.getStudents();
        const courseStudents = allStudents.filter((s: any) => s.courseCode === course.code || s.courseName === course.name);
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
  }, [course]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      await professorService.syncPastAttendance();
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
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée.");
      setGeneratingQR(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await attendanceService.generateQR(course.code, latitude, longitude);
          setQrToken(result.qrToken);
          setShowQRModal(true);
          setTimeout(() => setGeneratingQR(false), 800);
        } catch (error: any) {
          alert(error.message || "Erreur QR Code");
          setGeneratingQR(false);
        }
      },
      (error) => {
        setLocationError("Problème de localisation. Vérifiez vos paramètres.");
        setGeneratingQR(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSave = async () => {
    try {
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
      const records = Object.entries(selectedStatus).map(([studentId, status]) => ({ studentId, status }));
      if (records.length === 0) {
        alert("Veuillez marquer au moins un étudiant.");
        return;
      }
      await professorService.saveAttendance({ courseCode: course.code, date, records });
      alert("Présences enregistrées !");
    } catch (error) {
      console.error(error);
      alert("Erreur enregistrement.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="mt-6 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Chargement des effectifs...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">

      {/* Header with improved hierarchy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <button onClick={onBack} className="group flex items-center gap-3 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-[0.3em] transition-all mb-4">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
            Retour au cours
          </button>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00E5BC]" />
            <span className="text-[#00E5BC] font-black text-[11px] uppercase tracking-[0.4em]">{course.code}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter">Présences Académiques<span className="text-teal-600">.</span></h1>
        </div>

        <div className="flex p-2 bg-slate-100 rounded-[30px] border border-slate-200/50 shadow-inner">
          <button onClick={() => setActiveTab('current')} className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-white text-teal-600 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
            <QrCode className="w-4 h-4" /> Journal Quotidien
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-teal-600 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
            <History className="w-4 h-4" /> Archives session
          </button>
        </div>
      </div>

      {course.status === 'FINISHED' && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50/50 border-2 border-amber-100 rounded-[40px] p-10 flex items-center gap-8 shadow-sm">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 shadow-xl shadow-amber-200/20">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-amber-900 tracking-tight uppercase">Session Archivee</h3>
            <p className="text-amber-800 font-bold opacity-80 leading-relaxed text-lg italic">
              Ce cours ne dispose plus de prise de présence vue que il a ete terminer.
            </p>
          </div>
        </motion.div>
      )}

      {activeTab === 'current' ? (
        <div className="space-y-10">

          {/* Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 opacity-20 rounded-bl-[60px]" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Sélectionner la date</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full h-16 px-6 bg-slate-50 border-0 rounded-[20px] font-black text-lg text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer" />
            </div>

            <div className="lg:col-span-2 bg-slate-950 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
              <div className="relative z-10 space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Check-in Dynamique</h3>
                <div className="flex items-center gap-3 text-teal-400/60 font-bold text-[10px] uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Zone sécurisée 200m
                </div>
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={generatingQR || course.status === 'FINISHED'}
                className="relative z-10 group h-20 px-10 bg-[#009485] hover:bg-[#00E5BC] text-white hover:text-slate-950 rounded-[24px] font-black text-[12px] uppercase tracking-[0.25em] transition-all duration-500 flex items-center gap-4 disabled:bg-slate-800 disabled:text-slate-500 active:scale-95 shadow-2xl shadow-teal-900/40"
              >
                {generatingQR ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                {generatingQR ? "Localisation..." : "Activer le QR Code"}
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { id: 'all', label: 'Inscrits', value: students.length, color: 'slate' },
              { id: 'present', label: 'Présents', value: Object.values(selectedStatus).filter(s => s === 'present').length, color: 'emerald' },
              { id: 'late', label: 'Retards', value: Object.values(selectedStatus).filter(s => s === 'late').length, color: 'amber' },
              { id: 'absent', label: 'Absents', value: Object.values(selectedStatus).filter(s => s === 'absent').length, color: 'rose' }
            ].map(stat => (
              <button
                key={stat.id}
                onClick={() => setFilterStatus(stat.id as any)}
                className={`relative group p-8 rounded-[36px] bg-white border-2 transition-all duration-300 text-left ${filterStatus === stat.id ? 'border-teal-500 shadow-2xl scale-105' : 'border-slate-50 hover:border-slate-100 shadow-sm'}`}
              >
                <div className={`text-4xl font-black mb-2 tracking-tighter ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'rose' ? 'text-rose-500' : stat.color === 'amber' ? 'text-amber-500' : 'text-slate-900'}`}>{stat.value}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</p>
                {filterStatus === stat.id && <div className="absolute top-6 right-8 w-2 h-2 rounded-full bg-teal-500" />}
              </button>
            ))}
          </div>

          {/* Search and Save Section */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative flex-1 group w-full">
              <input
                type="text"
                placeholder="Filtrer un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-20 pl-16 pr-8 bg-white border-2 border-slate-50 rounded-[30px] font-bold text-slate-900 focus:border-[#009485] focus:ring-0 transition-all outline-none shadow-sm group-hover:shadow-xl"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-hover:text-[#009485] transition-colors" />
            </div>
            <button
              onClick={handleSave}
              disabled={course.status === 'FINISHED'}
              className="w-full md:w-auto h-20 px-12 bg-slate-950 hover:bg-[#009485] text-white rounded-[30px] font-black text-[12px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 shadow-2xl"
            >
              <Save className="w-5 h-5 text-teal-400" /> Confirmer session
            </button>
          </div>

          {/* Table Design Revamped */}
          <div className="bg-white border border-slate-100 rounded-[50px] overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Liste d'appel</h4>
              <button onClick={handleRefresh} className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync. en direct
              </button>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 font-black text-[10px] uppercase tracking-[0.25em]">
                    <th className="px-10 py-8">Identification</th>
                    <th className="px-10 py-8">Promotion</th>
                    <th className="px-10 py-8 text-center">Action de présence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={3} className="px-10 py-32 text-center text-slate-400 font-bold italic">Aucun étudiant ne correspond à cette requête.</td></tr>
                  ) : filteredStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-lg tracking-tight uppercase group-hover:text-teal-700 transition-colors">{s.name}</span>
                          <span className="text-[10px] font-black text-slate-400 tracking-[0.15em]">{s.id}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 font-black text-[10px] text-slate-500 uppercase tracking-widest">{s.academicLevel || '-'}</td>
                      <td className="px-10 py-8">
                        <div className="flex items-center justify-center gap-3">
                          {[
                            { id: 'present', label: 'Présent', color: 'emerald' },
                            { id: 'late', label: 'Retard', color: 'amber' },
                            { id: 'absent', label: 'Absent', color: 'rose' }
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => handleStatusChange(s.id, type.id as any)}
                              disabled={course.status === 'FINISHED'}
                              className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedStatus[s.id] === type.id
                                ? `bg-${type.color}-600 text-white shadow-xl shadow-${type.color}-600/20 scale-110`
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-slate-50 rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Archives Vides</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {history.map((session) => (
                <motion.div key={session.id} whileHover={{ x: 12 }} className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center text-[#00E5BC] shadow-xl group-hover:scale-110 transition-transform">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                          <Users className="w-4 h-4" /> {session.present} Présents
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Taux: {Math.round((session.present / (session.totalStudents || 1)) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedHistorySession(session)} className="flex items-center gap-4 px-8 py-4 bg-slate-50 hover:bg-[#009485] text-slate-400 hover:text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all group-hover:shadow-xl">
                    Détails Session <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Detail Modal Revamped */}
      <AnimatePresence>
        {selectedHistorySession && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[60px] w-full max-w-5xl h-[85vh] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col overflow-hidden">

              <div className="bg-[#0F172A] p-12 relative overflow-hidden flex justify-between items-center text-white shrink-0">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 blur-[100px] -mr-40 -mt-40 rounded-full" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00E5BC]" />
                    <span className="text-[#00E5BC] font-black text-[11px] uppercase tracking-[0.4em]">Audit de Session</span>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase whitespace-pre">Séance du {new Date(selectedHistorySession.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h3>
                </div>
                <button onClick={() => setSelectedHistorySession(null)} className="relative z-10 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/10">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-12 py-10 bg-slate-50 border-b border-slate-100 flex items-center gap-6 shrink-0">
                {[
                  { l: 'Présents', v: selectedHistorySession.present, c: 'text-emerald-500', b: 'bg-emerald-50/50' },
                  { l: 'En retard', v: selectedHistorySession.late, c: 'text-amber-500', b: 'bg-amber-50/50' },
                  { l: 'Absents', v: selectedHistorySession.absent, c: 'text-rose-500', b: 'bg-rose-50/50' }
                ].map(st => (
                  <div key={st.l} className={`${st.b} px-10 py-5 rounded-[24px] border border-white min-w-[200px] shadow-sm`}>
                    <div className={`${st.c} text-3xl font-black tracking-tighter`}>{st.v}</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{st.l}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-left text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
                      <th className="px-8 pb-4">Étudiant</th>
                      <th className="px-8 pb-4">Matricule</th>
                      <th className="px-8 pb-4 text-center">Statut Final</th>
                      <th className="px-8 pb-4 text-right">Horodatage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedHistorySession.records || []).map((record: any) => (
                      <tr key={record.studentId} className="bg-white border border-slate-50 shadow-sm rounded-[24px] hover:shadow-lg transition-all group">
                        <td className="px-8 py-6 rounded-l-[24px]">
                          <span className="font-black text-slate-900 tracking-tight group-hover:text-teal-600 transition-colors uppercase">{record.studentName}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-bold text-slate-400 text-sm tracking-widest">{record.studentId}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${record.status === 'PRESENT' ? 'bg-emerald-500 text-white' : record.status === 'LATE' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right rounded-r-[24px]">
                          <span className="text-slate-400 font-black text-xs">
                            {new Date(record.markedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-12 border-t border-slate-100 bg-slate-50/50 flex justify-center shrink-0">
                <button onClick={() => setSelectedHistorySession(null)} className="w-full h-20 bg-slate-950 hover:bg-slate-900 text-white rounded-[30px] font-black text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl shadow-slate-900/40 active:scale-95">Fermer les archives</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9, rotateX: 20 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[60px] max-w-lg w-full overflow-hidden shadow-[0_100px_150px_-30px_rgba(0,148,133,0.3)] border border-teal-100">
              <div className="p-12 text-center space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-emerald-600 font-black text-[11px] uppercase tracking-[0.4em]">Signal Cryptographique Actif</span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase whitespace-pre line-clamp-1">{course.name}</h2>
                </div>

                <div className="relative group mx-auto w-fit">
                  <div className="absolute inset-0 bg-[#00E5BC]/10 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-10 bg-white border-4 border-slate-950 rounded-[40px] shadow-2xl transition-transform duration-500 hover:scale-105">
                    {qrToken ? (
                      <QRCodeSVG value={qrToken} size={240} level="H" includeMargin={true} />
                    ) : (
                      <div className="w-60 h-60 flex items-center justify-center"><Loader2 className="w-12 h-12 text-teal-600 animate-spin" /></div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 space-y-4">
                  <div className="flex items-center gap-4 justify-center">
                    <MapPin className="w-6 h-6 text-[#009485]" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest text-left">Périmètre de confiance : <span className="text-[#009485]">200 Mètres</span></p>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Le jeton expire automatiquement à minuit</p>
                </div>
              </div>

              <div className="p-10 bg-slate-950 border-t border-white/5">
                <button onClick={() => setShowQRModal(false)} className="w-full h-20 bg-[#009485] hover:bg-[#00E5BC] text-white hover:text-slate-950 rounded-[28px] font-black text-[13px] uppercase tracking-[0.4em] transition-all duration-500 shadow-xl active:scale-95 group">
                  Clore la diffusion <ArrowRight className="inline-block w-5 h-5 ml-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
