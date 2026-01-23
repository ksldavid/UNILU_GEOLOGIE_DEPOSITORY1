import { useState, useEffect, useCallback } from 'react';
import {
    Terminal, Search, Filter, Trash2,
    Download, Play, AlertTriangle,
    CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';

export function SystemLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('Tous les Types');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/stats/api-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Erreur chargement logs:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Rafraîchissement auto toutes les 5s
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const handleClearLogs = async () => {
        if (!window.confirm("Voulez-vous vraiment vider les logs de la session ?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/stats/clear-cache', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchLogs();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(log.status).includes(searchTerm);

        if (selectedType === 'Erreurs') return matchesSearch && log.status >= 400;
        if (selectedType === 'Avertissements') return matchesSearch && log.status === 404;
        if (selectedType === 'Informations') return matchesSearch && log.status < 400;

        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                        <Terminal className="w-8 h-8 text-blue-500" /> Logs API En Direct
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mono tracking-tighter italic">Flux d'événements HTTP capturés en temps réel par le middleware.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLogs}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[10px] transition-all border border-slate-700 uppercase tracking-widest">
                        <Download className="w-4 h-4" /> Download
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-4 shadow-xl">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Filtrer par chemin (ex: /api/admin), méthode ou status..."
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all font-medium font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-8 py-2.5 text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                    >
                        <option>Tous les Types</option>
                        <option>Informations</option>
                        <option>Avertissements</option>
                        <option>Erreurs</option>
                    </select>
                </div>
                <button
                    onClick={handleClearLogs}
                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
                    title="Vider les logs de session"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Logs List */}
            <div className="bg-[#111827] border border-slate-800 rounded-[24px] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capture active : {filteredLogs.length} événements</span>
                    </div>
                </div>
                <div className="divide-y divide-slate-800 border-t border-slate-800/50 max-h-[600px] overflow-y-auto custom-scrollbar font-mono">
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-slate-800/20 transition-colors flex items-start gap-6 text-[11px] group">
                            <div className="flex-shrink-0 pt-1">
                                <LogStatusIcon status={log.status} />
                            </div>
                            <div className="flex-shrink-0 w-24 border-r border-slate-800/50 pr-4">
                                <p className="text-slate-500 font-bold">{new Date(log.time).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex-shrink-0 w-16">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${log.method === 'GET' ? 'text-blue-400 bg-blue-500/10' :
                                    log.method === 'POST' ? 'text-emerald-400 bg-emerald-500/10' :
                                        log.method === 'DELETE' ? 'text-red-400 bg-red-500/10' : 'text-orange-400 bg-orange-500/10'
                                    }`}>
                                    {log.method}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold mb-0.5 truncate tracking-tight group-hover:text-blue-400 transition-colors">{log.path}</p>
                                <div className="flex items-center gap-4 text-[9px] text-slate-500 font-bold uppercase">
                                    <span>IP: {log.ip}</span>
                                    <span>Duration: {log.duration}ms</span>
                                    <span className={log.status >= 400 ? 'text-red-500' : 'text-emerald-500'}>Status: {log.status}</span>
                                </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-500 hover:text-white">
                                <Play className="w-4 h-4" />
                            </button>
                        </div>
                    )) : (
                        <div className="p-20 text-center text-slate-600 uppercase font-black text-xs tracking-[0.3em]">
                            Aucun log intercepté
                        </div>
                    )}
                </div>
                <div className="p-4 bg-[#0B0F19]/50 text-center border-t border-slate-800">
                    <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest italic">Les logs sont conservés uniquement pour la session en cours (Mémoire vive).</p>
                </div>
            </div>
        </div>
    );
}

function LogStatusIcon({ status }: { status: number }) {
    if (status >= 500) return <XCircle className="w-4 h-4 text-red-600" />;
    if (status >= 400) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (status >= 300) return <RefreshCw className="w-4 h-4 text-blue-400" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
}
