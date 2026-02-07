
import { useState, useEffect } from 'react';
import { Trash2, Plus, Bell, Image as ImageIcon, Upload, MousePointer2, Clock, MessageSquareText } from 'lucide-react';
import { API_URL } from '../../../../services/config';

export function AdsManager() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [newAd, setNewAd] = useState({
        title: '',
        linkUrl: '',
        dailyLimit: 1,
        pushTitle: '',
        pushBody: '',
        description: '', // Nouveau: Texte style Instagram
        durationDays: 7, // Nouveau: Durée par défaut
        targetPushCount: 0 // Nouveau: Cible totale
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            // On récupère toutes les pubs (pas seulement les actives) pour l'historique
            const res = await fetch(`${API_URL}/ads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAds(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleCreateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newAd.title);
            formData.append('linkUrl', newAd.linkUrl);
            formData.append('dailyLimit', newAd.dailyLimit.toString());
            formData.append('pushTitle', newAd.pushTitle);
            formData.append('pushBody', newAd.pushBody);
            formData.append('description', newAd.description);
            formData.append('durationDays', newAd.durationDays.toString());
            formData.append('targetPushCount', newAd.targetPushCount.toString());

            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const res = await fetch(`${API_URL}/ads`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                setNewAd({
                    title: '',
                    linkUrl: '',
                    dailyLimit: 1,
                    pushTitle: '',
                    pushBody: '',
                    description: '',
                    durationDays: 7,
                    targetPushCount: 0
                });
                setSelectedFile(null);
                setIsCreating(false);
                fetchAds();
                alert("Campagne publicitaire publiée sur toutes les applications !");
            } else {
                const err = await res.json();
                alert(err.message || "Erreur création");
            }
        } catch (error) {
            alert("Erreur réseau");
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm("Supprimer définitivement cette campagne et ses statistiques ?")) return;
        try {
            const token = sessionStorage.getItem('token');
            await fetch(`${API_URL}/ads/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAds(ads.filter(a => a.id !== id));
        } catch (error) {
            alert("Erreur suppression");
        }
    };

    const handleNotify = async (id: string) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/ads/${id}/notify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchAds();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Erreur push");
        }
    };

    const getRemainingDays = (expiresAt: string) => {
        if (!expiresAt) return "Illimité";
        const diff = new Date(expiresAt).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} jours` : "Expiré";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-emerald-500" />
                        Commandement Publicitaire
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Diffusez vos visuels sur le réseau mobile Unilu.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                    <Plus className="w-4 h-4" /> Publier une Photo
                </button>
            </div>

            {isCreating && (
                <div className="bg-[#111827]/80 border border-emerald-500/30 rounded-3xl p-8 animate-in slide-in-from-top-4 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-black text-white uppercase italic tracking-widest text-sm">Nouvelle parution Instagram-Style</h3>
                        </div>
                        <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white font-bold text-xs uppercase">Annuler</button>
                    </div>
                    <form onSubmit={handleCreateAd} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vignette Interne</label>
                                <input type="text" value={newAd.title} onChange={e => setNewAd({ ...newAd, title: e.target.value })} className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all" placeholder="ex: Samsung S24 Promo" required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Photo de la publicité (Haute Qualité)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        className="hidden"
                                        id="ad-image-upload"
                                        accept="image/*"
                                        required
                                    />
                                    <label
                                        htmlFor="ad-image-upload"
                                        className="w-full bg-[#0B0F19] border border-white/5 border-dashed border-2 rounded-xl px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all group"
                                    >
                                        <Upload className={`w-10 h-10 mb-2 transition-transform group-hover:scale-110 ${selectedFile ? 'text-emerald-500' : 'text-slate-500'}`} />
                                        <span className="text-[10px] font-black uppercase text-slate-400">
                                            {selectedFile ? selectedFile.name : "Glissez votre visuel ici"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description (S'affiche sous la photo)</label>
                                <textarea
                                    value={newAd.description}
                                    onChange={e => setNewAd({ ...newAd, description: e.target.value })}
                                    className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all resize-none"
                                    rows={4}
                                    placeholder="Décrivez votre offre ici, comme sur un post Instagram..."
                                />
                            </div>
                        </div>

                        <div className="space-y-5 border-l border-white/5 pl-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Durée (jours)</label>
                                    <div className="relative">
                                        <input type="number" value={newAd.durationDays} onChange={e => setNewAd({ ...newAd, durationDays: parseInt(e.target.value) })} className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" min="1" />
                                        <Clock className="w-4 h-4 text-emerald-500/30 absolute right-4 top-3.5" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lien de redirection</label>
                                    <input type="text" value={newAd.linkUrl} onChange={e => setNewAd({ ...newAd, linkUrl: e.target.value })} className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" placeholder="https://..." required />
                                </div>
                            </div>

                            <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 space-y-4">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Bell className="w-3 h-3" /> Paramètres des Notifications Push
                                </p>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre du Message Push</label>
                                    <input type="text" value={newAd.pushTitle} onChange={e => setNewAd({ ...newAd, pushTitle: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" placeholder="Nouveauté Unilu !" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quota / Jour</label>
                                        <input type="number" value={newAd.dailyLimit} onChange={e => setNewAd({ ...newAd, dailyLimit: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" min="1" max="10" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cible Totale Push</label>
                                        <input type="number" value={newAd.targetPushCount} onChange={e => setNewAd({ ...newAd, targetPushCount: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" placeholder="Optionnel" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-4 border-t border-white/5 pt-6 mt-4">
                            <button
                                type="submit"
                                className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                            >
                                Lancer la Publication
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-80 bg-white/5 rounded-[40px] animate-pulse" />)
                ) : ads.length === 0 ? (
                    <div className="md:col-span-3 bg-[#111827]/30 border border-white/5 border-dashed rounded-[40px] p-32 text-center">
                        <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-10" />
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Vôtre régie est vide</p>
                    </div>
                ) : (
                    ads.map(ad => (
                        <div key={ad.id} className="bg-[#111827]/50 border border-white/5 rounded-[40px] overflow-hidden group hover:border-emerald-500/30 transition-all flex flex-col shadow-2xl relative">
                            {/* Stats Flottantes */}
                            <div className="absolute top-4 left-6 z-10 flex gap-2">
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <MousePointer2 className="w-3 h-3 text-blue-400" />
                                    <span className="text-[10px] font-black text-white">{ad.clickCount || 0} clics</span>
                                </div>
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-black text-white">{getRemainingDays(ad.expiresAt)}</span>
                                </div>
                            </div>

                            <div className="h-56 bg-slate-900 relative">
                                {ad.imageUrl ? (
                                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center italic text-slate-600 text-xs uppercase tracking-widest uppercase">ÉCHEC CHARGEMENT</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-6 left-8 right-8">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter truncate leading-none mb-1">{ad.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{ad.linkUrl}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {ad.description && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2">
                                            <MessageSquareText className="w-3 h-3" /> Descriptif
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2 italic">"{ad.description}"</p>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">Aujourd'hui</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-lg font-black text-white">{ad.sentToday}</p>
                                            <p className="text-[10px] text-slate-500 font-bold">/ {ad.dailyLimit} push</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">Total Clics</p>
                                        <p className="text-xl font-black text-blue-500">{ad.clickCount || 0}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleNotify(ad.id)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95"
                                    >
                                        <Bell className="w-4 h-4" /> Envoyer Push
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAd(ad.id)}
                                        className="w-14 h-14 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 hover:border-red-500 rounded-2xl transition-all active:scale-90"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
