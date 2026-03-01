import { useState, useEffect } from "react";
import { 
    Calendar as CalendarIcon, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    BookOpen, 
    AlertCircle, 
    CheckCircle2, 
    Trash2,
    Lock,
    Unlock,
    Search,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { examScheduleService, ExamScheduleData } from "../../services/exam-schedule";
import { professorService } from "../../services/professor";
import { courseService } from "../../services/course";
import { toast } from "sonner";

interface ExamInterroSchedulerProps {
    mode: 'PROFESSOR' | 'ACADEMIC_OFFICE';
}

export function ExamInterroScheduler({ mode }: ExamInterroSchedulerProps) {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [schedules, setSchedules] = useState<ExamScheduleData[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Data for selectors
    const [levels, setLevels] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    
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
                setLoading(true);
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
                setLoading(false);
            }
        };
        initData();
    }, [mode]);

    useEffect(() => {
        if (mode === 'ACADEMIC_OFFICE' && selectedLevelId) {
            const fetchLevelCourses = async () => {
                const courses = await courseService.getCourses(selectedLevelId);
                setAvailableCourses(courses);
                if (courses.length > 0) {
                    setFormData(prev => ({ ...prev, courseCode: courses[0].code }));
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
                academicLevelId: mode === 'ACADEMIC_OFFICE' ? (selectedLevelId || undefined) : undefined
            });
            setSchedules(data);
        } catch (error) {
            toast.error("Erreur de récupération du programme");
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [currentMonth, currentYear, selectedLevelId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Find selected course to check status
        const course = availableCourses.find(c => c.code === formData.courseCode);
        
        if (formData.type === 'EXAM' && mode === 'ACADEMIC_OFFICE') {
            if (!course?.isCompleted) {
                toast.error("Impossible : L'examen ne peut être planifié que si le cours est terminé.");
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

            await examScheduleService.create({
                courseCode: formData.courseCode,
                academicLevelId: mode === 'PROFESSOR' ? course.academicLevelId : formData.academicLevelId,
                type: formData.type,
                date: fullDate.toISOString(),
                month: currentMonth,
                year: currentYear
            });

            toast.success("Programme enregistré !");
            setShowForm(false);
            fetchSchedules();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
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

                <div className="flex gap-3">
                    {mode === 'ACADEMIC_OFFICE' && (
                        <select 
                            value={selectedLevelId || ""} 
                            onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm"
                        >
                            {levels.map(l => <option key={l.id} value={l.id}>{l.displayName}</option>)}
                        </select>
                    )}
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nouvelle Date
                    </button>
                </div>
            </div>

            {/* Calendar Header */}
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
                    <span className="text-2xl font-black uppercase">{monthNames[currentMonth-1]} {currentYear}</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main View */}
                <div className="lg:col-span-2 space-y-6">
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
                                                onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
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
                                                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="INTERROGATION" className="text-black">Interrogation</option>
                                                {mode === 'ACADEMIC_OFFICE' && <option value="EXAM" className="text-black">Examen Final</option>}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Jour (en {monthNames[currentMonth-1]})</label>
                                            <input 
                                                type="number" min="1" max="31"
                                                required
                                                value={formData.dateDay}
                                                onChange={(e) => setFormData({...formData, dateDay: parseInt(e.target.value)})}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Heure</label>
                                            <input 
                                                type="time" 
                                                required
                                                value={formData.dateTime}
                                                onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold italic"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-white/50 hover:text-white transition-colors">Annuler</button>
                                        <button 
                                            disabled={isSubmitting}
                                            className="bg-white text-blue-900 px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-50 transition-all"
                                        >
                                            {isSubmitting ? "Enregistrement..." : "Confirmer le planning"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dashboard/List */}
                    <div className="space-y-4">
                        {schedules.length === 0 ? (
                            <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                                <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold italic">Rien de planifié pour ce mois</p>
                            </div>
                        ) : (
                            schedules.map((s) => (
                                <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
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
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <h3 className="font-black text-gray-900 uppercase">{s.course?.name}</h3>
                                            <p className="text-xs text-gray-400 font-medium">{s.academicLevelId === 0 ? 'Presciences' : `B${s.academicLevelId}`}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => s.id && handleDelete(s.id)}
                                        className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Status Panel */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                        <h4 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-blue-600" />
                            Règles de planning
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 h-fit"><CheckCircle2 className="w-4 h-4" /></div>
                                <p className="text-xs font-bold text-gray-600">
                                    Les interrogations peuvent être programmées à tout moment par les professeurs.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 h-fit"><AlertCircle className="w-4 h-4" /></div>
                                <p className="text-xs font-bold text-gray-600">
                                    Le service académique a priorité sur le calendrier et gère les conflits.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 h-fit"><Lock className="w-4 h-4" /></div>
                                <p className="text-xs font-bold text-gray-600">
                                    <span className="text-rose-600 font-black">STRICT:</span> Un examen final ne peut être planifié que pour un cours marqué comme fini.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 p-8 rounded-[40px] text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <h4 className="font-black mb-2 italic">Vision Étudiante</h4>
                        <p className="text-xs font-medium text-blue-100 leading-relaxed mb-6">
                            Toute modification effectuée ici est instantanément répercutée sur le calendrier mobile des étudiants concernés.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-full border border-white/10">
                            <Unlock className="w-3 h-3" /> Diffusion Directe
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
