import { useState } from 'react';
import {
    Terminal, Search, Filter, Trash2,
    Download, Play, AlertTriangle, Info,
    CheckCircle2, XCircle, Clock
} from 'lucide-react';

const mockLogs = [
    { id: 1, type: 'info', user: 'SYSTEM', action: 'DB_BACKUP_COMPLETED', details: 'Backup of univ-db-primary-01 successful. Size: 42GB', time: '2023-12-26 13:45:12' },
    { id: 2, type: 'warn', user: 'ADM_0042', action: 'UNAUTHORIZED_LOGIN_ATTEMPT', details: 'Failed SSH login from 142.12.33.1', time: '2023-12-26 13:42:05' },
    { id: 3, type: 'error', user: 'APP_SRV', action: 'API_GATEWAY_TIMEOUT', details: 'Timeout on endpoint /api/v1/enrollment-sync', time: '2023-12-26 13:40:55' },
    { id: 4, type: 'success', user: 'SYS_ADMIN', action: 'USER_PERMISSION_UPDATE', details: 'Granted ADMIN_TECH role to user m.dubois', time: '2023-12-26 13:35:10' },
    { id: 5, type: 'info', user: 'SYSTEM', action: 'CACHE_CLEARED', details: 'Manual cache invalidation on redis-01', time: '2023-12-26 13:30:00' },
];

export function SystemLogs() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                        <Terminal className="w-8 h-8 text-blue-500" /> Logs Système En Direct
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mono tracking-tighter">Journal complet des événements du serveur et des actions utilisateurs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[10px] transition-all border border-slate-700 uppercase tracking-widest">
                        <Download className="w-4 h-4" /> Download Logs
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-4 shadow-xl">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher un événement, un utilisateur ou un ID..."
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all font-medium font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select className="bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-8 py-2.5 text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer focus:border-blue-500/50">
                        <option>Tous les Types</option>
                        <option>Informations</option>
                        <option>Avertissements</option>
                        <option>Erreurs</option>
                    </select>
                </div>
                <button className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all" title="Clear All Logs">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Logs List */}
            <div className="bg-[#111827] border border-slate-800 rounded-[24px] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Flux en direct actif</span>
                    </div>
                </div>
                <div className="divide-y divide-slate-800 border-t border-slate-800/50">
                    {mockLogs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-slate-800/20 transition-colors flex items-start gap-6 font-mono text-[11px] group">
                            <div className="flex-shrink-0 pt-1">
                                <LogTypeIcon type={log.type} />
                            </div>
                            <div className="flex-shrink-0 w-32 border-r border-slate-800/50 pr-4">
                                <p className="text-slate-500 font-bold mb-1">{log.time.split(' ')[1]}</p>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{log.time.split(' ')[0]}</p>
                            </div>
                            <div className="flex-shrink-0 w-24">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${log.user === 'SYSTEM' ? 'text-blue-500 bg-blue-500/10 border border-blue-500/20' : 'text-slate-400 bg-slate-800'
                                    }`}>
                                    {log.user}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold mb-1 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{log.action}</p>
                                <p className="text-slate-500 truncate">{log.details}</p>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-500 hover:text-white">
                                <Play className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-[#0B0F19]/50 text-center border-t border-slate-800">
                    <button className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-500 transition-colors tracking-[0.2em]">Charger les logs archivés</button>
                </div>
            </div>
        </div>
    );
}

function LogTypeIcon({ type }: any) {
    switch (type) {
        case 'info': return <Info className="w-4 h-4 text-blue-500" />;
        case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
        case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
}
