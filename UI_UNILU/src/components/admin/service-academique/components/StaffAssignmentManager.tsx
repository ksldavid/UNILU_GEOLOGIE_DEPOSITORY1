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
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<string>('2025-2026');
    const [selectedAssignment, setSelectedAssignment] = useState<StaffAssignment | null>(null);
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
    }, []);

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

    const filtered = assignments.filter(a =>
        (a.profName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.profId.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRole === 'all' || a.role === filterRole) &&
        (a.academicYear === filterYear)
    );

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
        if (!selectedAssignment || !targetStaffId) return;

        setIsProcessing(true);
        try {
            const role = editMode === 'replace_prof' ? 'PROFESSOR' : 'ASSISTANT';

            await staffService.assignStaff({
                userId: targetStaffId,
                courseCode: selectedAssignment.courseCode,
                role: role,
                academicYear: selectedAssignment.academicYear
            });

            // Reset and refresh
            setEditMode('none');
            setTargetStaffId('');
            fetchAssignments();

            if (role === 'PROFESSOR') {
                setSelectedAssignment(null);
            }

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
                        placeholder="Rechercher un professeur ou un cours..."
                        className="bg-transparent border-none outline-none text-sm w-full text-[#1B4332]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="bg-[#F1F8F4] px-4 py-2 rounded-xl border border-[#1B4332]/5 text-sm text-[#1B4332] outline-none"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    <option value="all">Tous les rôles</option>
                    <option value="PROFESSOR">Titulaires (Professeurs)</option>
                    <option value="ASSISTANT">Assistants</option>
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
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Professeur / Assistant</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Cours Assigné</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Rôle</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Classe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B4332]/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
                                            <p className="text-sm text-[#52796F]">Chargement des données...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length > 0 ? (
                                filtered.map((assignment) => (
                                    <tr
                                        key={assignment.id}
                                        onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setEditMode('none');
                                        }}
                                        className="hover:bg-[#F1F8F4]/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-[#1B4332] rounded-lg flex items-center justify-center">
                                                    <GraduationCap className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#1B4332]">{assignment.profName}</p>
                                                    <p className="text-[10px] text-[#52796F] font-medium">{assignment.profTitle}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-[#52796F]">
                                            {assignment.profId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <School className="w-4 h-4 text-[#52796F]" />
                                                <div>
                                                    <p className="text-sm font-medium text-[#1B4332]">{assignment.courseName}</p>
                                                    <p className="text-[10px] text-[#52796F]">{assignment.courseCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${assignment.role === 'PROFESSOR'
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                {assignment.role === 'PROFESSOR' ? <UserCheck className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                                {assignment.role === 'PROFESSOR' ? 'Titulaire' : 'Assistant'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block whitespace-nowrap bg-[#1B4332]/10 text-[#1B4332] px-3 py-1 rounded-full text-xs font-bold border border-[#1B4332]/20">
                                                {assignment.academicLevel}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : null}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#52796F]">
                        <Search className="w-12 h-12 opacity-20 mb-4" />
                        <p className="font-medium">Aucune affectation trouvée pour l'année {filterYear}</p>
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

                            {/* Warning if replacing existing professor */}
                            {newAssignmentData.role === 'PROFESSOR' && selectedCourseHasProfessor() && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-[12px] text-xs flex items-start gap-2 border border-red-100">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>Attention : Ce cours a déjà un titulaire. Si vous continuez, l'ancien titulaire sera remplacé automatiquement.</p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setShowNewAssignmentModal(false)}
                                    className="flex-1 py-3 px-4 bg-white border border-[#1B4332]/10 text-[#52796F] font-bold rounded-[16px] hover:bg-[#1B4332]/5"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={isProcessing || !newAssignmentData.courseCode || !newAssignmentData.staffId}
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

            {/* Modal Détails Affectation (Existing Edit Logic) */}
            {selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <School className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedAssignment.courseName}</h3>
                                    <p className="text-white/70 flex items-center gap-2 mt-1">
                                        <span className="font-mono bg-white/10 px-2 rounded">{selectedAssignment.courseCode}</span>
                                        <span>•</span>
                                        <span>{selectedAssignment.academicLevel}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAssignment(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {editMode === 'none' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div className="p-4 bg-[#F1F8F4] rounded-[20px] border border-[#1B4332]/10">
                                            <h4 className="text-sm font-bold text-[#1B4332] mb-3 flex items-center gap-2">
                                                <UserCheck className="w-4 h-4" />
                                                Titulaire du Cours
                                            </h4>
                                            {getCourseStaff(selectedAssignment.courseCode).filter(s => s.role === 'PROFESSOR').map(prof => (
                                                <div key={prof.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#1B4332]/5 mb-2 last:mb-0 group">
                                                    <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {prof.profName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-[#1B4332]">{prof.profName}</p>
                                                        <p className="text-xs text-[#52796F]">{prof.profTitle}</p>
                                                    </div>
                                                    {/* On ne peut pas facilement supprimer le titulaire unique sans remplacement, sauf via le gros bouton rouge en bas */}
                                                </div>
                                            ))}
                                            {getCourseStaff(selectedAssignment.courseCode).filter(s => s.role === 'PROFESSOR').length === 0 && (
                                                <div className="text-center py-4">
                                                    <p className="text-sm text-[#52796F] italic mb-2">Aucun titulaire assigné</p>
                                                    <button onClick={() => setEditMode('replace_prof')} className="text-xs text-[#1B4332] font-bold underline">Ajouter un titulaire</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-[#F1F8F4] rounded-[20px] border border-[#1B4332]/10">
                                            <h4 className="text-sm font-bold text-[#1B4332] mb-3 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Assistants
                                            </h4>
                                            {getCourseStaff(selectedAssignment.courseCode).filter(s => s.role === 'ASSISTANT').map(assist => (
                                                <div key={assist.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#1B4332]/5 mb-2 last:mb-0 group">
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {assist.profName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-[#1B4332]">{assist.profName}</p>
                                                        <p className="text-xs text-[#52796F]">{assist.profTitle}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assist.profId, assist.courseCode, assist.academicYear); }}
                                                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                                        title="Retirer cet assistant"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {getCourseStaff(selectedAssignment.courseCode).filter(s => s.role === 'ASSISTANT').length === 0 && (
                                                <p className="text-sm text-[#52796F] italic mb-3">Aucun assistant assigné</p>
                                            )}
                                            <button
                                                onClick={() => setEditMode('add_assistant')}
                                                className="w-full py-2 bg-white border border-[#1B4332]/10 rounded-lg text-xs font-bold text-[#1B4332] hover:bg-[#1B4332]/5 flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Ajouter un assistant
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#1B4332]/10 pt-6">
                                        <h4 className="text-sm font-bold text-[#1B4332] mb-4">Que souhaitez-vous faire ?</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className="py-4 px-4 bg-white border border-[#1B4332]/20 text-[#1B4332] font-bold rounded-[16px] hover:bg-[#F1F8F4] transition-colors flex items-center justify-center gap-3 group"
                                                onClick={() => setEditMode('replace_prof')}
                                            >
                                                <div className="w-10 h-10 bg-[#1B4332]/5 rounded-xl flex items-center justify-center group-hover:bg-[#1B4332]/10 transition-colors">
                                                    <UserCheck className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-sm">Changer le Titulaire</span>
                                                    <span className="block text-[10px] text-[#52796F] font-normal">Remplacer le professeur principal</span>
                                                </div>
                                            </button>

                                            <button
                                                className="py-4 px-4 bg-white border border-[#1B4332]/20 text-[#1B4332] font-bold rounded-[16px] hover:bg-[#F1F8F4] transition-colors flex items-center justify-center gap-3 group"
                                                onClick={() => setEditMode('add_assistant')}
                                            >
                                                <div className="w-10 h-10 bg-[#1B4332]/5 rounded-xl flex items-center justify-center group-hover:bg-[#1B4332]/10 transition-colors">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-sm">Ajouter un Assistant</span>
                                                    <span className="block text-[10px] text-[#52796F] font-normal">Renforcer l'équipe enseignante</span>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-[#1B4332]/5">
                                            <button
                                                onClick={() => handleDeleteAssignment(selectedAssignment.profId, selectedAssignment.courseCode, selectedAssignment.academicYear)}
                                                className="w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-[12px] flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Retirer {selectedAssignment.profName} complètement de ce cours
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
                                            {editMode === 'replace_prof' ? 'Remplacer le Titulaire' : 'Ajouter un Assistant'}
                                        </span>
                                    </div>

                                    <div className="bg-[#F1F8F4] p-6 rounded-[24px] border border-[#1B4332]/10">
                                        <label className="block text-sm font-bold text-[#1B4332] mb-3">
                                            Sélectionnez le {editMode === 'replace_prof' ? 'nouveau professeur titulaire' : 'nouvel assistant'} :
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
                                                        // Exclure ceux qui sont déjà dans ce cours avec CE rôle
                                                        const inCourse = getCourseStaff(selectedAssignment.courseCode);
                                                        const alreadyHasRole = inCourse.some(ic => ic.profId === s.id && ic.role === (editMode === 'replace_prof' ? 'PROFESSOR' : 'ASSISTANT'));
                                                        return !alreadyHasRole;
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
                                                {editMode === 'replace_prof' ? 'Confirmer le remplacement' : 'Ajouter l\'assistant'}
                                            </button>
                                        </div>
                                    </div>

                                    {editMode === 'replace_prof' && (
                                        <div className="mt-4 p-4 bg-orange-50 text-orange-700 text-xs rounded-[16px] border border-orange-100 flex gap-2">
                                            <div className="min-w-[4px] bg-orange-400 rounded-full"></div>
                                            <p>Attention : Cette action retirera automatiquement l'ancien titulaire de ce cours pour l'année sélectionnée.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
