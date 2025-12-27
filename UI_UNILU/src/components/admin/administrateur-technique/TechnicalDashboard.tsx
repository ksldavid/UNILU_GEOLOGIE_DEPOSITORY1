import { useState } from 'react';
import {
    Activity, ShieldCheck, Database, Server,
    Terminal, Settings, LogOut, Bell, Search,
    Clock, Cpu, Shield, LayoutDashboard, Globe, Wrench as ToolIcon, Menu, X
} from 'lucide-react';
import { SystemStatus } from './components/SystemStatus';
import { AccessManagement } from './components/AccessManagement';
import { DatabaseManager } from './components/DatabaseManager';
import { ServersStatus } from './components/ServersStatus';
import { SystemLogs } from './components/SystemLogs';
import { UserModal } from './components/UserModal';

export function TechnicalDashboard({ onLogout }: { onLogout: () => void }) {
    const [activeTab, setActiveTab] = useState('System');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { id: 'System', icon: Activity, label: 'État du Système' },
        { id: 'Users', icon: ShieldCheck, label: 'Gestion des Accès' },
        { id: 'Database', icon: Database, label: 'Base de Données' },
        { id: 'Servers', icon: Server, label: 'Serveurs' },
        { id: 'Logs', icon: Terminal, label: 'Logs' },
        { id: 'Config', icon: Settings, label: 'Configuration' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'System':
                return <SystemStatus />;
            case 'Users':
                return <AccessManagement onOpenNewUser={() => setIsUserModalOpen(true)} />;
            case 'Database':
                return <DatabaseManager />;
            case 'Servers':
                return <ServersStatus />;
            case 'Logs':
                return <SystemLogs />;
            case 'Config':
                return (
                    <div className="bg-[#111827] border border-slate-800 rounded-[32px] p-12 text-center animate-in zoom-in duration-500">
                        <ToolIcon className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white uppercase mb-2">Configuration Globale</h2>
                        <p className="text-slate-500 max-w-md mx-auto">Interface de modification des variables d'environnement et des clés de sécurité.</p>
                        <div className="mt-10 grid grid-cols-2 gap-4 max-w-lg mx-auto">
                            <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 text-left">
                                <span className="text-[10px] font-black uppercase text-blue-500 block mb-1">CORS Policy</span>
                                <span className="text-xs text-white font-mono">ALLOW_ALL: FALSE</span>
                            </div>
                            <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 text-left">
                                <span className="text-[10px] font-black uppercase text-blue-500 block mb-1">Auth Strategy</span>
                                <span className="text-xs text-white font-mono">JWT + 2FA</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 space-y-4">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700">
                            <LayoutDashboard className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-xs">Section en cours de maintenance</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-[#0B0F19] text-slate-300 font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-[#0B0F19] flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 className="font-black text-xl text-white tracking-tighter">NETGUARD MOBILE</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-full">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600/10 text-white border-l-4 border-blue-500' : 'text-slate-500'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-widest">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {/* Sidebar NETGUARD (Desktop) */}
            <aside className="hidden md:flex w-72 bg-[#111827]/50 backdrop-blur-xl border-r border-white/5 flex-col pt-8">
                {/* Brand */}
                <div className="px-8 mb-12">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-all">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-white tracking-tighter leading-none">NETGUARD</h2>
                            <p className="text-[10px] font-bold text-blue-500 tracking-[0.2em] mt-1">ADMIN PORTAL</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all relative group ${isActive
                                    ? 'bg-blue-600/10 text-white border-l-4 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]'
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-500' : ''}`} />
                                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Bottom Footer */}
                <div className="p-6 space-y-4">
                    <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">System: Online</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-blue-500 rounded-full" />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black font-mono text-slate-600 uppercase">
                            <span>Uptime</span>
                            <span>14d 2h 12m</span>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full py-4 flex items-center justify-center gap-3 text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Quitter
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Premium Header */}
                <header className="h-24 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-10 z-10">
                    <div className="flex items-center gap-4 md:gap-8 flex-1 max-w-2xl">
                        {/* Mobile Trigger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 bg-white/5 text-white rounded-xl"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Search logs or commands.."
                                className="w-full bg-[#111827] border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-xs text-slate-300 outline-none focus:border-blue-500/30 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-mono text-[10px] uppercase font-bold tracking-tighter">
                            <Globe className="w-3 h-3" /> EU-WEST-3
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 pr-6 border-r border-white/5">
                            <button className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
                            </button>
                            <button className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
                                <Clock className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="text-right">
                                <p className="text-xs font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-widest">SysAdmin</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">Super-user</p>
                            </div>
                            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-600 p-[1px]">
                                <div className="w-full h-full rounded-[13px] bg-slate-900 p-1 flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full rounded-[10px] bg-blue-500/20 flex items-center justify-center">
                                        <Cpu className="w-6 h-6 text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                    {/* Background Subtle Gradient */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] -z-10 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] -z-10 rounded-full" />

                    {/* Page Title Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
                                Dashboard Technique <span className="text-blue-600">v2.4.0</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium mt-1 font-mono tracking-tighter">root@university-portal:~/dashboard</p>
                        </div>
                    </div>

                    {/* Dynamic Content */}
                    {renderContent()}
                </div>

                {/* Global Status Bar Footer */}
                <footer className="h-10 bg-[#0B0F19] border-t border-white/5 flex items-center justify-between px-10 text-[9px] font-black font-mono text-slate-600 uppercase tracking-widest">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            SYSTEM_STATUS: <span className="text-emerald-500">ONLINE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            DB_LATENCY: <span className="text-blue-500">24ms</span>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <span>SERVER: EU-WEST-3</span>
                        <span>BUILD: 2023.10.24-RC2</span>
                    </div>
                </footer>
            </main>

            {/* Modal */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
            />
        </div>
    );
}
