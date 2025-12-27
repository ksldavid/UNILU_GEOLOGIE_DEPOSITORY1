import { LayoutGrid, GraduationCap, Calendar, Users, LogOut } from "lucide-react";
import logoImage from "../../assets/da1a2f529aca98b88831def6f2dc64f21ceb1b65.png";
import type { Page } from "../../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as const, label: "Vue d'ensemble", icon: LayoutGrid },
    { id: 'courses' as const, label: "Mes Cours", icon: GraduationCap },
    { id: 'planning' as const, label: "Planning", icon: Calendar },
    { id: 'students' as const, label: "Étudiants", icon: Users },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="UNILU Logo" className="w-10 h-auto" />
          <span className="font-semibold text-xl tracking-tight text-gray-900">UNILU</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id ||
            (item.id === 'courses' && (currentPage === 'course-detail' || currentPage === 'attendance'));

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
