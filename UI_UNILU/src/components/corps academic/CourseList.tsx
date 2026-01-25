import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { MoreVertical, CheckCircle2, Trash2, ShieldAlert, AlertCircle, Settings2, BookOpen, Calendar, Users, GraduationCap, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CourseListProps {
  onCourseSelect: (course: Course) => void;
}

export function CourseList({ onCourseSelect }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      const data = await professorService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleFinishCourse = async (courseCode: string) => {
    if (!window.confirm("Voulez-vous marquer ce cours comme terminé ? Cela bloquera les futures prises de présence.")) return;
    try {
      await professorService.updateCourseStatus(courseCode, 'FINISHED');
      setActiveMenu(null);
      fetchCourses();
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  const handleReactivateCourse = async (courseCode: string) => {
    try {
      await professorService.updateCourseStatus(courseCode, 'ACTIVE');
      setActiveMenu(null);
      fetchCourses();
    } catch (error) {
      alert("Erreur lors de la réactivation");
    }
  };

  const handleDeleteCourse = async (courseCode: string) => {
    try {
      await professorService.removeCourseAssignment(courseCode);
      setShowDeleteModal(null);
      fetchCourses();
    } catch (error) {
      alert("Erreur lors du retrait du cours");
    }
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string; light: string; secondary: string } } = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', secondary: 'bg-blue-100' },
      green: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', secondary: 'bg-emerald-100' },
      yellow: { bg: 'bg-amber-600', text: 'text-amber-600', light: 'bg-amber-50', secondary: 'bg-amber-100' },
      purple: { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50', secondary: 'bg-indigo-100' }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-50 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-[#009485] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initialisation du cursus...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#009485]" />
            <span className="text-[#009485] font-black text-[11px] uppercase tracking-[0.4em]">Portefeuille Académique</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
            Mes Enseignements<span className="text-[#009485]">.</span>
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
            Pilotez vos cours, gérez les présences et accompagnez la réussite de vos étudiants en Géologie.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-[32px] border border-slate-100 shadow-inner">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group cursor-default">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{courses.filter(c => c.status === 'ACTIVE' || !c.status).length} Cours Actifs</span>
          </div>
          <div className="px-6 py-3 flex items-center gap-4 group cursor-default opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{courses.filter(c => c.status === 'FINISHED').length} Archivés</span>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {courses.map((course) => {
          const isFinished = course.status === 'FINISHED';
          const colorClasses = getColorClasses(course.color);

          return (
            <motion.div
              key={course.id}
              whileHover={{ y: -8 }}
              className={`group relative bg-white border border-slate-100 rounded-[48px] p-10 transition-all duration-500 hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.12)] ${isFinished ? 'bg-slate-50/70 grayscale-[0.4]' : ''}`}
            >
              {/* Overlapping Gradient Highlight */}
              <div className={`absolute top-0 right-0 w-48 h-48 opacity-[0.04] rounded-bl-[100px] transition-all duration-700 group-hover:scale-125 group-hover:opacity-[0.08] ${isFinished ? 'bg-slate-900' : colorClasses.bg}`} />

              <div className="relative z-10 flex flex-col h-full">
                {/* Upper Meta */}
                <div className="flex items-start justify-between mb-10">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border ${isFinished ? 'bg-slate-100 text-slate-500 border-slate-200' : `${colorClasses.light} ${colorClasses.text} border-${course.color}-100`}`}>
                        {course.code}
                      </span>
                      {isFinished && (
                        <div className="bg-slate-800 text-[#00E5BC] text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-slate-900/20">
                          <CheckCircle2 className="w-3 h-3" /> ARCHIVÉ
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 opacity-40" />
                      {course.level}
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === course.id ? null : course.id)}
                      className="p-3 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent"
                    >
                      <MoreVertical className="w-6 h-6" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === course.id && (
                        <>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-4 w-72 bg-white border border-slate-100 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] z-20 py-4 flex flex-col gap-1 backdrop-blur-3xl bg-white/95"
                          >
                            <div className="px-6 py-2 border-b border-slate-50 mb-2 pb-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestion Académique</p>
                            </div>

                            {isFinished ? (
                              <button
                                onClick={() => handleReactivateCourse(course.code)}
                                className="mx-2 flex items-center gap-4 px-4 py-3 text-sm font-bold text-teal-600 hover:bg-teal-50 rounded-2xl transition-all group/opt"
                              >
                                <div className="p-2 bg-teal-100/50 rounded-xl group-hover/opt:scale-110 transition-transform"><AlertCircle className="w-4 h-4" /></div>
                                Réactiver le cours
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFinishCourse(course.code)}
                                className="mx-2 flex items-center gap-4 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-2xl transition-all group/opt"
                              >
                                <div className="p-2 bg-slate-100 rounded-xl group-hover/opt:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4" /></div>
                                Clôturer le cours
                              </button>
                            )}

                            <div className="mx-4 h-px bg-slate-50 my-2" />

                            <button
                              onClick={() => {
                                setActiveMenu(null);
                                setShowDeleteModal(course);
                              }}
                              className="mx-2 flex items-center gap-4 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all group/opt"
                            >
                              <div className="p-2 bg-rose-100/50 rounded-xl group-hover/opt:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></div>
                              Supprimer de la charge
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-4 min-h-[140px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${isFinished ? 'bg-slate-200 text-slate-400' : `${colorClasses.secondary} ${colorClasses.text}`}`}>
                        <BookOpen className="w-5 h-5 shadow-sm" />
                      </div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{course.role || 'Professeur Titulaire'}</span>
                    </div>
                    <h3 className={`text-3xl font-black tracking-tight leading-[1.1] transition-all duration-500 ${isFinished ? 'text-slate-400 opacity-60' : 'text-slate-950 group-hover:tracking-tighter'}`}>
                      {course.name}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-10 border-t border-slate-50">
                    {course.schedule.split('\n').map((line, index) => (
                      <div key={index} className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] group/line cursor-default">
                        <div className="flex items-center gap-3">
                          <Calendar className={`w-4 h-4 transition-colors ${isFinished ? 'text-slate-300' : 'text-[#009485] group-hover/line:scale-125 duration-300'}`} />
                          <span className="group-hover/line:text-slate-600 transition-colors">{line}</span>
                        </div>
                        {!isFinished && <div className="w-1.5 h-1.5 rounded-full bg-slate-100 group-hover:bg-[#009485] transition-colors" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-12 pt-8">
                  <button
                    onClick={() => onCourseSelect(course)}
                    className={`w-full group/btn flex items-center justify-between px-8 py-5 rounded-[28px] transition-all duration-500 font-black text-[12px] uppercase tracking-[0.25em] active:scale-[0.97] shadow-xl ${isFinished
                      ? 'bg-white border-2 border-slate-100 text-slate-400 shadow-sm hover:border-slate-300 hover:text-slate-600'
                      : 'bg-[#0F172A] hover:bg-[#009485] text-white shadow-slate-200 hover:shadow-[#009485]/30'}`}
                  >
                    <div className="flex items-center gap-4">
                      <Settings2 className={`w-5 h-5 transition-transform duration-700 group-hover/btn:rotate-180 ${isFinished ? 'text-slate-300' : 'text-teal-400 group-hover/btn:text-white'}`} />
                      Piloter l'enseignement
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Improved Modal Section */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[60px] w-full max-w-lg shadow-[0_60px_120px_-20px_rgba(0,0,0,0.4)] border border-slate-100 overflow-hidden"
            >
              <div className="p-16 text-center">
                <div className="w-28 h-28 bg-rose-50 rounded-[40px] flex items-center justify-center text-rose-500 mx-auto mb-10 relative">
                  <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-75 animate-pulse" />
                  <ShieldAlert className="w-14 h-14 relative z-10" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Retrait de Charge</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12 px-2">
                  Voulez-vous vraiment retirer l'enseignement <span className="text-slate-900 font-black italic underline decoration-[#009485] decoration-4 underline-offset-8">"{showDeleteModal.name}"</span> de votre portefeuille ? Cette configuration est irréversible.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="py-6 px-8 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[30px] font-black transition-all text-[11px] uppercase tracking-widest border border-slate-100"
                  >
                    Conserver le cours
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(showDeleteModal.code)}
                    className="py-6 px-8 bg-rose-600 hover:bg-rose-700 text-white rounded-[30px] font-black transition-all shadow-2xl shadow-rose-600/30 text-[11px] uppercase tracking-widest active:scale-95"
                  >
                    Confirmer le retrait
                  </button>
                </div>
              </div>
              <div className="bg-rose-50/50 py-5 px-8 text-center border-t border-rose-100/50">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                  <AlertCircle className="w-4 h-4" /> Système de protection actif
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
