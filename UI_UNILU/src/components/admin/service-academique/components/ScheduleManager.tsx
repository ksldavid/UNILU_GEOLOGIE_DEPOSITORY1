import { useState } from 'react';
import { Save, Send, Clock, GripVertical, X } from 'lucide-react';

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

const AVAILABLE_COURSES: Course[] = [
    { id: 'c1', name: 'Cristallographie', code: 'GEO101', professor: 'Prof. Martin', color: '#1B4332' },
    { id: 'c2', name: 'Mathématiques I', code: 'MAT101', professor: 'Prof. Leroy', color: '#3B82F6' },
    { id: 'c3', name: 'Minéralogie', code: 'GEO201', professor: 'Prof. Mwepu', color: '#8B5CF6' },
    { id: 'c4', name: 'Pétrologie', code: 'GEO202', professor: 'Prof. Kalala', color: '#EC4899' },
    { id: 'c5', name: 'Géochimie', code: 'GEO301', professor: 'Prof. Tshimabanga', color: '#F59E0B' },
    { id: 'c6', name: 'Stratigraphie', code: 'GEO203', professor: 'Prof. Kabeya', color: '#10B981' },
];

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export function ScheduleManager() {
    const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
    const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [pendingSchedule, setPendingSchedule] = useState<{ course: Course; day: string } | null>(null);
    const [timeForm, setTimeForm] = useState({ startTime: '08:00', endTime: '10:00', room: '' });
    const [hasChanges, setHasChanges] = useState(false);

    const handleDragStart = (course: Course) => {
        setDraggedCourse(course);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (day: string) => {
        if (draggedCourse) {
            setPendingSchedule({ course: draggedCourse, day });
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
            setScheduledCourses([...scheduledCourses, newScheduledCourse]);
            setHasChanges(true);
            setIsTimeModalOpen(false);
            setPendingSchedule(null);
            setTimeForm({ startTime: '08:00', endTime: '10:00', room: '' });
        }
    };

    const removeCourse = (courseId: string, day: string, startTime: string) => {
        setScheduledCourses(scheduledCourses.filter(
            sc => !(sc.id === courseId && sc.day === day && sc.startTime === startTime)
        ));
        setHasChanges(true);
    };

    const saveSchedule = () => {
        alert('Horaire enregistré localement !');
        setHasChanges(false);
    };

    const publishSchedule = () => {
        if (window.confirm('Êtes-vous sûr de vouloir publier cet horaire ? Cela mettra à jour les emplois du temps de tous les professeurs.')) {
            alert('Horaire publié avec succès ! Les professeurs ont été notifiés.');
            setHasChanges(false);
        }
    };

    const getCoursesForDayAndTime = (day: string, time: string) => {
        return scheduledCourses.filter(sc => {
            const courseStart = parseInt(sc.startTime.split(':')[0]);
            const courseEnd = parseInt(sc.endTime.split(':')[0]);
            const slotTime = parseInt(time.split(':')[0]);
            return sc.day === day && slotTime >= courseStart && slotTime < courseEnd;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Actions */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B4332]">Gestion des Horaires</h2>
                    <p className="text-sm text-[#52796F] mt-1">Glissez-déposez les cours dans le calendrier</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={saveSchedule}
                        disabled={!hasChanges}
                        className="px-6 py-3 bg-[#52796F] hover:bg-[#1B4332] text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        Enregistrer
                    </button>
                    <button
                        onClick={publishSchedule}
                        disabled={!hasChanges && scheduledCourses.length === 0}
                        className="px-6 py-3 bg-[#1B4332] hover:bg-[#2D5F4C] text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        Publier l'horaire
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Available Courses Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 sticky top-6">
                        <h3 className="text-lg font-bold text-[#1B4332] mb-4">Cours disponibles</h3>
                        <div className="space-y-3">
                            {AVAILABLE_COURSES.map(course => (
                                <div
                                    key={course.id}
                                    draggable
                                    onDragStart={() => handleDragStart(course)}
                                    className="p-4 rounded-xl border-2 border-dashed border-[#1B4332]/20 hover:border-[#1B4332] hover:bg-[#F1F8F4] cursor-move transition-all"
                                    style={{ borderLeftWidth: '4px', borderLeftColor: course.color }}
                                >
                                    <div className="flex items-start gap-2">
                                        <GripVertical className="w-4 h-4 text-[#52796F] mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[#1B4332] text-sm truncate">{course.name}</p>
                                            <p className="text-xs text-[#52796F]">{course.code}</p>
                                            <p className="text-xs text-[#52796F] mt-1">{course.professor}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Header */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                <div className="p-2 text-xs font-bold text-[#52796F] text-center">Heure</div>
                                {DAYS.map(day => (
                                    <div key={day} className="p-2 text-sm font-bold text-[#1B4332] text-center bg-[#F1F8F4] rounded-lg">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots */}
                            <div className="space-y-1">
                                {TIME_SLOTS.map(time => (
                                    <div key={time} className="grid grid-cols-7 gap-2">
                                        <div className="p-2 text-xs font-medium text-[#52796F] text-center flex items-center justify-center bg-gray-50 rounded-lg">
                                            {time}
                                        </div>
                                        {DAYS.map(day => {
                                            const coursesAtSlot = getCoursesForDayAndTime(day, time);
                                            const isFirstSlot = coursesAtSlot.length > 0 && coursesAtSlot[0].startTime === time;

                                            return (
                                                <div
                                                    key={`${day}-${time}`}
                                                    onDragOver={handleDragOver}
                                                    onDrop={() => handleDrop(day)}
                                                    className="min-h-[60px] border border-[#1B4332]/10 rounded-lg hover:bg-[#F1F8F4] transition-colors relative"
                                                >
                                                    {isFirstSlot && coursesAtSlot.map(course => {
                                                        const duration = parseInt(course.endTime.split(':')[0]) - parseInt(course.startTime.split(':')[0]);
                                                        return (
                                                            <div
                                                                key={`${course.id}-${course.startTime}`}
                                                                className="absolute inset-0 p-2 rounded-lg text-white text-xs font-medium shadow-md group"
                                                                style={{
                                                                    backgroundColor: course.color,
                                                                    height: `${duration * 61}px`,
                                                                    zIndex: 10
                                                                }}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold truncate">{course.name}</p>
                                                                        <p className="text-xs opacity-90">{course.code}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeCourse(course.id, course.day, course.startTime)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                                <p className="text-xs opacity-90">{course.professor}</p>
                                                                <p className="text-xs opacity-90 mt-1 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {course.startTime} - {course.endTime}
                                                                </p>
                                                                <p className="text-xs opacity-90">Salle: {course.room}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Selection Modal */}
            {isTimeModalOpen && pendingSchedule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#1B4332] p-6 text-white">
                            <h3 className="text-xl font-bold">Définir l'horaire</h3>
                            <p className="text-sm text-white/80 mt-1">
                                {pendingSchedule.course.name} - {pendingSchedule.day}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                        Heure de début
                                    </label>
                                    <select
                                        value={timeForm.startTime}
                                        onChange={(e) => setTimeForm({ ...timeForm, startTime: e.target.value })}
                                        className="w-full p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                                    >
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                        Heure de fin
                                    </label>
                                    <select
                                        value={timeForm.endTime}
                                        onChange={(e) => setTimeForm({ ...timeForm, endTime: e.target.value })}
                                        className="w-full p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                                    >
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                    Salle *
                                </label>
                                <input
                                    type="text"
                                    value={timeForm.room}
                                    onChange={(e) => setTimeForm({ ...timeForm, room: e.target.value })}
                                    placeholder="Ex: B204, Amphi A, Lab 3..."
                                    className="w-full p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsTimeModalOpen(false);
                                        setPendingSchedule(null);
                                        setTimeForm({ startTime: '08:00', endTime: '10:00', room: '' });
                                    }}
                                    className="flex-1 py-3 text-[#52796F] hover:bg-[#F1F8F4] rounded-[16px] font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmSchedule}
                                    disabled={!timeForm.room.trim()}
                                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D5F4C] text-white rounded-[16px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Ajouter au calendrier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
