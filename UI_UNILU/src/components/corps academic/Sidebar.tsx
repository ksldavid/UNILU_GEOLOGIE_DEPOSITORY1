import { LayoutGrid, GraduationCap, Calendar, Users, LogOut, Megaphone } from "lucide-react";
// import logoImage from "../../assets/unilu-official-logo.png";
import type { Page } from "../../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onClose }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as const, label: "Vue d'ensemble", icon: LayoutGrid },
    { id: 'courses' as const, label: "Mes Cours", icon: GraduationCap },
    { id: 'planning' as const, label: "Planning", icon: Calendar },
    { id: 'students' as const, label: "Étudiants", icon: Users },
    { id: 'announcements' as const, label: "Mes Annonces", icon: Megaphone },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Logo supprimé */}
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
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
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
    </>
  );
}
