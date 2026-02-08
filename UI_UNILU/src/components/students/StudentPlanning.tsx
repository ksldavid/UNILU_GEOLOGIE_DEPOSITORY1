import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, List, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

export function StudentPlanning() {
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 1 : new Date().getDay());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>(window.innerWidth < 768 ? 'daily' : 'weekly');

  const days = [
    { id: 1, label: 'Lundi', short: 'Lun' },
    { id: 2, label: 'Mardi', short: 'Mar' },
    { id: 3, label: 'Mercredi', short: 'Mer' },
    { id: 4, label: 'Jeudi', short: 'Jeu' },
    { id: 5, label: 'Vendredi', short: 'Ven' },
    { id: 6, label: 'Samedi', short: 'Sam' },
  ];

  useEffect(() => {
    const fetchPlanning = async () => {
      try {
        const data = await studentService.getSchedule();
        // Transformation des données si nécessaire (l'API semble retourner un objet par jour)
        const flattenedPlanning: any[] = [];
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          Object.entries(data).forEach(([dayName, courses]: [string, any]) => {
            const dayId = days.find(d => d.label === dayName)?.id || 0;
            if (Array.isArray(courses)) {
              courses.forEach(c => {
                const [start, end] = (c.time || "").split("-");
                flattenedPlanning.push({
                  ...c,
                  dayOfWeek: dayId,
                  startTime: (start || "").trim(),
                  endTime: (end || "").trim()
                });
              });
            }
          });
        }
        setPlanning(flattenedPlanning.length > 0 ? flattenedPlanning : (Array.isArray(data) ? data : []));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanning();

    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode('daily');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCoursesForDay = (dayId: number) => {
    return planning.filter(p => p.dayOfWeek === dayId).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  if (loading) return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-pulse">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-20 rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2 tracking-tight">Emploi du temps</h1>
          <p className="text-gray-500 text-xs md:text-base font-medium">Votre programme académique hebdomadaire</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl md:rounded-2xl self-start md:self-center">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-3.5 md:w-4 h-3.5 md:h-4" /> Jour
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="w-3.5 md:w-4 h-3.5 md:h-4" /> Semaine
          </button>
        </div>
      </div>

      {/* Day Selector - Only visible in daily view */}
      <AnimatePresence>
        {viewMode === 'daily' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-2 rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar mb-6 md:mb-10">
              <div className="flex items-center gap-1 min-w-max md:min-w-0 md:grid md:grid-cols-6">
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`flex-1 py-3 md:py-5 px-6 md:px-2 rounded-xl md:rounded-2xl transition-all relative overflow-hidden group ${selectedDay === day.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="block md:hidden text-xs font-black uppercase relative z-10">{day.short}</span>
                    <span className="hidden md:block text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">{day.label}</span>
                    {selectedDay === day.id && (
                      <motion.div layoutId="activeDay" className="absolute inset-0 bg-blue-600" />
                    )}
                    <div className="relative z-10">
                      <span className={`text-[10px] font-bold ${selectedDay === day.id ? 'text-white/60' : 'text-gray-300'}`}>
                        {getCoursesForDay(day.id).length} cours
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay + viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {viewMode === 'daily' ? (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {getCoursesForDay(selectedDay).length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl md:rounded-[40px] border border-dashed border-gray-200">
                  <Calendar className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold italic">Aucun cours prévu pour ce jour</p>
                </div>
              ) : getCoursesForDay(selectedDay).map((course, idx) => (
                <div key={idx} className="bg-white rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4 md:gap-6 flex-1">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                      <Clock className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-md bg-blue-50 text-blue-600">{course.startTime} - {course.endTime}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-md bg-purple-50 text-purple-600">{course.type}</span>
                      </div>
                      <h3 className="text-sm md:text-xl font-black text-gray-900 uppercase truncate group-hover:text-blue-600 transition-colors">{course.courseName || course.course}</h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Local</p>
                        <p className="text-[10px] md:text-xs font-bold text-gray-700">{course.room}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Professeur</p>
                        <p className="text-[10px] md:text-xs font-bold text-gray-700 uppercase truncate max-w-[120px]">{course.professor}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {days.map(day => (
                <div key={day.id} className="bg-white rounded-2xl md:rounded-[32px] border border-gray-100 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs md:text-sm">{day.label}</h3>
                    <span className="text-[10px] font-bold text-gray-400">{getCoursesForDay(day.id).length} cours</span>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {getCoursesForDay(day.id).map((course, idx) => (
                      <div key={idx} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all group/item">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest">{course.startTime}</span>
                          <span className="text-[8px] md:text-[9px] font-black text-purple-600 bg-purple-50 px-2 rounded-full uppercase">{course.type}</span>
                        </div>
                        <h4 className="text-[11px] md:text-xs font-black text-gray-900 uppercase line-clamp-2 mb-2 group-hover/item:text-blue-600 transition-colors leading-relaxed">{course.courseName || course.course}</h4>
                        <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <MapPin className="w-2.5 md:w-3 h-2.5 md:h-3" /> {course.room}
                        </div>
                      </div>
                    ))}
                    {getCoursesForDay(day.id).length === 0 && (
                      <p className="text-center py-6 md:py-8 text-[10px] md:text-xs text-gray-400 font-bold italic">Libre</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
