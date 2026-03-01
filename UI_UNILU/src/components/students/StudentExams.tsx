import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, GraduationCap, ChevronLeft, ChevronRight, AlertCircle, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { examScheduleService, ExamScheduleData } from "../../services/exam-schedule";
import { Skeleton } from "../Skeleton";

export function StudentExams() {
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<ExamScheduleData[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    useEffect(() => {
        const fetchExams = async () => {
            try {
                setLoading(true);
                const data = await examScheduleService.getAll({ 
                    month: currentMonth, 
                    year: currentYear 
                });
                setSchedules(data);
            } catch (error) {
                console.error("Failed to fetch exam schedules:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, [currentMonth, currentYear]);

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    // Grouping by date
    const groupedSchedules = schedules.reduce((groups: { [key: string]: ExamScheduleData[] }, item) => {
        const dateKey = new Date(item.date).toLocaleDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(item);
        return groups;
    }, {});

    const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.split('/').reverse().join('-')).getTime();
        return dateA - dateB;
    });

    if (loading) return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-20 rounded-3xl" />
            <div className="space-y-4">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2 tracking-tight">Examen & Interro</h1>
                <p className="text-gray-500 text-xs md:text-base font-medium">Calendrier de vos évaluations académiques</p>
            </div>

            {/* Month Selector */}
            <div className="bg-white p-4 md:p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                <button 
                    onClick={handlePrevMonth}
                    className="p-3 hover:bg-gray-50 rounded-2xl transition-all active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-400" />
                </button>
                
                <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter">
                        {monthNames[currentMonth - 1]} {currentYear}
                    </h2>
                    <p className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-[0.2em] mt-1">
                        {schedules.length} Évaluation{schedules.length > 1 ? 's' : ''} prévue{schedules.length > 1 ? 's' : ''}
                    </p>
                </div>

                <button 
                    onClick={handleNextMonth}
                    className="p-3 hover:bg-gray-50 rounded-2xl transition-all active:scale-90"
                >
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                </button>
            </div>

            {/* List of Schedules */}
            <div className="space-y-8">
                {sortedDates.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <CalendarIcon className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold italic text-center px-6">
                            Aucune évaluation programmée pour ce mois. <br />
                            <span className="text-xs font-medium not-italic">Vérifiez les mois suivants ou précédenst.</span>
                        </p>
                    </div>
                ) : (
                    sortedDates.map((dateStr) => {
                        const items = groupedSchedules[dateStr];
                        const dateObj = new Date(items[0].date);
                        
                        return (
                            <div key={dateStr} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gray-100" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] bg-gray-50 px-4 py-1 rounded-full border border-gray-100">
                                        {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {items.map((exam, idx) => (
                                        <motion.div
                                            key={exam.id || idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="relative overflow-hidden group"
                                        >
                                            <div className={`p-6 md:p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 group-hover:-translate-y-1 border-l-8 ${exam.type === 'EXAM' ? 'border-l-rose-500' : 'border-l-blue-500'}`}>
                                                
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${exam.type === 'EXAM' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                {exam.type === 'EXAM' ? 'Examen Final' : 'Interrogation'}
                                                            </span>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-full border border-gray-100 italic">
                                                                {exam.courseCode}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight uppercase tracking-tight mt-2">
                                                            {exam.course?.name}
                                                        </h3>
                                                    </div>

                                                    <div 
                                                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10"
                                                        style={{ background: `linear-gradient(to bottom right, ${exam.course?.colorFrom || '#1B4332'}, ${exam.course?.colorTo || '#2D6A4F'})` }}
                                                    >
                                                        <GraduationCap className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                        <Clock className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Heure</p>
                                                            <p className="text-sm font-black text-gray-900 italic">
                                                                {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                        <MapPin className="w-5 h-5 text-gray-400" />
                                                        <div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Local</p>
                                                            <p className="text-sm font-black text-gray-900 italic">
                                                                À confirmer
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                            <Bookmark className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Professeur</p>
                                                            <p className="text-xs font-bold text-gray-700 uppercase truncate max-w-[120px]">
                                                                {exam.course?.professor}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {exam.type === 'EXAM' && (
                                                        <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-pulse">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Crucial</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Mobile Footer Tip */}
            <div className="md:hidden bg-[#0F172A] p-6 rounded-[32px] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <p className="text-xs font-bold italic leading-relaxed relative z-10 text-white/80">
                    <span className="text-blue-400 font-black not-italic block mb-1">NOTE :</span>
                    Les horaires et locaux peuvent être modifiés par le service académique. Restez attentifs aux annonces générales.
                </p>
            </div>
        </div>
    );
}
