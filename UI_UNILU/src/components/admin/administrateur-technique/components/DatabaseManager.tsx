import { API_URL } from '../../../../services/config';
import { useState, useEffect, useCallback } from 'react';
import {
    Database, Activity, HardDrive,
    RefreshCw, Play, AlertTriangle,
    ShieldCheck
} from 'lucide-react';

export function DatabaseManager() {
    const [query, setQuery] = useState("SELECT id, name, systemRole FROM \"User\" LIMIT 5;");
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/database/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Erreur stats DB:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRunQuery = async () => {
        if (!query.trim()) return;
        setIsRunning(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/database/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if (res.ok) {
                setResults(Array.isArray(data) ? data : [data]);
            } else {
                alert(data.error || "Erreur lors de l'exécution de la requête.");
            }
        } catch (error) {
            console.error("Erreur query:", error);
            alert("Erreur de connexion au serveur.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                        <Database className="w-8 h-8 text-emerald-500" /> Base de Données
                        <span className="text-[10px] animate-pulse bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 tracking-widest ml-2">LIVE</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mono italic underline decoration-emerald-500/30">Connecté à l'instance Prisma PostgreSQL locale.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DBStatCard
                    label="TABLES PRINCIPALES"
                    value={stats?.tableCounts.users || '...'}
                    unit="Utilisateurs"
                    trend="+5"
                    icon={<Activity className="w-6 h-6 text-blue-400" />}
                />
                <DBStatCard
                    label="CHARGE ÉTUDIANTE"
                    value={stats?.tableCounts.students || '...'}
                    unit="Inscriptions"
                    icon={<HardDrive className="w-6 h-6 text-yellow-400" />}
                />
                <DBStatCard
                    label="ÉTAT DU MOTEUR"
                    value={stats?.engine.split(' ')[0] || '...'}
                    unit={stats?.engine.split(' ')[1] || 'DB'}
                    status={stats?.status || 'Active'}
                    icon={<RefreshCw className="w-6 h-6 text-emerald-400" />}
                    details={[
                        { name: 'Professeurs', status: stats?.tableCounts.professors },
                        { name: 'Niveaux Acad.', status: stats?.tableCounts.levels }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {/* SQL Editor */}
                    <div className="bg-[#111827] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl relative transition-all">
                        <div className="p-4 bg-orange-600/10 border-b border-orange-500/10 flex items-center justify-between">
                            <h3 className="text-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> SQL CONSOLE - ACCÈS PRISMA DIRECT
                            </h3>
                            <div className="flex gap-4 items-center">
                                <span className="text-[9px] font-bold text-slate-600 uppercase italic">Seules les requêtes SELECT sont autorisées</span>
                            </div>
                        </div>
                        <div className="p-8 bg-[#0B0F19] font-mono text-sm relative group">
                            <div className="absolute left-6 top-8 text-blue-500/50 select-none font-black italic">SQL{'>'}</div>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-blue-400 resize-none pl-12 h-20 leading-loose scrollbar-none font-bold"
                                spellCheck={false}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setQuery("")}
                                    className="px-6 py-3 bg-slate-900 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-800 hover:text-white transition-all"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleRunQuery}
                                    disabled={isRunning}
                                    className="flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50 active:scale-95"
                                >
                                    {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                    {isRunning ? "Exécution..." : "Exécuter SQL"}
                                </button>
                            </div>
                        </div>

                        {results.length > 0 && (
                            <div className="overflow-x-auto border-t border-slate-800 bg-[#0B0F19]/50 max-h-[400px] custom-scrollbar">
                                <table className="w-full text-left font-mono text-[11px]">
                                    <thead className="border-b border-slate-800/50 bg-[#111827] sticky top-0 z-10">
                                        <tr className="text-slate-500 font-black uppercase tracking-widest">
                                            {Object.keys(results[0]).map(key => (
                                                <th key={key} className="px-6 py-3">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y divide-slate-800/30 transition-opacity duration-300 ${isRunning ? 'opacity-30' : 'opacity-100'}`}>
                                        {results.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-600/5 transition-colors">
                                                {Object.values(row).map((val: any, i) => (
                                                    <td key={i} className="px-6 py-4 text-slate-300 font-medium">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* DB Sidebar: Info */}
                <div className="space-y-6 text-slate-300">
                    <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-blue-500" /> Structure Tables
                        </h3>
                        <div className="space-y-3">
                            <DBTableInfo name="User" count={stats?.tableCounts.users} />
                            <DBTableInfo name="StudentEnrollment" count={stats?.tableCounts.students} />
                            <DBTableInfo name="AcademicLevel" count={stats?.tableCounts.levels} />
                            <DBTableInfo name="SupportTicket" count={stats?.tableCounts.supportTickets} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-white/5 p-6 rounded-3xl shadow-xl">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" /> Performance
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="text-slate-500">Connexions</span>
                                <span className="text-emerald-400">{stats?.connectionCount} active</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="text-slate-500">Taille DB</span>
                                <span className="text-emerald-400">{stats?.sizeMb} MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DBTableInfo({ name, count }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-[#0B0F19] border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all cursor-default">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{name}</span>
            <span className="text-[10px] font-mono text-blue-400 font-bold">{count ?? '...'} rows</span>
        </div>
    );
}

function DBStatCard({ label, value, unit, trend, status, icon, details }: any) {
    return (
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-900/80 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
                {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">↑ {trend}</span>}
                {status && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest">{status}</span>}
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tighter">{value}</span>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">{unit}</span>}
            </div>
            {details && (
                <div className="mt-5 space-y-2">
                    {details.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold font-mono">
                            <span className="text-slate-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {d.name}
                            </span>
                            <span className="text-blue-500 font-black uppercase">{d.status ?? '0'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}





