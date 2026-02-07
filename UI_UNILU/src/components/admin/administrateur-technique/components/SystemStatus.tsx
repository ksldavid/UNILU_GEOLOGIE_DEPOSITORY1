import { API_URL } from '../../../../services/config';
import { useState, useEffect } from 'react';
import {
    Activity, Cpu, Database, Cloud, Image,
    ShieldAlert, RefreshCcw,
    Clock, Terminal, Zap, Users, BookOpen, GraduationCap, MessageSquare, Monitor, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SystemStatus() {
    const [stats, setStats] = useState<any>(null);
    const [apiLogs, setApiLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [uptime, setUptime] = useState('14d 2h 12m');
    const [trafficData, setTrafficData] = useState<any>(null);

    useEffect(() => {
        fetchData();
        fetchTraffic();
        const statsInterval = setInterval(fetchData, 10000);
        const trafficInterval = setInterval(fetchTraffic, 15000);
        const logsInterval = setInterval(fetchLogs, 5000);
        return () => {
            clearInterval(statsInterval);
            clearInterval(trafficInterval);
            clearInterval(logsInterval);
        };
    }, []);

    const fetchTraffic = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/stats/traffic-insights`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setTrafficData(await res.json());
        } catch (error) {
            console.error("Erreur traffic:", error);
        }
    };

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/stats/technical`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setIsOffline(false);

                // Calculer l'uptime proprement (ex: 14d 2h 12m)
                const totalSeconds = data.system.uptime || 0;
                const days = Math.floor(totalSeconds / (3600 * 24));
                const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                setUptime(`${days}d ${hours}h ${minutes}m`);
            } else {
                setIsOffline(true);
            }
        } catch (error) {
            setIsOffline(true);
            console.error("Erreur chargement stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (isOffline) return;
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/stats/api-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setApiLogs(await res.json());
        } catch (error) {
            console.error("Erreur logs:", error);
        }
    };

    const handleRestart = async () => {
        if (!window.confirm("Action critique : Êtes-vous sûr de vouloir redémarrer le noyau du serveur ?")) return;

        setIsRestarting(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/stats/restart`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // On met l'UI en attente
                setIsOffline(true);
                setStats(null);
                alert("Séquence de redémarrage initiée. Le serveur va s'éteindre et être relancé par le processeur de surveillance.");
            }
        } catch (error) {
            console.error("Erreur redémarrage:", error);
        } finally {
            // Pas de setIsRestarting(false) immédiat, on attend que le serveur revienne
            setTimeout(() => setIsRestarting(false), 5000);
        }
    };

    const handleClearCache = async () => {
        setIsClearingCache(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/stats/clear-cache`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setApiLogs([]);
                alert("Cache et logs système nettoyés.");
            }
        } catch (error) {
            console.error("Erreur nettoyage:", error);
        } finally {
            setIsClearingCache(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-[#0B0F19]">
                <div className="w-10 h-10 border-2 border-blue-500/20 rounded-full animate-spin border-t-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1700px] mx-auto p-4">
            {/* Connection Banner - Only shows when offline */}
            {isOffline && !isRestarting && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Serveur hors ligne - Tentative de reconnexion...</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-1 h-6 ${isOffline ? 'bg-red-600' : 'bg-blue-600'} rounded-full transition-colors`} />
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">Ops Center Dashboard</h1>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: {isOffline ? 'CRITICAL' : 'STABLE'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ServerBadge status={isOffline ? 'offline' : 'online'} label="Database Cluster" detail={stats?.database?.serverName || "RECONNECTING..."} />
                    <ServerBadge status={isOffline ? 'offline' : 'online'} label="API Hub" detail={stats?.system?.serverName || "RECONNECTING..."} />
                </div>
            </div>

            {/* Principal Stat Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 transition-opacity duration-500 ${isOffline ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <StatCardSmall
                    label="RAM Système"
                    value={`${stats?.system?.memUsed || '0'} / ${stats?.system?.memTotal || '0'} GB`}
                    subLabel={`Charge: ${stats?.system?.memPercent || 0}%`}
                    color="blue"
                    icon={<Cpu className="w-5 h-5" />}
                    progress={stats?.system?.memPercent}
                />
                <StatCardSmall
                    label="Stockage Data"
                    value={stats?.database?.sizeUsed || '0 MB'}
                    subLabel={`Limite: ${stats?.database?.sizeLimit || '512 MB'}`}
                    color="emerald"
                    icon={<Database className="w-5 h-5" />}
                    progress={stats?.database?.sizeUsedRaw ? (stats.database.sizeUsedRaw / (512 * 1024 * 1024)) * 100 : 0}
                />
                <StatCardSmall
                    label="Cloudinary (Média)"
                    value={stats?.cloudinary?.storage?.used || '0 GB'}
                    subLabel={`Limite: ${stats?.cloudinary?.storage?.limit || '25 GB'}`}
                    color="purple"
                    icon={<Cloud className="w-5 h-5" />}
                    progress={stats?.cloudinary?.storage?.percent || 0}
                />
                <StatCardSmall
                    label="Latence API"
                    value={stats?.database?.latency || '--'}
                    unit="ms"
                    subLabel={stats?.database?.status === 'CONNECTED' ? "Lien Stable" : "Erreur Lien"}
                    color="purple"
                    icon={<Activity className="w-5 h-5" />}
                />
                <StatCardSmall
                    label="Utilisateurs Actifs"
                    value={trafficData?.activeUsersCount || '0'}
                    unit="Live"
                    subLabel="Last 5 minutes"
                    color="orange"
                    icon={<Users className="w-5 h-5" />}
                />
                <StatCardSmall
                    label="Temps d'Activité"
                    value={uptime}
                    unit="Actif"
                    subLabel={`Platform: ${stats?.system?.platform}`}
                    color="emerald"
                    icon={<Clock className="w-5 h-5" />}
                />
            </div>

            {/* Traffic Insights Chart */}
            <div className={`bg-[#111827] border border-white/5 rounded-2xl overflow-hidden shadow-2xl transition-opacity ${isOffline ? 'opacity-30' : 'opacity-100'}`}>
                <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyse des Piques de Trafic (24h)</span>
                    </div>
                    <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Live Data Stream</div>
                </div>
                <div className="h-[250px] w-full p-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trafficData?.trafficHistory || []}>
                            <defs>
                                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="hour"
                                stroke="#ffffff20"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b' }}
                            />
                            <YAxis
                                stroke="#ffffff20"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b' }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="requests"
                                stroke="#f97316"
                                fillOpacity={1}
                                fill="url(#colorRequests)"
                                strokeWidth={3}
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Spec Row */}
            <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl transition-opacity ${isOffline ? 'opacity-30' : 'opacity-100'}`}>
                <SpecItem label="Architecture" value={stats?.system?.arch} icon={<Monitor className="w-3.5 h-3.5" />} />
                <SpecItem label="Processeur" value={stats?.system?.cpuCores ? `${stats.system.cpuCores} Cores` : '--'} icon={<Cpu className="w-3.5 h-3.5" />} />
                <SpecItem label="Enregistrements" value="Postgres SQL" icon={<Database className="w-3.5 h-3.5" />} />
                <SpecItem label="Cloud Média" value={stats?.cloudinary?.plan ? `Plan ${stats.cloudinary.plan}` : 'Image Cloud'} icon={<Cloud className="w-3.5 h-3.5" />} />
                <SpecItem label="Sécurité" value="SSL/JWT Cloud" icon={<ShieldAlert className="w-3.5 h-3.5" />} />
            </div>

            {/* Metrics Section */}
            <div className="space-y-4">
                <div className={`grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4 transition-opacity ${isOffline ? 'opacity-30' : 'opacity-100'}`}>
                    <MetricBadge label="Étudiants" value={stats?.database?.totalUsers} icon={<Users className="w-4 h-4" />} color="blue" />
                    <MetricBadge label="Cours" value={stats?.database?.totalCourses} icon={<BookOpen className="w-4 h-4" />} color="emerald" />
                    <MetricBadge label="Inscriptions" value={stats?.database?.totalEnrollments} icon={<GraduationCap className="w-4 h-4" />} color="purple" />
                    <MetricBadge label="Tickets Support" value={stats?.database?.totalTickets} icon={<MessageSquare className="w-4 h-4" />} color="orange" />
                    <MetricBadge label="Médias Cloud" value={stats?.cloudinary?.objects} icon={<Image className="w-4 h-4" />} color="blue" />
                </div>

                {/* Terminal */}
                <div className="bg-[#0B0F19] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl h-[300px]">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flux d'Exécution Fluxo-Logistics</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                                <span className="text-[8px] font-black text-white/50 uppercase">{isOffline ? 'LISTEN_FAIL' : 'LISTENING_PORT_3001'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2 bg-black/20 flex-1">
                        {isRestarting ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-blue-400">
                                <RefreshCcw className="w-8 h-8 animate-spin" />
                                <p className="text-[9px] font-black uppercase tracking-[0.6em] animate-pulse">SYSTÈME EN COURS DE REDÉMARRAGE...</p>
                            </div>
                        ) : apiLogs.length > 0 ? apiLogs.map((log, idx) => (
                            <div key={log.id || idx} className="flex gap-4 p-2 rounded-lg hover:bg-white/5 transition-all group">
                                <span className="text-slate-700 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                                <span className={`shrink-0 font-black w-8 ${log.method === 'POST' ? 'text-orange-400' : log.method === 'SYSTEM' ? 'text-emerald-400' : 'text-blue-400'}`}>{log.method}</span>
                                <span className="text-slate-400 flex-1 truncate">{log.path}</span>
                                <span className={`shrink-0 font-bold ${log.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>HTTP {log.status}</span>
                                <span className="text-slate-700 shrink-0 w-16 text-right">{log.duration}ms</span>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                                <Activity className="w-8 h-8 opacity-50" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em]">En attente d'activité réseau...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="bg-[#111827] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-600/10 rounded-lg">
                        <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Noyau d'Administration Nucleus</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRestart}
                        disabled={isRestarting}
                        className={`px-8 py-3 rounded-xl transition-all font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/10
                            ${isRestarting ? 'bg-blue-900 text-white/50 opacity-100' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
                        {isRestarting ? 'Redémarrage...' : 'Redémarrer le Noyau'}
                    </button>
                    <button
                        onClick={handleClearCache}
                        disabled={isClearingCache || isOffline}
                        className="bg-white/5 border border-white/10 text-white/50 px-8 py-3 rounded-xl transition-all font-black uppercase text-[9px] tracking-widest hover:text-white disabled:opacity-30"
                    >
                        Purger le Cache
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCardSmall({ label, value, subLabel, unit, color, icon, progress }: any) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10",
        emerald: "text-emerald-400 bg-emerald-500/10",
        purple: "text-purple-400 bg-purple-500/10",
        orange: "text-orange-400 bg-orange-500/10"
    };

    return (
        <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl shadow-lg flex flex-col justify-between h-[130px] group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-[8px] font-bold text-slate-700 uppercase">{subLabel}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white tracking-tighter leading-none">{value}</span>
                    {unit && <span className="text-[10px] font-bold text-slate-600 uppercase">{unit}</span>}
                </div>
                {progress !== undefined && (
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[color].split(' ')[0]} bg-current transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                    </div>
                )}
            </div>
        </div>
    );
}

function SpecItem({ label, value, icon }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-slate-600">{icon}</div>
            <div className="min-w-0">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
                <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{value || "Detecting..."}</p>
            </div>
        </div>
    );
}

function MetricBadge({ label, value, icon, color }: any) {
    const colors: any = {
        blue: "text-blue-400 border-blue-500/10",
        emerald: "text-emerald-400 border-emerald-500/10",
        purple: "text-purple-400 border-purple-500/10",
        orange: "text-orange-400 border-orange-500/10"
    };
    return (
        <div className={`bg-white/[0.02] border p-4 rounded-xl flex items-center justify-between group hover:bg-white/[0.04] transition-all min-w-0 ${colors[color]}`}>
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    {icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-50 truncate">{label}</span>
            </div>
            <p className="text-lg font-black text-white tracking-tighter ml-2 flex-shrink-0">{value || "0"}</p>
        </div>
    );
}

function ServerBadge({ status, label, detail }: any) {
    const isOnline = status === 'online';
    return (
        <div className={`flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border transition-colors ${isOnline ? 'border-white/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            <div className="flex flex-col leading-none">
                <span className="text-[9px] font-black text-white/60 uppercase tracking-tighter">{label}</span>
                <span className={`text-[7px] font-bold uppercase tracking-widest truncate max-w-[80px] ${isOnline ? 'text-white/20' : 'text-red-500/50'}`}>
                    {detail}
                </span>
            </div>
        </div>
    );
}





