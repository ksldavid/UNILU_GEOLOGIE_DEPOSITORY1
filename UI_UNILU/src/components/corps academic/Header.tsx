import { Search, Calendar, Bell, Menu } from "lucide-react";
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
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm md:text-base"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 ml-2 md:ml-8">
          <div className="hidden md:flex items-center gap-2 text-gray-700">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          <button
            onClick={onBellClick}
            className={`relative p-2.5 rounded-xl transition-all duration-500 overflow-hidden group ${hasUnreadAnnouncements
              ? 'bg-teal-50 text-teal-600 shadow-lg shadow-teal-500/20'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            title={hasUnreadAnnouncements ? "Nouvelles annonces" : "Pas de nouvelles annonces"}
          >
            <div className={`absolute inset-0 bg-teal-400/10 blur-xl transition-opacity duration-500 ${hasUnreadAnnouncements ? 'opacity-100' : 'opacity-0'}`} />

            <Bell className={`w-5 h-5 relative z-10 ${hasUnreadAnnouncements ? 'animate-bell' : 'group-hover:rotate-12'}`} />

            {hasUnreadAnnouncements && (
              <>
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-20 animate-pulse-red"></span>
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full z-10 animate-ping opacity-75"></span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-gray-200">
            <div className="hidden md:block text-right">
              <div className="font-semibold text-gray-900">{userData.name}</div>
              <div className="text-sm text-gray-500">{userData.title}</div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm md:text-base">{getInitials(userData.name)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
