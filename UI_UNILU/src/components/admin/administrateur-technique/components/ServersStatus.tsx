import { useState, useEffect, useCallback } from 'react';
import {
    Server as ServerIcon,
    Power, RefreshCw
} from 'lucide-react';

export function ServersStatus() {
    const [servers, setServers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchServers = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/infrastructure/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setServers(data);
            }
        } catch (error) {
            console.error("Erreur chargement serveurs:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServers();
        // Optionnel: refresh toutes les 30 secondes pour faire "temps réel"
        const interval = setInterval(fetchServers, 30000);
        return () => clearInterval(interval);
    }, [fetchServers]);

    const handlePowerAction = async (id: string, action: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/infrastructure/${id}/power`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                fetchServers();
            }
        } catch (error) {
            console.error("Erreur action serveur:", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ServerIcon className="w-8 h-8 text-blue-500" /> Infrastructure Serveurs
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mono tracking-tighter italic underline decoration-blue-500/30">Connecté au contrôleur d'infrastructure locale.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchServers}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
                        Global Restart
                    </button>
                </div>
            </div>

            {loading && servers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                    <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Scanning Nodes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.map(server => (
                        <div key={server.id} className="bg-[#111827] border border-slate-800 rounded-[24px] p-6 hover:shadow-2xl hover:border-blue-500/30 transition-all group overflow-hidden relative">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -z-10 rounded-full" />

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${server.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' :
                                        server.status === 'Offline' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                        } border border-current opacity-70`}>
                                        <ServerIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{server.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{server.region} • {server.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${server.status === 'Online' ? 'bg-emerald-500 animate-pulse' : server.status === 'Offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${server.status === 'Online' ? 'text-emerald-500' : server.status === 'Offline' ? 'text-red-500' : 'text-yellow-500'}`}>
                                        {server.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <SmallStat label="CPU" value={`${server.cpu}%`} />
                                <SmallStat label="RAM" value={`${server.ram}G`} />
                                <SmallStat label="Disk" value={`${server.storage}%`} />
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                                <button className="flex-1 py-1.5 bg-[#0B0F19] hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-lg text-[9px] font-black uppercase transition-all border border-slate-800">
                                    SSH Terminal
                                </button>
                                <button
                                    onClick={() => handlePowerAction(server.id, server.status === 'Online' ? 'stop' : 'start')}
                                    className="p-1.5 bg-[#0B0F19] hover:bg-slate-800 text-slate-500 rounded-lg transition-all border border-slate-800"
                                >
                                    <Power className={`w-4 h-4 ${server.status === 'Online' ? 'text-emerald-500' : 'text-red-500'}`} />
                                </button>
                                <button
                                    onClick={() => handlePowerAction(server.id, 'restart')}
                                    className="p-1.5 bg-[#0B0F19] hover:bg-slate-800 text-slate-500 rounded-lg transition-all border border-slate-800"
                                >
                                    <RefreshCw className="w-4 h-4 text-blue-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SmallStat({ label, value }: any) {
    return (
        <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800/50 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xs font-bold text-white font-mono">{value}</p>
        </div>
    );
}
