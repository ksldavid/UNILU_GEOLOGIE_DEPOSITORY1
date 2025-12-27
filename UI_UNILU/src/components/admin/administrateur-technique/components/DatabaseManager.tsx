import React, { useState } from 'react';
import {
    Database, Server, Activity, HardDrive,
    RefreshCw, Play, AlertTriangle,
    MoreVertical, Plus,
    ShieldCheck, Filter
} from 'lucide-react';

const instancesList = [
    {
        id: '1',
        name: 'univ-db-primary-01',
        role: 'MASTER',
        status: 'Online',
        version: 'PostgreSQL 15.4',
        region: 'eu-west-3',
        uptime: '45d 12h'
    },
    {
        id: '2',
        name: 'univ-db-replica-01',
        role: 'READ-REPLICA',
        status: 'Online',
        version: 'PostgreSQL 15.4',
        region: 'eu-west-3',
        uptime: '45d 12h'
    },
    {
        id: '3',
        name: 'univ-db-analytics-02',
        role: 'ANALYTICS',
        status: 'Maintenance',
        version: 'ClickHouse 23.8',
        region: 'eu-central-1',
        uptime: '-'
    }
];

const initialResults = [
    { id: 84920, student_id: 'STD-2024-001', email: 'alex.doe@univ.edu', status: 'PENDING', last_login: 'NULL' },
    { id: 84921, student_id: 'STD-2024-042', email: 'sarah.j@univ.edu', status: 'PENDING', last_login: '2023-10-20 14:22' },
    { id: 84922, student_id: 'STD-2024-088', email: 'm.chen@univ.edu', status: 'SUSPENDED', last_login: '2023-10-18 09:15' },
];

export function DatabaseManager() {
    const [query, setQuery] = useState("SELECT * FROM students WHERE status = 'PENDING' LIMIT 10;");
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(initialResults);
    const [instances] = useState(instancesList);
    const [showSchema, setShowSchema] = useState(false);

    const handleRunQuery = () => {
        setIsRunning(true);
        // Simulate execution
        setTimeout(() => {
            const newResults = [...initialResults].sort(() => Math.random() - 0.5);
            setResults(newResults);
            setIsRunning(false);
            alert("Requête SQL exécutée avec succès. 3 lignes affectées.");
        }, 1500);
    };

    const handleNewInstance = () => {
        alert("Ouverture de l'assistant de configuration d'instance Cloud...");
    };

    const handleAction = (action: string, obj: any) => {
        alert(`${action} pour ${obj.name || obj.id}`);
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
                    <p className="text-slate-500 text-sm mt-1 font-mono">root@university-portal:~/databases/management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSchema(!showSchema)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all border border-slate-700"
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Browser Schema
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DBStatCard
                    label="CONNEXIONS ACTIVES"
                    value="1,842"
                    trend="+12%"
                    icon={<Activity className="w-6 h-6 text-blue-400" />}
                    onClick={() => handleAction('View Active Connexions', { name: 'Cluster' })}
                />
                <DBStatCard
                    label="ESPACE DISQUE UTILISÉ"
                    value="8.4"
                    unit="TB / 12TB Total"
                    progress={70}
                    subText="Prediction: Full in 45 days"
                    icon={<HardDrive className="w-6 h-6 text-yellow-400" />}
                    onClick={() => handleAction('Storage Analysis', { name: 'Volume group-01' })}
                />
                <DBStatCard
                    label="REPLICATION LAG"
                    value="0.02"
                    unit="s"
                    status="Synced"
                    icon={<RefreshCw className="w-6 h-6 text-emerald-400" />}
                    details={[
                        { name: 'Primary → Replica-01', status: 'OK' },
                        { name: 'Primary → Replica-02', status: 'OK' }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Instances Table */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                    <Server className="w-4 h-4 text-blue-400" /> Instances de Cluster
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                    <Filter className="w-3 h-3" /> Filters: <span className="text-white">All Regions</span>
                                </div>
                            </div>
                            <button
                                onClick={handleNewInstance}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Plus className="w-4 h-4" /> New Instance
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800/50 bg-[#0B0F19]">
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Instance Node</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Topology</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Health</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Engine</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Uptime</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest">Mod</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {instances.map((ins) => (
                                        <tr key={ins.id} className="hover:bg-slate-800/10 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-blue-500/10 transition-colors"><Database className="w-4 h-4 text-slate-400 group-hover:text-blue-400" /></div>
                                                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{ins.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] px-2.5 py-1 rounded-lg border border-slate-700 font-black tracking-widest ${ins.role === 'MASTER' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 bg-slate-800/50'}`}>
                                                    {ins.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                <div className="flex items-center gap-2 uppercase tracking-widest font-black text-[9px]">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${ins.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`} />
                                                    <span className={ins.status === 'Online' ? 'text-emerald-500' : 'text-yellow-500'}>{ins.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest opacity-60">{ins.version}</td>
                                            <td className="px-6 py-4 text-[11px] text-slate-400 font-bold italic">{ins.uptime}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleAction('Instance Configuration', ins)}
                                                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-slate-700"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SQL Editor */}
                    <div className="bg-[#111827] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl relative transition-all">
                        <div className="p-4 bg-orange-600/10 border-b border-orange-500/10 flex items-center justify-between">
                            <h3 className="text-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> PRODUCTION DATA EDITOR - USE WITH CAUTION
                            </h3>
                            <div className="flex gap-4 items-center">
                                <span className="text-[9px] font-bold text-slate-600 uppercase italic">Session: root@admin-tty1</span>
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
                                    {isRunning ? "Executing..." : "Run Selection"}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto border-t border-slate-800 bg-[#0B0F19]/50">
                            <table className="w-full text-left font-mono text-[11px]">
                                <thead className="border-b border-slate-800/50 bg-[#111827]">
                                    <tr className="text-slate-500 font-black uppercase tracking-widest">
                                        <th className="px-6 py-3">id</th>
                                        <th className="px-6 py-3">student_id</th>
                                        <th className="px-6 py-3">email</th>
                                        <th className="px-6 py-3">status</th>
                                        <th className="px-6 py-3">last_login</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y divide-slate-800/30 transition-opacity duration-300 ${isRunning ? 'opacity-30' : 'opacity-100'}`}>
                                    {results.map((row) => (
                                        <tr key={row.id} className="hover:bg-blue-600/5 transition-colors">
                                            <td className="px-6 py-4 text-blue-400 font-black">{row.id}</td>
                                            <td className="px-6 py-4 text-slate-300 font-bold">{row.student_id}</td>
                                            <td className="px-6 py-4 text-slate-400">{row.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg font-black tracking-widest text-[9px] uppercase border ${row.status === 'PENDING' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 italic font-medium">{row.last_login}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* DB Sidebar: Alerts */}
                <div className="space-y-6">
                    <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-3 mb-8">
                            <ShieldCheck className="w-5 h-5 text-red-500" /> System Events
                        </h3>
                        <div className="space-y-4">
                            <DBAlertItem
                                title="Critical Deadlock"
                                desc="Process ID 9821 killed to resolve deadlock on table 'enrollments'."
                                time="2m ago"
                                color="red"
                                action="View Log"
                                onAction={() => handleAction('Deadlock Log Analytics', { id: 'ERR-9821' })}
                            />
                            <DBAlertItem
                                title="Slow Query Detected"
                                desc="Query on 'exam_results' took 4.2s (Threshold: 2s)."
                                time="14m ago"
                                color="yellow"
                                action="Analyze"
                                onAction={() => handleAction('Query Performance Optimizer', { id: 'QRY-SLW-1' })}
                            />
                        </div>
                        <button
                            onClick={() => handleAction('Master Event Log', { id: 'ROOT' })}
                            className="w-full mt-8 py-4 bg-[#0B0F19] text-[10px] font-black uppercase text-slate-500 hover:text-white rounded-2xl border border-slate-800 transition-all hover:bg-slate-800"
                        >
                            View All Root Events
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5 p-6 rounded-3xl shadow-xl">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">Backup Maintenance</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-bold leading-relaxed mb-6 tracking-tight">AUTO-BACKUP SYSTEM (V-SNAPS) IS CONFIGURED FOR EVERY 4H TO S3-LU-BACKUP.</p>
                        <button
                            onClick={() => alert("Sauvegarde manuelle initiée...")}
                            className="w-full py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
                        >
                            Snap Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DBStatCard({ label, value, unit, trend, status, progress, subText, icon, details, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`bg-[#111827] border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-blue-500/30 transition-all group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-900/80 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
                {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">↑ {trend}</span>}
                {status && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest">{status}</span>}
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter">{value}</span>
                {unit && <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">{unit}</span>}
            </div>
            {progress !== undefined && (
                <div className="mt-5 space-y-2">
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" style={{ width: `${progress}%` }} />
                    </div>
                    {subText && <p className="text-[10px] text-orange-500 font-bold italic tracking-tight uppercase opacity-80">{subText}</p>}
                </div>
            )}
            {details && (
                <div className="mt-5 space-y-2">
                    {details.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold font-mono">
                            <span className="text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {d.name}
                            </span>
                            <span className="text-emerald-500 font-black uppercase">({d.status})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DBAlertItem({ title, desc, time, color, action, onAction }: any) {
    const border = color === 'red' ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10' : 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10';
    const text = color === 'red' ? 'text-red-400' : 'text-yellow-500';
    return (
        <div className={`p-5 border-2 rounded-3xl transition-all cursor-pointer group ${border}`} onClick={onAction}>
            <div className="flex justify-between items-center mb-2">
                <p className={`text-[11px] font-black uppercase tracking-widest ${text}`}>{title}</p>
                <span className="text-[9px] text-slate-700 font-black">{time}</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed mb-5 uppercase font-bold tracking-tight">{desc}</p>
            <button className="w-full text-[9px] font-black uppercase text-white bg-[#0B0F19] py-3 rounded-2xl border border-slate-800 hover:border-slate-500 transition-all transition-transform active:scale-95">
                {action || "Details"}
            </button>
        </div>
    );
}
