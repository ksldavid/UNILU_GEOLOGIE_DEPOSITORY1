import { LayoutDashboard, Users, ClipboardCheck, FileText, Calendar, TrendingUp, GraduationCap, Shield } from "lucide-react";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const navItems = [
  { id: "supervision", label: "Supervision", icon: LayoutDashboard },
  { id: "inscriptions", label: "Inscriptions", icon: Users },
  { id: "assiduite", label: "Assiduité & Rectif.", icon: ClipboardCheck },
  { id: "notes", label: "Notes & PV", icon: FileText },
  { id: "planning", label: "Planning", icon: Calendar },
  { id: "performance", label: "Performance", icon: TrendingUp },
];

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground p-6 flex flex-col">
      {/* Logo Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-[16px] flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold">UNILU</h2>
            <p className="text-xs text-sidebar-foreground/70 uppercase tracking-widest">Service Académique</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Secure Access Badge */}
      <div className="mt-6 bg-sidebar-accent/50 backdrop-blur-sm rounded-[20px] p-4 border border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm">Accès Sécurisé</p>
            <p className="text-xs text-sidebar-foreground/70">Connexion cryptée active</p>
          </div>
        </div>
        <button className="w-full bg-white/10 hover:bg-white/20 text-sidebar-foreground py-2 rounded-[16px] text-sm transition-colors">
          Détails Session
        </button>
      </div>
    </aside>
  );
}
