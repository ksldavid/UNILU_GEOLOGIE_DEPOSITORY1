import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

export function StudentPlanning() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await studentService.getSchedule();
        setSchedule(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const hours = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const toMinutes = (time: string) => {
    if (!time || typeof time !== 'string') return 0;
    const parts = time.trim().split(':');
    if (parts.length < 1) return 0;
    const h = parseInt(parts[0]) || 0;
    const m = parts[1] ? parseInt(parts[1]) : 0;
    return h * 60 + m;
  };

  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7));

    return days.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date.getDate();
    });
  };

  const weekDates = getWeekDates();

  const getSlotColor = (time: string) => {
    const hour = time.split(':')[0];
    const colors: { [key: string]: string } = {
      '07': 'bg-lime-100 border-lime-300 text-lime-800 hover:bg-lime-200',
      '08': 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
      '09': 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
      '10': 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200',
      '11': 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200',
      '12': 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
      '13': 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
      '14': 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-200',
      '15': 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-200',
      '16': 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200',
      '17': 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200',
      '18': 'bg-cyan-100 border-cyan-300 text-cyan-800 hover:bg-cyan-200',
    };
    return colors[hour] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  if (loading) return (
    <div className="p-8 space-y-8 animate-pulse">
      <Skeleton className="h-12 w-64" />
      <div className="h-20 bg-gray-100 rounded-[24px]" />
      <div className="h-[600px] bg-gray-50 rounded-[40px]" />
    </div>
  );

  const renderModal = () => {
    if (!selectedCourse) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div
          className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Pattern */}
          <div className={`h-32 ${getSlotColor(selectedCourse.time.split('-')[0])} relative flex items-end p-8`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 -mr-16 -mt-16 rounded-full blur-2xl" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Détails du cours</span>
              <h3 className="text-2xl font-black uppercase tracking-tight">{selectedCourse.course}</h3>
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
            >
              <Clock className="w-5 h-5 rotate-45" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                <div className="flex items-center gap-3 text-teal-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Horaire</span>
                </div>
                <div className="text-lg font-black text-gray-900">{selectedCourse.time}</div>
              </div>

              <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                <div className="flex items-center gap-3 text-teal-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Salle / Local</span>
                </div>
                <div className="text-lg font-black text-gray-900">{selectedCourse.room}</div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-teal-500" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Professeur Responsable</div>
                  <div className="text-gray-900 font-black">{selectedCourse.professor}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCourse(null)}
              className="w-full py-4 bg-gray-900 text-white font-black rounded-[24px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Emploi du temps</h1>
          <p className="text-gray-500 font-medium tracking-tight italic">Consultez votre programme hebdomadaire de cours et TP</p>
        </div>

        {/* Week Navigator */}
        <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex items-center gap-1">
          <button
            onClick={() => setCurrentWeek(currentWeek - 1)}
            className="p-3 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="px-6 py-2 flex items-center gap-3 border-x border-gray-50">
            <CalendarIcon className="w-5 h-5 text-teal-500" />
            <div className="text-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                {currentWeek === 0 ? 'Cette semaine' : `Semaine ${currentWeek > 0 ? '+' : ''}${currentWeek}`}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setCurrentWeek(currentWeek + 1)}
            className="p-3 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
          <div className="p-6 text-center border-r border-gray-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-gray-300" />
          </div>
          {days.map((day, index) => (
            <div key={day} className="p-6 text-center border-r border-gray-100 last:border-r-0">
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{day}</div>
              <div className={`text-xl font-black ${new Date().getDate() === weekDates[index] && currentWeek === 0 ? 'text-teal-600' : 'text-gray-900'}`}>
                {weekDates[index]}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="divide-y divide-gray-50">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-7 min-h-[90px] group/row">
              <div className="p-4 text-[10px] text-gray-400 font-black uppercase tracking-widest text-center bg-gray-50/30 border-r border-gray-100 flex items-center justify-center group-hover/row:bg-gray-50 transition-colors">
                {hour}
              </div>
              {days.map((day) => {
                const slotMin = toMinutes(hour);
                const coursesAtSlot = schedule?.[day]?.filter((c: any) => {
                  if (!c.time) return false;
                  // Handle "08:00-10:00" or "08:00 - 10:00"
                  const timeParts = c.time.split(/\s*-\s*/);
                  const start = toMinutes(timeParts[0]);
                  const end = toMinutes(timeParts[1] || timeParts[0]);
                  return slotMin >= start && slotMin < end;
                }) || [];

                const isFirstSlot = coursesAtSlot.length > 0 &&
                  toMinutes(coursesAtSlot[0].time.split(/\s*-\s*/)[0]) === slotMin;

                return (
                  <div key={`${day}-${hour}`} className="p-1 border-r border-gray-50 last:border-r-0 hover:bg-gray-50/30 transition-all relative group/slot">
                    {isFirstSlot && coursesAtSlot.map((course: any, idx: number) => {
                      const timeParts = course.time.split(/\s*-\s*/);
                      const startStr = timeParts[0];
                      const endStr = timeParts[1] || timeParts[0];
                      const durationSlots = Math.max(1, (toMinutes(endStr) - toMinutes(startStr)) / 30);

                      return (
                        <div
                          key={`${course.id}-${idx}`}
                          onClick={() => setSelectedCourse(course)}
                          className={`absolute inset-[2px] ${getSlotColor(startStr)} p-3 rounded-[20px] border border-transparent shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden z-10`}
                          style={{
                            height: `${durationSlots * 90 + (durationSlots - 1) * 1 - 4}px`,
                          }}
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 -mr-8 -mt-8 rounded-full blur-xl" />

                          <div>
                            <div className="font-black text-[11px] mb-1 leading-tight tracking-tight line-clamp-2 uppercase">
                              {course.course}
                            </div>
                            <div className="flex items-center gap-1 opacity-60 font-bold text-[9px] uppercase tracking-widest mb-1">
                              {course.time}
                            </div>
                          </div>

                          <div className="space-y-0.5 mt-auto">
                            <div className="flex items-center gap-1 font-bold text-[9px] opacity-70 truncate uppercase">
                              <MapPin className="w-2.5 h-2.5 shrink-0" /> {course.room}
                            </div>
                            <div className="flex items-center gap-1 font-bold text-[8px] opacity-60 truncate uppercase italic">
                              {course.professor}
                            </div>
                          </div>
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

      {/* Info Card */}
      <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 blur-[100px] -mr-48 -mt-48" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10">
              <CalendarIcon className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">Guide des Horaires</h3>
              <p className="text-gray-400 text-sm font-medium">Les cours sont colorés selon leur plage horaire pour une lecture rapide.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map(h => (
              <div key={h} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSlotColor(h).split(' ')[0]}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {renderModal()}
    </div>
  );
}
