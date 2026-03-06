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
    Download,
    GraduationCap,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import uniluLogo from "../../assets/unilu-official-logo.png";
import { examScheduleService, ExamScheduleData } from "../../services/exam-schedule";
import { professorService } from "../../services/professor";
import { courseService } from "../../services/course";

// Helper for consistent colors across classes
const getLevelColor = (levelId: number) => {
    switch (levelId) {
        case 0: return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', badge: 'bg-orange-500' }; // Presciences
        case 1: return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' };   // B1
        case 2: return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-500' }; // B2
        case 3: return { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', badge: 'bg-purple-500' }; // B3
        default: return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' };
    }
};

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
    // Professor-specific class filter
    const [selectedProfLevelId, setSelectedProfLevelId] = useState<number | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        courseCode: "",
        type: 'INTERROGATION' as 'EXAM' | 'INTERROGATION',
        dateDay: new Date().getDate(),
        dateTime: "08:00",
        academicLevelId: 0,
        room: "",
        duration: 120
    });

    // Detail Modal / Edit State
    const [selectedSchedule, setSelectedSchedule] = useState<ExamScheduleData | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        room: "",
        dateTime: "",
        duration: 120
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
                    const levelsWithGlobal = [
                        { id: -1, displayName: "🌍 VUE GLOBALE" },
                        ...levelsData
                    ];
                    setLevels(levelsWithGlobal);
                    if (levelsWithGlobal.length > 0) {
                        setSelectedLevelId(-1); // Default to Global View
                        setFormData(prev => ({ ...prev, academicLevelId: -1 }));
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
            if (selectedLevelId === -1) {
                setAvailableCourses([]);
                return;
            }
            const fetchLevelCourses = async () => {
                try {
                    const courses = await courseService.getCourses(selectedLevelId);
                    setAvailableCourses(courses);

                    // FIX: Synchroniser l'ID du niveau dans le formulaire pour éviter les erreurs de classe
                    setFormData(prev => ({
                        ...prev,
                        academicLevelId: selectedLevelId,
                        type: 'EXAM' // Force EXAM for academic office
                    }));

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
        } else if (mode === 'PROFESSOR') {
            // Force INTERROGATION for professor
            setFormData(prev => ({ ...prev, type: 'INTERROGATION' }));
        }
    }, [selectedLevelId, mode]);

    const fetchSchedules = async () => {
        try {
            const data = await examScheduleService.getAll({
                month: currentMonth,
                year: currentYear,
                academicLevelId: mode === 'ACADEMIC_OFFICE' ? (selectedLevelId !== -1 ? (selectedLevelId !== null ? selectedLevelId : undefined) : undefined) : undefined
            });
            setSchedules(data);

            // Fetch yearly data for the yearly view
            if (viewMode === 'YEARLY') {
                const yearlyData = await examScheduleService.getAll({
                    year: currentYear,
                    academicLevelId: mode === 'ACADEMIC_OFFICE' ? (selectedLevelId !== -1 ? (selectedLevelId !== null ? selectedLevelId : undefined) : undefined) : undefined
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

        if (mode === 'ACADEMIC_OFFICE' && formData.type !== 'EXAM') {
            toast.error("Le service académique ne peut planifier que les examens finaux.");
            return;
        }

        if (mode === 'PROFESSOR' && formData.type !== 'INTERROGATION') {
            toast.error("Les professeurs ne peuvent planifier que les interrogations.");
            return;
        }

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
                isPublished: mode === 'PROFESSOR' ? true : isPublished,
                room: formData.room,
                duration: formData.duration
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
        if (selectedLevelId === null) {
            toast.error("Sélectionnez une classe d'abord");
            return;
        }

        const level = levels.find(l => l.id === selectedLevelId);

        // Dynamic class name for the PDF
        let displayClassName = level?.displayName || "Classe inconnue";
        if (selectedLevelId === 0) displayClassName = "PRESCIENCE";
        else if (selectedLevelId === 1) displayClassName = "BACHELOR 1";
        else if (selectedLevelId === 2) displayClassName = "BACHELOR 2";
        else if (selectedLevelId === 3) displayClassName = "BACHELOR 3";
        else if (selectedLevelId === -1) displayClassName = "TOUTES LES CLASSES";

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- DEBUT ENTETE OFFICIELLE ---
            // Logo Unilu
            const img = new Image();
            img.src = uniluLogo;
            doc.addImage(img, 'PNG', 15, 10, 20, 20);

            // Textes officiels (Gauche)
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.setFont("helvetica", "bold");
            doc.text("UNIVERSITÉ DE LUBUMBASHI", 40, 15);
            doc.text("FACULTÉ DES SCIENCES ET TECHNOLOGIE", 40, 20);
            doc.text("DÉPARTEMENT DE GÉOLOGIE", 40, 25);

            // Année Académique (Droite)
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text(`Année Académique: ${currentYear}-${currentYear + 1}`, pageWidth - 20, 15, { align: 'right' });
            doc.text("Lubumbashi, RDC", pageWidth - 20, 20, { align: 'right' });

            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(0.5);
            doc.line(15, 32, pageWidth - 15, 32);
            // --- FIN ENTETE OFFICIELLE ---

            // Titre Principal
            doc.setFontSize(22);
            doc.setTextColor(30, 64, 175); // Blue-800
            doc.setFont("helvetica", "bold");
            doc.text("PLANNING DES EXAMENS", pageWidth / 2, 45, { align: 'center' });

            // Sous-titre: Classe et Session
            doc.setFontSize(16);
            doc.setTextColor(51, 65, 85); // Slate-700
            doc.text(displayClassName, pageWidth / 2, 55, { align: 'center' });

            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.setFont("helvetica", "italic");
            doc.text(`Examen du Premier Semestre - ${monthNames[currentMonth - 1]} ${currentYear}`, pageWidth / 2, 62, { align: 'center' });

            // Séparateur léger
            doc.setDrawColor(226, 232, 240); // Slate-200
            doc.setLineWidth(0.1);
            doc.line(40, 68, pageWidth - 40, 68);

            // Table Header
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.setFont("helvetica", "bold");
            doc.text("JOUR", 15, 80);
            doc.text("DATE", 45, 80);
            doc.text("HEURE", 75, 80);
            doc.text("TYPE", 100, 80);
            doc.text("COURS / SALLE", 130, 80);

            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.4);
            doc.line(15, 83, pageWidth - 15, 83);

            // Content
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            let y = 92;

            const sortedSchedules = [...schedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (sortedSchedules.length === 0) {
                doc.setTextColor(148, 163, 184); // Slate-400
                doc.text("Aucun planning enregistré pour cette sélection.", pageWidth / 2, 92, { align: 'center' });
            }

            sortedSchedules.forEach((s) => {
                const scheduleDate = new Date(s.date);

                // Préparer les textes
                const dayStr = scheduleDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase();
                const dateStr = scheduleDate.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const timeStr = scheduleDate.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const courseName = s.course?.name || s.courseCode;
                const roomName = s.room ? ` - Salle: ${s.room}` : "";
                const durationInfo = s.duration ? ` (${s.duration} min)` : "";
                const fullCourseLine = `${courseName}${roomName}${durationInfo}`;

                // Gérer le wrapping du cours
                const maxWidth = pageWidth - 130 - 15; // De 130 à la marge droite
                const splitCourse = doc.splitTextToSize(fullCourseLine, maxWidth);
                const rowHeight = Math.max(8, splitCourse.length * 5);

                // Saut de page si nécessaire
                if (y + rowHeight > 275) {
                    doc.addPage();
                    y = 25;
                    // Rappel des entêtes si nouvelle page (Optionnel mais propre)
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(`Suite - Planning des Examens - ${displayClassName}`, 20, 15);
                    doc.line(15, 18, pageWidth - 15, 18);
                    doc.setFontSize(10);
                    doc.setTextColor(30, 41, 59);
                    y = 30;
                }

                doc.setTextColor(30, 41, 59);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.text(dayStr, 15, y);
                doc.text(dateStr, 45, y);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text(timeStr, 75, y);

                // Type details
                if (s.type === 'EXAM') {
                    doc.setTextColor(225, 29, 72); // Rose-600
                    doc.setFont("helvetica", "bold");
                    doc.text("EXAMEN", 100, y);
                } else {
                    doc.setTextColor(37, 99, 235); // Blue-600
                    doc.text("INTERRO", 100, y);
                }

                doc.setTextColor(30, 41, 59);
                doc.setFont("helvetica", "normal");
                doc.text(splitCourse, 130, y);

                // Draw a very light line between items
                doc.setDrawColor(241, 245, 249); // Slate-100
                doc.setLineWidth(0.1);
                doc.line(15, y + rowHeight - 2, pageWidth - 15, y + rowHeight - 2);

                y += rowHeight + 4; // Espacement entre les lignes
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            const footerText = `Document officiel généré le ${new Date().toLocaleString('fr-FR')} - Secrétariat Géologie`;
            doc.text(footerText, pageWidth / 2, 285, { align: 'center' });

            const fileName = `Planning_Examens_${displayClassName.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);
            toast.success("Planning officiel généré !");
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

    const handlePublishAll = async () => {
        const drafts = schedules.filter(s => !s.isPublished);
        if (drafts.length === 0) {
            toast.info("Aucun brouillon à publier pour ce mois.");
            return;
        }

        if (!window.confirm(`Voulez-vous publier les ${drafts.length} dates de ce mois ?`)) return;

        try {
            setIsSubmitting(true);
            await Promise.all(drafts.map(s => s.id && examScheduleService.update(s.id, { isPublished: true })));
            toast.success("Tous les programmes du mois ont été publiés !");
            fetchSchedules();
        } catch (error) {
            toast.error("Erreur lors de la publication de masse");
        } finally {
            setIsSubmitting(false);
        }
    };

    const exportToJson = () => {
        const level = levels.find(l => l.id === selectedLevelId);
        const levelName = level?.displayName || "Classe";
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schedules, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `Backup_Planning_${levelName.replace(/\s+/g, '_')}_${currentYear}_M${currentMonth}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Sauvegarde locale (JSON) effectuée !");
    };

    const handleSelectSchedule = (s: ExamScheduleData) => {
        setSelectedSchedule(s);
        const date = new Date(s.date);
        setEditData({
            room: s.room || "",
            dateTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            duration: s.duration || 120
        });
        setIsEditing(false);
        setShowDetailModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedSchedule?.id) return;
        try {
            setIsSubmitting(true);
            const date = new Date(selectedSchedule.date);
            const [hours, minutes] = editData.dateTime.split(':');
            date.setHours(parseInt(hours), parseInt(minutes));

            await examScheduleService.update(selectedSchedule.id, {
                room: editData.room,
                date: date.toISOString(),
                duration: editData.duration
            });

            toast.success("Informations mises à jour !");
            setShowDetailModal(false);
            fetchSchedules();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
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

                    {/* Filter for Professor or Academic Office */}
                    {(() => {
                        const profLevels = Array.from(
                            new Map(
                                availableCourses
                                    .filter(c => c.academicLevelId !== undefined && c.academicLevelId !== null)
                                    .map(c => [c.academicLevelId, c.academicLevelId])
                            ).values()
                        ).sort((a, b) => a - b);

                        if (mode === 'PROFESSOR') {
                            return (
                                <select
                                    value={selectedProfLevelId !== null ? selectedProfLevelId : ''}
                                    onChange={(e) => setSelectedProfLevelId(e.target.value === '' ? null : Number(e.target.value))}
                                    className="px-4 py-3 bg-blue-50 border-2 border-blue-100 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer whitespace-nowrap"
                                >
                                    <option value="">🎓 Choisir une classe...</option>
                                    {profLevels.map(lid => (
                                        <option key={lid} value={lid}>
                                            {lid === 0 ? 'Presciences' : `Bachelor ${lid}`}
                                        </option>
                                    ))}
                                </select>
                            );
                        }

                        if (mode === 'ACADEMIC_OFFICE') {
                            return (
                                <select
                                    value={selectedLevelId !== null ? selectedLevelId : ""}
                                    onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                                    className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {levels.map(l => <option key={l.id} value={l.id}>{l.displayName}</option>)}
                                </select>
                            );
                        }
                        return null;
                    })()}

                    {mode === 'ACADEMIC_OFFICE' && (
                        <div className="flex gap-2">
                            <button
                                onClick={exportToJson}
                                className="px-5 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                                title="Sauvegarder une copie locale (JSON)"
                            >
                                <Lock className="w-4 h-4" />
                                <span className="hidden sm:inline">Sauvegarde</span>
                            </button>
                            <button
                                onClick={handlePublishAll}
                                className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                title="Publier tous les brouillons du mois"
                            >
                                <Unlock className="w-4 h-4" />
                                <span className="hidden sm:inline">Publier Tout</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={downloadScheduleAsPDF}
                        className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        title="Télécharger le planning en PDF"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </div>

            {/* Calendar Header - Only show in monthly mode */}
            {
                viewMode === 'MONTHLY' && (
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
                )
            }

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
                        {mode === 'PROFESSOR'
                            ? (selectedProfLevelId !== null
                                ? `Mes Cours — ${selectedProfLevelId === 0 ? 'Presciences' : `Bachelor ${selectedProfLevelId}`}`
                                : 'Mes Cours (Interrogations)')
                            : (selectedLevelId === -1 ? 'Sélectionnez une classe pour programmer' : 'Cours Terminés (Examens Finaux)')}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                        {mode === 'PROFESSOR'
                            ? (selectedProfLevelId !== null
                                ? availableCourses.filter(c => c.academicLevelId === selectedProfLevelId).length
                                : availableCourses.length)
                            : (selectedLevelId === -1 ? 0 : availableCourses.filter(c => c.isCompleted).length)} COURS
                    </span>
                </div>

                <div className="flex flex-wrap gap-3">
                    {mode === 'PROFESSOR' && selectedProfLevelId === null ? (
                        <div className="w-full py-12 px-6 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center space-y-8">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto">
                                    <GraduationCap className="w-8 h-8" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900">Programmer une Interrogation</h5>
                                    <p className="text-xs text-gray-500 font-medium">Sélectionnez une classe pour commencer :</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {Array.from(
                                    new Map(
                                        availableCourses
                                            .filter(c => c.academicLevelId !== undefined && c.academicLevelId !== null)
                                            .map(c => [c.academicLevelId, c.academicLevelId])
                                    ).values()
                                ).sort((a, b) => a - b).map(lid => (
                                    <button
                                        key={lid}
                                        onClick={() => setSelectedProfLevelId(lid)}
                                        className="px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        {lid === 0 ? 'Presciences' : `Bachelor ${lid}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        availableCourses
                            .filter(c => {
                                if (mode === 'PROFESSOR') {
                                    return selectedProfLevelId !== null ? c.academicLevelId === selectedProfLevelId : true;
                                }
                                return c.isCompleted;
                            })
                            .map(course => {
                                const isAlreadyScheduled = schedules.some(s => s.courseCode === course.code && (mode === 'PROFESSOR' ? s.type === 'INTERROGATION' : s.type === 'EXAM'));
                                const courseLevel = getLevelColor(course.academicLevelId);
                                return (
                                    <div
                                        key={course.code}
                                        onClick={() => {
                                            if (mode === 'PROFESSOR' || !isAlreadyScheduled) {
                                                setFormData({
                                                    ...formData,
                                                    courseCode: course.code,
                                                    type: mode === 'PROFESSOR' ? 'INTERROGATION' : 'EXAM',
                                                    academicLevelId: mode === 'PROFESSOR' ? (course.academicLevelId || 0) : (selectedLevelId || 0)
                                                });
                                                setShowForm(true);
                                            }
                                        }}
                                        className={`px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isAlreadyScheduled
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                            : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:shadow-md'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isAlreadyScheduled ? 'bg-emerald-500' : (mode === 'PROFESSOR' ? courseLevel.badge : (course.isCompleted ? 'bg-blue-500' : 'bg-gray-300'))}`}></div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase leading-none">[{course.code}]</span>
                                            </div>
                                            <span className="text-xs font-bold leading-none mt-1">{course.name}</span>
                                        </div>
                                        {isAlreadyScheduled && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                    </div>
                                );
                            })
                    )}
                    {availableCourses.filter(c => mode === 'PROFESSOR'
                        ? (selectedProfLevelId !== null ? c.academicLevelId === selectedProfLevelId : true)
                        : c.isCompleted
                    ).length === 0 && (
                            <p className="text-gray-300 font-bold italic text-sm">
                                {mode === 'PROFESSOR'
                                    ? (selectedProfLevelId !== null
                                        ? `Aucun cours trouvé pour cette classe.`
                                        : "Aucun cours assigné.")
                                    : (selectedLevelId === -1
                                        ? "🌍 Sélectionnez une classe spécifique pour voir les cours programmables."
                                        : "Aucun cours n'est marqué comme terminé.")
                                }
                            </p>
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
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Type d'évaluation</label>
                                            <div className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl font-black text-blue-400 flex items-center justify-between">
                                                <span>{formData.type === 'EXAM' ? 'EXAMEN FINAL' : 'INTERROGATION'}</span>
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <p className="text-[9px] text-gray-400 italic">
                                                {mode === 'ACADEMIC_OFFICE'
                                                    ? "Le service académique ne planifie que les examens finaux."
                                                    : "Les professeurs planifient uniquement les interrogations."
                                                }
                                            </p>
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

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Salle</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Local 10, Amphi A..."
                                                value={formData.room}
                                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Durée (minutes)</label>
                                            <input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
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
                                                Enregistrer Localement
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
                                onSelect={handleSelectSchedule}
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
                                                <ScheduleCard key={s.id} schedule={s} onDelete={handleDelete} onPublish={handlePublish} onSelect={handleSelectSchedule} mode={mode} />
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

            {/* Detail & Edit Modal */}
            <AnimatePresence>
                {showDetailModal && selectedSchedule && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDetailModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            {/* Header Gradient */}
                            <div className={`h-32 w-full ${selectedSchedule.type === 'EXAM' ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'} flex items-center justify-center relative p-8`}>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all"
                                >
                                    <AlertCircle className="w-6 h-6 rotate-45" />
                                </button>
                                <div className="text-center">
                                    <div className="bg-white/20 px-4 py-1.5 rounded-full inline-block mb-3 border border-white/20 backdrop-blur-md">
                                        <span className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                                            {selectedSchedule.type === 'EXAM' ? '🔴 Examen Final' : '🔵 Interrogation'}
                                        </span>
                                    </div>
                                    <h2 className="text-white text-xl md:text-2xl font-black leading-tight truncate px-4">
                                        {selectedSchedule.course?.name || selectedSchedule.courseCode}
                                    </h2>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Jour</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 capitalize">
                                                    {new Date(selectedSchedule.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                                </p>
                                                <p className="text-xs font-bold text-gray-500">
                                                    {new Date(selectedSchedule.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tranche Horaire</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="time"
                                                        value={editData.dateTime}
                                                        onChange={(e) => setEditData({ ...editData, dateTime: e.target.value })}
                                                        className="font-black text-blue-600 bg-blue-50 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-2 py-1"
                                                    />
                                                ) : (
                                                    <>
                                                        <p className="font-black text-gray-900">
                                                            {new Date(selectedSchedule.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <span className="mx-1 text-gray-300">→</span>
                                                            {(() => {
                                                                const end = new Date(selectedSchedule.date);
                                                                end.setMinutes(end.getMinutes() + (selectedSchedule.duration || 120));
                                                                return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                            })()}
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-500">Durée: {selectedSchedule.duration || 120} min</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localisation</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                <AlertCircle className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        placeholder="Salle..."
                                                        value={editData.room}
                                                        onChange={(e) => setEditData({ ...editData, room: e.target.value })}
                                                        className="font-black text-blue-600 bg-blue-50 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-2 py-1 w-full"
                                                    />
                                                ) : (
                                                    <p className="font-black text-gray-900">{selectedSchedule.room || "Non spécifié"}</p>
                                                )}
                                                <p className="text-xs font-bold text-gray-500">Salle / Amphi</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Classe / Niveau</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                <GraduationCap className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900">
                                                    {selectedSchedule.academicLevelId === 0 ? 'Presciences' : `Bachelor ${selectedSchedule.academicLevelId}`}
                                                </p>
                                                <p className="text-xs font-bold text-gray-500">Géologie</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="pt-8 border-t border-gray-100 flex items-center justify-between gap-4">
                                    <button
                                        onClick={() => {
                                            selectedSchedule.id && handleDelete(selectedSchedule.id);
                                            setShowDetailModal(false);
                                        }}
                                        className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-2xl transition-all"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>

                                    <div className="flex items-center gap-3 flex-1">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest text-xs"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={handleUpdate}
                                                    disabled={isSubmitting}
                                                    className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-3xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs"
                                                >
                                                    {isSubmitting ? "..." : "Valider les modifications"}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="w-full py-4 bg-gray-900 text-white font-black rounded-3xl shadow-xl shadow-gray-900/20 hover:bg-black transition-all uppercase tracking-widest text-xs"
                                            >
                                                Modifier l'examen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
function ScheduleCard({ schedule, onDelete, onPublish, onSelect, mode }: {
    schedule: ExamScheduleData,
    onDelete: (id: number) => void,
    onPublish: (id: number) => void,
    onSelect: (s: ExamScheduleData) => void,
    mode: 'PROFESSOR' | 'ACADEMIC_OFFICE'
}) {
    const s = schedule;
    // Color based on TYPE: red for exams, blue for interrogations
    const isExam = s.type === 'EXAM';
    const cardBg = isExam ? 'bg-rose-50' : 'bg-blue-50';
    const cardBorder = isExam ? 'border-rose-100' : 'border-blue-100';
    const badgeBg = isExam ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700';
    const levelColors = getLevelColor(s.academicLevelId);

    return (
        <div
            onClick={() => onSelect(s)}
            className={`p-6 rounded-3xl border ${cardBorder} ${cardBg} shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer`}
        >
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center border ${cardBorder}`}>
                    <span className={`text-xs font-black ${isExam ? 'text-rose-600' : 'text-blue-600'} uppercase`}>{new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <span className="text-xl font-black text-gray-900">{new Date(s.date).getDate()}</span>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badgeBg}`}>
                            {isExam ? '🔴 Examen' : '🔵 Interro'}
                        </span>
                        {!s.isPublished && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 italic">
                                Brouillon
                            </span>
                        )}
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h3 className="font-black text-gray-900 uppercase">{s.course?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${levelColors.badge} text-white`}>
                            {s.academicLevelId === 0 ? 'Presciences' : `Bachelor ${s.academicLevelId}`}
                        </span>
                        {s.room && (
                            <>
                                <span className="text-gray-300">•</span>
                                <p className="text-xs font-bold text-blue-600">Salle: {s.room}</p>
                            </>
                        )}
                        {s.duration && (
                            <>
                                <span className="text-gray-300">•</span>
                                <p className="text-xs font-bold text-gray-500">{s.duration} min</p>
                            </>
                        )}
                    </div>
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
function CalendarGrid({ month, year, schedules, onDelete, onPublish, onSelect, mode }: {
    month: number,
    year: number,
    schedules: ExamScheduleData[],
    onDelete: (id: number) => void,
    onPublish: (id: number) => void,
    onSelect: (s: ExamScheduleData) => void,
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
                                    {d.schedules?.map(s => {
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={(e) => { e.stopPropagation(); onSelect(s); }}
                                                className={`p-1.5 rounded-lg text-[9px] font-bold border leading-tight group/item relative cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all ${!s.isPublished
                                                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                    : s.type === 'EXAM'
                                                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1 truncate">
                                                        {!s.isPublished && <div className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0 animate-pulse"></div>}
                                                        <span className="truncate uppercase pr-2">{s.course?.name}</span>
                                                    </div>
                                                    {s.academicLevelId !== -1 && (
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.type === 'EXAM' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-1 opacity-60">
                                                        <span>{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>•</span>
                                                        <span>{s.academicLevelId === 0 ? 'PS' : `B${s.academicLevelId}`}</span>
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
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

