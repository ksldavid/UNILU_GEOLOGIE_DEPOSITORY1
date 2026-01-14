import { useState, useEffect } from "react";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";

interface CourseListProps {
  onCourseSelect: (course: Course) => void;
}

export function CourseList({ onCourseSelect }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        <p className="mt-4 text-gray-500 font-medium">Chargement de vos cours...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-3">
          Mes Cours
        </h1>
        <p className="text-gray-600 text-lg">
          Gérez vos supports de cours, consultez les soumissions et communiquez avec vos étudiants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const colorClasses = getColorClasses(course.color);
          return (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300"
            >
              <div className="mb-4">
                <span className={`inline-block ${colorClasses.bg} ${colorClasses.text} px-3 py-1 rounded-lg text-sm font-semibold tracking-wide`}>
                  {course.code}
                </span>
                <span className={`ml-2 inline-block px-3 py-1 rounded-lg text-sm font-semibold tracking-wide ${course.role === 'Professeur' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                  {course.role || 'Professeur'}
                </span>
                <span className="ml-3 text-sm text-gray-600">{course.level}</span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {course.name}
              </h3>

              <div className="space-y-2 mb-6">
                {course.schedule.split('\n').map((line, index) => (
                  <p key={index} className="text-gray-600 text-sm">
                    {line}
                  </p>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onCourseSelect(course)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#009485] hover:bg-[#007A6E] text-white rounded-2xl transition-all font-black text-lg active:scale-[0.98] shadow-lg shadow-teal-100"
                >
                  Gérer le cours
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
