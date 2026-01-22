import { useState, useEffect } from 'react';
import { Megaphone, Send, Trash2, Clock, Globe, Users, Search } from 'lucide-react';
import { professorService } from '../../../../services/professor';

export function CommunicationManager() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [query, setQuery] = useState("");
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [searchLabel, setSearchLabel] = useState("");
    const [newAnnouncement, setNewAnnouncement] = useState<{
        title: string;
        content: string;
        target: string;
        type: string;
        targetUserId?: string;
    }>({
        title: '',
        content: '',
        target: 'GLOBAL',
        type: 'GENERAL'
    });

    const handleStudentSearch = async (val: string) => {
        setQuery(val);
        if (val.length > 2) {
            try {
                const results = await professorService.searchStudents(val);
                setFilteredStudents(results);
            } catch (error) {
                console.error(error);
            }
        } else {
            setFilteredStudents([]);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await professorService.getMyAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSending(true);
            await professorService.createAnnouncement(newAnnouncement);
            setNewAnnouncement({ title: '', content: '', target: 'GLOBAL', type: 'GENERAL' });
            setSearchLabel("");
            setQuery("");
            fetchAnnouncements();
            alert("Annonce système diffusée avec succès !");
        } catch (error) {
            alert("Erreur lors de la diffusion");
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cette annonce système ?")) return;
        try {
            await professorService.deleteAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Nouveau Message Section */}
            <div className="bg-[#111827]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Megaphone className="w-8 h-8" />
                            Diffusion Système (IT)
                        </h3>
                        <p className="text-blue-100 text-sm font-medium mt-1 opacity-80">Communiquez des informations techniques ou générales à tous les utilisateurs.</p>
                    </div>
                </div>

                <form onSubmit={handleSend} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Titre du Message</label>
                            <input
                                type="text"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                placeholder="ex: Maintenance Serveur, Mise à jour..."
                                className="w-full px-6 py-4 bg-[#0B0F19] border border-white/5 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-white text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cible de Diffusion</label>
                            <select
                                value={newAnnouncement.target}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target: e.target.value, targetUserId: undefined })}
                                className="w-full px-6 py-4 bg-[#0B0F19] border border-white/5 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-white text-sm appearance-none"
                            >
                                <option value="GLOBAL">TOUT LE SYSTÈME (Professeurs & Étudiants)</option>
                                <option value="ALL_STUDENTS">TOUS LES ÉTUDIANTS UNIQUEMENT</option>
                                <option value="SPECIFIC_USER">UN ÉTUDIANT SPÉCIFIQUE (Recherche cible)</option>
                            </select>
                        </div>
                    </div>

                    {newAnnouncement.target === 'SPECIFIC_USER' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rechercher l'Étudiant</label>
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Entrez le nom ou le matricule..."
                                    value={searchLabel || query}
                                    onChange={(e) => {
                                        setSearchLabel("");
                                        handleStudentSearch(e.target.value);
                                    }}
                                    className="w-full px-14 py-4 bg-[#0B0F19] border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-white text-sm"
                                />
                                {filteredStudents.length > 0 && !searchLabel && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                        {filteredStudents.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => {
                                                    setNewAnnouncement({ ...newAnnouncement, targetUserId: s.id });
                                                    setSearchLabel(`${s.name} (${s.id})`);
                                                    setFilteredStudents([]);
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                                            >
                                                <p className="text-sm font-bold text-white">{s.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.id} • {s.academicLevel}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contenu de l'Annonce</label>
                        <textarea
                            value={newAnnouncement.content}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                            placeholder="Détaillez votre message ici..."
                            rows={4}
                            className="w-full px-6 py-4 bg-[#0B0F19] border border-white/5 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-300 text-sm resize-none"
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSending}
                            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 flex items-center gap-3 group"
                        >
                            {isSending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            )}
                            Diffuser l'Alerte
                        </button>
                    </div>
                </form>
            </div>

            {/* Historique Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Clock className="w-6 h-6 text-blue-500" />
                        Historique des Diffusions IT
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        [1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)
                    ) : announcements.length === 0 ? (
                        <div className="bg-[#111827]/30 border border-white/5 border-dashed rounded-3xl p-12 text-center">
                            <Megaphone className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucune annonce système enregistrée</p>
                        </div>
                    ) : (
                        announcements.map((ann) => (
                            <div key={ann.id} className="bg-[#111827]/50 border border-white/5 rounded-[28px] p-6 group hover:border-blue-500/30 transition-all relative overflow-hidden">
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-600 opacity-50" />

                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ann.target === 'GLOBAL' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                {ann.target === 'GLOBAL' ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                                Cible: {ann.target}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-bold font-mono">
                                                {new Date(ann.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{ann.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-3xl">{ann.content}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
