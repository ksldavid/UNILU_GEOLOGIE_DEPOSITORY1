import { Search, Filter, ChevronDown } from "lucide-react";
import { useState } from "react";

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Géologie - L2');
  
  const students = [
    { id: '22GEO001', name: 'Kabeya Ilunga' },
    { id: '22GEO002', name: 'Ndaya Tshibangu' },
    { id: '22GEO003', name: 'Mulumba Kalonji' },
    { id: '22GEO004', name: 'Kazadi Mukendi' },
    { id: '22GEO005', name: 'Banza Ngoy' },
    { id: '22GEO006', name: 'Tshala Mbuyi' },
    { id: '22GEO007', name: 'Kabongo Ilunga' },
    { id: '22GEO008', name: 'Mwamba Kalala' },
  ];

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-10 mb-8 text-white">
        <h1 className="text-4xl font-semibold mb-3">
          Liste des Étudiants
        </h1>
        <p className="text-teal-50 text-lg">
          Consultez et gérez les profils de vos étudiants par cours.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Course Selector */}
          <div className="relative">
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer min-w-[200px]"
            >
              <option>Géologie - L2</option>
              <option>Géologie Structurale - L3</option>
              <option>Minéralogie - L2</option>
              <option>Paléontologie - M1</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            Filtre
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-8 py-4 text-sm font-medium text-gray-600">
                Nom Complet
              </th>
              <th className="text-left px-8 py-4 text-sm font-medium text-gray-600">
                Matricule
              </th>
              <th className="text-left px-8 py-4 text-sm font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 text-gray-900">
                  {student.name}
                </td>
                <td className="px-8 py-5 text-gray-900">
                  {student.id}
                </td>
                <td className="px-8 py-5">
                  <button className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                    Voir profil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-xl mt-4">
          Aucun étudiant trouvé pour "{searchTerm}"
        </div>
      )}
    </div>
  );
}
