import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Users, Clock, Loader2, ChevronRight, AlertTriangle, RotateCcw, X } from 'lucide-react';
import { courseService } from '../../../../services/course';
import { attendanceService } from '../../../../services/attendance';

interface StudentSummary {
    id: string;
    name: string;
    attendance: number;
}

interface SessionStudentStatus {
    studentId: string;
    studentName: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    recordId: number | null;
}

interface AttendanceSession {
    sessionId: number;
    date: string;
    courseCode: string;
    isLocked: boolean;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    students: SessionStudentStatus[];
}

export function AttendanceManager() {
    const [levels, setLevels] = useState<{ id: number; name: string; displayName: string }[]>([]);
    const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);

    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
    const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'good' | 'average' | 'bad'>('all');
    const [loading, setLoading] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [overriding, setOverriding] = useState<number | null>(null); // sessionId being overridden
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch levels on mount
    useEffect(() => {
        courseService.getLevels().then(setLevels).catch(console.error);
    }, []);

    // Fetch courses when level changes
    useEffect(() => {
        if (selectedLevelId === null) { setCourses([]); setSelectedCourseCode(''); return; }
        courseService.getCourses(selectedLevelId).then(setCourses).catch(console.error);
        setSelectedCourseCode('');
        setSelectedStudent(null);
    }, [selectedLevelId]);

    // Fetch students + sessions when course changes
    useEffect(() => {
        if (!selectedCourseCode || selectedLevelId === null) {
            setStudents([]); setSessions([]); setSelectedStudent(null); return;
        }

        const fetchData = async () => {
            setLoading(true);
            setLoadingSessions(true);
            setSelectedStudent(null);
            try {
                const [studentsData, sessionsData] = await Promise.all([
                    (await import('../../../../services/user')).userService.getDetailedAttendance(selectedCourseCode, selectedLevelId),
                    attendanceService.getCourseSessions(selectedCourseCode)
                ]);
                setStudents(studentsData);
                setSessions(sessionsData);
            } catch (error) {
                console.error('Erreur chargement données:', error);
            } finally {
                setLoading(false);
                setLoadingSessions(false);
            }
        };
        fetchData();
    }, [selectedCourseCode, selectedLevelId]);

    // Get sessions where selected student was absent
    const studentSessions = selectedStudent
        ? sessions.map(session => {
            const studentStatus = session.students.find(s => s.studentId === selectedStudent.id);
            return {
                ...session,
                myStatus: studentStatus?.status ?? 'ABSENT',
                myRecordId: studentStatus?.recordId ?? null
            };
        })
        : [];

    const handleOverride = async (sessionId: number, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
        if (!selectedStudent) return;
        setOverriding(sessionId);
        try {
            await attendanceService.overrideAttendance(sessionId, selectedStudent.id, newStatus);
            // Update local sessions state
            setSessions(prev => prev.map(s => {
                if (s.sessionId !== sessionId) return s;
                const updatedStudents = s.students.map(st => {
                    if (st.studentId !== selectedStudent.id) return st;
                    return { ...st, status: newStatus };
                });
                const presentCount = updatedStudents.filter(st => st.status !== 'ABSENT').length;
                return { ...s, students: updatedStudents, presentCount, absentCount: s.totalStudents - presentCount };
            }));
            // Update student attendance rate locally (rough estimate)
            const totalSessions = sessions.length;
            const newPresent = sessions.filter(s => {
                if (s.sessionId === sessionId) return newStatus !== 'ABSENT';
                return s.students.find(st => st.studentId === selectedStudent.id)?.status !== 'ABSENT';
            }).length;
            const newRate = totalSessions > 0 ? Math.round((newPresent / totalSessions) * 100) : 0;
            setStudents(prev => prev.map(st => st.id === selectedStudent.id ? { ...st, attendance: newRate } : st));
            setSelectedStudent(prev => prev ? { ...prev, attendance: newRate } : prev);

            showToast(`✓ Présence de ${selectedStudent.name} mise à jour : ${newStatus === 'PRESENT' ? 'Présent' : newStatus === 'LATE' ? 'En retard' : 'Absent'}`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Erreur lors de la rectification', 'error');
        } finally {
            setOverriding(null);
        }
    };

    // Stats
    const goodAttendance = students.filter(s => s.attendance > 69).length;
    const avgAttendance = students.filter(s => s.attendance >= 40 && s.attendance <= 69).length;
    const badAttendance = students.filter(s => s.attendance < 40).length;
    const overallAverage = students.length > 0
        ? Math.round(students.reduce((acc, curr) => acc + curr.attendance, 0) / students.length)
        : 0;

    const filteredStudents = students
        .filter(s => {
            if (attendanceFilter === 'good') return s.attendance > 69;
            if (attendanceFilter === 'average') return s.attendance >= 40 && s.attendance <= 69;
            if (attendanceFilter === 'bad') return s.attendance < 40;
            return true;
        })
        .sort((a, b) => a.attendance - b.attendance); // Worst first

    const absentSessions = studentSessions.filter(s => s.myStatus === 'ABSENT');
    const presentSessions = studentSessions.filter(s => s.myStatus !== 'ABSENT');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-[#1B4332]' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex flex-wrap gap-4 items-center">
                <h2 className="text-xl font-bold text-[#1B4332] mr-4">Rectification des Présences</h2>
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
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm">
                    <div className="w-20 h-20 bg-[#F1F8F4] rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-[#1B4332] opacity-30" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1B4332] mb-2">Aucune donnée affichée</h3>
                    <p className="text-[#52796F] text-center max-w-md">
                        Sélectionnez une <span className="font-bold">Promotion</span> et un <span className="font-bold">Cours</span> pour gérer les présences.
                    </p>
                </div>
            ) : students.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm">
                    <Users className="w-12 h-12 text-[#1B4332] opacity-20 mb-4" />
                    <p className="text-[#52796F]">Aucun étudiant inscrit à cette promotion</p>
                </div>
            ) : (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-[20px] border border-[#1B4332]/10 shadow-sm text-center">
                            <div className={`text-3xl font-black ${overallAverage < 40 ? 'text-red-500' : 'text-[#1B4332]'}`}>{overallAverage}%</div>
                            <div className="text-xs text-[#52796F] font-bold mt-1">Moyenne globale</div>
                        </div>
                        <div onClick={() => setAttendanceFilter(attendanceFilter === 'good' ? 'all' : 'good')} className={`bg-white p-5 rounded-[20px] border shadow-sm text-center cursor-pointer transition-all ${attendanceFilter === 'good' ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20' : 'border-[#1B4332]/10 hover:border-[#1B4332]/30'}`}>
                            <div className="text-3xl font-black text-[#1B4332]">{goodAttendance}</div>
                            <div className="text-xs text-[#52796F] font-bold mt-1">Bonne (&gt;69%)</div>
                        </div>
                        <div onClick={() => setAttendanceFilter(attendanceFilter === 'average' ? 'all' : 'average')} className={`bg-white p-5 rounded-[20px] border shadow-sm text-center cursor-pointer transition-all ${attendanceFilter === 'average' ? 'border-orange-400 ring-2 ring-orange-200' : 'border-[#1B4332]/10 hover:border-orange-300'}`}>
                            <div className="text-3xl font-black text-orange-500">{avgAttendance}</div>
                            <div className="text-xs text-[#52796F] font-bold mt-1">Moyenne (40-69%)</div>
                        </div>
                        <div onClick={() => setAttendanceFilter(attendanceFilter === 'bad' ? 'all' : 'bad')} className={`bg-white p-5 rounded-[20px] border shadow-sm text-center cursor-pointer transition-all ${attendanceFilter === 'bad' ? 'border-red-400 ring-2 ring-red-200' : 'border-[#1B4332]/10 hover:border-red-300'}`}>
                            <div className="text-3xl font-black text-red-500">{badAttendance}</div>
                            <div className="text-xs text-[#52796F] font-bold mt-1">Critique (&lt;40%)</div>
                        </div>
                    </div>

                    {/* Main Panel: Student List + Detail */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* LEFT: Student List */}
                        <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-[#1B4332]/10 flex items-center justify-between">
                                <h3 className="font-bold text-[#1B4332] flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Étudiants
                                    {attendanceFilter !== 'all' && <span className="text-[10px] bg-[#1B4332] text-white px-2 py-0.5 rounded-full">Filtré</span>}
                                </h3>
                                <span className="text-xs text-[#52796F] font-bold">{filteredStudents.length} étudiant(s)</span>
                            </div>
                            <div className="divide-y divide-[#1B4332]/5 max-h-[500px] overflow-y-auto">
                                {filteredStudents.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`flex items-center justify-between p-4 cursor-pointer transition-all ${selectedStudent?.id === student.id ? 'bg-[#F1F8F4] border-l-4 border-[#1B4332]' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[#1B4332] truncate text-sm">{student.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${student.attendance > 69 ? 'bg-[#1B4332]' : student.attendance >= 40 ? 'bg-orange-400' : 'bg-red-500'}`}
                                                        style={{ width: `${student.attendance}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-black ${student.attendance > 69 ? 'text-[#1B4332]' : student.attendance >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                                                    {student.attendance}%
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 ml-3 shrink-0 transition-transform ${selectedStudent?.id === student.id ? 'text-[#1B4332] rotate-90' : 'text-gray-300'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Session Detail for selected student */}
                        <div className="lg:col-span-3 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm overflow-hidden">
                            {!selectedStudent ? (
                                <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                    <div className="w-16 h-16 bg-[#F1F8F4] rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-[#1B4332] opacity-30" />
                                    </div>
                                    <p className="text-[#52796F] font-bold">Sélectionnez un étudiant</p>
                                    <p className="text-[#52796F] text-sm mt-1">pour voir et corriger ses présences</p>
                                </div>
                            ) : (
                                <>
                                    {/* Student Header */}
                                    <div className="p-5 border-b border-[#1B4332]/10 flex items-center justify-between bg-[#F1F8F4]">
                                        <div>
                                            <h3 className="font-black text-[#1B4332]">{selectedStudent.name}</h3>
                                            <p className="text-xs text-[#52796F] font-bold mt-0.5">
                                                {absentSessions.length} absence(s) · {presentSessions.length} présence(s) · {sessions.length} séance(s) au total
                                            </p>
                                        </div>
                                        <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                            <X className="w-4 h-4 text-[#52796F]" />
                                        </button>
                                    </div>

                                    {loadingSessions ? (
                                        <div className="flex items-center justify-center p-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#1B4332]" />
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-center">
                                            <Clock className="w-10 h-10 text-[#1B4332] opacity-20 mb-3" />
                                            <p className="text-[#52796F] font-bold">Aucune séance enregistrée pour ce cours</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[#1B4332]/5 max-h-[500px] overflow-y-auto">
                                            {studentSessions.map(session => {
                                                const isAbsent = session.myStatus === 'ABSENT';
                                                const isLate = session.myStatus === 'LATE';
                                                const isOverriding = overriding === session.sessionId;

                                                return (
                                                    <div key={session.sessionId} className={`flex items-center justify-between p-4 gap-4 ${isAbsent ? 'bg-red-50/50' : 'bg-white'}`}>
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAbsent ? 'bg-red-500' : isLate ? 'bg-orange-400' : 'bg-[#1B4332]'}`} />
                                                            <div>
                                                                <p className="font-bold text-[#1B4332] text-sm">
                                                                    {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </p>
                                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isAbsent ? 'text-red-500' : isLate ? 'text-orange-500' : 'text-[#1B4332]'}`}>
                                                                    {isAbsent ? '✗ Absent' : isLate ? '⚠ En retard' : '✓ Présent'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {isOverriding ? (
                                                                <Loader2 className="w-5 h-5 animate-spin text-[#1B4332]" />
                                                            ) : isAbsent ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleOverride(session.sessionId, 'PRESENT')}
                                                                        className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D5F4C] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                                                    >
                                                                        <CheckCircle className="w-3 h-3" /> Présent
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleOverride(session.sessionId, 'LATE')}
                                                                        className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                                                    >
                                                                        <Clock className="w-3 h-3" /> Retard
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleOverride(session.sessionId, 'ABSENT')}
                                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                                                    title="Annuler la présence"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" /> Annuler
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
