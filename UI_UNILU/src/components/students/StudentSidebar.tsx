import { LayoutDashboard, BookOpen, Calendar, GraduationCap, Megaphone, LogOut } from "lucide-react";
import uniluLogo from "../../assets/unilu-official-logo.png";

export type StudentPage = 'dashboard' | 'courses' | 'planning' | 'grades' | 'announcements';

interface StudentSidebarProps {
  currentPage: StudentPage;
  onNavigate: (page: StudentPage) => void;
  onLogout: () => void;
}

export function StudentSidebar({ currentPage, onNavigate, onLogout }: StudentSidebarProps) {
  const menuItems = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'courses' as const, icon: BookOpen, label: 'Mes Cours' },
    { id: 'planning' as const, icon: Calendar, label: 'Emploi du temps' },
    { id: 'grades' as const, icon: GraduationCap, label: 'Notes & Résultats' },
    { id: 'announcements' as const, icon: Megaphone, label: 'Annonces' },
  ];

  return (
    <aside className="w-64 bg-white flex flex-col shadow-sm border-r border-gray-100">
      {/* Logo Section */}
      <div className="p-8">
        <div className="flex flex-col items-center gap-4">
          <img src={uniluLogo} alt="UNILU Logo" className="w-20 h-20 object-contain" />
          <div className="text-center">
            <h1 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em]">Portail Étudiant</h1>
            <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-1 italic">Faculté de Géologie</p>
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
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20'
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
  );
}