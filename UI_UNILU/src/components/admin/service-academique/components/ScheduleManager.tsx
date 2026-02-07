import { useState, useEffect, useMemo, Fragment } from 'react';
import { Save, Send, Clock, GripVertical, X, Calendar as CalendarIcon, Loader2, School, Search, Layout, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { courseService } from '../../../../services/course';
import { scheduleService } from '../../../../services/schedule';

interface Course {
    id: string;
    name: string;
    code: string;
    professor: string;
    color: string;
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

    const handleDragStart = (e: React.DragEvent, course: Course) => {
        setDraggedCourse(course);
        e.dataTransfer.setData('source', 'sidebar');
        const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
        ghost.style.opacity = '0.5';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (day: string, time: string) => {
        if (draggedCourse) {
            setPendingSchedule({ course: draggedCourse, day });
            setTimeForm(prev => ({ ...prev, startTime: time }));
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
        <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
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
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-6 min-h-0 relative">
                {/* Course Sidebar - Thinner for a bigger calendar box */}
                <aside className={`
                    absolute lg:relative z-30 h-full w-[260px] transition-all duration-300 transform
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 overflow-hidden'}
                `}>
                    <div className="bg-white/90 backdrop-blur-sm h-full rounded-[32px] border border-[#1B4332]/10 shadow-xl lg:shadow-sm flex flex-col overflow-hidden">
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
                                            <span className="text-[10px] font-black text-[#1B4332]/30 uppercase tracking-tighter">{course.code}</span>
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

                    <div className="flex-1 flex flex-col min-h-0 p-4 bg-[#F1F8F4]/30">
                        {/* Days Header */}
                        <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-2 mb-2">
                            <div />
                            {DAYS.map(day => (
                                <div key={day} className="text-center py-2 bg-white rounded-xl border border-[#1B4332]/10 shadow-sm">
                                    <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-[0.2em] opacity-60">{day}</span>
                                </div>
                            ))}
                        </div>

                        {/* Scrollable Grid Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="w-full">
                                <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-2">
                                    {TIME_SLOTS.map(time => (
                                        <Fragment key={time}>
                                            <div className="h-[85px] flex items-center justify-center">
                                                <span className="text-[11px] font-black text-[#1B4332]/30">{time}</span>
                                            </div>
                                            {DAYS.map(day => {
                                                const coursesAtSlot = getCoursesForDayAndTime(day, time);
                                                const isFirstSlot = coursesAtSlot.length > 0 && coursesAtSlot[0].startTime === time;

                                                return (
                                                    <div
                                                        key={`${day}-${time}`}
                                                        onDragOver={handleDragOver}
                                                        onDrop={() => handleDrop(day, time)}
                                                        className="h-[85px] bg-white rounded-2xl border border-[#1B4332]/5 hover:border-[#1B4332]/20 hover:bg-white transition-all relative group/slot shadow-sm"
                                                    >
                                                        {isFirstSlot && coursesAtSlot.map(course => {
                                                            const durationSlots = (toMinutes(course.endTime) - toMinutes(course.startTime)) / 30;
                                                            return (
                                                                <div
                                                                    key={`${course.id}-${course.startTime}`}
                                                                    className="absolute inset-[1px] p-3 rounded-2xl text-white shadow-lg animate-in zoom-in-95 duration-500 z-10 group/course flex flex-col"
                                                                    style={{
                                                                        backgroundColor: course.color,
                                                                        height: `${durationSlots * 85 + (durationSlots - 1) * 8 - 2}px`,
                                                                        background: `linear-gradient(135deg, ${course.color}, ${course.color}dd)`,
                                                                        boxShadow: `0 8px 20px -5px ${course.color}66`
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
        </div>
    );
}
