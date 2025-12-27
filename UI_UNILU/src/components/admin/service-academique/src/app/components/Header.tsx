import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps = {}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-border px-6 md:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl">Bonjour, Service Académique</h2>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </div>

        {/* Search & Profile */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-input-background rounded-[20px] px-4 py-2 w-80">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher étudiant, CMD+K"
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
            <kbd className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-muted rounded-[16px] transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          {/* Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-white rounded-[20px] px-4 py-2 border border-border hover:shadow-md transition-all"
            >
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm text-primary-foreground">SA</span>
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm">Service Académique</p>
                <p className="text-xs text-muted-foreground">Géologie - UNILU</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && onLogout && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-border shadow-xl py-2 z-50">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
