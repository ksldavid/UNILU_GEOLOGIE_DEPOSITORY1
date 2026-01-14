import { useState, useEffect } from 'react';
import {
    Clock, Users, FileText, Calendar, Filter,
    Search, Activity, LayoutGrid, List, Megaphone
} from 'lucide-react';
import { userService } from '../../../../services/user';

export function ActivityHistory() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');

    useEffect(() => {
        const fetchAllActivities = async () => {
            try {
                setLoading(true);
                const data = await userService.getRecentActivities();
                // Simulation pour remplir un historique plus large si besoin
                setActivities(data);
            } catch (error) {
                console.error("Erreur historique:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllActivities();
    }, []);


    const getActivityStyle = (type: string) => {
        switch (type) {
            case 'STUDENT': return { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Inscription' };
            case 'GRADE': return { icon: FileText, color: 'text-green-500', bg: 'bg-green-50', label: 'Note' };
            case 'SCHEDULE': return { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Planning' };
            case 'ATTENDANCE': return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Présence' };
            case 'ANNOUNCEMENT': return { icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Annonce' };
            default: return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Système' };
        }
    };

    const filteredActivities = activities.filter((a: any) => {
        const matchesSearch = a.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.detail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || a.type === filterType;
        return matchesSearch && matchesType;
    });

    // Group activities by month/day for timeline
    const groupedActivities = filteredActivities.reduce((groups: any, activity: any) => {
        const date = new Date(activity.time);
        const dayKey = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[dayKey]) groups[dayKey] = [];
        groups[dayKey].push(activity);
        return groups;
    }, {});

    return (
        <div className="flex flex-col h-full bg-[#F1F8F4] animate-in fade-in duration-500">
            {/* Header / Toolbar */}
            <div className="bg-white p-6 rounded-[24px] border border-[#1B4332]/10 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-[#1B4332] flex items-center gap-3">
                            <Activity className="w-8 h-8" />
                            Historique des Activités
                        </h2>
                        <p className="text-[#52796F] font-medium">Suivi complet des actions administratives de l'année</p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F1F8F4] p-1 rounded-2xl border border-[#1B4332]/5">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'timeline' ? 'bg-white text-[#1B4332] shadow-md' : 'text-[#52796F]'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Timeline
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-[#1B4332] shadow-md' : 'text-[#52796F]'}`}
                        >
                            <List className="w-4 h-4" />
                            Liste
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52796F]" />
                        <input
                            type="text"
                            placeholder="Rechercher une action, un utilisateur..."
                            className="w-full pl-11 pr-4 py-3 bg-[#F1F8F4] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#1B4332]/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="p-3 bg-[#F1F8F4] border-none rounded-2xl text-sm font-bold text-[#1B4332] cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Tous les types d'activités</option>
                        <option value="STUDENT">Inscriptions Étudiants</option>
                        <option value="GRADE">Rectifications de Notes</option>
                        <option value="SCHEDULE">Changements Planning</option>
                        <option value="ATTENDANCE">Modifs de Présence</option>
                    </select>

                    <div className="flex items-center gap-2 bg-[#1B4332]/5 px-4 rounded-2xl overflow-hidden">
                        <Filter className="w-4 h-4 text-[#1B4332]" />
                        <span className="text-xs font-black text-[#1B4332] uppercase tracking-wider">{filteredActivities.length} Actions trouvées</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50">
                        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-[#1B4332]">Génération de l'historique...</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border border-[#1B4332]/10 border-dashed">
                        <Activity className="w-16 h-16 text-[#1B4332] opacity-10 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-[#1B4332]">Aucune trace trouvée</h3>
                        <p className="text-[#52796F]">Ajustez vos filtres ou lancez une nouvelle recherche.</p>
                    </div>
                ) : viewMode === 'timeline' ? (
                    <div className="space-y-10 pb-20">
                        {Object.keys(groupedActivities).map((day) => (
                            <div key={day} className="relative">
                                <div className="sticky top-0 z-10 bg-[#F1F8F4] py-2 mb-6">
                                    <div className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2 rounded-full shadow-lg">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-black">{day}</span>
                                    </div>
                                </div>

                                <div className="ml-6 space-y-6 border-l-2 border-[#1B4332]/10 pl-10 relative">
                                    {groupedActivities[day].map((activity: any) => {
                                        const { icon: Icon, color, bg, label } = getActivityStyle(activity.type);
                                        return (
                                            <div key={activity.id} className="relative group">
                                                {/* Line node */}
                                                <div className="absolute -left-[51px] top-4 w-[22px] h-[22px] bg-[#F1F8F4] flex items-center justify-center">
                                                    <div className={`w-3 h-3 rounded-full ${color.replace('text', 'bg')} ring-4 ring-white`}></div>
                                                </div>

                                                <div className="bg-white rounded-[24px] p-6 border border-[#1B4332]/10 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                                    <div className="flex items-start justify-between gap-6">
                                                        <div className="flex items-start gap-5">
                                                            <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                                                                <Icon className={`w-7 h-7 ${color}`} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${bg} ${color}`}>
                                                                        {label}
                                                                    </span>
                                                                    <span className="text-xs text-[#52796F] flex items-center gap-1 font-medium">
                                                                        <Clock className="w-3 h-3" />
                                                                        {new Date(activity.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-lg font-black text-[#1B4332] mb-1">{activity.action}</h4>
                                                                <p className="text-sm text-[#52796F] font-bold">Par : <span className="text-[#1B4332]">{activity.user}</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="hidden md:block bg-[#F1F8F4] px-4 py-2 rounded-xl text-end">
                                                            <p className="text-[10px] text-[#52796F] uppercase font-bold tracking-tighter opacity-70">CONCERNE</p>
                                                            <p className="text-sm font-black text-[#1B4332] whitespace-nowrap">{activity.detail}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] overflow-hidden border border-[#1B4332]/10 shadow-sm mb-20">
                        <table className="w-full text-left">
                            <thead className="bg-[#1B4332]/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#52796F]">Date & Heure</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#52796F]">Catégorie</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#52796F]">Utilisateur</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#52796F]">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[#52796F]">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1B4332]/5">
                                {filteredActivities.map((activity: any) => {
                                    const { icon: Icon, color, bg, label } = getActivityStyle(activity.type);
                                    return (
                                        <tr key={activity.id} className="hover:bg-[#F1F8F4]/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-[#52796F]">
                                                {new Date(activity.time).toLocaleDateString()} • {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 ${bg} ${color} px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider`}>
                                                    <Icon className="w-3 h-3" />
                                                    {label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-[#1B4332] text-sm">{activity.user}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-[#2D6A4F]">{activity.action}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-[#52796F] italic font-medium">{activity.detail}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

