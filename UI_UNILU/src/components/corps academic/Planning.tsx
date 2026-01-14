import { ChevronLeft, ChevronRight, Clock, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { professorService } from "../../services/professor";

export function Planning() {
  const [currentWeek] = useState("Semaine actuelle");
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await professorService.getSchedule();
        setSchedules(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const handleTodayClick = () => {
    const todayIndex = new Date().getDay();
    setFilterDay(daysOfWeek[todayIndex]);
  };

  const weekSchedule: Record<string, any[]> = {
    Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
  };

  schedules.forEach(s => {
    const day = s.day.charAt(0).toUpperCase() + s.day.slice(1).toLowerCase(); // Ensure capitalization matches keys
    if (weekSchedule[day]) {
      weekSchedule[day].push({
        title: s.title,
        location: s.location,
        time: `${s.startTime} - ${s.endTime}`,
        color: s.color || "text-blue-600"
      });
    }
  });

  const displayedSchedule = filterDay
    ? Object.entries(weekSchedule).filter(([day]) => day === filterDay)
    : Object.entries(weekSchedule);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Synchronisation de l'agenda...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">
          Mon Planning
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          Vue {filterDay ? `du ${filterDay}` : 'hebdomadaire'} de vos cours et activités.
        </p>
      </div>

      {/* Week Navigation & Controls */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-6 mb-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <span className="font-black text-gray-900 text-xl px-4">{currentWeek}</span>
              <button className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {filterDay && (
              <button
                onClick={() => setFilterDay(null)}
                className="text-teal-600 font-bold text-sm bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100 transition-all border border-teal-100"
              >
                Voir toute la semaine
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleTodayClick}
              className={`px-8 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${filterDay ? 'bg-teal-600 text-white shadow-teal-200' : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'}`}
            >
              Aujourd'hui
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className={`grid grid-cols-1 ${filterDay ? 'max-w-4xl mx-auto' : 'lg:grid-cols-7 md:grid-cols-2'} gap-4`}>
        {displayedSchedule.map(([day, events]) => (
          <div key={day} className="flex flex-col animate-in fade-in duration-500">
            {/* Day Header */}
            <div className="mb-3 px-1">
              <h3 className={`font-black uppercase tracking-widest text-[11px] ${day === filterDay ? 'text-teal-600' : 'text-gray-400'}`}>
                {day}
              </h3>
            </div>

            {/* Events Column */}
            <div className="flex flex-col gap-3">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:border-teal-100 transition-all cursor-pointer group/card border-l-4 border-l-transparent hover:border-l-teal-500"
                  >
                    <div className="space-y-1 mb-3 text-left">
                      <h4 className={`font-bold text-[15px] leading-tight ${event.color}`}>
                        {event.title}
                      </h4>
                      <p className="text-gray-400 text-xs font-semibold">
                        {event.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-3.5 h-3.5 opacity-50" />
                      <span className="text-[11px] font-bold">{event.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-100/20 border border-gray-100/50 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[120px] text-center">
                  <p className="text-[11px] text-gray-300 font-black uppercase tracking-wider">
                    Aucun événement
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
