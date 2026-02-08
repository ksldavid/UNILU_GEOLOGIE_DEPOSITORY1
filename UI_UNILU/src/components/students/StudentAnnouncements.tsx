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
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2 tracking-tight">Annonces</h1>
        <p className="text-gray-500 text-xs md:text-base font-medium">Actualités et communications importantes</p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4 md:space-y-6">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune annonce pour le moment.</p>
          </div>
        ) : announcements.map((announcement) => {
          const Icon = getTypeIcon(announcement.type);
          const handleMarkAsRead = async () => {
            if (announcement.isRead) return;
            try {
              await studentService.markAnnouncementAsRead(announcement.id);
              setAnnouncements(prev => prev.map(a =>
                a.id === announcement.id ? { ...a, isRead: true } : a
              ));
            } catch (err) {
              console.error(err);
            }
          };

          return (
            <div
              key={announcement.id}
              onClick={handleMarkAsRead}
              className={`bg-white rounded-3xl p-5 md:p-8 shadow-sm border-l-4 ${announcement.isRead ? 'border-teal-500 opacity-80' : 'border-rose-500 shadow-md ring-1 ring-rose-100'} hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden`}
            >
              {!announcement.isRead && (
                <div className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                {/* Icon Container */}
                <div className="flex items-center md:items-start gap-4 md:gap-0">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${announcement.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="md:hidden flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {getTypeLabel(announcement.type)}
                    </span>
                    {!announcement.isRead && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-rose-500 text-white rounded-full">NOUVEAU</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="mb-3">
                    <div className="hidden md:flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {getTypeLabel(announcement.type)}
                      </span>
                      {!announcement.isRead && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-rose-500 text-white rounded-full">NOUVEAU</span>
                      )}
                      <span className="text-xs text-gray-400 font-bold italic ml-auto">
                        Le {new Date(announcement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className={`text-lg md:text-2xl font-black mb-2 ${announcement.isRead ? 'text-gray-700' : 'text-gray-900 group-hover:text-rose-600'} transition-colors leading-tight`}>
                      {announcement.title}
                    </h3>
                    <div className="md:hidden text-[10px] text-gray-400 font-bold italic mb-4">
                      {new Date(announcement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {/* Body */}
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base font-medium">
                    {announcement.content}
                  </p>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                      <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500" />
                      <span className="truncate max-w-[150px]">{announcement.course}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500" />
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
