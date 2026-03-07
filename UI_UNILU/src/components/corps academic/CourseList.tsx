import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";
import { CheckCircle2, Settings2, ArrowRight } from "lucide-react";

interface CourseListProps {
  onCourseSelect: (course: Course) => void;
}

export function CourseList({ onCourseSelect }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

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
          const isFinished = course.isFinished;
          const colorClasses = getColorClasses(course.color);

          return (
            <div
              key={course.id}
              className={`group relative bg-white border border-slate-100 rounded-[40px] p-8 transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 ${isFinished ? 'opacity-75 grayscale-[0.4]' : ''}`}
            >
              {/* Overlapping Status overlay for finished courses */}
              {isFinished && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 scale-95">
                  <span className="bg-[#123124] text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2 border border-[#1B4332]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Cours Terminé
                  </span>
                </div>
              )}

              {/* Options Menu Button (REMOVED: Professors do not have academic management rights) */}

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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    {course.level}
                  </div>
                  {course.progress !== undefined && (
                    <div className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      Progression: {course.progress}%
                    </div>
                  )}
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

    </div>
  );
}
