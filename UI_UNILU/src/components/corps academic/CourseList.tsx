import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { MoreVertical, CheckCircle2, Trash2, ShieldAlert, AlertCircle, Settings2 } from "lucide-react";

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
              className={`group relative bg-white border border-gray-100 rounded-[32px] p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${isFinished ? 'opacity-80 grayscale-[0.3]' : ''}`}
            >
              {/* Overlapping Status overlay for finished courses */}
              {isFinished && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-full shadow-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Cours Terminé
                  </span>
                </div>
              )}

              {/* Options Menu Button */}
              <div className="absolute top-6 right-6 z-20">
                <button
                  onClick={() => setActiveMenu(activeMenu === course.id ? null : course.id)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown menu */}
                {activeMenu === course.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {isFinished ? (
                        <button
                          onClick={() => handleReactivateCourse(course.code)}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-teal-600 hover:bg-teal-50 flex items-center gap-3"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Réactiver le cours
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFinishCourse(course.code)}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Finir le cours
                        </button>
                      )}

                      <div className="h-px bg-gray-50 my-1 mx-2" />

                      <button
                        onClick={() => {
                          setActiveMenu(null);
                          setShowDeleteModal(course);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer le cours
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-2 pr-8">
                <span className={`inline-block ${colorClasses.bg} ${colorClasses.text} px-3 py-1 rounded-lg text-[11px] font-black tracking-widest uppercase`}>
                  {course.code}
                </span>
                <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black tracking-widest uppercase ${course.role === 'Professeur' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                  {course.role || 'Professeur'}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{course.level}</span>
                <h3 className={`text-xl font-bold text-gray-900 mt-1 leading-tight h-14 line-clamp-2 ${isFinished ? 'text-gray-500' : ''}`}>
                  {course.name}
                </h3>
              </div>

              <div className="space-y-2 mb-8 min-h-[48px]">
                {course.schedule.split('\n').map((line, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-400 font-medium text-xs">
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    {line}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onCourseSelect(course)}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest active:scale-[0.98] shadow-lg ${isFinished
                    ? 'bg-slate-300 text-slate-600 shadow-slate-100 cursor-not-allowed cursor-pointer opacity-80'
                    : 'bg-[#1B4332] hover:bg-[#123124] text-white shadow-teal-100'}`}
                >
                  <Settings2 className="w-4 h-4" />
                  Gérer le cours
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
                  onClick={() => handleDeleteCourse(showDeleteModal.code)}
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
