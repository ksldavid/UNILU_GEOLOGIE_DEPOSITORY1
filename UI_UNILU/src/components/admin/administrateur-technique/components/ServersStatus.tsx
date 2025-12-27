import {
    Server as ServerIcon,
    Power, RefreshCw
} from 'lucide-react';

const servers = [
    { id: '1', name: 'PROD-FRONT-01', status: 'Online', cpu: 12, ram: 4.2, storage: 45, region: 'EU-WEST-3', type: 't3.xlarge' },
    { id: '2', name: 'PROD-FRONT-02', status: 'Online', cpu: 15, ram: 3.8, storage: 42, region: 'EU-WEST-3', type: 't3.xlarge' },
    { id: '3', name: 'API-GATEWAY-01', status: 'Online', cpu: 42, ram: 8.5, storage: 12, region: 'EU-WEST-3', type: 'c5.2xlarge' },
    { id: '4', name: 'WORKER-REPORTS-01', status: 'Standby', cpu: 2, ram: 1.2, storage: 85, region: 'EU-CENTRAL-1', type: 't3.large' },
    { id: '5', name: 'CDN-EDGE-GOMA', status: 'Offline', cpu: 0, ram: 0, storage: 0, region: 'CD-EAST', type: 'edge-n1' },
];

export function ServersStatus() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ServerIcon className="w-8 h-8 text-blue-500" /> Infrastructure Serveurs
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mono tracking-tighter">Gestion des instances physiques et virtuelles.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">
                        Deploy New Node
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
                        Global Restart
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map(server => (
                    <div key={server.id} className="bg-[#111827] border border-slate-800 rounded-[24px] p-6 hover:shadow-2xl hover:border-blue-500/30 transition-all group overflow-hidden relative">
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
                                Connect
                            </button>
                            <button className="p-1.5 bg-[#0B0F19] hover:bg-slate-800 text-slate-500 rounded-lg transition-all border border-slate-800">
                                <Power className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 bg-[#0B0F19] hover:bg-slate-800 text-slate-500 rounded-lg transition-all border border-slate-800">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SmallStat({ label, value }: any) {
    return (
        <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800/50 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xs font-bold text-white">{value}</p>
        </div>
    );
}
