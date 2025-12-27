import { QrCode, Save, Search, ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { Course } from "../../App";

interface AttendanceManagementProps {
  course: Course;
  onBack: () => void;
}

export function AttendanceManagement({ course, onBack }: AttendanceManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<{ [key: string]: 'present' | 'absent' | 'late' }>({
    '2023-0101': 'present',
    '2023-0102': 'absent',
    '2023-0103': 'present',
    '2023-0104': 'late',
    '2023-0105': 'present',
  });

  const students = [
    { id: '2023-0101', name: 'Adebayo Okoro' },
    { id: '2023-0102', name: 'Binta Diallo' },
    { id: '2023-0103', name: 'Chidi Nwosu' },
    { id: '2023-0104', name: 'Fatoumata Keïta' },
    { id: '2023-0105', name: 'Kwame Mensah' },
  ];

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setSelectedStatus(prev => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à {course.name}
        </button>

        <h1 className="text-4xl font-semibold text-gray-900 mb-3">
          Prendre la Présence
        </h1>
        <p className="text-gray-600 text-lg">
          Sélectionnez la date et marquez la présence pour le cours de{' '}
          <span className="font-semibold text-teal-600">{course.name}</span>{' '}
          <span className="text-gray-500">({course.code})</span>.
        </p>
      </div>

      {/* Date and QR Code Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de la séance :
              </label>
              <input
                type="date"
                defaultValue="2025-11-27"
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <button className="flex items-center gap-3 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors shadow-lg shadow-teal-600/30">
            <QrCode className="w-5 h-5" />
            <span className="font-semibold">Générer le QR code de présence</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              className="px-5 py-2.5 bg-teal-50 text-teal-700 rounded-lg font-medium border-2 border-teal-200"
            >
              Tous
            </button>
            <button className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              Présent
            </button>
            <button className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              Absent
            </button>
            <button className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              En Retard
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-80"
              />
            </div>

            <button className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold shadow-md">
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                N° Matricule
              </th>
              <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Nom de l'étudiant
              </th>
              <th className="text-left px-8 py-5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6 text-gray-900 font-medium">
                  {student.id}
                </td>
                <td className="px-8 py-6 text-gray-900 font-medium">
                  {student.name}
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`px-5 py-2 rounded-lg font-medium transition-all ${
                        selectedStatus[student.id] === 'present'
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      Présent
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`px-5 py-2 rounded-lg font-medium transition-all ${
                        selectedStatus[student.id] === 'absent'
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`px-5 py-2 rounded-lg font-medium transition-all ${
                        selectedStatus[student.id] === 'late'
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      En Retard
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Card */}
      <div className="mt-8 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Résumé de la séance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {students.length}
            </div>
            <div className="text-gray-600 font-medium">Total étudiants</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {Object.values(selectedStatus).filter(s => s === 'present').length}
            </div>
            <div className="text-gray-600 font-medium">Présents</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {Object.values(selectedStatus).filter(s => s === 'absent').length}
            </div>
            <div className="text-gray-600 font-medium">Absents</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-amber-200">
            <div className="text-3xl font-bold text-amber-600 mb-1">
              {Object.values(selectedStatus).filter(s => s === 'late').length}
            </div>
            <div className="text-gray-600 font-medium">En retard</div>
          </div>
        </div>
      </div>
    </div>
  );
}
