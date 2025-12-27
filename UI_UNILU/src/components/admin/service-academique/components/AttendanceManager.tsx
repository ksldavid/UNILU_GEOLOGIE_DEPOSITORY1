import { useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Users, Clock } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    attendance: number;
}

interface Request {
    id: string;
    student: string;
    course: string;
    date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface Absence {
    id: string;
    studentId: string;
    date: string;
    course: string;
    justified: boolean;
}

const MOCK_STUDENTS: Student[] = [
    { id: '1', name: 'Alice Konan', attendance: 85 },
    { id: '2', name: 'Jean Kabeya', attendance: 62 },
    { id: '3', name: 'Marc Lwamba', attendance: 28 },
    { id: '4', name: 'Sophie Tshimabanga', attendance: 92 },
    { id: '5', name: 'Paul Mwepu', attendance: 45 },
    { id: '6', name: 'Marie Kalala', attendance: 71 },
];

const MOCK_REQUESTS: Request[] = [
    { id: 'r1', student: 'Jean Kabeya', course: 'Géologie Structurale', date: '2023-11-15', reason: 'Maladie (Certificat médical joint)', status: 'pending' },
    { id: 'r2', student: 'Marc Lwamba', course: 'Pétrologie', date: '2023-11-10', reason: 'Deuil familial', status: 'rejected' },
];

const MOCK_ABSENCES: Absence[] = [
    { id: 'a1', studentId: '2', date: '2023-11-20', course: 'Géologie Structurale', justified: false },
    { id: 'a2', studentId: '2', date: '2023-11-22', course: 'Minéralogie', justified: false },
    { id: 'a3', studentId: '3', date: '2023-11-25', course: 'Pétrologie', justified: false },
]

export function AttendanceManager() {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showAllStudents, setShowAllStudents] = useState<boolean>(false);
    const [showAllRequests, setShowAllRequests] = useState<boolean>(false);
    const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'good' | 'average' | 'bad'>('all');


    // Derived Statistics
    const goodAttendance = MOCK_STUDENTS.filter(s => s.attendance > 69).length;
    const avgAttendance = MOCK_STUDENTS.filter(s => s.attendance >= 40 && s.attendance <= 69).length;
    const badAttendance = MOCK_STUDENTS.filter(s => s.attendance < 40).length;

    const overallAverage = Math.round(MOCK_STUDENTS.reduce((acc, curr) => acc + curr.attendance, 0) / MOCK_STUDENTS.length);

    const handleJustifyAbsence = (absence: Absence) => {
        // Logic to open modal or mark as justified
        const reason = prompt("Veuillez entrer le motif de justification :");
        if (reason) {
            alert(`Absence du ${absence.date} justifiée : ${reason}`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex flex-wrap gap-4 items-center">
                <h2 className="text-xl font-bold text-[#1B4332] mr-4">Filtres</h2>
                <select
                    className="bg-[#F1F8F4] border border-[#1B4332]/10 text-[#1B4332] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">Sélectionner une promotion</option>
                    <option value="bac1">Bac 1</option>
                    <option value="bac2">Bac 2</option>
                    <option value="bac3">Bac 3</option>
                </select>

                <select
                    className="bg-[#F1F8F4] border border-[#1B4332]/10 text-[#1B4332] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    disabled={!selectedClass}
                >
                    <option value="">Sélectionner un cours</option>
                    <option value="geo101">Géologie Structurale</option>
                    <option value="pet202">Pétrologie</option>
                    <option value="min303">Minéralogie</option>
                </select>
            </div>

            {!selectedCourse ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-[#F1F8F4] rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-[#1B4332] opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1B4332] mb-2">Aucune donnée affichée</h3>
                    <p className="text-[#52796F] text-center max-w-md">
                        Veuillez sélectionner une <span className="font-bold">Promotion</span> et un <span className="font-bold">Cours</span> ci-dessus pour visualiser les données d'assiduité.
                    </p>
                </div>
            ) : (
                <>
                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Overall Stat */}
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex flex-col items-center justify-center">
                            <h3 className="text-[#52796F] font-bold mb-4">Moyenne Globale</h3>
                            <div className="w-40 h-40 rounded-full border-8 border-[#1B4332] flex items-center justify-center shadow-lg shadow-[#1B4332]/10 bg-[#F1F8F4]">
                                <span className="text-4xl font-bold text-[#1B4332]">{overallAverage}%</span>
                            </div>
                            <p className="mt-4 text-sm text-[#52796F] text-center px-4">
                                Le taux de présence moyen pour ce cours est {overallAverage > 50 ? 'satisfaisant' : 'préoccupant'}.
                            </p>
                        </div>

                        {/* Distribution Graph */}
                        <div className="md:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                            <h3 className="text-[#1B4332] font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Répartition de l'Assiduité
                            </h3>
                            <div className="flex items-center gap-8">
                                {/* Visual Bars */}
                                <div className="flex-1 space-y-4">
                                    <div
                                        onClick={() => setAttendanceFilter(attendanceFilter === 'good' ? 'all' : 'good')}
                                        className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-all"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-[#1B4332]"></div>
                                                <span className="text-sm font-bold text-[#1B4332]">Bonne (&gt;69%)</span>
                                            </div>
                                            <button className="text-sm font-bold text-[#1B4332] hover:underline">{goodAttendance} étudiants</button>
                                        </div>
                                        <div className="w-full bg-gray-100 h-8 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1B4332] rounded-full transition-all duration-500"
                                                style={{ width: `${(goodAttendance / MOCK_STUDENTS.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        {attendanceFilter === 'good' && (
                                            <p className="text-xs text-[#52796F] mt-2 italic">Filtre actif - Cliquez pour désactiver</p>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => setAttendanceFilter(attendanceFilter === 'average' ? 'all' : 'average')}
                                        className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-all"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-[#F4A261]"></div>
                                                <span className="text-sm font-bold text-[#1B4332]">Moyenne (40-69%)</span>
                                            </div>
                                            <button className="text-sm font-bold text-[#1B4332] hover:underline">{avgAttendance} étudiants</button>
                                        </div>
                                        <div className="w-full bg-gray-100 h-8 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#F4A261] rounded-full transition-all duration-500"
                                                style={{ width: `${(avgAttendance / MOCK_STUDENTS.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        {attendanceFilter === 'average' && (
                                            <p className="text-xs text-[#52796F] mt-2 italic">Filtre actif - Cliquez pour désactiver</p>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => setAttendanceFilter(attendanceFilter === 'bad' ? 'all' : 'bad')}
                                        className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-all"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-[#E76F51]"></div>
                                                <span className="text-sm font-bold text-[#1B4332]">Critique (&lt;40%)</span>
                                            </div>
                                            <button className="text-sm font-bold text-[#1B4332] hover:underline">{badAttendance} étudiants</button>
                                        </div>
                                        <div className="w-full bg-gray-100 h-8 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#E76F51] rounded-full transition-all duration-500"
                                                style={{ width: `${(badAttendance / MOCK_STUDENTS.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        {attendanceFilter === 'bad' && (
                                            <p className="text-xs text-[#52796F] mt-2 italic">Filtre actif - Cliquez pour désactiver</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[#1B4332] font-bold flex items-center gap-2">
                                <Users className="w-5 h-5" /> Liste des Étudiants par Assiduité
                                {attendanceFilter !== 'all' && (
                                    <span className="text-xs bg-[#1B4332] text-white px-2 py-1 rounded-full">Filtré</span>
                                )}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {MOCK_STUDENTS
                                .filter(s => {
                                    if (attendanceFilter === 'good') return s.attendance > 69;
                                    if (attendanceFilter === 'average') return s.attendance >= 40 && s.attendance <= 69;
                                    if (attendanceFilter === 'bad') return s.attendance < 40;
                                    return true;
                                })
                                .sort((a, b) => b.attendance - a.attendance)
                                .slice(0, showAllStudents ? undefined : 6)
                                .map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedStudent?.id === student.id ? 'border-[#1B4332] bg-[#F1F8F4] ring-2 ring-[#1B4332]/10' : 'border-[#1B4332]/10 hover:border-[#1B4332]/30 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-[#1B4332]">{student.name}</span>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${student.attendance > 69 ? 'bg-green-100 text-green-700' :
                                                student.attendance >= 40 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {student.attendance}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${student.attendance > 69 ? 'bg-[#1B4332]' :
                                                    student.attendance >= 40 ? 'bg-[#F4A261]' :
                                                        'bg-[#E76F51]'
                                                    }`}
                                                style={{ width: `${student.attendance}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        {MOCK_STUDENTS.filter(s => {
                            if (attendanceFilter === 'good') return s.attendance > 69;
                            if (attendanceFilter === 'average') return s.attendance >= 40 && s.attendance <= 69;
                            if (attendanceFilter === 'bad') return s.attendance < 40;
                            return true;
                        }).length > 6 && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowAllStudents(!showAllStudents)}
                                        className="px-6 py-2 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#2D5F4C] transition-colors"
                                    >
                                        {showAllStudents ? 'Voir moins' : 'Voir plus'}
                                    </button>
                                </div>
                            )}
                    </div>

                    {/* Bottom Section: Requests & Absences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Requests History */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                            <h3 className="text-[#1B4332] font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" /> Historique des Demandes
                            </h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {MOCK_REQUESTS.slice(0, showAllRequests ? undefined : 3).map(req => (
                                    <div key={req.id} className="p-4 rounded-xl border border-[#1B4332]/10 hover:shadow-sm transition-all bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-[#1B4332]">{req.student}</p>
                                                <p className="text-xs text-[#52796F]">{req.date}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${req.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Validé' : 'Refusé'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#1B4332] italic bg-white p-3 rounded-lg border border-[#1B4332]/5">
                                            "{req.reason}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {MOCK_REQUESTS.length > 3 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => setShowAllRequests(!showAllRequests)}
                                        className="text-sm text-[#1B4332] font-medium hover:underline"
                                    >
                                        {showAllRequests ? 'Voir moins' : `Voir plus (${MOCK_REQUESTS.length - 3} autres)`}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Absences Management */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                            <h3 className="text-[#1B4332] font-bold mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Gestion des Absences
                            </h3>

                            {!selectedStudent ? (
                                <div className="h-[200px] flex flex-col items-center justify-center text-[#52796F] bg-[#F1F8F4] rounded-[24px]">
                                    <Users className="w-10 h-10 mb-2 opacity-50" />
                                    <p>Sélectionnez un étudiant ci-dessus</p>
                                    <p className="text-xs">pour voir ses absences individuelles</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-[#1B4332]/10">
                                        <div>
                                            <h4 className="font-bold text-[#1B4332]">{selectedStudent.name}</h4>
                                            <p className="text-xs text-[#52796F]">Absences enregistrées</p>
                                        </div>
                                        <button onClick={() => setSelectedStudent(null)} className="text-xs text-[#52796F] hover:text-[#1B4332]">
                                            Fermer
                                        </button>
                                    </div>

                                    {MOCK_ABSENCES.filter(a => a.studentId === selectedStudent.id).length === 0 ? (
                                        <p className="text-center py-8 text-green-600 font-medium">Aucune absence injustifiée !</p>
                                    ) : (
                                        MOCK_ABSENCES.filter(a => a.studentId === selectedStudent.id).map(absence => (
                                            <div key={absence.id} className="flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-red-200 text-red-700 flex items-center justify-center">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1B4332]">{absence.date}</p>
                                                        <p className="text-xs text-red-600">Non Justifiée</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleJustifyAbsence(absence)}
                                                    className="px-3 py-1.5 bg-white text-xs font-bold text-[#1B4332] rounded-lg border border-[#1B4332]/10 hover:bg-[#1B4332] hover:text-white transition-colors"
                                                >
                                                    Justifier
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}
