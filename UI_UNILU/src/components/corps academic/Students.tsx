import { Search, ChevronDown, Eye, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { professorService } from "../../services/professor";

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Tous');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      const fetchPerformance = async () => {
        setLoadingPerformance(true);
        try {
          const data = await professorService.getStudentPerformance(selectedStudent.id, selectedStudent.courseCode);
          setPerformanceData(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingPerformance(false);
        }
      };
      fetchPerformance();
    } else {
      setPerformanceData(null);
    }
  }, [selectedStudent]);

  const [allProfessorCourses, setAllProfessorCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, coursesData] = await Promise.all([
          professorService.getStudents(),
          professorService.getCourses()
        ]);
        setStudents(studentsData);
        setAllProfessorCourses(coursesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (student: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer ${student.name} du cours ${student.courseName} ?`)) {
      try {
        await professorService.unenrollStudent(student.id, student.courseCode);
        setStudents(prev => prev.filter(s => !(s.id === student.id && s.courseCode === student.courseCode)));
        alert("Étudiant retiré avec succès");
      } catch (error) {
        console.error(error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const [selectedLevel, setSelectedLevel] = useState('Tous');

  // Extract unique courses and levels for filter
  const courses = Array.from(new Set(allProfessorCourses.map(c => c.name))).sort();
  const levels = Array.from(new Set(students.map(s => s.academicLevel))).sort();

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'Tous' || student.courseName === selectedCourse;
    const matchesLevel = selectedLevel === 'Tous' || student.academicLevel === selectedLevel;

    return matchesSearch && matchesCourse && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Récupération de la liste des étudiants...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-10 mb-8 text-white">
        <h1 className="text-4xl font-semibold mb-3">
          Liste des Étudiants
        </h1>
        <p className="text-teal-50 text-lg">
          Consultez et gérez les profils de vos étudiants par cours et promotion.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Level Selector */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer min-w-[180px]"
            >
              <option value="Tous">Toutes les promotions</option>
              {levels.map((l: any) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>

          {/* Course Selector */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer min-w-[200px]"
            >
              <option value="Tous">Tous les cours</option>
              {courses.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Nom Complet
                </th>
                <th className="text-left px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="text-left px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Promotion
                </th>
                <th className="text-left px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Cours
                </th>
                <th className="text-left px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, idx) => (
                <tr key={`${student.id}-${idx}`} className="hover:bg-teal-50/30 transition-colors group">
                  <td className="px-8 py-5 text-gray-900 font-medium">
                    {student.name}
                  </td>
                  <td className="px-8 py-5 text-gray-500 font-mono text-sm">
                    {student.id}
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {student.academicLevel}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-gray-600">
                    {student.courseName}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-2 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors group-hover:scale-110"
                        title="Voir détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group-hover:scale-110"
                        title="Désinscrire"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-xl mt-4">
          Aucun étudiant trouvé pour "{searchTerm}"
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold leading-tight">{selectedStudent.name}</h3>
                <p className="text-teal-50 text-xs font-mono opacity-80">{selectedStudent.id}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {loadingPerformance ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-500 font-medium text-sm text-center">Chargement des données...</p>
                </div>
              ) : performanceData ? (
                <>
                  {/* Attendance Stats */}
                  <div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      Assiduité
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm font-medium">Taux de présence global</span>
                        <span className="text-xl font-bold text-gray-900">{performanceData.attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${performanceData.attendanceRate}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2">
                        Présent à {performanceData.presentCount} séances sur {performanceData.totalSessions} au total
                      </p>
                    </div>
                  </div>

                  {/* Interro Marks */}
                  <div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      Résultats Interrogations
                    </h4>
                    {performanceData.grades.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {performanceData.grades.map((grade: any, i: number) => (
                          <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 hover:border-teal-300 transition-colors shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-bold text-gray-900 text-sm truncate pr-2">{grade.title}</div>
                              <div className={`text-base font-black shrink-0 ${grade.score >= (grade.maxPoints / 2) ? 'text-emerald-600' : 'text-red-600'}`}>
                                {grade.score}<span className="text-gray-400 text-[10px] font-bold">/{grade.maxPoints}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(grade.date).toLocaleDateString('fr-FR')}</div>
                              <div className="w-24 bg-gray-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-1 rounded-full ${grade.score >= (grade.maxPoints / 2) ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${(grade.score / grade.maxPoints) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
                        Aucune note enregistrée pour ce cours
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-red-500 text-sm font-bold">
                  Impossible de charger les données.
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
