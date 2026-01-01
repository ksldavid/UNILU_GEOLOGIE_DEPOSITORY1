import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Users, Clock, Loader2 } from 'lucide-react';
import { courseService } from '../../../../services/course';
import { userService } from '../../../../services/user';

interface Student {
    id: string;
    name: string;
    attendance: number;
}


export function AttendanceManager() {
    const [levels, setLevels] = useState<{ id: number; name: string; displayName: string }[]>([]);
    const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showAllStudents, setShowAllStudents] = useState<boolean>(false);
    const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'good' | 'average' | 'bad'>('all');
    const [loading, setLoading] = useState(false);

    // Fetch levels on mount
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const data = await courseService.getLevels();
                setLevels(data);
            } catch (error) {
                console.error("Erreur niveaux:", error);
            }
        };
        fetchLevels();
    }, []);

    // Fetch courses when level changes
    useEffect(() => {
        if (selectedLevelId === null) {
            setCourses([]);
            setSelectedCourseCode('');
            return;
        }

        const fetchCourses = async () => {
            try {
                const data = await courseService.getCourses(selectedLevelId);
                setCourses(data);
                setSelectedCourseCode('');
            } catch (error) {
                console.error("Erreur cours:", error);
            }
        };
        fetchCourses();
    }, [selectedLevelId]);

    // Fetch students when course changes
    useEffect(() => {
        if (!selectedCourseCode || selectedLevelId === null) {
            setStudents([]);
            return;
        }

        const fetchStudents = async () => {
            setLoading(true);
            try {
                // Appel à l'API pour récupérer les données RÉELLES d'assiduité calculées
                const realAttendanceData = await userService.getDetailedAttendance(selectedCourseCode, selectedLevelId);
                setStudents(realAttendanceData);
            } catch (error) {
                console.error("Erreur étudiants:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedCourseCode, selectedLevelId]);

    // Derived Statistics
    const goodAttendance = students.filter(s => s.attendance > 69).length;
    const avgAttendance = students.filter(s => s.attendance >= 40 && s.attendance <= 69).length;
    const badAttendance = students.filter(s => s.attendance < 40).length;

    const overallAverage = students.length > 0
        ? Math.round(students.reduce((acc, curr) => acc + curr.attendance, 0) / students.length)
        : 0;


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex flex-wrap gap-4 items-center">
                <h2 className="text-xl font-bold text-[#1B4332] mr-4">Filtres</h2>
                <select
                    className="bg-[#F1F8F4] border border-[#1B4332]/10 text-[#1B4332] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                    value={selectedLevelId ?? ''}
                    onChange={(e) => setSelectedLevelId(e.target.value ? Number(e.target.value) : null)}
                >
                    <option value="">Sélectionner une promotion</option>
                    {levels.map(level => (
                        <option key={level.id} value={level.id}>{level.displayName || level.name}</option>
                    ))}
                </select>

                <select
                    className="bg-[#F1F8F4] border border-[#1B4332]/10 text-[#1B4332] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    disabled={selectedLevelId === null}
                >
                    <option value="">Sélectionner un cours</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.code}>{course.name}</option>
                    ))}
                </select>

                {loading && <Loader2 className="w-5 h-5 animate-spin text-[#1B4332]" />}
            </div>

            {!selectedCourseCode ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-[#F1F8F4] rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-[#1B4332] opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1B4332] mb-2">Aucune donnée affichée</h3>
                    <p className="text-[#52796F] text-center max-w-md">
                        Veuillez sélectionner une <span className="font-bold">Promotion</span> et un <span className="font-bold">Cours</span> ci-dessus pour visualiser les données d'assiduité.
                    </p>
                </div>
            ) : students.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm">
                    <Users className="w-12 h-12 text-[#1B4332] opacity-20 mb-4" />
                    <p className="text-[#52796F]">Aucun étudiant inscrit à cette promotion</p>
                </div>
            ) : (
                <>
                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Overall Stat */}
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex flex-col items-center justify-center">
                            <h3 className="text-[#52796F] font-bold mb-4">Moyenne Globale</h3>
                            <div className={`w-40 h-40 rounded-full border-8 ${overallAverage < 40 ? 'border-red-500' : 'border-[#1B4332]'} flex items-center justify-center shadow-lg shadow-[#1B4332]/10 bg-[#F1F8F4]`}>
                                <span className={`text-4xl font-bold ${overallAverage < 40 ? 'text-red-500' : 'text-[#1B4332]'}`}>{overallAverage}%</span>
                            </div>
                            <p className="mt-4 text-sm text-[#52796F] text-center px-4">
                                {overallAverage === 0
                                    ? "Aucune présence enregistrée à ce jour."
                                    : `Le taux de présence moyen pour ce cours est ${overallAverage > 50 ? 'satisfaisant' : 'préoccupant'}.`}
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
                                                style={{ width: `${students.length > 0 ? (goodAttendance / students.length) * 100 : 0}%` }}
                                            ></div>
                                        </div>
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
                                                style={{ width: `${students.length > 0 ? (avgAttendance / students.length) * 100 : 0}%` }}
                                            ></div>
                                        </div>
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
                                                style={{ width: `${students.length > 0 ? (badAttendance / students.length) * 100 : 0}%` }}
                                            ></div>
                                        </div>
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
                            {students
                                .filter(s => {
                                    if (attendanceFilter === 'good') return s.attendance > 69;
                                    if (attendanceFilter === 'average') return s.attendance >= 40 && s.attendance <= 69;
                                    if (attendanceFilter === 'bad') return s.attendance < 40;
                                    return true;
                                })
                                .sort((a, b) => b.attendance - a.attendance)
                                .slice(0, showAllStudents ? undefined : 9)
                                .map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedStudent?.id === student.id ? 'border-[#1B4332] bg-[#F1F8F4] ring-2 ring-[#1B4332]/10' : 'border-[#1B4332]/10 hover:border-[#1B4332]/30 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-[#1B4332] truncate max-w-[150px]">{student.name}</span>
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
                        {students.length > 9 && (
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

                    {/* Bottom Section: Requests & Absences (Keeping as placeholder) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                            <h3 className="text-[#1B4332] font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" /> Historique des Demandes
                            </h3>
                            <div className="flex flex-col items-center justify-center h-[200px] text-[#52796F] bg-[#F1F8F4] rounded-[24px]">
                                <p className="text-sm">Aucune demande de rectification</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                            <h3 className="text-[#1B4332] font-bold mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Gestion des Absences
                            </h3>
                            <div className="h-[200px] flex flex-col items-center justify-center text-[#52796F] bg-[#F1F8F4] rounded-[24px]">
                                <Users className="w-10 h-10 mb-2 opacity-50" />
                                <p>Sélectionnez un étudiant ci-dessus</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
