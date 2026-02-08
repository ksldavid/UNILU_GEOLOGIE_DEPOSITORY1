import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Award, Download, CheckCircle2 } from "lucide-react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

export function StudentGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await studentService.getGrades();
        setGrades(response.grades || []);
        setStats(response.stats || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const calculateAverage = () => {
    if (grades.length === 0) return "0.00";
    const totalPoints = grades.reduce((sum, g) => sum + (g.final * g.coefficient), 0);
    const totalCoef = grades.reduce((sum, g) => sum + g.coefficient, 0);
    return (totalPoints / (totalCoef || 1)).toFixed(2);
  };

  const average = parseFloat(calculateAverage());

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-400 bg-gray-50';
    if (grade >= 8) return 'text-green-600 bg-green-50';
    if (grade >= 7) return 'text-blue-600 bg-blue-50';
    if (grade >= 6) return 'text-orange-600 bg-orange-50';
    if (grade >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMention = (avg: number) => {
    if (grades.length === 0) return { text: 'En attente', color: 'text-gray-400', bg: 'bg-gray-50' };
    if (avg >= 8) return { text: 'Très Bien', color: 'text-green-600', bg: 'bg-green-50' };
    if (avg >= 7) return { text: 'Bien', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (avg >= 6) return { text: 'Assez Bien', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (avg >= 5) return { text: 'Passable', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: 'Insuffisant', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const mention = getMention(average);

  if (loading) return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-6 md:mb-10 text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2 tracking-tight">Notes & Résultats</h1>
        <p className="text-gray-500 text-xs md:text-base font-medium">Suivez vos performances académiques</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-blue-100/50 transition-colors duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${mention.bg} flex items-center justify-center shadow-inner`}>
                <Award className={`w-6 h-6 md:w-7 md:h-7 ${mention.color}`} />
              </div>
              {average >= 7 ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-orange-500" />
              )}
            </div>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Moyenne Générale</p>
            <p className={`text-2xl md:text-4xl font-black ${mention.color} leading-none mb-3`}>{average}/10</p>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 ${mention.bg} ${mention.color} rounded-full inline-block border border-current/10`}>
              {mention.text}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-green-100/50 transition-colors duration-500" />
          <div className="relative">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6 shadow-inner">
              <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
            </div>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Meilleure note</p>
            <p className="text-2xl md:text-4xl font-black text-gray-900 leading-none mb-3">
              {grades.length > 0 ? Math.max(...grades.map(g => g.final)) : '0'}<span className="text-sm md:text-lg text-gray-400">/10</span>
            </p>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 italic truncate">
              {grades.length > 0 ? grades.find(g => g.final === Math.max(...grades.map(g => g.final)))?.course : 'En attente'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-purple-100/50 transition-colors duration-500" />
          <div className="relative">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 shadow-inner">
              <Award className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
            </div>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Classement Réel</p>
            <p className="text-2xl md:text-4xl font-black text-gray-900 leading-none mb-3">
              {stats?.rank || '--'}<span className="text-sm md:text-lg text-gray-400">/{stats?.totalStudents || '--'}</span>
            </p>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
              {stats?.levelName || 'Étudiant'}{stats?.levelName && " - Géologie"}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Grades */}
      <div className="bg-white rounded-3xl md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <h3 className="text-gray-900 text-lg md:text-xl font-black uppercase tracking-tight">Relevé détaillé</h3>
          <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-black/10">
            <Download className="w-4 h-4" />
            <span>Extraire PDF</span>
          </button>
        </div>

        <div>
          {grades.length === 0 ? (
            <div className="p-12 text-center">
              < Award className="w-16 h-16 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 font-bold italic">Aucun résultat publié pour le moment.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Code</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Module / Cours</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">TP (40%)</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Exam (60%)</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Moyenne</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Coef.</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Décision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grades.map((grade) => (
                      <tr key={grade.code} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{grade.code}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-1.5 h-10 rounded-full bg-gradient-to-b ${grade.color} group-hover:scale-y-110 transition-transform`} />
                            <div>
                              <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{grade.course}</span>
                              <p className="text-[10px] text-gray-400 font-bold italic">Module validé</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`${getGradeColor(grade.tp)} text-[11px] font-black px-3 py-1.5 rounded-xl border border-current/10`}>
                            {grade.tp !== null ? `${grade.tp}/10` : '--'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`${getGradeColor(grade.exam)} text-[11px] font-black px-3 py-1.5 rounded-xl border border-current/10`}>
                            {grade.exam !== null ? `${grade.exam}/10` : '--'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`${getGradeColor(grade.final)} text-sm font-black px-4 py-2 rounded-xl shadow-sm border border-current/10`}>
                            {grade.final}/10
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-black text-gray-400">x{grade.coefficient}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {grade.final >= 5 ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Admis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                              ✕ Non Admis
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {grades.map((grade) => (
                  <div key={grade.code} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${grade.color}`} />
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{grade.code}</p>
                          <h4 className="text-sm font-black text-gray-900 leading-tight">{grade.course}</h4>
                        </div>
                      </div>
                      <div className={`${getGradeColor(grade.final)} px-3 py-1.5 rounded-2xl border border-current/10 text-xs font-black`}>
                        {grade.final}/10
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-2xl p-3">
                      <div className="text-center">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mb-1">TP (40%)</p>
                        <p className={`text-[10px] font-black ${getGradeColor(grade.tp).split(' ')[0]}`}>{grade.tp !== null ? `${grade.tp}/10` : '--'}</p>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mb-1">Exam (60%)</p>
                        <p className={`text-[10px] font-black ${getGradeColor(grade.exam).split(' ')[0]}`}>{grade.exam !== null ? `${grade.exam}/10` : '--'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mb-1">Coef.</p>
                        <p className="text-[10px] font-black text-gray-600">x{grade.coefficient}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {grade.final >= 5 ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-50 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Validé
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-rose-50 rounded-full">
                          ✕ Ajourné
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 font-bold italic">Session Normale</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
