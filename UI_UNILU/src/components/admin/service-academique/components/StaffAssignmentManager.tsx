import { useState, useEffect } from 'react';
import { Search, GraduationCap, School, BookOpen, UserCheck, Plus, Loader2, Trash2, X, Users, ArrowRight, Save, AlertCircle } from 'lucide-react';
import { staffService } from '../../../../services/staff';
import { courseService } from '../../../../services/course';

interface StaffAssignment {
    id: string;
    profId: string;
    profName: string;
    profTitle: string;
    courseCode: string;
    courseName: string;
    academicLevel: string;
    role: 'PROFESSOR' | 'ASSISTANT';
    academicYear: string;
    status: 'active' | 'pending';
}

interface Course {
    id: string;
    code: string;
    name: string;
    academicLevels: { displayName: string }[];
}

export function StaffAssignmentManager() {
    const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [levels, setLevels] = useState<any[]>([]); // New: Levels for filter
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevelId, setSelectedLevelId] = useState<string>('all'); // New: Level filter
    const [filterYear, setFilterYear] = useState<string>('2025-2026');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null); // Changed: Focus on course
    const [availableStaff, setAvailableStaff] = useState<any[]>([]);
    const [editMode, setEditMode] = useState<'none' | 'action_select' | 'replace_prof' | 'add_assistant'>('none');
    const [targetStaffId, setTargetStaffId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // New Assignment State
    const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
    const [newAssignmentData, setNewAssignmentData] = useState({
        courseCode: '',
        staffId: '',
        role: 'PROFESSOR',
        academicYear: '2025-2026'
    });

    useEffect(() => {
        fetchAssignments();
        fetchAvailableStaff();
        fetchCourses();
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        try {
            const data = await courseService.getLevels();
            setLevels(data);
        } catch (error) {
            console.error("Erreur niveaux:", error);
        }
    };

    const fetchAvailableStaff = async () => {
        try {
            const staff = await staffService.getAvailableStaff();
            setAvailableStaff(staff);
        } catch (error) {
            console.error("Erreur chargement personnel:", error);
        }
    };

    const fetchCourses = async () => {
        try {
            const coursesData = await courseService.getCourses();
            setCourses(coursesData);
        } catch (error) {
            console.error("Erreur chargement cours:", error);
        }
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await staffService.getAssignments();
            console.log("Assignments fetched:", data);

            const processed: StaffAssignment[] = data.map((enr: any) => {
                const level = enr.course?.academicLevels?.[0]?.displayName || 'Non défini';

                return {
                    id: `${enr.userId}-${enr.courseCode}-${enr.academicYear}`,
                    profId: enr.userId,
                    profName: enr.user?.name || 'Inconnu',
                    profTitle: enr.user?.professorProfile?.title || 'Enseignant',
                    courseCode: enr.courseCode,
                    courseName: enr.course?.name || 'Inconnu',
                    academicLevel: level,
                    role: enr.role,
                    academicYear: enr.academicYear,
                    status: 'active'
                };
            });

            setAssignments(processed);
        } catch (error) {
            console.error("Erreur lors du chargement des affectations:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses
        .filter(c => {
            // Filter by level
            if (selectedLevelId !== 'all') {
                return c.academicLevels?.some((l: any) => l.id.toString() === selectedLevelId);
            }
            return true;
        })
        .filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    const getCourseStaff = (courseCode: string) => {
        return assignments.filter(a => a.courseCode === courseCode && a.academicYear === filterYear);
    };

    const handleDeleteAssignment = async (userId: string, courseCode: string, academicYear: string) => {
        if (!confirm(`Voulez-vous vraiment retirer cette personne du cours ?`)) return;

        try {
            await staffService.removeStaff({ userId, courseCode, academicYear });
            // Refresh local state if deleting the selected assignment main user
            if (selectedAssignment && selectedAssignment.profId === userId && selectedAssignment.courseCode === courseCode) {
                setSelectedAssignment(null);
            }
            // Refresh list
            fetchAssignments();
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const handleAssignStaff = async () => {
        // Logic for EDIT mode
        if (!selectedCourse || !targetStaffId) return;

        // Check limits
        const existingStaff = getCourseStaff(selectedCourse.code);
        const role = editMode === 'replace_prof' ? 'PROFESSOR' : 'ASSISTANT';

        if (role === 'PROFESSOR' && existingStaff.filter(s => s.role === 'PROFESSOR').length >= 5) {
            alert("Limite atteinte : maximum 5 titulaires par cours.");
            return;
        }
        if (role === 'ASSISTANT' && existingStaff.filter(s => s.role === 'ASSISTANT').length >= 10) {
            alert("Limite atteinte : maximum 10 assistants par cours.");
            return;
        }

        setIsProcessing(true);
        try {
            await staffService.assignStaff({
                userId: targetStaffId,
                courseCode: selectedCourse.code,
                role: role,
                academicYear: filterYear
            });

            setEditMode('none');
            setTargetStaffId('');
            fetchAssignments();
        } catch (error) {
            console.error("Erreur assignation:", error);
            alert("Une erreur est survenue.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNewAssignmentSubmit = async () => {
        // Logic for NEW Assignment mode
        if (!newAssignmentData.courseCode || !newAssignmentData.staffId || !newAssignmentData.role) return;

        // Check limits before submitting
        const existingStaff = getCourseStaff(newAssignmentData.courseCode);
        if (newAssignmentData.role === 'PROFESSOR' && existingStaff.filter(s => s.role === 'PROFESSOR').length >= 5) {
            alert("Limite atteinte : maximum 5 titulaires autorisé pour ce cours.");
            return;
        }
        if (newAssignmentData.role === 'ASSISTANT' && existingStaff.filter(s => s.role === 'ASSISTANT').length >= 10) {
            alert("Limite atteinte : maximum 10 assistants autorisés pour ce cours.");
            return;
        }

        setIsProcessing(true);
        try {
            await staffService.assignStaff({
                userId: newAssignmentData.staffId,
                courseCode: newAssignmentData.courseCode,
                role: newAssignmentData.role,
                academicYear: newAssignmentData.academicYear
            });

            setShowNewAssignmentModal(false);
            setNewAssignmentData({
                courseCode: '',
                staffId: '',
                role: 'PROFESSOR',
                academicYear: '2025-2026'
            });
            fetchAssignments();
        } catch (error) {
            console.error("Erreur nouvelle affection:", error);
            alert("Une erreur est survenue lors de l'affectation.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper check if course already has a professor
    const selectedCourseHasProfessor = () => {
        if (!newAssignmentData.courseCode) return false;
        const staff = getCourseStaff(newAssignmentData.courseCode);
        return staff.some(s => s.role === 'PROFESSOR');
    };

    return (
        <div className="flex flex-col h-full space-y-6 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B4332]">Charge Horaire & Personnel</h2>
                    <p className="text-sm text-[#52796F]">Gestion des affectations Professeurs - Cours</p>
                </div>
                <button
                    onClick={() => setShowNewAssignmentModal(true)}
                    className="flex items-center gap-2 bg-[#1B4332] text-white px-6 py-2.5 rounded-[16px] font-bold hover:shadow-lg transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Nouvelle Affectation
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-[24px] border border-[#1B4332]/10 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] flex items-center gap-3 bg-[#F1F8F4] px-4 py-2 rounded-xl border border-[#1B4332]/5">
                    <Search className="w-5 h-5 text-[#52796F]" />
                    <input
                        type="text"
                        placeholder="Rechercher un cours par nom ou code..."
                        className="bg-transparent border-none outline-none text-sm w-full text-[#1B4332]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="bg-[#F1F8F4] px-4 py-2 rounded-xl border border-[#1B4332]/5 text-sm text-[#1B4332] outline-none"
                    value={selectedLevelId}
                    onChange={(e) => setSelectedLevelId(e.target.value)}
                >
                    <option value="all">Toutes les classes</option>
                    {levels.map(l => (
                        <option key={l.id} value={l.id.toString()}>{l.displayName}</option>
                    ))}
                </select>

                <select
                    className="bg-[#F1F8F4] px-4 py-2 rounded-xl border border-[#1B4332]/5 text-sm text-[#1B4332] outline-none"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                >
                    <option value="2025-2026">Année 2025-2026</option>
                </select>
            </div>

            {/* Table View */}
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-[24px] border border-[#1B4332]/10 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1B4332]/5 border-b border-[#1B4332]/10">
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Cours</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Classe(s)</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Effectif Académique</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B4332]/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
                                            <p className="text-sm text-[#52796F]">Chargement des données...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => {
                                    const staff = getCourseStaff(course.code);
                                    const profs = staff.filter(s => s.role === 'PROFESSOR');
                                    const assistants = staff.filter(s => s.role === 'ASSISTANT');

                                    return (
                                        <tr
                                            key={course.code}
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                setEditMode('none');
                                            }}
                                            className="hover:bg-[#F1F8F4]/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 text-sm font-mono font-bold text-[#1B4332]">
                                                {course.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-[#1B4332] rounded-lg flex items-center justify-center">
                                                        <School className="w-4 h-4 text-white" />
                                                    </div>
                                                    <p className="text-sm font-bold text-[#1B4332]">{course.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {course.academicLevels.map((l: any, i: number) => (
                                                        <span key={i} className="inline-block bg-[#1B4332]/10 text-[#1B4332] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#1B4332]/20">
                                                            {l.displayName}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5" title={`${profs.length} Titulaire(s)`}>
                                                        <UserCheck className="w-4 h-4 text-purple-600" />
                                                        <span className="text-sm font-bold text-purple-700">{profs.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title={`${assistants.length} Assistant(s)`}>
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-bold text-blue-700">{assistants.length}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : null}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredCourses.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#52796F]">
                        <Search className="w-12 h-12 opacity-20 mb-4" />
                        <p className="font-medium">Aucun cours trouvé</p>
                    </div>
                )}
            </div>

            {/* Modal Nouvelle Affectation */}
            {showNewAssignmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Nouvelle Affectation
                            </h3>
                            <button
                                onClick={() => setShowNewAssignmentModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Course Selection */}
                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-1">Cours</label>
                                <select
                                    className="w-full h-12 px-4 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] outline-none focus:border-[#1B4332]"
                                    value={newAssignmentData.courseCode}
                                    onChange={(e) => setNewAssignmentData({ ...newAssignmentData, courseCode: e.target.value })}
                                >
                                    <option value="">-- Sélectionner un cours --</option>
                                    {courses.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.name} ({c.code}) - {c.academicLevels?.[0]?.displayName || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Staff Selection */}
                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-1">Membre du personnel</label>
                                <select
                                    className="w-full h-12 px-4 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] outline-none focus:border-[#1B4332]"
                                    value={newAssignmentData.staffId}
                                    onChange={(e) => setNewAssignmentData({ ...newAssignmentData, staffId: e.target.value })}
                                >
                                    <option value="">-- Sélectionner une personne --</option>
                                    {availableStaff.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.professorProfile?.title ? `(${s.professorProfile.title})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-1">Rôle</label>
                                <div className="flex gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            className="hidden peer"
                                            checked={newAssignmentData.role === 'PROFESSOR'}
                                            onChange={() => setNewAssignmentData({ ...newAssignmentData, role: 'PROFESSOR' })}
                                        />
                                        <div className="h-12 flex items-center justify-center gap-2 rounded-[16px] border border-[#1B4332]/10 peer-checked:bg-[#1B4332] peer-checked:text-white transition-all bg-[#F1F8F4] text-[#52796F]">
                                            <UserCheck className="w-4 h-4" />
                                            <span className="text-sm font-bold">Titulaire</span>
                                        </div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            className="hidden peer"
                                            checked={newAssignmentData.role === 'ASSISTANT'}
                                            onChange={() => setNewAssignmentData({ ...newAssignmentData, role: 'ASSISTANT' })}
                                        />
                                        <div className="h-12 flex items-center justify-center gap-2 rounded-[16px] border border-[#1B4332]/10 peer-checked:bg-[#1B4332] peer-checked:text-white transition-all bg-[#F1F8F4] text-[#52796F]">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm font-bold">Assistant</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Warning if limits reached */}
                            {newAssignmentData.courseCode && (
                                <>
                                    {newAssignmentData.role === 'PROFESSOR' && getCourseStaff(newAssignmentData.courseCode).filter(s => s.role === 'PROFESSOR').length >= 5 && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-[12px] text-xs flex items-start gap-2 border border-red-100">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p>Limite atteinte : Ce cours a déjà 5 titulaires. Vous ne pouvez pas en ajouter d'autres.</p>
                                        </div>
                                    )}
                                    {newAssignmentData.role === 'ASSISTANT' && getCourseStaff(newAssignmentData.courseCode).filter(s => s.role === 'ASSISTANT').length >= 10 && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-[12px] text-xs flex items-start gap-2 border border-red-100">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p>Limite atteinte : Ce cours a déjà 10 assistants.</p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setShowNewAssignmentModal(false)}
                                    className="flex-1 py-3 px-4 bg-white border border-[#1B4332]/10 text-[#52796F] font-bold rounded-[16px] hover:bg-[#1B4332]/5"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={
                                        isProcessing ||
                                        !newAssignmentData.courseCode ||
                                        !newAssignmentData.staffId ||
                                        (newAssignmentData.role === 'PROFESSOR' && getCourseStaff(newAssignmentData.courseCode).filter(s => s.role === 'PROFESSOR').length >= 5) ||
                                        (newAssignmentData.role === 'ASSISTANT' && getCourseStaff(newAssignmentData.courseCode).filter(s => s.role === 'ASSISTANT').length >= 10)
                                    }
                                    onClick={handleNewAssignmentSubmit}
                                    className="flex-1 py-3 px-4 bg-[#1B4332] text-white font-bold rounded-[16px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Détails Cours (Updated from selectedAssignment to selectedCourse) */}
            {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <School className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedCourse.name}</h3>
                                    <p className="text-white/70 flex items-center gap-2 mt-1">
                                        <span className="font-mono bg-white/10 px-2 rounded">{selectedCourse.code}</span>
                                        <span>•</span>
                                        <span className="flex gap-1">
                                            {selectedCourse.academicLevels.map((l: any, i: number) => (
                                                <span key={i}>{l.displayName}{i < selectedCourse.academicLevels.length - 1 ? ',' : ''}</span>
                                            ))}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            {editMode === 'none' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        <div className="flex flex-col h-full p-5 bg-[#F1F8F4] rounded-[32px] border border-[#1B4332]/10 shadow-sm">
                                            <div className="flex items-center justify-between mb-5 px-1">
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#1B4332]/60 flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4 text-[#1B4332]" />
                                                    Titulaires ({getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').length}/5)
                                                </h4>
                                            </div>
                                            <div className="space-y-3 flex-1 scrollbar-hide overflow-y-auto max-h-[220px]">
                                                {getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').map(prof => (
                                                    <div key={prof.profId} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#1B4332]/5 group animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                                                            {prof.profName.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-[#1B4332] leading-tight">{prof.profName}</p>
                                                            <p className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider mt-0.5">{prof.profTitle}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(prof.profId, prof.courseCode, prof.academicYear); }}
                                                            className="p-2 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all active:scale-90"
                                                            title="Retirer ce titulaire"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').length === 0 && (
                                                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center opacity-40">
                                                        <AlertCircle className="w-8 h-8 mb-2" />
                                                        <p className="text-xs font-bold italic">Aucun titulaire</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col h-full p-5 bg-[#F1F8F4] rounded-[32px] border border-[#1B4332]/10 shadow-sm">
                                            <div className="flex items-center justify-between mb-5 px-1">
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#1B4332]/60 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#1B4332]" />
                                                    Assistants ({getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').length}/10)
                                                </h4>
                                            </div>
                                            <div className="space-y-3 flex-1 scrollbar-hide overflow-y-auto max-h-[220px]">
                                                {getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').map(assist => (
                                                    <div key={assist.profId} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#1B4332]/5 group animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                                                            {assist.profName.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-[#1B4332] leading-tight">{assist.profName}</p>
                                                            <p className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider mt-0.5">{assist.profTitle}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assist.profId, assist.courseCode, assist.academicYear); }}
                                                            className="p-2 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all active:scale-90"
                                                            title="Retirer cet assistant"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').length === 0 && (
                                                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center opacity-40">
                                                        <Users className="w-8 h-8 mb-2" />
                                                        <p className="text-xs font-bold italic">Aucun assistant</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#1B4332]/10 pt-8 mt-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1B4332]/40 mb-6 text-center">Actions de Management</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                disabled={getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').length >= 5}
                                                className="p-5 bg-white border-2 border-[#1B4332]/10 text-[#1B4332] font-black rounded-[28px] hover:border-[#1B4332]/30 hover:bg-[#F1F8F4] transition-all flex items-center gap-4 group shadow-sm active:scale-95 disabled:opacity-50"
                                                onClick={() => setEditMode('replace_prof')}
                                            >
                                                <div className="w-12 h-12 bg-[#1B4332]/5 rounded-2xl flex items-center justify-center group-hover:bg-[#1B4332]/10 transition-colors shadow-inner">
                                                    <UserCheck className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-sm uppercase tracking-tight">Ajouter Titulaire</span>
                                                    <span className="block text-[10px] text-[#52796F] font-bold uppercase opacity-60">Max 5 par cours</span>
                                                </div>
                                            </button>

                                            <button
                                                disabled={getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').length >= 10}
                                                className="p-5 bg-white border-2 border-[#1B4332]/10 text-[#1B4332] font-black rounded-[28px] hover:border-[#1B4332]/30 hover:bg-[#F1F8F4] transition-all flex items-center gap-4 group shadow-sm active:scale-95 disabled:opacity-50"
                                                onClick={() => setEditMode('add_assistant')}
                                            >
                                                <div className="w-12 h-12 bg-[#1B4332]/5 rounded-2xl flex items-center justify-center group-hover:bg-[#1B4332]/10 transition-colors shadow-inner">
                                                    <Plus className="w-6 h-6 border-2 border-[#1B4332] rounded-lg" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-sm uppercase tracking-tight">Nouvel Assistant</span>
                                                    <span className="block text-[10px] text-[#52796F] font-bold uppercase opacity-60">Max 10 par cours</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="flex items-center gap-2 mb-6 text-[#52796F]">
                                        <button onClick={() => { setEditMode('none'); setTargetStaffId(''); }} className="hover:text-[#1B4332] flex items-center gap-1 text-sm font-medium">
                                            <ArrowRight className="w-4 h-4 rotate-180" />
                                            Retour
                                        </button>
                                        <span className="text-[#1B4332]/20">|</span>
                                        <span className="text-[#1B4332] font-bold">
                                            {editMode === 'replace_prof' ? 'Ajouter un Titulaire' : 'Ajouter un Assistant'}
                                        </span>
                                    </div>

                                    <div className="bg-[#F1F8F4] p-6 rounded-[24px] border border-[#1B4332]/10">
                                        <label className="block text-sm font-bold text-[#1B4332] mb-3">
                                            Sélectionnez la personne à ajouter :
                                        </label>

                                        <div className="relative mb-6">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52796F]" />
                                            <select
                                                className="w-full h-12 pl-12 pr-4 bg-white border border-[#1B4332]/10 rounded-[16px] outline-none focus:border-[#1B4332] transition-colors appearance-none cursor-pointer"
                                                value={targetStaffId}
                                                onChange={(e) => setTargetStaffId(e.target.value)}
                                            >
                                                <option value="">-- Choisir une personne --</option>
                                                {availableStaff
                                                    .filter(s => {
                                                        // Exclure ceux qui sont déjà dans ce cours
                                                        const inCourse = getCourseStaff(selectedCourse.code);
                                                        const alreadyInCourse = inCourse.some(ic => ic.profId === s.id);
                                                        return !alreadyInCourse;
                                                    })
                                                    .map(staff => (
                                                        <option key={staff.id} value={staff.id}>
                                                            {staff.name} {staff.professorProfile?.title ? `(${staff.professorProfile.title})` : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setEditMode('none'); setTargetStaffId(''); }}
                                                className="flex-1 py-3 px-4 bg-white border border-[#1B4332]/10 text-[#52796F] font-bold rounded-[16px] hover:bg-[#1B4332]/5"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                disabled={!targetStaffId || isProcessing}
                                                onClick={handleAssignStaff}
                                                className="flex-1 py-3 px-4 bg-[#1B4332] text-white font-bold rounded-[16px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                Confirmer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
