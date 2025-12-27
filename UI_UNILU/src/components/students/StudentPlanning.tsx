import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";

export function StudentPlanning() {
  const [currentWeek, setCurrentWeek] = useState(0);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

  const schedule = {
    'Lundi': [
      { time: '08:00-10:00', course: 'Minéralogie', professor: 'Dr. Kalombo', room: 'Lab 101', color: 'bg-purple-100 border-purple-300 text-purple-700' },
      { time: '10:00-12:00', course: 'Pétrographie', professor: 'Dr. Mukendi', room: 'Amphi A', color: 'bg-blue-100 border-blue-300 text-blue-700' },
    ],
    'Mardi': [
      { time: '10:00-12:00', course: 'Géologie Structurale', professor: 'Pr. Mwamba', room: 'Amphi C', color: 'bg-orange-100 border-orange-300 text-orange-700' },
      { time: '14:00-16:00', course: 'Stratigraphie', professor: 'Pr. Kabeya', room: 'Salle 203', color: 'bg-teal-100 border-teal-300 text-teal-700' },
    ],
    'Mercredi': [
      { time: '10:00-12:00', course: 'Pétrographie', professor: 'Dr. Mukendi', room: 'Amphi A', color: 'bg-blue-100 border-blue-300 text-blue-700' },
      { time: '14:00-17:00', course: 'Cartographie Géologique', professor: 'Dr. Kabamba', room: 'Salle 205', color: 'bg-pink-100 border-pink-300 text-pink-700' },
      { time: '16:30-18:30', course: 'Géomorphologie', professor: 'Dr. Tshimanga', room: 'Amphi B', color: 'bg-green-100 border-green-300 text-green-700' },
    ],
    'Jeudi': [
      { time: '08:00-10:00', course: 'Minéralogie', professor: 'Dr. Kalombo', room: 'Lab 101', color: 'bg-purple-100 border-purple-300 text-purple-700' },
      { time: '14:00-16:00', course: 'Stratigraphie', professor: 'Pr. Kabeya', room: 'Salle 203', color: 'bg-teal-100 border-teal-300 text-teal-700' },
    ],
    'Vendredi': [
      { time: '10:00-12:00', course: 'Géologie Structurale', professor: 'Pr. Mwamba', room: 'Amphi C', color: 'bg-orange-100 border-orange-300 text-orange-700' },
      { time: '16:30-18:30', course: 'Géomorphologie', professor: 'Dr. Tshimanga', room: 'Amphi B', color: 'bg-green-100 border-green-300 text-green-700' },
    ],
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Emploi du temps</h1>
        <p className="text-gray-600">Planning hebdomadaire de vos cours</p>
      </div>

      {/* Week Navigator */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeek(currentWeek - 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            <h3 className="text-gray-900">
              {currentWeek === 0 ? 'Cette semaine' : currentWeek > 0 ? `Semaine +${currentWeek}` : `Semaine ${currentWeek}`}
            </h3>
            <span className="text-sm text-gray-500">Décembre 2025</span>
          </div>

          <button
            onClick={() => setCurrentWeek(currentWeek + 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-200">
          <div className="p-4 text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto" />
          </div>
          {days.map((day, index) => (
            <div key={day} className="p-4 text-center border-l border-gray-200">
              <div className="text-sm text-gray-500">{day}</div>
              <div className="text-lg text-gray-900 mt-1">{weekDates[index]}</div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="divide-y divide-gray-100">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-6 min-h-[100px]">
              <div className="p-4 text-sm text-gray-500 text-center bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                {hour}
              </div>
              {days.map((day) => {
                const courseForSlot = schedule[day as keyof typeof schedule]?.find(c => 
                  c.time.startsWith(hour)
                );
                
                return (
                  <div key={`${day}-${hour}`} className="p-2 border-l border-gray-100 hover:bg-gray-50 transition-colors">
                    {courseForSlot && (
                      <div className={`${courseForSlot.color} p-3 rounded-lg border-l-4 h-full`}>
                        <div className="font-medium text-sm mb-1">{courseForSlot.course}</div>
                        <div className="text-xs opacity-75 mb-1">{courseForSlot.time}</div>
                        <div className="text-xs opacity-75">{courseForSlot.room}</div>
                        <div className="text-xs opacity-75 mt-1">{courseForSlot.professor}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-gray-900 mb-4">Légende</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
            <span className="text-sm text-gray-600">Pétrographie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-teal-100 border-2 border-teal-300"></div>
            <span className="text-sm text-gray-600">Stratigraphie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
            <span className="text-sm text-gray-600">Géomorphologie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-300"></div>
            <span className="text-sm text-gray-600">Minéralogie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
            <span className="text-sm text-gray-600">Géol. Structurale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-300"></div>
            <span className="text-sm text-gray-600">Cartographie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
