import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Award, Download, CheckCircle2 } from "lucide-react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

export function StudentGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await studentService.getGrades();
        setGrades(data);
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
    <div className="p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2 font-bold text-3xl">Notes & Résultats</h1>
        <p className="text-gray-600">Consultez vos résultats académiques et votre progression (Base 10)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${mention.bg} flex items-center justify-center`}>
              <Award className={`w-6 h-6 ${mention.color}`} />
            </div>
            {average >= 7 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">Moyenne Générale</p>
          <p className={`text-3xl font-bold ${mention.color}`}>{average}/10</p>
          <p className={`text-xs ${mention.color} mt-2 px-2 py-1 ${mention.bg} rounded-full inline-block`}>
            {mention.text}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Meilleure note</p>
          <p className="text-3xl text-gray-900 font-bold">
            {grades.length > 0 ? Math.max(...grades.map(g => g.final)) : '0'}<span className="text-lg text-gray-500">/10</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {grades.length > 0 ? grades.find(g => g.final === Math.max(...grades.map(g => g.final)))?.course : 'Aucune donnée'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Classement (Simulé)</p>
          <p className="text-3xl text-gray-900 font-bold">---<span className="text-lg text-gray-500">/--</span></p>
          <p className="text-xs text-gray-500 mt-2">Licence 3 - Géologie</p>
        </div>
      </div>

      {/* Detailed Grades */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-gray-900 font-bold">Relevé de notes détaillé</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors">
            <Download className="w-4 h-4" />
            <span>Télécharger PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {grades.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 font-medium italic">Aucune note n'a été publiée pour le moment.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-gray-600 font-bold">Code</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-600 font-bold">Cours</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-600 font-bold">TP/CC</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-600 font-bold">Examen</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-600 font-bold">Note Finale</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-600 font-bold">Coefficient</th>
                  <th className="px-6 py-4 text-center text-sm text-gray-600 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {grades.map((grade) => (
                  <tr key={grade.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 font-bold">{grade.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${grade.color}`}></div>
                        <span className="text-sm text-gray-900 font-medium">{grade.course}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${getGradeColor(grade.tp)}`}>
                        {grade.tp !== null ? `${grade.tp}/10` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${getGradeColor(grade.exam)}`}>
                        {grade.exam !== null ? `${grade.exam}/10` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${getGradeColor(grade.final)}`}>
                        {grade.final}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 font-medium">{grade.coefficient}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {grade.final >= 5 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold">
                          ✗ Non validé
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
