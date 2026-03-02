import { useState, useEffect } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Trash2,
    Lock,
    Unlock,
    BookMarked,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import { examScheduleService, ExamScheduleData } from "../../services/exam-schedule";
import { professorService } from "../../services/professor";
import { courseService } from "../../services/course";
import { toast } from "sonner";

interface ExamInterroSchedulerProps {
    mode: 'PROFESSOR' | 'ACADEMIC_OFFICE';
}

export function ExamInterroScheduler({ mode }: ExamInterroSchedulerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [schedules, setSchedules] = useState<ExamScheduleData[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Data for selectors
    const [levels, setLevels] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [allYearlySchedules, setAllYearlySchedules] = useState<ExamScheduleData[]>([]);
    const [viewMode, setViewMode] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        courseCode: "",
        type: 'INTERROGATION' as 'EXAM' | 'INTERROGATION',
        dateDay: new Date().getDate(),
        dateTime: "08:00",
        academicLevelId: 0
    });

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    useEffect(() => {
        const initData = async () => {
            try {
                // setLoading(true);
                if (mode === 'PROFESSOR') {
                    const courses = await professorService.getCourses();
                    setAvailableCourses(courses);
                    if (courses.length > 0) {
                        setFormData(prev => ({ ...prev, courseCode: courses[0].code }));
                    }
                } else {
                    const levelsData = await courseService.getLevels();
                    setLevels(levelsData);
                    if (levelsData.length > 0) {
                        setSelectedLevelId(levelsData[0].id);
                        setFormData(prev => ({ ...prev, academicLevelId: levelsData[0].id }));
                    }
                }
                await fetchSchedules();
            } catch (error) {
                console.error("Failed to init scheduler:", error);
            } finally {
                // setLoading(false);
            }
        };
        initData();
    }, [mode]);

    useEffect(() => {
        if (mode === 'ACADEMIC_OFFICE' && (selectedLevelId !== null)) {
            const fetchLevelCourses = async () => {
                try {
                    const courses = await courseService.getCourses(selectedLevelId);
                    setAvailableCourses(courses);
                    if (courses.length > 0) {
                        setFormData(prev => ({ ...prev, courseCode: courses[0].code }));
                    } else {
                        setFormData(prev => ({ ...prev, courseCode: "" }));
                    }
                } catch (error) {
                    console.error("Failed to fetch courses:", error);
                }
            };
            fetchLevelCourses();
        }
    }, [selectedLevelId, mode]);

    const fetchSchedules = async () => {
        try {
            const data = await examScheduleService.getAll({
                month: currentMonth,
                year: currentYear,
                academicLevelId: mode === 'ACADEMIC_OFFICE' ? (selectedLevelId !== null ? selectedLevelId : undefined) : undefined
            });
            setSchedules(data);

            // Fetch yearly data for the yearly view
            if (viewMode === 'YEARLY') {
                const yearlyData = await examScheduleService.getAll({
                    year: currentYear,
                    academicLevelId: mode === 'ACADEMIC_OFFICE' ? (selectedLevelId !== null ? selectedLevelId : undefined) : undefined
                });
                setAllYearlySchedules(yearlyData);
            }
        } catch (error) {
            toast.error("Erreur de récupération du programme");
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [currentMonth, currentYear, selectedLevelId, viewMode]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Find selected course to check status
        const course = availableCourses.find(c => c.code === formData.courseCode);

        if (formData.type === 'EXAM' && mode === 'ACADEMIC_OFFICE') {
            if (!course?.isCompleted) {
                toast.error("Impossible : L'examen ne peut être planifié que si le cours est terminé.");
                return;
            }

            // check if already scheduled for exam
            const existingExam = schedules.find(s => s.courseCode === formData.courseCode && s.type === 'EXAM');
            if (existingExam) {
                const date = new Date(existingExam.date).toLocaleDateString('fr-FR');
                toast.error(`Ce cours a déjà été programmé pour l'examen pour le ${date}`);
                return;
            }
        }

        if (mode === 'PROFESSOR' && formData.type === 'EXAM') {
            toast.error("Seul le service académique peut planifier des examens.");
            return;
        }

        try {
            setIsSubmitting(true);
            const fullDate = new Date(currentYear, currentMonth - 1, formData.dateDay);
            const [hours, minutes] = formData.dateTime.split(':');
            fullDate.setHours(parseInt(hours), parseInt(minutes));

            // Determine if publishing (always true for Professor for now, or use a param)
            const isPublished = (e.nativeEvent as any).submitter?.name === 'publish';

            await examScheduleService.create({
                courseCode: formData.courseCode,
                academicLevelId: mode === 'PROFESSOR' ? course.academicLevelId : formData.academicLevelId,
                type: formData.type,
                date: fullDate.toISOString(),
                month: currentMonth,
                year: currentYear,
                isPublished: mode === 'PROFESSOR' ? true : isPublished
            });

            toast.success(isPublished ? "Programme publié !" : "Brouillon enregistré !");
            setShowForm(false);
            fetchSchedules();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadScheduleAsPDF = () => {
        if (!selectedLevelId) {
            toast.error("Sélectionnez une classe d'abord");
            return;
        }

        const level = levels.find(l => l.id === selectedLevelId);
        const levelName = level?.displayName || "Classe inconnue";

        try {
            const doc = new jsPDF();

            // PDF Styles and Header
            doc.setFontSize(22);
            doc.setTextColor(30, 64, 175); // Blue-800
            doc.text(`PLANNING DES EXAMENS & INTERROS`, 105, 20, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text(`${levelName}`, 105, 30, { align: 'center' });

            doc.setDrawColor(226, 232, 240); // Slate-200
            doc.line(20, 35, 190, 35);

            // Table Header
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.setFont("helvetica", "bold");
            doc.text("DATE", 20, 45);
            doc.text("HEURE", 50, 45);
            doc.text("TYPE", 75, 45);
            doc.text("COURS", 100, 45);

            doc.line(20, 48, 190, 48);

            // Content
            doc.setFont("helvetica", "normal");
            let y = 58;

            const sortedSchedules = [...schedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (sortedSchedules.length === 0) {
                doc.setTextColor(148, 163, 184); // Slate-400
                doc.text("Aucun planning enregistré pour cette sélection.", 105, 70, { align: 'center' });
            }

            sortedSchedules.forEach((s) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                    // Redraw header on new page if needed
                }

                const date = new Date(s.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                const time = new Date(s.date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                doc.text(date, 20, y);
                doc.text(time, 50, y);

                // Type with color
                if (s.type === 'EXAM') {
                    doc.setTextColor(225, 29, 72); // Rose-600
                    doc.text("EXAMEN", 75, y);
                } else {
                    doc.setTextColor(37, 99, 235); // Blue-600
                    doc.text("INTERRO", 75, y);
                }

                doc.setTextColor(0, 0, 0);
                const courseName = s.course?.name || s.courseCode;
                const truncatedName = courseName.length > 40 ? courseName.substring(0, 37) + "..." : courseName;
                doc.text(truncatedName, 100, y);

                y += 10;
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} - Plateforme UNILU Geologie`, 105, 285, { align: 'center' });

            doc.save(`Planning_${levelName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("PDF téléchargé avec succès");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Échec de la génération du PDF");
        }
    };

    const handlePublish = async (id: number) => {
        try {
            await examScheduleService.update(id, { isPublished: true });
            toast.success("Programme publié aux étudiants !");
            fetchSchedules();
        } catch (error) {
            toast.error("Échec de la publication");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Voulez-vous supprimer cette date ?")) return;
        try {
            await examScheduleService.delete(id);
            toast.success("Supprimé");
            fetchSchedules();
        } catch (error) {
            toast.error("Échec de suppression");
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Planning {mode === 'PROFESSOR' ? 'des Interros' : 'des Examens'}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {mode === 'PROFESSOR'
                            ? "Planifiez vos interrogations pour vos étudiants"
                            : "Gestion centralisée du calendrier des examens et interrogations"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setViewMode(viewMode === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50"
                    >
                        <CalendarIcon className="w-4 h-4" />
                        {viewMode === 'MONTHLY' ? 'Vue Annuelle' : 'Vue Mensuelle'}
                    </button>
                    {mode === 'ACADEMIC_OFFICE' && (
                        <>
                            <select
                                value={selectedLevelId !== null ? selectedLevelId : ""}
                                onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                                className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {levels.map(l => <option key={l.id} value={l.id}>{l.displayName}</option>)}
                            </select>
                            <button
                                onClick={downloadScheduleAsPDF}
                                className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                title="Télécharger le planning en PDF"
                            >
                                <Download className="w-4 h-4" />
                                PDF
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Calendar Header - Only show in monthly mode */}
            {viewMode === 'MONTHLY' && (
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
                            else setCurrentMonth(currentMonth - 1);
                        }}
                        className="p-3 hover:bg-gray-50 rounded-2xl"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <span className="text-2xl font-black uppercase">{monthNames[currentMonth - 1]} {currentYear}</span>
                    </div>
                    <button
                        onClick={() => {
                            if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
                            else setCurrentMonth(currentMonth + 1);
                        }}
                        className="p-3 hover:bg-gray-50 rounded-2xl"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Informational Panels - Now at the Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center">
                    <h4 className="font-black text-xs text-gray-900 mb-3 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        RÈGLES DE PLANNING
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 h-fit"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">
                                Interros : programmables à tout moment.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 h-fit"><AlertCircle className="w-3.5 h-3.5" /></div>
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">
                                Le service académique gère les conflits.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 h-fit"><Lock className="w-3.5 h-3.5" /></div>
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">
                                <span className="text-rose-600 font-black">STRICT:</span> Examens si cours fini.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-[32px] text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-black text-xs mb-1 italic">Vision Étudiante</h4>
                            <p className="text-[10px] font-medium text-blue-100 leading-tight">
                                Diffusion instantanée sur mobile.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                            <Unlock className="w-3 h-3" /> Direct
                        </div>
                    </div>
                </div>
            </div>

            {/* Banque de Cours */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="font-black text-gray-900 flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-blue-600" />
                        {mode === 'PROFESSOR' ? 'Mes Cours (Interrogations)' : 'Banque de Cours (Terminés)'}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                        {mode === 'PROFESSOR' ? availableCourses.length : availableCourses.filter(c => c.isCompleted).length} COURS {mode === 'PROFESSOR' ? 'À ENSEIGNER' : 'DISPONIBLES'}
                    </span>
                </div>

                <div className="flex flex-wrap gap-3">
                    {availableCourses
                        .filter(c => mode === 'PROFESSOR' ? true : c.isCompleted)
                        .map(course => {
                            const isAlreadyScheduled = schedules.some(s => s.courseCode === course.code && (mode === 'PROFESSOR' ? s.type === 'INTERROGATION' : s.type === 'EXAM'));
                            return (
                                <div
                                    key={course.code}
                                    onClick={() => {
                                        if (mode === 'PROFESSOR' || !isAlreadyScheduled) {
                                            setFormData({
                                                ...formData,
                                                courseCode: course.code,
                                                type: mode === 'PROFESSOR' ? 'INTERROGATION' : 'EXAM'
                                            });
                                            setShowForm(true);
                                        }
                                    }}
                                    className={`px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isAlreadyScheduled
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                        : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isAlreadyScheduled ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase leading-none mb-1">[{course.code}]</span>
                                        <span className="text-xs font-bold leading-none">{course.name}</span>
                                    </div>
                                    {isAlreadyScheduled && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                </div>
                            );
                        })}
                    {availableCourses.filter(c => c.isCompleted).length === 0 && (
                        <p className="text-gray-300 font-bold italic text-sm">Aucun cours n'est encore marqué comme terminé.</p>
                    )}
                </div>
            </div>

            <div className="w-full space-y-6">
                {/* Main View - Now takes Full Width */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <form onSubmit={handleCreate} className="bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Cours</label>
                                            <select
                                                required
                                                value={formData.courseCode}
                                                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {availableCourses
                                                    .filter(c => formData.type === 'EXAM' ? c.isCompleted : true)
                                                    .map(c => (
                                                        <option key={c.code} value={c.code} className="text-black">
                                                            [{c.code}] {c.name} {c.isCompleted ? '✅ Fini' : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="INTERROGATION" className="text-black">Interrogation</option>
                                                {mode === 'ACADEMIC_OFFICE' && <option value="EXAM" className="text-black">Examen Final</option>}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Jour (en {monthNames[currentMonth - 1]})</label>
                                            <input
                                                type="number" min="1" max="31"
                                                required
                                                value={formData.dateDay}
                                                onChange={(e) => setFormData({ ...formData, dateDay: parseInt(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Heure</label>
                                            <input
                                                type="time"
                                                required
                                                value={formData.dateTime}
                                                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold italic"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-white/50 hover:text-white transition-colors">Annuler</button>

                                        {mode === 'ACADEMIC_OFFICE' && (
                                            <button
                                                type="submit"
                                                name="draft"
                                                disabled={isSubmitting}
                                                className="bg-white/10 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                                            >
                                                Enregistrer Brouillon
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            name="publish"
                                            disabled={isSubmitting}
                                            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40"
                                        >
                                            {isSubmitting ? "Envoi..." : (mode === 'ACADEMIC_OFFICE' ? "Publier l'horaire" : "Confirmer le planning")}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dashboard/List */}
                    <div className="space-y-4">
                        {viewMode === 'MONTHLY' ? (
                            <CalendarGrid
                                month={currentMonth}
                                year={currentYear}
                                schedules={schedules}
                                onDelete={handleDelete}
                                onPublish={handlePublish}
                                mode={mode}
                            />
                        ) : (
                            <div className="space-y-8">
                                {monthNames.map((mName, mIdx) => {
                                    const monthSchedules = allYearlySchedules.filter(s => s.month === mIdx + 1);
                                    if (monthSchedules.length === 0) return null;
                                    return (
                                        <div key={mName} className="space-y-4">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <div className="w-8 h-px bg-gray-200"></div>
                                                {mName} {currentYear}
                                            </h4>
                                            {monthSchedules.map(s => (
                                                <ScheduleCard key={s.id} schedule={s} onDelete={handleDelete} onPublish={handlePublish} mode={mode} />
                                            ))}
                                        </div>
                                    );
                                })}
                                {allYearlySchedules.length === 0 && (
                                    <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                                        <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold italic">Rien de planifié pour toute l'année {currentYear}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
// Internal component for schedule items
function ScheduleCard({ schedule, onDelete, onPublish, mode }: {
    schedule: ExamScheduleData,
    onDelete: (id: number) => void,
    onPublish: (id: number) => void,
    mode: 'PROFESSOR' | 'ACADEMIC_OFFICE'
}) {
    const s = schedule;
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center border border-blue-100">
                    <span className="text-xs font-black text-blue-600 uppercase">{new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <span className="text-xl font-black text-gray-900">{new Date(s.date).getDate()}</span>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${s.type === 'EXAM' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            {s.type === 'EXAM' ? 'Examen' : 'Interro'}
                        </span>
                        {!s.isPublished && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 italic">
                                Brouillon
                            </span>
                        )}
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h3 className="font-black text-gray-900 uppercase">{s.course?.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{s.academicLevelId === 0 ? 'Presciences' : `B${s.academicLevelId}`}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!s.isPublished && mode === 'ACADEMIC_OFFICE' && (
                    <button
                        onClick={() => s.id && onPublish(s.id)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                        Publier
                    </button>
                )}
                <button
                    onClick={() => s.id && onDelete(s.id)}
                    className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// Calendar Grid Component
function CalendarGrid({ month, year, schedules, onDelete, onPublish, mode }: {
    month: number,
    year: number,
    schedules: ExamScheduleData[],
    onDelete: (id: number) => void,
    onPublish: (id: number) => void,
    mode: 'PROFESSOR' | 'ACADEMIC_OFFICE'
}) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

    // Adjust for Monday start (0: Mon, 6: Sun)
    const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    const days = [];
    // Previous month padding
    for (let i = 0; i < startOffset; i++) {
        days.push({ type: 'empty' });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const daySchedules = schedules.filter(s => new Date(s.date).getDate() === d);
        days.push({ type: 'day', day: d, schedules: daySchedules });
    }

    return (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
                {weekDays.map(wd => (
                    <div key={wd} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                        {wd}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`min-h-[140px] p-2 border-r border-b border-gray-50 group hover:bg-blue-50/10 transition-colors ${i % 7 === 6 ? 'border-r-0' : ''}`}
                    >
                        {d.type === 'day' && (
                            <>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-black ${d.day === new Date().getDate() && month === new Date().getMonth() + 1 ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {d.day}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {d.schedules?.map(s => (
                                        <div
                                            key={s.id}
                                            className={`p-1.5 rounded-lg text-[9px] font-bold border leading-tight group/item relative ${!s.isPublished
                                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                : (s.type === 'EXAM' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700')
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1 truncate">
                                                    {!s.isPublished && <div className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0 animate-pulse"></div>}
                                                    <span className="truncate uppercase pr-2">{s.course?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!s.isPublished && mode === 'ACADEMIC_OFFICE' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); s.id && onPublish(s.id); }}
                                                            className="opacity-0 group-hover/item:opacity-100 bg-emerald-500 text-white rounded px-1.5 py-0.5 text-[8px] font-black uppercase"
                                                        >
                                                            Publier
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); s.id && onDelete(s.id); }}
                                                        className="opacity-0 group-hover/item:opacity-100 text-rose-500 bg-white/50 rounded p-0.5"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5 opacity-60">
                                                <span>{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>•</span>
                                                <span>{s.academicLevelId === 0 ? 'PS' : `B${s.academicLevelId}`}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

