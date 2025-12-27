import { Search, Calendar, Bell, Menu } from "lucide-react";
import { UserData } from "../../App";

interface StudentHeaderProps {
  studentData: UserData;
  onMenuClick: () => void;
}

export function StudentHeader({ studentData, onMenuClick }: StudentHeaderProps) {
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

          <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-gray-200">
            <div className="hidden md:block text-right">
              <div className="font-semibold text-gray-900">{studentData.name}</div>
              <div className="text-sm text-gray-500">{studentData.class}</div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm md:text-base">{getInitials(studentData.name)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
