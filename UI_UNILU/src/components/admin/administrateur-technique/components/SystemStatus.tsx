import { useState } from 'react';
import {
    Activity, Cpu, Database, Server,
    ShieldAlert, RefreshCcw, Trash2,
    X, Info
} from 'lucide-react';

const trafficData = [
    { time: '00:00', inbound: 12, outbound: 8 },
    { time: '04:00', inbound: 18, outbound: 12 },
    { time: '08:00', inbound: 45, outbound: 30 },
    { time: '12:00', inbound: 82, outbound: 55 },
    { time: '16:00', inbound: 75, outbound: 48 },
    { time: '20:00', inbound: 52, outbound: 35 },
    { time: '24:00', inbound: 28, outbound: 18 },
];

function CustomNetworkChart() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const width = 800;
    const height = 240;
    const padding = 20;

    const getX = (i: number) => (i / (trafficData.length - 1)) * (width - 2 * padding) + padding;
    const getY = (val: number) => height - ((val / 100) * (height - 2 * padding) + padding);

    const createPath = (key: 'inbound' | 'outbound') => {
        const points = trafficData.map((d, i) => `${getX(i)},${getY(d[key])}`);
        return `M ${points.join(' L ')}`;
    };

    const createAreaPath = (key: 'inbound' | 'outbound') => {
        const points = trafficData.map((d, i) => `${getX(i)},${getY(d[key])}`);
        return `M ${getX(0)},${height} L ${points.join(' L ')} L ${getX(trafficData.length - 1)},${height} Z`;
    };

    return (
        <div className="relative w-full h-[250px] font-mono group" onMouseLeave={() => setHoveredIdx(null)}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {[0, 25, 50, 75, 100].map(v => (
                    <line key={v} x1={padding} y1={getY(v)} x2={width - padding} y2={getY(v)} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                <path d={createAreaPath('inbound')} fill="url(#gradIn)" className="transition-all duration-700" />
                <path d={createAreaPath('outbound')} fill="url(#gradOut)" className="transition-all duration-700" />

                <path d={createPath('inbound')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d={createPath('outbound')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" />

                {trafficData.map((d, i) => (
                    <g key={i} onMouseEnter={() => setHoveredIdx(i)} className="cursor-crosshair">
                        <circle cx={getX(i)} cy={getY(d.inbound)} r={hoveredIdx === i ? 6 : 4} fill="#0B0F19" stroke="#3b82f6" strokeWidth="2" className="transition-all" />
                        <line x1={getX(i)} y1={0} x2={getX(i)} y2={height} stroke={hoveredIdx === i ? "#3b82f644" : "transparent"} strokeWidth="1" />
                    </g>
                ))}
            </svg>

            {hoveredIdx !== null && (
                <div
                    className="absolute bg-[#1e293b] border border-blue-500/30 p-3 rounded-xl shadow-2xl pointer-events-none z-50 animate-in fade-in zoom-in duration-150"
                    style={{ left: `${(hoveredIdx / (trafficData.length - 1)) * 90}%`, top: '10%' }}
                >
                    <p className="text-[10px] text-slate-500 font-black mb-1">{trafficData[hoveredIdx].time} LOCAL_NODE</p>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-400">IN: {trafficData[hoveredIdx].inbound} MB/s</p>
                        <p className="text-xs font-bold text-emerald-400">OUT: {trafficData[hoveredIdx].outbound} MB/s</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between px-4 mt-2">
                {trafficData.map((d, i) => (
                    <span key={i} className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{d.time}</span>
                ))}
            </div>
        </div>
    );
}

export function SystemStatus() {
    const [logs, setLogs] = useState<string[]>([
        "unilu-system@admin:~$ systemctl status portal-service",
        "● portal-service.service - University Academic Portal Main Service",
        "   Loaded: loaded (/etc/systemd/system/portal.service; enabled; vendor preset: enabled)",
        "   Active: active (running) since Mon 2024-10-21 04:20:12 UTC; 6h ago",
        "   Main PID: 12345 (node)",
        "   Memory: 456.2M",
        "   CPU: 12s",
        "unilu-system@admin:~$ check-integrity --quick",
        "[INFO] Scanning core modules...",
        "[OK] Auth module",
        "[OK] Database connector",
        "[WARN] Cache latency slightly high (45ms)",
        "[OK] File system permissions"
    ]);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [showAlertsModal, setShowAlertsModal] = useState(false);

    const addLog = (msg: string, type: 'cmd' | 'info' | 'error' | 'success' = 'info') => {
        setLogs(prev => [...prev, `${type === 'cmd' ? 'unilu-system@admin:~$ ' : ''}${msg}`]);
    };

    const handleRestart = () => {
        setIsRestarting(true);
        addLog("systemctl restart portal-service", 'cmd');
        addLog("[SYSTEM] Stopping services...", 'info');
        setTimeout(() => {
            addLog("[SYSTEM] Graceful shutdown completed.", 'success');
            setTimeout(() => {
                addLog("[SYSTEM] Starting main services...", 'info');
                setTimeout(() => {
                    addLog("[SYSTEM] Portal service is ONLINE [PID: " + Math.floor(Math.random() * 90000 + 10000) + "]", 'success');
                    setIsRestarting(false);
                }, 1000);
            }, 800);
        }, 1200);
    };

    const handleClearCache = () => {
        setIsClearingCache(true);
        addLog("redis-cli FLUSHALL", 'cmd');
        setTimeout(() => {
            addLog("[CACHE] Purging objects... 1,422 keys removed.", 'success');
            addLog("[CACHE] Memory freed: 142.5MB", 'info');
            setIsClearingCache(false);
        }, 1000);
    };

    const handleAction = (action: string) => {
        alert(`${action} en cours...`);
        addLog(`Executing administrative action: ${action}`, 'info');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="CHARGE CPU"
                    value="42%"
                    status="Normal"
                    color="blue"
                    icon={<Cpu className="w-6 h-6" />}
                    progress={42}
                />
                <StatCard
                    label="UTILISATION RAM"
                    value="12.4"
                    unit="GB / 16GB"
                    color="purple"
                    icon={<Activity className="w-6 h-6" />}
                    progress={78}
                />
                <StatCard
                    label="LATENCE BASE DE DONNÉES"
                    value="24"
                    unit="ms"
                    trend="-2ms"
                    color="emerald"
                    icon={<Database className="w-6 h-6" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Console */}
                <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 bg-[#1e293b]/50 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">user@admin-console: ~</span>
                        <div className="w-12" />
                    </div>
                    <div className="p-6 font-mono text-[10px] md:text-xs leading-relaxed space-y-1 h-[350px] overflow-y-auto custom-scrollbar bg-[#0B0F19]">
                        {logs.map((log, idx) => {
                            let color = "text-slate-400";
                            if (log.startsWith("unilu-system@admin:~$")) color = "text-emerald-400";
                            else if (log.includes("[OK]") || log.includes("[SYSTEM]") || log.includes("[CACHE]")) {
                                if (log.includes("ONLINE") || log.includes("completed") || log.includes("removed") || log.includes("OK")) color = "text-emerald-500 font-bold";
                                else color = "text-blue-400";
                            }
                            else if (log.includes("[WARN]")) color = "text-yellow-500";
                            else if (log.includes("Active:")) color = "text-slate-300";

                            return <p key={idx} className={color}>{log}</p>;
                        })}
                        <p className="text-emerald-400 animate-pulse">unilu-system@admin:~$ _</p>
                    </div>
                </div>

                {/* Cluster Status */}
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                        <Server className="w-4 h-4 text-blue-500" /> Statut des Clusters
                    </h3>
                    <div className="space-y-4">
                        <ClusterItem name="Web-Front-01" load="32%" status="Online" onAction={() => handleAction('Node Inspection')} />
                        <ClusterItem name="API-Gateway-01" load="54%" status="Online" onAction={() => handleAction('Node Inspection')} />
                        <ClusterItem name="DB-Shard-03" load="Maintenance" status="Standby" color="yellow" onAction={() => handleAction('Maintenance Log')} />
                        <ClusterItem name="Auth-Srv-02" load="12%" status="Online" onAction={() => handleAction('Node Inspection')} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Chart Placeholder */}
                <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Trafic Réseau (Real-time)</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Inbound</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Outbound</div>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <CustomNetworkChart />
                    </div>
                </div>

                {/* Right Column: Alerts & Actions */}
                <div className="space-y-6">
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-red-500" /> Alertes Sécurité
                            </h3>
                            <button onClick={() => setShowAlertsModal(true)} className="text-[10px] font-bold text-blue-400 hover:underline">Voir tout</button>
                        </div>
                        <div className="space-y-4">
                            <AlertItem
                                title="Tentative d'intrusion SSH"
                                desc="IP 45.23.12.89 bloquée après 5 tentatives échouées."
                                time="10:42 AM"
                                color="red"
                                onAction={() => alert("Logs d'intrusion ouverts.")}
                            />
                            <AlertItem
                                title="Certificat SSL expire bientôt"
                                desc="Le domaine *.univ-portal.com expire dans 7 jours."
                                time="Hier"
                                color="yellow"
                                action="Renouveler"
                                onAction={() => alert("Demande de renouvellement de certificat envoyée au registrar.")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <QuickAction
                            icon={<RefreshCcw className={`w-5 h-5 ${isRestarting ? 'animate-spin' : ''} text-blue-400`} />}
                            label={isRestarting ? "Restarting..." : "Restart Service"}
                            onClick={handleRestart}
                            disabled={isRestarting}
                        />
                        <QuickAction
                            icon={<Trash2 className={`w-5 h-5 ${isClearingCache ? 'animate-bounce' : ''} text-red-400`} />}
                            label={isClearingCache ? "Clearing..." : "Clear Cache"}
                            onClick={handleClearCache}
                            disabled={isClearingCache}
                        />
                    </div>
                </div>
            </div>

            {/* Alerts Modal */}
            {showAlertsModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0B0F19]/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-[#111827] w-full max-w-xl rounded-[32px] border border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.1)] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-600/10 to-transparent">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center border border-red-500/20">
                                    <ShieldAlert className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Journal de Sécurité</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Temps réel - Filtré par sévérité</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAlertsModal(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4 p-4 bg-slate-900/50 rounded-2xl border border-white/5 transition-all hover:bg-slate-900">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] flex-shrink-0" />
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs font-black text-white uppercase">Critical Leak attempt on node 02</p>
                                            <span className="text-[9px] text-slate-600 font-bold">12:0{i} PM</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">Injection attempt detected on endpoint /api/v1/auth/enroll. Source IP tracing to TOR exit node.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-[#0B0F19]/50 border-t border-white/5 flex gap-3">
                            <button className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Télécharger Rapport PDF</button>
                            <button onClick={() => setShowAlertsModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, unit, status, trend, icon, progress, color }: any) {
    const colorClasses: any = {
        blue: 'text-blue-400 bg-blue-500/10 progress-blue',
        purple: 'text-purple-400 bg-purple-500/10 progress-purple',
        emerald: 'text-emerald-400 bg-emerald-500/10 progress-emerald'
    };

    return (
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color].split(' ')[1]} ${colorClasses[color].split(' ')[0]}`}>
                    {icon}
                </div>
                {status && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{status}</span>}
                {trend && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">↓ {trend}</span>}
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{value}</span>
                {unit && <span className="text-sm font-bold text-slate-500 uppercase">{unit}</span>}
            </div>
            {progress !== undefined && (
                <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function ClusterItem({ name, load, status, color = 'emerald', onAction }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-all cursor-pointer group" onClick={onAction}>
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`} />
                <div>
                    <p className="text-xs font-bold text-white uppercase group-hover:text-blue-400 transition-colors">{name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Load: {load}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                    {status}
                </span>
                <Info className="w-3.5 h-3.5 text-slate-700 hover:text-white" />
            </div>
        </div>
    );
}

function AlertItem({ title, desc, time, color, action, onAction }: any) {
    const base = color === 'red' ? 'border-red-500/20 bg-red-500/5' : 'border-yellow-500/20 bg-yellow-500/5';
    const text = color === 'red' ? 'text-red-400' : 'text-yellow-400';

    return (
        <div className={`p-4 border rounded-[20px] ${base} relative group`}>
            <div className="flex justify-between mb-1">
                <p className={`text-xs font-black uppercase tracking-tight ${text}`}>{title}</p>
                <span className="text-[9px] text-slate-600 font-bold">{time}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4 uppercase font-bold tracking-tighter opacity-70">{desc}</p>
            <button
                onClick={onAction}
                className="w-full text-[9px] font-black uppercase text-white bg-slate-800 px-3 py-2.5 rounded-xl hover:bg-slate-700 transition-all border border-slate-700 shadow-sm"
            >
                {action || "Investigate Log"}
            </button>
        </div>
    );
}

function QuickAction({ icon, label, onClick, disabled }: any) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`w-full flex flex-col items-center justify-center gap-3 p-5 bg-[#111827] border border-slate-800 rounded-[24px] hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-lg relative overflow-hidden group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {icon}
            <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}
