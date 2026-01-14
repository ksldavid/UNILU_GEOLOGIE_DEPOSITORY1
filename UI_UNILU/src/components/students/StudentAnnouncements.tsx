import { useState, useEffect } from "react";
import { Megaphone, BookOpen, User, Calendar, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

export function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await studentService.getAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'URGENT': return 'Urgent';
      case 'SCHEDULE': return 'Horaire';
      case 'RESOURCE': return 'Ressource';
      case 'REMINDER': return 'Rappel';
      default: return 'Information';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'URGENT': return AlertCircle;
      case 'SCHEDULE': return Calendar;
      case 'RESOURCE': return BookOpen;
      case 'REMINDER': return AlertTriangle;
      default: return Info;
    }
  };

  if (loading) return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2 font-bold text-3xl">Annonces</h1>
        <p className="text-gray-600">Toutes les communications et actualités de vos cours</p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune annonce pour le moment.</p>
          </div>
        ) : announcements.map((announcement) => {
          const Icon = getTypeIcon(announcement.type);
          return (
            <div
              key={announcement.id}
              className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-teal-500 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex gap-6">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${announcement.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {getTypeLabel(announcement.type)}
                        </span>
                        <span className="text-xs text-gray-400 font-bold italic">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">{announcement.title}</h3>
                    </div>
                  </div>

                  {/* Body */}
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm font-medium">{announcement.content}</p>

                  {/* Footer */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-teal-500" />
                      <span>{announcement.course}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <User className="w-4 h-4 text-teal-500" />
                      <span>{announcement.author}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
