import { useState, useEffect } from "react";
import { BookOpen, Users, Megaphone, X, Send, Search, AlertCircle, ClipboardCheck, CheckCircle2, MapPin, GraduationCap, ArrowRight, Activity, Calendar } from "lucide-react";
import type { Page } from "../../App";
import { professorService } from "../../services/professor";
import { motion, AnimatePresence } from "motion/react";
import "../../utils/auth-debug";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementType, setAnnouncementType] = useState('all_courses');
  const [announcementText, setAnnouncementText] = useState("");
  const [targetStudent, setTargetStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [targetLevel, setTargetLevel] = useState("");
  const [targetCourse, setTargetCourse] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [dismissedReminders, setDismissedReminders] = useState<number[]>(() => {
    const saved = localStorage.getItem('professor_dismissed_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('readProfAnnouncements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardData, coursesData] = await Promise.all([
          professorService.getDashboard(),
          professorService.getCourses()
        ]);
        setData(dashboardData);
        setCourses(coursesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getCourseStyles = (title: string) => {
    const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      { bg: "bg-blue-50", text: "text-blue-600", secondary: "bg-blue-600" },
      { bg: "bg-purple-50", text: "text-purple-600", secondary: "bg-purple-600" },
      { bg: "bg-teal-50", text: "text-teal-600", secondary: "bg-teal-600" },
      { bg: "bg-orange-50", text: "text-orange-600", secondary: "bg-orange-600" },
      { bg: "bg-pink-50", text: "text-pink-600", secondary: "bg-pink-600" },
      { bg: "bg-indigo-50", text: "text-indigo-600", secondary: "bg-indigo-600" }
    ];
    return colors[hash % colors.length];
  };

  const todaysCourses = data?.todaySchedule ? data.todaySchedule.map((c: any) => {
    const styles = getCourseStyles(c.title);
    return {
      ...c,
      icon: BookOpen,
      iconBg: styles.bg,
      iconColor: styles.text,
      dotColor: styles.secondary
    };
  }) : [];

  const handleSendAnnouncement = async () => {
    if (!announcementText) return;
    try {
      setLoading(true);
      const payload: any = {
        title: `Annonce de ${data?.professorName || 'votre professeur'}`,
        content: announcementText,
        type: 'GENERAL',
        target: announcementType === 'all_courses' ? 'ALL_STUDENTS' :
          (announcementType === 'specific_class' ? 'ACADEMIC_LEVEL' :
            (announcementType === 'specific_course' ? 'COURSE_STUDENTS' : 'SPECIFIC_USER')),
      };

      if (announcementType === 'specific_class') {
        const selectedLevel = data?.myLevels?.find((l: any) => l.name === targetLevel);
        payload.academicLevelId = selectedLevel?.id;
      }
      if (announcementType === 'specific_course') {
        payload.courseCode = targetCourse;
      }
      if (announcementType === 'specific_student') {
        payload.targetUserId = targetStudent;
      }

      await professorService.createAnnouncement(payload);

      alert("Annonce diffusée avec succès !");
      setShowAnnouncementModal(false);
      setAnnouncementText("");
      setTargetStudent("");
      setTargetLevel("");
      setTargetCourse("");
      setSelectedStudentLabel("");

      const dashboardData = await professorService.getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la diffusion de l'annonce");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReminder = (id: number) => {
    const updated = [...dismissedReminders, id];
    setDismissedReminders(updated);
    sessionStorage.setItem('professor_dismissed_reminders', JSON.stringify(updated));
  };

  const handleMarkAsRead = (id: string) => {
    if (!readAnnouncementIds.includes(id)) {
      const updated = [...readAnnouncementIds, id];
      setReadAnnouncementIds(updated);
      sessionStorage.setItem('readProfAnnouncements', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleStudentSearch = async (query: string) => {
    setTargetStudent(query);
    if (query.length > 1) {
      try {
        const results = await professorService.searchStudents(query);
        setFilteredStudents(results);
      } catch (error) {
        console.error("Erreur recherche:", error);
      }
    } else {
      setFilteredStudents([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-50 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-[#009485] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Symphonie Académique...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Premium Hero Section */}
      <div className="relative group overflow-hidden rounded-[50px] bg-[#0F172A] p-12 text-white">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#009485]/20 to-teal-500/10 blur-[100px] -mr-64 -mt-64 rounded-full transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-600/10 to-transparent blur-[80px] -ml-32 -mb-32 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-[#009485] text-white text-[8px] font-black uppercase tracking-[0.4em] rounded-full shadow-lg shadow-[#009485]/20">
                Espace Facultaire
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
                Pr. {data?.professorName?.split(' ')[0] || 'Enseignant'}<span className="text-[#009485]">.</span>
              </h1>
              <p className="text-slate-400 text-xl font-medium max-w-xl leading-relaxed">
                Expertise en Géosciences & Pilotage de la réussite académique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-teal-500/20 rounded-2xl flex flex-col items-center justify-center border border-teal-500/30">
              <span className="text-2xl font-black text-[#00E5BC]">{new Date().getDate()}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#00E5BC]/60">Janv.</span>
            </div>
            <div className="pr-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Session Ouverte</p>
              <p className="text-sm font-bold text-white uppercase">{new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Schedule & Feed */}
        <div className="lg:col-span-2 space-y-12">

          {/* Today's Schedule Card */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tight">Programme du jour</h3>
              </div>
              <button
                onClick={() => onNavigate('planning')}
                className="group flex items-center gap-3 px-6 py-3 bg-slate-50 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100"
              >
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Agenda Complet</span>
                <ArrowRight className="w-4 h-4 text-[#009485] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {todaysCourses.length === 0 ? (
                <div className="bg-slate-50 rounded-[32px] p-12 border border-slate-100 border-dashed text-center">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold tracking-tight italic">Aucune séance programmée pour aujourd'hui.</p>
                </div>
              ) : todaysCourses.map((course: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ x: 8 }}
                  className="bg-white border border-slate-100 rounded-[32px] p-8 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`${course.iconBg} w-16 h-16 rounded-[22px] flex items-center justify-center transition-transform group-hover:rotate-6`}>
                        <course.icon className={`w-8 h-8 ${course.iconColor}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${course.dotColor}`} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{course.courseCode}</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 group-hover:text-teal-600 transition-colors tracking-tight uppercase line-clamp-1">{course.title}</h4>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            {course.room}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            {course.level}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-slate-900 tracking-tighter">{course.timeDetail?.split(' - ')[0] || 'Horaire'}</p>
                      <p className="text-[9px] font-black text-[#009485] uppercase tracking-[0.2em]">{course.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Recently Expired Assignments Design Improved */}
          {data?.expiredAssignments?.filter((a: any) => !dismissedReminders.includes(a.id)).length > 0 && (
            <section className="animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Corrections attendues</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.expiredAssignments
                  .filter((a: any) => !dismissedReminders.includes(a.id))
                  .map((assignment: any) => (
                    <motion.div
                      key={assignment.id}
                      whileHover={{ scale: 1.02 }}
                      className="group relative bg-white border border-rose-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                          <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{assignment.courseName}</p>
                          <h4 className="font-black text-slate-900 truncate leading-tight">{assignment.title}</h4>
                          <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{assignment.submissionCount} Copies à noter</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismissReminder(assignment.id)}
                        className="absolute -top-2 -right-2 p-2 bg-white text-slate-300 hover:text-rose-500 shadow-lg rounded-full border border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
              </div>
            </section>
          )}

          {/* Feed design refined */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-3xl font-black text-slate-950 tracking-tight">Inspirations & Annonces</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {data?.announcements?.length > 0 ? (
                data.announcements.map((ann: any) => {
                  const isRead = readAnnouncementIds.includes(ann.id);
                  return (
                    <div
                      key={ann.id}
                      onClick={() => handleMarkAsRead(ann.id)}
                      className={`bg-white border rounded-[36px] p-8 shadow-sm transition-all duration-500 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 ${isRead ? 'border-slate-100 opacity-60' : 'border-teal-100 shadow-teal-50 shadow-xl'}`}
                    >
                      <div className={`absolute top-0 bottom-0 left-0 w-2 ${ann.target === 'ALL_STUDENTS' ? 'bg-indigo-500' : 'bg-pink-500'}`} />

                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${ann.target === 'ALL_STUDENTS' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                            {ann.target === 'ALL_STUDENTS' ? 'GLOBAL' : 'FACULTÉ'}
                          </span>
                          {!isRead && <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse outline outline-4 outline-teal-500/20" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(ann.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                      </div>

                      <h4 className="text-2xl font-black text-slate-950 mb-3 tracking-tight group-hover:text-teal-700 transition-colors uppercase leading-[1.1]">{ann.title}</h4>
                      <p className="text-slate-500 text-base font-medium leading-relaxed max-w-2xl">{ann.content}</p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-50/50 rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
                  <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Le flux est calme pour le moment</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="space-y-10">

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-[#009485] rounded-full" />
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-widest">Performances</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Stat 1: Students */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => onNavigate('students')}
                className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-[#009485]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 bg-teal-50 text-[#009485] text-[8px] font-black uppercase tracking-widest rounded-lg underline">Détails</div>
                </div>
                <div className="text-5xl font-black text-slate-950 tracking-tighter mb-1">{data?.stats?.studentCount || '0'}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Étudiants à charge</p>
              </motion.div>

              {/* Stat 2: Active Courses */}
              <div
                onClick={() => onNavigate('courses')}
                className="bg-[#1B4332] rounded-[40px] p-8 text-white shadow-2xl shadow-teal-900/20 cursor-pointer active:scale-95 transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-5xl font-black tracking-tighter mb-1">{data?.stats?.activeCourseCount || '0'}</div>
                <p className="text-[10px] font-black text-teal-200/60 uppercase tracking-[0.3em]">Cours en cours</p>
              </div>

              {/* Stat 3: Finished Courses */}
              <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 group opacity-70 hover:opacity-100 transition-all">
                <div className="text-5xl font-black text-slate-300 group-hover:text-slate-500 tracking-tighter mb-1 transition-colors">{data?.stats?.finishedCourseCount || '0'}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Unités Finalisées</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-[50px] p-10 text-white shadow-[0_40px_80px_-20px_rgba(0,148,133,0.3)] relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#009485]/30 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-2xl font-black tracking-tight mb-8">Espace de Transmission</h4>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="w-full h-20 bg-[#009485] hover:bg-[#007A6E] rounded-[24px] flex items-center justify-center gap-4 transition-all duration-300 font-black text-[12px] uppercase tracking-[0.25em] active:scale-95 shadow-xl shadow-[#009485]/20 group/btn"
            >
              <Megaphone className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
              Nouvelle Annonce
            </button>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-6 text-center leading-relaxed">
              Partagez infos, ressources ou <br /> rappels de manière sécurisée.
            </p>
          </div>

        </div>
      </div>

      {/* Modern Announcement Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[60px] w-full max-w-2xl shadow-[0_60px_100px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#0F172A] p-12 relative overflow-hidden flex justify-between items-start">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#009485]/20 blur-[80px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00E5BC]" />
                    <span className="text-[#00E5BC] font-black text-[11px] uppercase tracking-[0.4em]">Diffusion Globale</span>
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tight">Nouvelle Annonce</h3>
                </div>
                <button onClick={() => setShowAnnouncementModal(false)} className="relative z-10 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-12 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Configuration du ciblage</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'all_courses', label: 'Tous' },
                      { id: 'specific_class', label: 'Promotion' },
                      { id: 'specific_course', label: 'Cours' },
                      { id: 'specific_student', label: 'Individuel' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setAnnouncementType(option.id)}
                        className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${announcementType === option.id
                          ? 'border-[#009485] bg-teal-50 text-[#009485] shadow-lg shadow-teal-900/5'
                          : 'border-slate-50 text-slate-400 hover:border-slate-100'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {announcementType === 'specific_class' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-2">Promotion visée</label>
                      <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className="w-full h-16 px-6 bg-slate-50 border-0 rounded-[20px] font-bold text-slate-900 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none appearance-none cursor-pointer">
                        <option value="">Sélectionner une promotion...</option>
                        {data?.myLevels?.map((level: any) => (<option key={level.id} value={level.name}>{level.displayName || level.name}</option>))}
                      </select>
                    </motion.div>
                  )}

                  {announcementType === 'specific_course' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-2">Enseignement source</label>
                      <select value={targetCourse} onChange={(e) => setTargetCourse(e.target.value)} className="w-full h-16 px-6 bg-slate-50 border-0 rounded-[20px] font-bold text-slate-900 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none appearance-none cursor-pointer">
                        <option value="">Sélectionner un cours...</option>
                        {courses.map((course: any) => (<option key={course.id} value={course.code}>{course.name}</option>))}
                      </select>
                    </motion.div>
                  )}

                  {announcementType === 'specific_student' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 relative">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-2">Matricule Étudiant</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={selectedStudentLabel || targetStudent}
                          onChange={(e) => { setSelectedStudentLabel(""); handleStudentSearch(e.target.value); }}
                          placeholder="Rechercher par nom..."
                          className="w-full h-16 pl-14 pr-6 bg-slate-50 border-0 rounded-[24px] font-bold text-slate-900 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      </div>
                      {filteredStudents.length > 0 && !selectedStudentLabel && (
                        <div className="absolute z-50 left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden max-h-64 overflow-y-auto translate-z-0">
                          {filteredStudents.map((s) => (
                            <button key={s.id} onClick={() => { setTargetStudent(s.id); setSelectedStudentLabel(`${s.name} (${s.id})`); setFilteredStudents([]); }} className="w-full text-left px-8 py-5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group/item">
                              <div>
                                <p className="font-black text-slate-900 group-hover/item:text-[#009485] transition-colors">{s.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.id}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-slate-200 group-hover/item:translate-x-2 transition-transform" />
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Rédaction du message</label>
                  <textarea
                    rows={6}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Énoncez vos directives de manière claire et concise..."
                    className="w-full p-8 bg-slate-50 border-0 rounded-[40px] font-bold text-slate-900 focus:ring-8 focus:ring-[#009485]/5 transition-all outline-none resize-none text-lg leading-relaxed placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="p-12 bg-slate-50/50 border-t border-slate-100 flex gap-6 shrink-0">
                <button onClick={() => setShowAnnouncementModal(false)} className="flex-1 py-6 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-[28px] font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 shadow-sm hover:shadow-xl">Annuler</button>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={!announcementText || loading || (announcementType === 'specific_class' && !targetLevel) || (announcementType === 'specific_course' && !targetCourse) || (announcementType === 'specific_student' && !targetStudent)}
                  className="flex-[2] py-6 bg-slate-950 hover:bg-[#009485] text-white rounded-[28px] font-black flex items-center justify-center gap-6 transition-all duration-500 shadow-2xl shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-[12px] uppercase tracking-widest active:scale-[0.98]"
                >
                  {loading ? <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" /> : <>Diffuser l'annonce <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
