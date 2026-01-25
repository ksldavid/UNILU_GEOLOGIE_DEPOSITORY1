import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { MoreVertical, CheckCircle2, Trash2, ShieldAlert, AlertCircle, Settings2, ArrowRight } from "lucide-react";

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

  const handleFinishCourse = async (enrollmentId: string) => {
    if (!window.confirm("Voulez-vous marquer ce cours comme terminé ? Cela bloquera les futures prises de présence.")) return;
    try {
      await professorService.updateCourseStatus(enrollmentId, 'FINISHED');
      setActiveMenu(null);
      fetchCourses();
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  const handleReactivateCourse = async (enrollmentId: string) => {
    try {
      await professorService.updateCourseStatus(enrollmentId, 'ACTIVE');
      setActiveMenu(null);
      fetchCourses();
    } catch (error) {
      alert("Erreur lors de la réactivation");
    }
  };

  const handleDeleteCourse = async (enrollmentId: string) => {
    try {
      await professorService.removeCourseAssignment(enrollmentId);
      setShowDeleteModal(null);
      fetchCourses();
    } catch (error) {
      alert("Erreur lors du retrait du cours");
    }
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
      green: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      yellow: { bg: 'bg-amber-100', text: 'text-amber-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700' }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#009485] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium tracking-tight">Chargement de vos cours...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
          Mes Cours
        </h1>
        <p className="text-gray-600 text-lg font-medium opacity-80">
          Gérez vos supports de cours, consultez les soumissions et communiquez avec vos étudiants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => {
          const isFinished = course.status === 'FINISHED';
          const colorClasses = getColorClasses(course.color);

          return (
            <div
              key={course.id}
              className={`group relative bg-white border border-slate-100 rounded-[40px] p-8 transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 ${isFinished ? 'opacity-75 grayscale-[0.4]' : ''}`}
            >
              {/* Overlapping Status overlay for finished courses */}
              {isFinished && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 scale-90">
                  <span className="bg-slate-800 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Cours Terminé
                  </span>
                </div>
              )}

              {/* Options Menu Button */}
              <div className="absolute top-8 right-8 z-20">
                <button
                  onClick={() => setActiveMenu(activeMenu === course.id ? null : course.id)}
                  className="p-2.5 bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown menu */}
                {activeMenu === course.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                    <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-20 py-3 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="px-4 py-2 border-b border-slate-50 mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options académiques</p>
                      </div>
                      {isFinished ? (
                        <button
                          onClick={() => handleReactivateCourse(course.id)}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-teal-600 hover:bg-teal-50 flex items-center gap-3 transition-colors"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Réactiver le cours
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFinishCourse(course.id)}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Finir le cours
                        </button>
                      )}

                      <div className="h-px bg-slate-50 my-1 mx-2" />

                      <button
                        onClick={() => {
                          setActiveMenu(null);
                          setShowDeleteModal(course);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer le cours
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Card Content */}
              <div className="mb-6 flex flex-wrap items-center gap-2 pr-8">
                <span className={`inline-block ${colorClasses.bg} ${colorClasses.text} px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm border border-transparent`}>
                  {course.code}
                </span>
                <span className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm ${course.role === 'Professeur' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                  {course.role || 'Professeur'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  {course.level}
                </div>
                <h3 className={`font-black text-slate-900 mt-1 leading-[1.2] min-h-[64px] tracking-tight group-hover:text-teal-900 transition-colors ${isFinished ? 'text-slate-500' : ''} ${course.name.length > 50 ? 'text-base' :
                  course.name.length > 35 ? 'text-lg' :
                    course.name.length > 25 ? 'text-xl' : 'text-2xl'
                  }`}>
                  {course.name}
                </h3>
              </div>

              <div className="space-y-4 mb-10 pt-6 border-t border-slate-50">
                {course.schedule.split('\n').map((line, index) => (
                  <div key={index} className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-wider group/line">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover/line:bg-teal-50 group-hover/line:text-teal-600 transition-colors">
                      <Settings2 className="w-3.5 h-3.5 opacity-50" />
                    </div>
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="relative group/btn">
                <div className="absolute inset-0 bg-teal-600 blur-xl opacity-0 group-hover/btn:opacity-20 transition-opacity rounded-2xl" />
                <button
                  onClick={() => onCourseSelect(course)}
                  className={`w-full relative flex items-center justify-between px-10 py-5 rounded-[26px] transition-all duration-300 font-black text-[11px] uppercase tracking-[0.25em] active:scale-[0.98] shadow-lg ${isFinished
                    ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 shadow-none'
                    : 'bg-[#123124] hover:bg-[#0D261C] text-white shadow-teal-900/10 hover:shadow-teal-900/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <Settings2 className="w-5 h-5 text-teal-400 group-hover/btn:rotate-180 transition-transform duration-700" />
                    <span>Gérer le cours</span>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Supprimer de votre charge ?</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Cette action retirera le cours <span className="text-rose-600 font-bold underline underline-offset-4 decoration-rose-200">{showDeleteModal.name}</span> de votre tableau de bord. Vous ne pourrez plus gérer les notes ni les présences pour ce cours.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteCourse(showDeleteModal.id)}
                  className="py-4 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-rose-200 text-xs uppercase tracking-widest active:scale-95"
                >
                  Confirmer
                </button>
              </div>
            </div>
            <div className="bg-rose-50 py-3 px-6 text-center">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> Action Irréversible
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
