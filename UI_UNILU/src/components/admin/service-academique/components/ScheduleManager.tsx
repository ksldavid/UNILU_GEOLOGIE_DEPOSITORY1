import { useState, useEffect, useMemo, Fragment } from 'react';
import { Save, Send, Clock, GripVertical, X, Calendar as CalendarIcon, Loader2, School, Search, Layout, AlertTriangle, CheckCircle2, FileDown, Printer } from 'lucide-react';
import logoUnilu from '../../../../assets/unilu-official-logo.png';
import { courseService } from '../../../../services/course';
import { scheduleService } from '../../../../services/schedule';

interface Course {
    id: string;
    name: string;
    code: string;
    professor: string;
    color: string;
    isCompleted?: boolean;
}

interface ScheduledCourse extends Course {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];
interface ScheduleManagerProps {
    onModifiedChange?: (isModified: boolean) => void;
    onSaveReady?: (saveFn: () => Promise<void>) => void;
}

export function ScheduleManager({ onModifiedChange, onSaveReady }: ScheduleManagerProps) {
    const [levels, setLevels] = useState<{ id: number; name: string; displayName: string }[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

    // Buffer for unsaved changes across different levels
    const [scheduleBuffer, setScheduleBuffer] = useState<Record<number, ScheduledCourse[]>>({});
    const [modifiedLevels, setModifiedLevels] = useState<Set<number>>(new Set());

    // Notify parent about unsaved changes
    useEffect(() => {
        if (onModifiedChange) {
            onModifiedChange(modifiedLevels.size > 0);
        }
    }, [modifiedLevels, onModifiedChange]);

    // Handle initial save function exposure
    useEffect(() => {
        if (onSaveReady) {
            onSaveReady(publishAll);
        }
    }, [onSaveReady, modifiedLevels, scheduleBuffer]); // Re-expose if dependencies change if necessary, though publishAll is stable mostly

    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
    const [loading, setLoading] = useState(false);
    const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [pendingSchedule, setPendingSchedule] = useState<{ course: Course; day: string } | null>(null);
    const [timeForm, setTimeForm] = useState({ startTime: '08:00', endTime: '10:00', room: '' });
    const [selectedEvent, setSelectedEvent] = useState<ScheduledCourse | null>(null);
    const [showExportView, setShowExportView] = useState(false);

    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isLeavingModalOpen, setIsLeavingModalOpen] = useState(false);

    const ACADEMIC_YEAR = "2025-2026";

    // Load levels on mount
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const data = await courseService.getLevels();
                setLevels(data);
                if (data.length > 0) {
                    setSelectedLevelId(data[0].id);
                }
            } catch (error) {
                console.error("Erreur niveaux:", error);
            }
        };
        fetchLevels();
    }, []);

    // Load courses when level changes
    useEffect(() => {
        if (selectedLevelId === null) return;

        const fetchLevelData = async () => {
            if (!scheduleBuffer[selectedLevelId]) {
                setLoading(true);
                try {
                    const [courses, schedule] = await Promise.all([
                        courseService.getCourses(selectedLevelId),
                        scheduleService.getSchedule(selectedLevelId, ACADEMIC_YEAR)
                    ]);
                    setAvailableCourses(courses);
                    setScheduleBuffer(prev => ({ ...prev, [selectedLevelId]: schedule }));
                    setScheduledCourses(schedule);
                } catch (error) {
                    console.error("Erreur chargement:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setScheduledCourses(scheduleBuffer[selectedLevelId]);
                courseService.getCourses(selectedLevelId).then(setAvailableCourses).catch(console.error);
            }
        };
        fetchLevelData();
    }, [selectedLevelId]);

    // Navigation Guard logic
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (modifiedLevels.size > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [modifiedLevels]);

    const filteredCourses = useMemo(() => {
        return availableCourses.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.professor.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableCourses, searchQuery]);

    const handleLevelSwitch = (levelId: number) => {
        if (levelId === selectedLevelId) return;
        setScheduleBuffer(prev => ({ ...prev, [selectedLevelId!]: scheduledCourses }));
        setSelectedLevelId(levelId);
    };

    const [activeDropSlot, setActiveDropSlot] = useState<{ day: string, time: string } | null>(null);

    const handleDragStart = (e: React.DragEvent, course: Course) => {
        setDraggedCourse(course);
        e.dataTransfer.setData('source', 'sidebar');
        e.dataTransfer.setData('courseId', course.id);
        e.dataTransfer.effectAllowed = 'move';

        // Création d'un ghost plus propre
        const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
        ghost.style.opacity = '0.8';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.width = '200px';
        ghost.style.zIndex = '1000';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 100, 20);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    const handleDragOver = (e: React.DragEvent, day: string, time: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (activeDropSlot?.day !== day || activeDropSlot?.time !== time) {
            setActiveDropSlot({ day, time });
        }
    };

    const handleDragLeave = () => {
        setActiveDropSlot(null);
    };

    const handleDrop = (day: string, time: string) => {
        setActiveDropSlot(null);
        if (draggedCourse) {
            setPendingSchedule({ course: draggedCourse, day });

            // Calculer une heure de fin par défaut (2h plus tard)
            const [h, m] = time.split(':').map(Number);
            const endH = h + 2;
            const endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

            setTimeForm({
                startTime: time,
                endTime: endTime,
                room: ''
            });
            setIsTimeModalOpen(true);
            setDraggedCourse(null);
        }
    };

    const confirmSchedule = () => {
        if (pendingSchedule && timeForm.room.trim()) {
            const newScheduledCourse: ScheduledCourse = {
                ...pendingSchedule.course,
                day: pendingSchedule.day,
                startTime: timeForm.startTime,
                endTime: timeForm.endTime,
                room: timeForm.room,
            };
            const updated = [...scheduledCourses, newScheduledCourse];
            setScheduledCourses(updated);
            setScheduleBuffer(prev => ({ ...prev, [selectedLevelId!]: updated }));
            setModifiedLevels(prev => new Set(prev).add(selectedLevelId!));
            setIsTimeModalOpen(false);
            setPendingSchedule(null);
            setTimeForm({ startTime: '08:00', endTime: '10:00', room: '' });
        }
    };

    const removeCourse = (courseId: string, day: string, startTime: string) => {
        const updated = scheduledCourses.filter(
            sc => !(sc.id === courseId && sc.day === day && sc.startTime === startTime)
        );
        setScheduledCourses(updated);
        setScheduleBuffer(prev => ({ ...prev, [selectedLevelId!]: updated }));
        setModifiedLevels(prev => new Set(prev).add(selectedLevelId!));
    };

    const saveSingleSchedule = async (levelId: number) => {
        const scheduleToSave = scheduleBuffer[levelId] || scheduledCourses;
        if (!scheduleToSave) return;

        setLoading(true);
        try {
            await scheduleService.saveSchedule(levelId, ACADEMIC_YEAR, scheduleToSave);
            setModifiedLevels(prev => {
                const next = new Set(prev);
                next.delete(levelId);
                return next;
            });
            return true;
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const publishAll = async () => {
        setLoading(true);
        try {
            for (const levelId of Array.from(modifiedLevels)) {
                await saveSingleSchedule(levelId);
            }
            alert('Tous les horaires ont été enregistrés et publiés !');
            setShowPublishModal(false);
        } catch (error) {
            alert('Erreur lors de la publication globale');
        } finally {
            setLoading(false);
        }
    };

    const getCoursesForDayAndTime = (day: string, time: string) => {
        const slotMin = toMinutes(time);
        return scheduledCourses.filter(sc => {
            const courseStart = toMinutes(sc.startTime);
            const courseEnd = toMinutes(sc.endTime);
            return sc.day === day && slotMin >= courseStart && slotMin < courseEnd;
        });
    };

    return (
        <div className="flex flex-col space-y-4 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-3 bg-[#F1F8F4] hover:bg-[#D8F3DC] rounded-2xl text-[#1B4332] transition-all shadow-sm border border-[#1B4332]/5 group"
                        title={sidebarOpen ? "Réduire le catalogue" : "Ouvrir le catalogue"}
                    >
                        <Layout className={`w-6 h-6 transition-transform ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1B4332] rounded-2xl flex items-center justify-center shadow-xl shadow-[#1B4332]/20">
                            <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1B4332] leading-tight">Master Planning</h2>
                            <p className="text-xs text-[#52796F] font-bold tracking-widest uppercase">{ACADEMIC_YEAR}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F8F4] border border-[#1B4332]/5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-[#1B4332]">Système Sync.</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => saveSingleSchedule(selectedLevelId!)}
                            disabled={!modifiedLevels.has(selectedLevelId!) || loading}
                            className="px-4 py-2 text-[#1B4332] hover:bg-[#F1F8F4] rounded-xl font-bold transition-all disabled:opacity-50 text-sm flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Sauver local
                        </button>
                        <button
                            onClick={() => setShowPublishModal(true)}
                            disabled={modifiedLevels.size === 0 && scheduledCourses.length === 0}
                            className="px-6 py-2 bg-[#1B4332] hover:bg-[#2D5F4C] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#1B4332]/20 flex items-center gap-2 text-sm"
                        >
                            <Send className="w-4 h-4" />
                            Publier {modifiedLevels.size > 0 ? `(${modifiedLevels.size})` : ''}
                        </button>
                        <button
                            onClick={() => setShowExportView(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 text-sm"
                        >
                            <FileDown className="w-4 h-4" />
                            Format Officiel
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-6 min-h-0 relative">
                {/* Course Sidebar - Thinner for a bigger calendar box */}
                <aside className={`
                    absolute lg:sticky lg:top-24 z-30 w-[350px] transition-all duration-300 transform self-start
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 overflow-hidden'}
                `}>
                    <div className="bg-white/90 backdrop-blur-sm h-fit max-h-[calc(100vh-120px)] rounded-[32px] border border-[#1B4332]/10 shadow-xl lg:shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-[#1B4332]/5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-[#1B4332]">Banque de Cours</h3>
                                <div className="text-[10px] bg-[#1B4332] text-white px-2 py-0.5 rounded-full font-bold">
                                    {availableCourses.length}
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52796F]" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un cours..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-[#F1F8F4] border border-transparent focus:border-[#1B4332]/30 rounded-xl text-sm outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <div
                                        key={course.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, course)}
                                        className="group p-4 rounded-2xl bg-white border border-[#1B4332]/5 hover:border-[#1B4332] hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: course.color }} />
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-[#1B4332]/30 uppercase tracking-tighter">{course.code}</span>
                                                {course.isCompleted && (
                                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-200">
                                                        Fini
                                                    </span>
                                                )}
                                            </div>
                                            <GripVertical className="w-3.5 h-3.5 text-[#1B4332]/20 group-hover:text-[#1B4332]" />
                                        </div>
                                        <p className="font-bold text-[#1B4332] text-sm leading-tight mb-1">{course.name}</p>
                                        <p className="text-[11px] text-[#52796F]">{course.professor}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-center text-[#52796F]">
                                    <Layout className="w-8 h-8 opacity-20 mb-2" />
                                    <p className="text-xs font-medium">Aucun cours trouvé</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Calendar Frame - Flexible height and independent overflow */}
                <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[40px] border border-[#1B4332]/15 overflow-hidden shadow-2xl">
                    {/* Level Selector - Integrated into the frame */}
                    <div className="px-6 py-4 bg-[#F1F8F4] border-b border-[#1B4332]/10 flex items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {levels.map(level => (
                                <button
                                    key={level.id}
                                    onClick={() => handleLevelSwitch(level.id)}
                                    className={`
                                        px-6 py-2 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap
                                        ${selectedLevelId === level.id
                                            ? 'bg-[#1B4332] text-white shadow-lg'
                                            : 'text-[#1B4332]/60 hover:bg-white'}
                                    `}
                                >
                                    {level.displayName || level.name}
                                    {modifiedLevels.has(level.id) && (
                                        <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col p-4 bg-[#F1F8F4]/30">
                        {/* Days Header */}
                        <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-2 mb-2">
                            <div />
                            {DAYS.map(day => (
                                <div key={day} className="text-center py-2 bg-white rounded-xl border border-[#1B4332]/10 shadow-sm">
                                    <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-[0.2em] opacity-60">{day}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Area - No inner scroll, grows naturally */}
                        <div className="pr-1">
                            <div className="w-full">
                                <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-2">
                                    {TIME_SLOTS.map(time => (
                                        <Fragment key={time}>
                                            <div className="h-[40px] flex items-center justify-center">
                                                <span className="text-[10px] font-black text-[#1B4332]/30">{time}</span>
                                            </div>
                                            {DAYS.map(day => {
                                                const coursesAtSlot = getCoursesForDayAndTime(day, time);
                                                const isFirstSlot = coursesAtSlot.length > 0 && coursesAtSlot[0].startTime === time;

                                                return (
                                                    <div
                                                        key={`${day}-${time}`}
                                                        onDragOver={(e) => handleDragOver(e, day, time)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={() => handleDrop(day, time)}
                                                        className={`h-[40px] bg-white rounded-2xl border transition-all relative group/slot shadow-sm
                                                            ${activeDropSlot?.day === day && activeDropSlot?.time === time
                                                                ? 'border-[#1B4332] bg-[#D8F3DC] border-2 scale-[1.02] z-20'
                                                                : 'border-[#1B4332]/5 hover:border-[#1B4332]/20 hover:bg-white'}
                                                        `}
                                                    >
                                                        {isFirstSlot && coursesAtSlot.map(course => {
                                                            const durationSlots = (toMinutes(course.endTime) - toMinutes(course.startTime)) / 30;
                                                            return (
                                                                <div
                                                                    key={`${course.id}-${course.startTime}`}
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(course); }}
                                                                    className="absolute inset-[1px] p-2 rounded-xl text-white shadow-lg animate-in zoom-in-95 duration-500 z-10 group/course flex flex-col cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                    style={{
                                                                        backgroundColor: course.color,
                                                                        height: `${durationSlots * 40 + (durationSlots - 1) * 8 - 2}px`,
                                                                        background: `linear-gradient(135deg, ${course.color}, ${course.color}dd)`,
                                                                        boxShadow: `0 8px 16px -5px ${course.color}44`
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="text-[7px] font-black bg-white/20 px-1 py-0.5 rounded uppercase">{course.code}</span>
                                                                            <h4 className="font-black text-xs leading-tight mt-0.5 truncate">{course.name}</h4>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); removeCourse(course.id, course.day, course.startTime); }}
                                                                            className="opacity-0 group-hover/course:opacity-100 p-1 hover:bg-white/20 rounded-lg transition-all"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>

                                                                    <div className="mt-auto">
                                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold bg-black/5 w-fit px-2 py-1 rounded-lg">
                                                                            <School className="w-3 h-3" />
                                                                            <span>{course.room}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Selection Modal */}
            {isTimeModalOpen && pendingSchedule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B4332]/20 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-[0_32px_64px_-16px_rgba(27,67,50,0.25)] border border-[#1B4332]/10 overflow-hidden">
                        <div className="bg-[#1B4332] p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Clock className="w-24 h-24 rotate-12" />
                            </div>
                            <h3 className="text-2xl font-black">Configuration</h3>
                            <p className="text-[#F1F8F4] opacity-80 mt-1 font-medium">Placement de {pendingSchedule.course.name}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1B4332] uppercase tracking-wider ml-1">Début</label>
                                    <select
                                        value={timeForm.startTime}
                                        onChange={(e) => setTimeForm({ ...timeForm, startTime: e.target.value })}
                                        className="w-full p-4 bg-[#F1F8F4] border-2 border-transparent focus:border-[#1B4332]/20 rounded-2xl font-bold text-[#1B4332] outline-none transition-all"
                                    >
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1B4332] uppercase tracking-wider ml-1">Fin</label>
                                    <select
                                        value={timeForm.endTime}
                                        onChange={(e) => setTimeForm({ ...timeForm, endTime: e.target.value })}
                                        className="w-full p-4 bg-[#F1F8F4] border-2 border-transparent focus:border-[#1B4332]/20 rounded-2xl font-bold text-[#1B4332] outline-none transition-all"
                                    >
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[#1B4332] uppercase tracking-wider ml-1">Local / Salle</label>
                                <div className="relative">
                                    <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52796F]" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={timeForm.room}
                                        onChange={(e) => setTimeForm({ ...timeForm, room: e.target.value })}
                                        placeholder="Ex: Amphi G, Salle B302..."
                                        className="w-full pl-12 pr-4 py-4 bg-[#F1F8F4] border-2 border-transparent focus:border-[#1B4332]/20 rounded-2xl font-bold text-[#1B4332] outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setIsTimeModalOpen(false)}
                                    className="flex-1 py-4 text-[#52796F] font-bold hover:bg-[#F1F8F4] rounded-2xl transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmSchedule}
                                    disabled={!timeForm.room.trim()}
                                    className="flex-[2] py-4 bg-[#1B4332] text-white font-black rounded-2xl shadow-xl shadow-[#1B4332]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    Confirmer le créneau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Modal */}
            {showPublishModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B4332]/30 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-[#1B4332]/10 overflow-hidden">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-[#F1F8F4] rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Send className="w-10 h-10 text-[#1B4332]" />
                            </div>
                            <h3 className="text-3xl font-black text-[#1B4332] mb-3">Publication Globale</h3>
                            <p className="text-[#52796F] font-medium mb-8">
                                Vous avez des modifications en attente pour <span className="font-bold text-[#1B4332]">{modifiedLevels.size} promotion(s)</span>.
                                Voulez-vous tout publier maintenant ?
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={publishAll}
                                    className="w-full py-5 bg-[#1B4332] text-white font-black rounded-[24px] shadow-xl shadow-[#1B4332]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Tout Publier et Synchroniser
                                </button>
                                <button
                                    onClick={() => saveSingleSchedule(selectedLevelId!)}
                                    className="w-full py-4 bg-[#F1F8F4] text-[#1B4332] font-extrabold rounded-[20px] hover:bg-[#e4efe8] transition-all"
                                >
                                    Publier uniquement {levels.find(l => l.id === selectedLevelId)?.name}
                                </button>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="w-full py-4 text-[#52796F] font-bold"
                                >
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1B4332]/40 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-[#1B4332]/10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#1B4332] p-8 text-white relative">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className="text-[11px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">{selectedEvent.code}</span>
                            <h3 className="text-3xl font-black mt-4 leading-tight">{selectedEvent.name}</h3>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#52796F] uppercase tracking-widest">Enseignant / Responsable</p>
                                    <p className="font-bold text-[#1B4332] flex items-center gap-2">
                                        <Layout className="w-4 h-4" />
                                        {selectedEvent.professor}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#52796F] uppercase tracking-widest">Localisation</p>
                                    <p className="font-bold text-[#1B4332] flex items-center gap-2">
                                        <School className="w-4 h-4" />
                                        {selectedEvent.room}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#52796F] uppercase tracking-widest">Jour & Horaire</p>
                                    <p className="font-bold text-[#1B4332] flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {selectedEvent.day}, {selectedEvent.startTime} - {selectedEvent.endTime}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="w-full py-4 bg-[#F1F8F4] text-[#1B4332] font-black rounded-2xl hover:bg-[#D8F3DC] transition-all"
                            >
                                Revenir au Planning
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leaving Warning Modal (Can be triggered by some logic or state) */}
            {isLeavingModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden border border-red-100">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-[#1B4332] mb-3">Changements non publiés !</h3>
                            <p className="text-[#52796F] font-medium mb-8">
                                Vous allez perdre les modifications apportées aux horaires. Voulez-vous publier avant de partir ou abandonner ?
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        await publishAll();
                                        setIsLeavingModalOpen(false);
                                    }}
                                    className="w-full py-4 bg-[#1B4332] text-white font-black rounded-2xl shadow-xl shadow-[#1B4332]/20 flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Tout publier et quitter
                                </button>
                                <button
                                    onClick={() => {
                                        setModifiedLevels(new Set());
                                        setScheduleBuffer({});
                                        setIsLeavingModalOpen(false);
                                    }}
                                    className="w-full py-4 bg-red-50 text-red-600 font-extrabold rounded-2xl hover:bg-red-100 transition-all"
                                >
                                    Abandonner les changements
                                </button>
                                <button
                                    onClick={() => setIsLeavingModalOpen(false)}
                                    className="w-full py-4 text-[#52796F] font-bold"
                                >
                                    Continuer l'édition
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Official Export Modal */}
            {showExportView && (
                <div className="fixed inset-0 z-[250] bg-slate-900/90 backdrop-blur-xl p-4 md:p-8 flex flex-col items-center overflow-y-auto">
                    <div className="max-w-6xl w-full mb-6 flex justify-between items-center sticky top-0 z-[260] bg-slate-900/50 p-4 rounded-2xl backdrop-blur-md">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Prévisualisation Officielle</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{levels.find(l => l.id === selectedLevelId)?.name}</p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowExportView(false)}
                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                            >
                                Revenir à l'édition
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimer / Exporter PDF
                            </button>
                        </div>
                    </div>

                    {/* Print Container */}
                    <div className="bg-white p-12 shadow-2xl rounded-sm print:p-0 print:shadow-none print:m-0 w-full max-w-[210mm] min-h-[297mm]">
                         <SchedulePrintGrid 
                            levelName={levels.find(l => l.id === selectedLevelId)?.displayName || levels.find(l => l.id === selectedLevelId)?.name || ''} 
                            courses={scheduledCourses}
                         />
                    </div>
                    
                    {/* Add a specific style tag for print for this view */}
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .print-container, .print-container * { visibility: visible; }
                            .print-container { 
                                position: absolute; 
                                left: 0; 
                                top: 0; 
                                width: 210mm;
                                height: 297mm;
                            }
                            @page {
                                size: A4 portrait;
                                margin: 0;
                            }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}

function SchedulePrintGrid({ levelName, courses }: { levelName: string, courses: ScheduledCourse[] }) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const rowSlots = [
        { id: 1, label: '1', morning: true },
        { id: 2, label: '2', morning: true },
        { id: 3, label: '3', morning: true },
        { id: 4, label: '4', morning: true },
        { id: 5, label: '5', afternoon: true },
        { id: 6, label: '6', afternoon: true },
        { id: 7, label: '7', afternoon: true },
    ];

    // Helper function to map days
    const dayMapFr: Record<string, string> = {
        'Lundi': 'Lundi',
        'Mardi': 'Mardi',
        'Mercredi': 'Mercredi',
        'Jeudi': 'Jeudi',
        'Vendredi': 'Vendredi',
        'Samedi': 'Samedi',
        'Dimanche': 'Dimanche'
    };

    const getSlotCourses = (frDay: string, slotId: number) => {
        const timeRanges: Record<number, {start: string, end: string}> = {
            1: { start: '07:00', end: '08:30' },
            2: { start: '08:30', end: '10:00' },
            3: { start: '10:00', end: '11:30' },
            4: { start: '11:30', end: '13:00' },
            5: { start: '13:30', end: '15:00' },
            6: { start: '15:00', end: '16:30' },
            7: { start: '16:30', end: '18:00' }
        };

        const range = timeRanges[slotId];
        return courses.filter(c => {
            if (c.day !== frDay) return false;
            
            const [ch, cm] = c.startTime.split(':').map(Number);
            const [rh, rm] = range.start.split(':').map(Number);
            const [reh, rem] = range.end.split(':').map(Number);
            
            const cMin = ch * 60 + cm;
            const rMin = rh * 60 + rm;
            const reMin = reh * 60 + rem;

            return cMin >= rMin && cMin < reMin;
        });
    };

    // Redesign as a proper table grid like requested
    return (
        <div className="print-container font-sans text-slate-800 flex flex-col min-h-screen bg-white p-8">
            {/* School Header */}
            <div className="w-full bg-[#9ACD32] border-2 border-black py-2 mb-1">
                <h1 className="text-center text-xl font-black uppercase tracking-widest text-black">
                    HORAIRE DES COURS - FACULTÉ DES SCIENCES
                </h1>
            </div>

            {/* Sub Header / Info */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-4">
                    <img src={logoUnilu} alt="Logo UNILU" className="w-12 h-12 object-contain" />
                    <div>
                        <p className="text-xs font-black uppercase text-slate-600">Promotion: <span className="text-blue-700">{levelName}</span></p>
                        <p className="text-[10px] font-bold text-slate-400">Année Académique 2025-2026</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Département de Géologie</p>
                    <p className="text-[10px] font-bold text-slate-400">Lubumbashi, RDC</p>
                </div>
            </div>

            {/* Proper Table Grid */}
            <table className="w-full border-collapse border-2 border-black">
                <thead>
                    <tr>
                        <th className="border-2 border-black w-32 bg-slate-50"></th>
                        {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(day => (
                            <th key={day} className="border-2 border-black py-2 text-xs font-black italic uppercase italic">
                                <u>{day}</u>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Period 1: Mornings */}
                    <tr className="bg-[#B0C4DE]">
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Matin 1</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-bold text-[9px]">
                                {getSlotCourses(day, 1).map((c, i) => <div key={i}>{c.name}<br/><span className="font-normal opacity-70">07:00 à 08:30</span></div>)}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Matin 2</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-bold text-[9px]">
                                {getSlotCourses(day, 2).map((c, i) => <div key={i}>{c.name}<br/><span className="font-normal opacity-70">08:30 à 10:00</span></div>)}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Matin 3</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-bold text-[9px]">
                                {getSlotCourses(day, 3).map((c, i) => <div key={i}>{c.name}<br/><span className="font-normal opacity-70">10:00 à 11:30</span></div>)}
                            </td>
                        ))}
                    </tr>

                    {/* Pause Row */}
                    <tr className="bg-[#FBCFE8]">
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Pause</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-black text-[10px] text-rose-700">
                                12:00 à 13:30
                            </td>
                        ))}
                    </tr>

                    {/* Period 2: Afternoon */}
                    <tr>
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Après-midi 1</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-bold text-[9px]">
                                {getSlotCourses(day, 5).map((c, i) => <div key={i}>{c.name}<br/><span className="font-normal opacity-70">13:30 à 15:00</span></div>)}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Après-midi 2</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-bold text-[9px]">
                                {getSlotCourses(day, 6).map((c, i) => <div key={i}>{c.name}<br/><span className="font-normal opacity-70">15:00 à 16:30</span></div>)}
                            </td>
                        ))}
                    </tr>
                    <tr className="bg-[#B0C4DE]">
                        <td className="border-2 border-black p-2 text-center text-[10px] font-black italic"><u>Fin de Journée</u></td>
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                            <td key={day} className="border-2 border-black p-1 text-center font-bold text-[9px]">
                                {getSlotCourses(day, 7).map((c, i) => <div key={i}>{c.name}<br/><span className="font-normal opacity-70">16:30 à 18:00</span></div>)}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-8 flex justify-between items-end border-t border-slate-100 pt-4">
                <div className="text-[9px] font-bold text-slate-400 space-y-1">
                    <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
                    <p>Signature et Sceau de la Faculté :</p>
                    <div className="h-16 w-32 border border-dashed border-slate-200 mt-2 rounded"></div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-[#1e3a8a] italic">UNILU - Scientia splendet et conscientia</p>
                </div>
            </div>
        </div>
    );
}
