import { useState, useEffect } from 'react';
import { Search, School, BookOpen, UserCheck, Plus, Loader2, X, Users, ArrowRight, Save, Trash2 } from 'lucide-react';
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
    totalHours: number;
    isActive: boolean;
    isCompleted: boolean;
    academicLevels: { id: number, displayName: string }[];
}

export function StaffAssignmentManager() {
    const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevelId, setSelectedLevelId] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<string>('2025-2026');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [availableStaff, setAvailableStaff] = useState<any[]>([]);
    const [editMode, setEditMode] = useState<'none' | 'action_select' | 'replace_prof' | 'add_assistant'>('none');
    const [targetStaffId, setTargetStaffId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // New Assignment State
    const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
    const [newAssignmentData, setNewAssignmentData] = useState({
        courseCode: '',
        staffId: '',
        role: 'PROFESSOR' as 'PROFESSOR' | 'ASSISTANT',
        academicYear: '2025-2026'
    });

    // Course management state
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const [isCreatingCourse, setIsCreatingCourse] = useState(false);
    const [newCourseData, setNewCourseData] = useState({
        code: '',
        name: '',
        totalHours: 45,
        academicLevelIds: [] as number[]
    });
    const [isEditingCourseName, setIsEditingCourseName] = useState(false);
    const [courseNameEdit, setCourseNameEdit] = useState('');
    const [courseHoursEdit, setCourseHoursEdit] = useState(45);

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
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (error) {
            console.error("Erreur chargement cours:", error);
            setCourses([]);
        }
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await staffService.getAssignments();
            if (!Array.isArray(data)) {
                setAssignments([]);
                return;
            }

            const processed: StaffAssignment[] = data.map((enr: any) => {
                const level = enr.course?.academicLevels?.[0]?.displayName || 'Non défini';
                return {
                    id: `${enr.userId}-${enr.courseCode}-${enr.academicYear}`,
                    profId: enr.userId,
                    profName: enr.user?.name || 'Inconnu',
                    profTitle: enr.user?.professorProfile?.title || 'Enseignant',
                    courseCode: enr.courseCode,
                    courseName: enr.course?.name || 'Inconnu',
                    totalHours: enr.course?.totalHours || 45,
                    isActive: enr.course?.isActive || false,
                    isCompleted: enr.course?.isCompleted || false,
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

    const filteredCourses = (courses || [])
        .filter(c => {
            if (selectedLevelId !== 'all') {
                return c.academicLevels?.some((l: any) => l.id?.toString() === selectedLevelId);
            }
            return true;
        })
        .filter(c =>
            (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.code || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const getCourseStaff = (courseCode: string) => {
        return assignments.filter(a => a.courseCode === courseCode && a.academicYear === filterYear);
    };

    const handleDeleteAssignment = async (userId: string, courseCode: string, academicYear: string) => {
        if (!confirm(`Voulez-vous vraiment retirer cette personne du cours ?`)) return;
        try {
            await staffService.removeStaff({ userId, courseCode, academicYear });
            fetchAssignments();
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const handleAssignStaff = async () => {
        if (!selectedCourse || !targetStaffId) return;
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

    const handleCreateCourse = async () => {
        if (!newCourseData.code || !newCourseData.name || newCourseData.academicLevelIds.length === 0) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        setIsCreatingCourse(true);
        try {
            await courseService.createCourse({
                code: newCourseData.code,
                name: newCourseData.name,
                totalHours: newCourseData.totalHours,
                academicLevelIds: newCourseData.academicLevelIds
            });
            setShowCreateCourseModal(false);
            setNewCourseData({ code: '', name: '', totalHours: 45, academicLevelIds: [] });
            fetchCourses();
            alert("Cours créé avec succès ! Les étudiants ont été inscrits automatiquement.");
        } catch (error: any) {
            alert(error.message || "Erreur lors de la création du cours");
        } finally {
            setIsCreatingCourse(false);
        }
    };

    const handleUpdateCourseName = async () => {
        if (!selectedCourse || !courseNameEdit.trim()) return;
        setIsProcessing(true);
        try {
            await courseService.updateCourse(selectedCourse.code, {
                name: courseNameEdit,
                totalHours: Number(courseHoursEdit)
            });
            setCourses(courses.map(c => c.code === selectedCourse.code ? { ...c, name: courseNameEdit, totalHours: Number(courseHoursEdit) } : c));
            setSelectedCourse({ ...selectedCourse, name: courseNameEdit, totalHours: Number(courseHoursEdit) });
            setIsEditingCourseName(false);
            fetchAssignments();
        } catch (error: any) {
            alert(error.message || "Erreur lors de la modification");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleStatus = async (field: 'isActive' | 'isCompleted') => {
        if (!selectedCourse) return;
        setIsProcessing(true);
        try {
            const newValue = !selectedCourse[field];
            await courseService.updateCourse(selectedCourse.code, { [field]: newValue });

            // Update local state
            setCourses(courses.map(c => c.code === selectedCourse.code ? { ...c, [field]: newValue } : c));
            setSelectedCourse({ ...selectedCourse, [field]: newValue });
            fetchAssignments();
        } catch (error: any) {
            alert(error.message || "Erreur de mise à jour");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteCourse = async (code: string) => {
        if (!confirm(`ATTENTION : Voulez-vous vraiment supprimer définitivement le cours ${code} ?\n\nCela supprimera également :\n- Toutes les inscriptions (étudiants et profs)\n- Tous les plannings et horaires\n- Toutes les présences et notes\n\nCette action est IRRÉVERSIBLE.`)) {
            return;
        }

        // Deuxième confirmation pour la sécurité
        const confirmCode = prompt(`Veuillez saisir le code du cours "${code}" pour confirmer la suppression :`);
        if (confirmCode !== code) {
            alert("Le code ne correspond pas. Suppression annulée.");
            return;
        }

        setIsProcessing(true);
        try {
            await courseService.deleteCourse(code);
            setCourses(courses.filter(c => c.code !== code));
            if (selectedCourse?.code === code) {
                setSelectedCourse(null);
            }
            alert("Cours supprimé avec succès.");
            fetchAssignments();
            fetchCourses();
        } catch (error: any) {
            alert(error.message || "Erreur lors de la suppression du cours");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNewAssignmentSubmit = async () => {
        if (!newAssignmentData.courseCode || !newAssignmentData.staffId || !newAssignmentData.role) return;
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

    return (
        <div className="flex flex-col h-full space-y-6 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B4332]">Charge Horaire & Personnel</h2>
                    <p className="text-sm text-[#52796F]">Gestion des affectations Professeurs - Cours</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateCourseModal(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-[16px] font-bold hover:shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Créer un Cours
                    </button>
                    <button
                        onClick={() => setShowNewAssignmentModal(true)}
                        className="flex items-center gap-2 bg-[#1B4332] text-white px-6 py-2.5 rounded-[16px] font-bold hover:shadow-lg transition-all active:scale-95"
                    >
                        <UserCheck className="w-5 h-5" />
                        Affecter Personnel
                    </button>
                </div>
            </div>

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
                    {Array.isArray(levels) && levels.map(l => (
                        <option key={l.id} value={l.id?.toString()}>{l.displayName}</option>
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

            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-[24px] border border-[#1B4332]/10 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1B4332]/5 border-b border-[#1B4332]/10">
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Cours</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">V.H. (Heures)</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Classe(s)</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider">Effectif Académique</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#1B4332] uppercase tracking-wider text-right">Actions</th>
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
                                                <div className="flex gap-2 mt-1">
                                                    {course.isCompleted && (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-emerald-200">
                                                            Terminé
                                                        </span>
                                                    )}
                                                    {course.isActive && (
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-blue-200">
                                                            Actif (Suivi manuel)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCourse(course);
                                                        setCourseNameEdit(course.name);
                                                        setCourseHoursEdit(course.totalHours || 45);
                                                        setIsEditingCourseName(true);
                                                    }}
                                                    className="group/vh flex items-center gap-2 bg-[#1B4332]/5 text-[#1B4332] px-3 py-1.5 rounded-lg text-xs font-mono font-black border border-[#1B4332]/10 hover:bg-[#1B4332] hover:text-white transition-all active:scale-95"
                                                    title="Modifier le Volume Horaire"
                                                >
                                                    {course.totalHours || 45} h
                                                    <BookOpen className="w-3 h-3 opacity-40 group-hover/vh:opacity-100" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {course.academicLevels?.map((l: any, i: number) => (
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
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCourse(course.code);
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                                                    title="Supprimer le cours"
                                                >
                                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                </button>
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

            {showNewAssignmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Affecter Personnel
                            </h3>
                            <button
                                onClick={() => setShowNewAssignmentModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
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

            {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <School className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    {isEditingCourseName ? (
                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="text"
                                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white outline-none focus:border-white/40 w-full mb-2"
                                                value={courseNameEdit}
                                                onChange={(e) => setCourseNameEdit(e.target.value)}
                                                placeholder="Nom du cours"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 flex items-center bg-white/10 rounded-lg px-3 border border-white/20">
                                                    <span className="text-[10px] text-white/60 mr-2 uppercase font-bold">V.H.</span>
                                                    <input
                                                        type="number"
                                                        className="bg-transparent text-white outline-none w-16 py-1 text-sm font-bold"
                                                        value={courseHoursEdit}
                                                        onChange={(e) => setCourseHoursEdit(Number(e.target.value))}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleUpdateCourseName}
                                                    disabled={isProcessing}
                                                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 text-white"
                                                    title="Sauvegarder"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingCourseName(false)}
                                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold leading-tight">{selectedCourse.name}</h3>
                                                <button
                                                    onClick={() => {
                                                        setCourseNameEdit(selectedCourse.name);
                                                        setCourseHoursEdit(selectedCourse.totalHours || 45);
                                                        setIsEditingCourseName(true);
                                                    }}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100 flex-shrink-0"
                                                    title="Modifier le nom et les heures"
                                                >
                                                    <BookOpen className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-white/80 font-black uppercase tracking-widest mt-1">
                                                Volume Horaire : <span className="bg-white/20 px-2 py-0.5 rounded ml-1">{selectedCourse.totalHours || 45} Heures</span>
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <button
                                                    onClick={() => handleToggleStatus('isActive')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${selectedCourse.isActive ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}
                                                >
                                                    {selectedCourse.isActive ? '✓ Suivi Actif' : 'Activer le Suivi'}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus('isCompleted')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${selectedCourse.isCompleted ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}
                                                >
                                                    {selectedCourse.isCompleted ? '✓ Semestre Fini' : 'Marquer comme Fini'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-white/70 flex items-center gap-2 mt-1">
                                        <span className="font-mono bg-white/10 px-2 rounded">{selectedCourse.code}</span>
                                        <span>•</span>
                                        <span className="flex gap-1 text-xs">
                                            {selectedCourse.academicLevels?.map((l: any, i: number) => (
                                                <span key={i}>{l.displayName}{i < selectedCourse.academicLevels.length - 1 ? ',' : ''}</span>
                                            ))}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedCourse(null); setIsEditingCourseName(false); }}
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
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#1B4332]/60 flex items-center gap-2 mb-4">
                                                <UserCheck className="w-4 h-4 text-[#1B4332]" />
                                                Titulaires ({getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').length}/5)
                                            </h4>
                                            <div className="space-y-3 overflow-y-auto max-h-[220px]">
                                                {getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').map(prof => (
                                                    <div key={prof.profId} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[#1B4332]/5">
                                                        <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                                                            {prof.profName.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-[#1B4332]">{prof.profName}</p>
                                                            <p className="text-[10px] font-bold text-[#52796F] uppercase">{prof.profTitle}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteAssignment(prof.profId, prof.courseCode, prof.academicYear)}
                                                            className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col h-full p-5 bg-[#F1F8F4] rounded-[32px] border border-[#1B4332]/10 shadow-sm">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#1B4332]/60 flex items-center gap-2 mb-4">
                                                <Users className="w-4 h-4 text-[#1B4332]" />
                                                Assistants ({getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').length}/10)
                                            </h4>
                                            <div className="space-y-3 overflow-y-auto max-h-[220px]">
                                                {getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').map(assist => (
                                                    <div key={assist.profId} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[#1B4332]/5">
                                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                                                            {assist.profName.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-[#1B4332]">{assist.profName}</p>
                                                            <p className="text-[10px] font-bold text-[#52796F] uppercase">{assist.profTitle}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteAssignment(assist.profId, assist.courseCode, assist.academicYear)}
                                                            className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#1B4332]/10 pt-8 flex gap-4">
                                        <button
                                            disabled={getCourseStaff(selectedCourse.code).filter(s => s.role === 'PROFESSOR').length >= 5}
                                            className="flex-1 p-5 bg-white border-2 border-[#1B4332]/10 text-[#1B4332] font-black rounded-[28px] hover:bg-[#F1F8F4] flex items-center gap-4 disabled:opacity-50"
                                            onClick={() => setEditMode('replace_prof')}
                                        >
                                            <UserCheck className="w-6 h-6" />
                                            <div className="text-left">
                                                <span className="block text-sm">Ajouter Titulaire</span>
                                                <span className="block text-[10px] text-[#52796F] font-bold uppercase">Max 5</span>
                                            </div>
                                        </button>
                                        <button
                                            disabled={getCourseStaff(selectedCourse.code).filter(s => s.role === 'ASSISTANT').length >= 10}
                                            className="flex-1 p-5 bg-white border-2 border-[#1B4332]/10 text-[#1B4332] font-black rounded-[28px] hover:bg-[#F1F8F4] flex items-center gap-4 disabled:opacity-50"
                                            onClick={() => setEditMode('add_assistant')}
                                        >
                                            <Users className="w-6 h-6" />
                                            <div className="text-left">
                                                <span className="block text-sm">Nouvel Assistant</span>
                                                <span className="block text-[10px] text-[#52796F] font-bold uppercase">Max 10</span>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#52796F]">
                                        <button onClick={() => { setEditMode('none'); setTargetStaffId(''); }} className="hover:text-[#1B4332] flex items-center gap-1 text-sm font-medium">
                                            <ArrowRight className="w-4 h-4 rotate-180" /> Retour
                                        </button>
                                        <span className="text-[#1B4332] font-bold ml-4">
                                            {editMode === 'replace_prof' ? 'Ajouter Titulaire' : 'Ajouter Assistant'}
                                        </span>
                                    </div>
                                    <div className="bg-[#F1F8F4] p-6 rounded-[24px] border border-[#1B4332]/10">
                                        <select
                                            className="w-full h-12 px-4 bg-white border border-[#1B4332]/10 rounded-[16px] mb-6"
                                            value={targetStaffId}
                                            onChange={(e) => setTargetStaffId(e.target.value)}
                                        >
                                            <option value="">-- Choisir une personne --</option>
                                            {availableStaff
                                                .filter(s => !getCourseStaff(selectedCourse.code).some(ic => ic.profId === s.id))
                                                .map(staff => (
                                                    <option key={staff.id} value={staff.id}>
                                                        {staff.name} {staff.professorProfile?.title ? `(${staff.professorProfile.title})` : ''}
                                                    </option>
                                                ))}
                                        </select>
                                        <div className="flex gap-3">
                                            <button onClick={() => { setEditMode('none'); setTargetStaffId(''); }} className="flex-1 py-3 bg-white border border-[#1B4332]/10 rounded-[16px] font-bold">Annuler</button>
                                            <button disabled={!targetStaffId || isProcessing} onClick={handleAssignStaff} className="flex-1 py-3 bg-[#1B4332] text-white rounded-[16px] font-bold flex items-center justify-center gap-2">
                                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Confirmer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCreateCourseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Créer un Cours</h3>
                            <button onClick={() => setShowCreateCourseModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-[#1B4332] mb-1">Code</label>
                                    <input type="text" placeholder="GEOL..." className="w-full h-12 px-4 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] font-mono uppercase" value={newCourseData.code} onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-[#1B4332] mb-1">Nom du cours</label>
                                    <input type="text" placeholder="Ex: Minéralogie..." className="w-full h-12 px-4 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px]" value={newCourseData.name} onChange={(e) => setNewCourseData({ ...newCourseData, name: e.target.value })} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-[#1B4332] mb-1">Volume H.</label>
                                    <input type="number" placeholder="45" className="w-full h-12 px-4 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[16px] font-bold" value={newCourseData.totalHours} onChange={(e) => setNewCourseData({ ...newCourseData, totalHours: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-2">Classe(s) rattachée(s)</label>
                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-[#F1F8F4] rounded-[16px] border border-[#1B4332]/10">
                                    {levels.map(l => (
                                        <label key={l.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer">
                                            <input type="checkbox" checked={newCourseData.academicLevelIds.includes(l.id)} onChange={(e) => {
                                                const ids = e.target.checked ? [...newCourseData.academicLevelIds, l.id] : newCourseData.academicLevelIds.filter(id => id !== l.id);
                                                setNewCourseData({ ...newCourseData, academicLevelIds: ids });
                                            }} />
                                            <span className="text-xs font-bold text-[#1B4332]">{l.displayName}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[#52796F] mt-2 italic">* Inscription automatique des étudiants.</p>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowCreateCourseModal(false)} className="flex-1 py-3 bg-white border border-[#1B4332]/10 rounded-[16px] font-bold">Annuler</button>
                                <button disabled={isCreatingCourse || !newCourseData.code || !newCourseData.name || newCourseData.academicLevelIds.length === 0} onClick={handleCreateCourse} className="flex-1 py-3 bg-purple-600 text-white rounded-[16px] font-bold flex items-center justify-center gap-2">
                                    {isCreatingCourse ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Créer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
