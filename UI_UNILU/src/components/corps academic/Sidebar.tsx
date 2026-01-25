import { LayoutGrid, GraduationCap, Calendar, Users, LogOut, Megaphone, ChevronRight } from "lucide-react";
import logoImage from "../../assets/da1a2f529aca98b88831def6f2dc64f21ceb1b65.png";
import type { Page } from "../../App";
import { motion } from "motion/react";

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
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-950 flex flex-col transition-all duration-500 transform md:translate-x-0 md:static ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[40px_0_100px_rgba(0,0,0,0.5)]`}>

        {/* Header - Brand */}
        <div className="p-10 mb-6">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <img src={logoImage} alt="UNILU Logo" className="w-8 h-auto" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tighter text-white block leading-none">UNILU</span>
              <span className="text-[9px] font-black text-[#009485] uppercase tracking-[0.4em]">Géologie</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Menu Principal</p>
          </div>
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
                  w-full group relative flex items-center justify-between gap-4 px-6 py-4 rounded-[22px] transition-all duration-500
                  ${isActive
                    ? 'bg-[#009485] text-white shadow-2xl shadow-[#009485]/20 ring-4 ring-[#009485]/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6 opacity-60 group-hover:opacity-100'}`} />
                  <span className={`text-[12px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
                </div>
                {isActive && <motion.div layoutId="sidebar-dot" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                {!isActive && <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300" />}
              </button>
            );
          })}
        </nav>

        {/* Footer - Profile/Logout Section */}
        <div className="p-8 border-t border-white/5 bg-white/2 space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-[24px] border border-white/5 flex items-center gap-4 transition-colors hover:bg-slate-900 group cursor-default">
            <div className="w-10 h-10 bg-gradient-to-br from-[#009485] to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#009485]/20 transition-all">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compte Actif</p>
              <p className="text-xs font-bold text-white max-w-[120px] truncate">Espace Professeur</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-[24px] transition-all duration-500 font-black text-[11px] uppercase tracking-[0.25em] group/logout shadow-lg hover:shadow-rose-600/30 active:scale-95"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover/logout:-translate-x-1" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}
