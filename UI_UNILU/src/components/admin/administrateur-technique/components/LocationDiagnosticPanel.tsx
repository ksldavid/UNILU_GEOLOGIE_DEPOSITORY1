import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, RefreshCw, Trash2, Clock, CheckCircle, XCircle, Search, Info } from 'lucide-react';
import { API_URL } from '../../../../services/config';

interface DiagnosticLog {
    id: number;
    userId: string;
    studentName: string;
    studentCode: string;
    receivedLat: number;
    receivedLng: number;
    accuracy: number;
    distanceKm: number;
    onCampus: boolean;
    tokenExpiresAt: string;
    tokenRemainingSeconds: number;
    tokenExpired: boolean;
    createdAt: string;
}

const LocationDiagnosticPanel: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['location-diagnostics'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/diagnostic/locations`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Erreur chargement');
            return res.json();
        },
        refetchInterval: 10000 // Refetch every 10 seconds
    });

    const clearMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/diagnostic/locations`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Erreur nettoyage');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['location-diagnostics'] });
        }
    });

    const diagnostics: DiagnosticLog[] = data?.diagnostics || [];
    const campusCoords = data?.campusCoords || { lat: 0, lng: 0 };

    const filteredLogs = diagnostics.filter(log => 
        log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.studentCode.includes(searchTerm)
    );

    const formatTime = (seconds: number) => {
        if (seconds < 0) return "N/A";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 italic uppercase tracking-tighter">
                        <MapPin className="text-indigo-600 w-8 h-8" />
                        Suivi Diagnostic GPS Temps Réel
                    </h2>
                    <p className="text-slate-500 font-medium">Visualisez les données reçues des téléphones étudiants</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => refetch()}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        title="Actualiser"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => {
                            if(window.confirm('Voulez-vous vraiment effacer tous les logs ?')) clearMutation.mutate();
                        }}
                        className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 hover:bg-red-100 transition-all"
                        title="Effacer tout"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Campus Info Card */}
            <div className="bg-indigo-600 text-white p-6 rounded-[32px] shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center gap-6 border-b-4 border-indigo-800">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                    <MapPin className="w-8 h-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black italic uppercase tracking-widest">Position de Référence (Campus)</h3>
                    <p className="text-indigo-100 font-bold">Lat: {campusCoords.lat} | Lng: {campusCoords.lng}</p>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-xs uppercase font-black tracking-widest text-indigo-200 mb-1">Périmètre Autorisé</p>
                    <p className="text-xl font-black italic">500 MÈTRES</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Rechercher un étudiant ou un matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
                />
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 italic">Étudiant</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 italic">Position Reçue</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 italic">Distance</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 italic">Statut GPS</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 italic">Token SQL</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 italic">Date/Heure</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-900">{log.studentName}</div>
                                        <div className="text-xs text-slate-400 font-mono">{log.studentCode}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded inline-block text-slate-600">
                                            {log.receivedLat.toFixed(6)}, {log.receivedLng.toFixed(6)}
                                        </div>
                                        {log.accuracy && (
                                            <div className="text-[10px] text-slate-400 mt-1">Précision: ±{log.accuracy}m</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`text-lg font-black italic ${log.onCampus ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.distanceKm} km
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {log.onCampus ? (
                                            <span className="flex items-center gap-1.5 text-xs font-black italic text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 w-fit">
                                                <CheckCircle size={14} /> VALIDE (PÉRIMÈTRE)
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs font-black italic text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 w-fit">
                                                <XCircle size={14} /> HORS ZONE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className={log.tokenExpired ? 'text-red-400' : 'text-indigo-400'} />
                                            <span className={log.tokenExpired ? 'text-red-600 font-black' : 'text-slate-600'}>
                                                {log.tokenExpired ? 'EXPIRÉ' : formatTime(log.tokenRemainingSeconds)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500">
                                        {new Date(log.createdAt).toLocaleString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="max-w-xs mx-auto text-slate-400 space-y-4">
                                            <Info className="w-12 h-12 mx-auto opacity-20" />
                                            <p className="font-bold italic">Aucun diagnostic reçu pour le moment.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LocationDiagnosticPanel;
