import type { Course } from "../../App";

interface CourseListProps {
  onCourseSelect: (course: Course) => void;
}

export function CourseList({ onCourseSelect }: CourseListProps) {
  const courses: Course[] = [
    {
      id: 'geo-301',
      code: 'GÉO-301',
      name: 'Géologie Structurale',
      level: 'L3 Géologie',
      schedule: 'Lundi: 08:30 - 12:30 (Amphi B)\nJeudi: 14:00 - 16:00 (Amphi C)',
      location: 'Amphi B',
      color: 'blue',
      role: 'Professeur'
    },
    {
      id: 'min-212',
      code: 'MIN-212',
      name: 'Minéralogie Optique',
      level: 'L2 Géologie',
      schedule: 'Mardi: 10:30 - 12:30 (Labo 1)\nVendredi: 08:30 - 10:30 (Labo 1)',
      location: 'Labo 1',
      color: 'green',
      role: 'Assistant'
    },
    {
      id: 'pal-405',
      code: 'PAL-405',
      name: 'Paléontologie des Vertébrés',
      level: 'M1 Paléontologie',
      schedule: 'Mercredi: 13:00 - 16:00 (Salle 204)',
      location: 'Salle 204',
      color: 'yellow',
      role: 'Professeur'
    },
    {
      id: 'sed-310',
      code: 'SED-310',
      name: 'Sédimentologie',
      level: 'L3 Géologie',
      schedule: 'Lundi: 13:00 - 15:00 (Amphi A)',
      location: 'Amphi A',
      color: 'purple',
      role: 'Assistant'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
      green: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      yellow: { bg: 'bg-amber-100', text: 'text-amber-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700' }
    };
    return colors[color] || colors.blue;
  };

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
