import { Search, Calendar, Bell, Menu, User } from "lucide-react";
import { UserData } from "../../App";

interface HeaderProps {
  userData: UserData;
  onLogout: () => void;
  onMenuClick: () => void;
  hasUnreadAnnouncements?: boolean;
  onBellClick?: () => void;
}

export function Header({ userData, onMenuClick, hasUnreadAnnouncements, onBellClick }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white/80 backdrop-blur-3xl border-b border-slate-100 px-6 md:px-12 py-6 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-8">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Improved Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#009485] transition-colors" />
            <input
              type="text"
              placeholder="Explorer le système académique..."
              className="w-full pl-16 pr-6 h-16 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-[#009485] focus:ring-0 transition-all text-[13px] font-bold text-slate-900 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4 md:gap-8 ml-auto">
          {/* Calendar Widget */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 shadow-sm cursor-default">
            <Calendar className="w-5 h-5 text-[#009485]" />
            <span className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em]">
              {new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Notifications Button */}
          <button
            onClick={onBellClick}
            className={`relative p-4 rounded-2xl transition-all duration-500 overflow-hidden group ${hasUnreadAnnouncements
              ? 'bg-teal-50 text-teal-600 shadow-xl shadow-teal-500/10 active:scale-90 border border-teal-100'
              : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-lg hover:border-slate-100 border border-transparent'
              }`}
          >
            <div className={`absolute inset-0 bg-teal-400/20 blur-xl transition-opacity duration-500 ${hasUnreadAnnouncements ? 'opacity-100' : 'opacity-0'}`} />
            <Bell className={`w-5 h-5 relative z-10 ${hasUnreadAnnouncements ? 'animate-bell' : 'transition-transform duration-500 group-hover:rotate-12'}`} />

            {hasUnreadAnnouncements && (
              <>
                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white z-20 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-400 rounded-full z-10 animate-ping opacity-75"></span>
              </>
            )}
          </button>

          {/* Profile Quick Access */}
          <div className="flex items-center gap-4 pl-4 md:pl-10 border-l border-slate-100">
            <div className="hidden sm:block text-right">
              <div className="text-[13px] font-black text-slate-950 tracking-tight leading-none mb-1 uppercase">{userData.name}</div>
              <div className="text-[9px] font-black text-[#009485] uppercase tracking-[0.3em] opacity-80">{userData.title || 'Professeur'}</div>
            </div>
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-[#009485] to-teal-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
              <div className="w-12 h-12 bg-white border-2 border-slate-50 rounded-2xl shadow-sm flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
                <span className="text-slate-950 font-black text-sm relative z-10">{getInitials(userData.name)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
