
import { useState, useEffect } from 'react';
import { PieChart, BarChart3, Globe, User, Baby, Filter, Calendar } from 'lucide-react';
import { userService } from '../../../../services/user';

export function StudentDemographics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [filters, setFilters] = useState<{ levels: any[], years: string[] }>({ levels: [], years: [] });

    // Filter State
    const [selectedLevelId, setSelectedLevelId] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>("");

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const data = await userService.getDemographicFilters();
                setFilters(data);
                if (data.years && data.years.length > 0) {
                    setSelectedYear(data.years[0]);
                }
            } catch (error) {
                console.error("Erreur filters:", error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await userService.getStudentDemographics(
                    selectedLevelId ? parseInt(selectedLevelId) : undefined,
                    selectedYear || undefined
                );
                setStats(data);
            } catch (error) {
                console.error("Erreur stats demog:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedLevelId, selectedYear]);

    if (loading && !stats) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#1B4332] font-medium text-lg">Analyse des données démographiques...</p>
                </div>
            </div>
        );
    }

    const sexLabels: any = { M: "Masculin", F: "Féminin", "N/A": "Non spécifié" };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-2 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#1B4332] mb-1">Statistiques Démographiques</h2>
                    <p className="text-[#52796F]">Analyse de l'effectif actuel ({stats?.total || 0} étudiants filtrés)</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[24px] border border-[#1B4332]/10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#1B4332]" />
                        <select
                            value={selectedLevelId}
                            onChange={(e) => setSelectedLevelId(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-[#1B4332] outline-none cursor-pointer p-1"
                        >
                            <option value="">Toutes les promotions</option>
                            {filters.levels.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-6 bg-[#1B4332]/10 hidden md:block" />

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1B4332]" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-[#1B4332] outline-none cursor-pointer p-1"
                        >
                            <option value="">Toutes les années</option>
                            {filters.years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex py-20 items-center justify-center">
                    <div className="w-8 h-8 border-3 border-[#1B4332] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : !stats ? (
                <div className="p-8 text-center text-[#52796F]">Impossible de charger les statistiques.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sexe */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#1B4332]">Répartition par Sexe</h3>
                                    <p className="text-xs text-[#52796F]">Sexe des étudiants</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(stats.sex).map(([key, count]: [string, any]) => {
                                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                    const colorClass = key === 'M' ? 'bg-blue-500' : key === 'F' ? 'bg-pink-500' : 'bg-gray-400';

                                    return (
                                        <div key={key} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-bold text-[#1B4332]">{sexLabels[key]}</span>
                                                <div className="text-right">
                                                    <span className="text-lg font-black text-[#1B4332]">{count}</span>
                                                    <span className="text-xs text-[#52796F] ml-1">({percentage}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Âge */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Baby className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#1B4332]">Tranches d'Âge</h3>
                                    <p className="text-xs text-[#52796F]">Basé sur la date de naissance</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {Object.entries(stats.age).map(([range, count]: [string, any]) => {
                                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                    return (
                                        <div key={range} className="flex items-center gap-4">
                                            <div className="w-16 text-right">
                                                <span className="text-xs font-bold text-[#52796F] uppercase tracking-tighter">{range} ans</span>
                                            </div>
                                            <div className="flex-1 h-8 bg-gray-100 rounded-xl overflow-hidden relative group/bar border border-gray-50">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ease-out"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                                <div className="absolute inset-0 flex items-center px-3 justify-end">
                                                    <span className="text-[10px] font-black text-[#1B4332]">{count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nationalité */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-all group lg:col-span-1">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Globe className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#1B4332]">Nationalités</h3>
                                    <p className="text-xs text-[#52796F]">Origines des étudiants</p>
                                </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-4">
                                    {Object.entries(stats.nationality).sort((a: any, b: any) => b[1] - a[1]).map(([nat, count]: [string, any]) => {
                                        const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                        return (
                                            <div key={nat} className="flex items-center justify-between p-3 bg-[#F1F8F4] rounded-2xl border border-[#1B4332]/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-[#1B4332] text-xs">
                                                        {nat.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-[#1B4332]">{nat}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-[#1B4332]">{count}</p>
                                                    <p className="text-[10px] text-[#52796F] font-medium">{percentage}%</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(stats.nationality).length === 0 && (
                                        <p className="text-center text-sm text-[#52796F] italic py-10">Aucune donnée de nationalité</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* General Insights */}
                    <div className="bg-[#1B4332] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <PieChart className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                                <BarChart3 className="w-8 h-8 text-[#74C69D]" />
                                Observations Globales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                    <p className="text-[#D8F3DC] text-xs font-bold uppercase tracking-widest mb-2">Majorité</p>
                                    <p className="text-xl font-bold">
                                        {Object.entries(stats.nationality).length > 0
                                            ? (Object.entries(stats.nationality).reduce((a: any, b: any) => a[1] > b[1] ? a : b) as any)[0]
                                            : "N/A"}
                                    </p>
                                    <p className="text-sm text-white/60 mt-2">Plus grande communauté représentée</p>
                                </div>
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                    <p className="text-[#D8F3DC] text-xs font-bold uppercase tracking-widest mb-2">Équilibre Sexe</p>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${stats.sex.M > stats.sex.F ? 'bg-blue-400' : 'bg-pink-400'}`} />
                                        <p className="text-xl font-bold">
                                            {Math.abs(Math.round((stats.sex.M / stats.total) * 100) - 50) < 10 ? "Équilibré" : (stats.sex.M > stats.sex.F ? "Prédominance Masculine" : "Prédominance Féminine")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-white/60 mt-2">Basé sur les inscriptions actuelles</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
