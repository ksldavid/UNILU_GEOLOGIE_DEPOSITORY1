import { useState, useEffect } from 'react';
import {
    Wrench as ToolIcon, RefreshCw, ShieldAlert,
    Terminal, Lock, Globe, Server
} from 'lucide-react';

export function ConfigManager() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3001/api/stats/technical', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const handleAction = async (action: string) => {
        if (!window.confirm(`Confirmer l'action système : ${action} ?`)) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = action === 'Redémarrage' ? 'restart' : 'clear-cache';
            const res = await fetch(`http://localhost:3001/api/stats/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message || data.error);
        } catch (err) {
            alert("Erreur lors de l'exécution de l'action.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in zoom-in duration-500 max-w-5xl mx-auto">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-600/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-xl shadow-blue-600/5">
                    <ToolIcon className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Configuration Système</h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">Interface de contrôle de bas niveau pour le moteur API UNILU.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Section */}
                <div className="bg-[#111827] border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10" />
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-blue-500" /> Protocoles de Sécurité
                    </h3>
                    <div className="space-y-4">
                        <ConfigToggle label="Authentification JWT" enabled={true} />
                        <ConfigToggle label="CORS Restriction" enabled={true} />
                        <ConfigToggle label="SSL / TLS 1.3" enabled={true} />
                        <div className="pt-6">
                            <button className="w-full py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                                Régénérer les clés secrètes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Operations Section */}
                <div className="bg-[#111827] border border-orange-500/20 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -z-10" />
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-orange-500" /> Maintenance Critique
                    </h3>
                    <div className="space-y-6">
                        <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                            <p className="text-[10px] text-orange-400 font-black uppercase mb-3 flex items-center gap-2">
                                <Terminal className="w-4 h-4" /> Danger Zone
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Attention: Le redémarrage coupe les connexions actives pendant environ 2-3 secondes.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleAction('Redémarrage')}
                                disabled={loading}
                                className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                                Redémarrer
                            </button>
                            <button
                                onClick={() => handleAction('Purge Cache')}
                                disabled={loading}
                                className="flex-1 py-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Purge RAM
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Runtime Info */}
            <div className="bg-[#111827]/50 border border-white/5 rounded-[32px] p-8 flex flex-wrap items-center justify-between gap-8">
                <RuntimeStat label="Environment" value="Production" icon={<Globe className="w-4 h-4 text-emerald-500" />} />
                <RuntimeStat label="OS Platform" value={stats?.system.platform || "Detecting..."} icon={<Server className="w-4 h-4 text-blue-500" />} />
                <RuntimeStat label="Active Threads" value={stats?.system.cpuCores || "Detecting..."} icon={<Activity className="w-4 h-4 text-purple-500" />} />
            </div>
        </div>
    );
}

function ConfigToggle({ label, enabled }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-[#0B0F19] rounded-2xl border border-slate-800/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`} />
            </div>
        </div>
    );
}

function RuntimeStat({ label, value, icon }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">{icon}</div>
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
                <p className="text-xs font-black text-white font-mono">{value}</p>
            </div>
        </div>
    );
}

function Activity({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
