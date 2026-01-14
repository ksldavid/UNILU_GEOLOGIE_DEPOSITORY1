import { LayoutDashboard, BookOpen, Calendar, GraduationCap, Megaphone, LogOut, Settings2 } from "lucide-react";
import uniluLogo from "../../assets/unilu-official-logo.png";

export type StudentPage = 'dashboard' | 'courses' | 'planning' | 'grades' | 'announcements' | 'settings';

interface StudentSidebarProps {
  currentPage: StudentPage;
  onNavigate: (page: StudentPage) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentSidebar({ currentPage, onNavigate, onLogout, isOpen, onClose }: StudentSidebarProps) {
  const menuItems = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'courses' as const, icon: BookOpen, label: 'Mes Cours' },
    { id: 'planning' as const, icon: Calendar, label: 'Emploi du temps' },
    { id: 'grades' as const, icon: GraduationCap, label: 'Notes & Résultats' },
    { id: 'announcements' as const, icon: Megaphone, label: 'Annonces' },
    { id: 'settings' as const, icon: Settings2, label: 'Mon Parcours' },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shadow-sm border-r border-gray-100 transition-transform duration-300 md:translate-x-0 md:static md:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Section */}
        <div className="p-8">
          <div className="flex flex-col items-center gap-4">
            <img src={uniluLogo} alt="UNILU Logo" className="w-20 h-20 object-contain" />
            <div className="text-center">
              <h1 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em]">Portail Étudiant</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

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
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className={isActive ? '' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
