
import { useState, useEffect } from 'react';
import { Trash2, Plus, Bell, Image as ImageIcon, Upload } from 'lucide-react';
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
        pushBody: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/ads/active`, {
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
                setNewAd({ title: '', linkUrl: '', dailyLimit: 1, pushTitle: '', pushBody: '' });
                setSelectedFile(null);
                setIsCreating(false);
                fetchAds();
                alert("Publicité ajoutée !");
            } else {
                const err = await res.json();
                alert(err.message || "Erreur création");
            }
        } catch (error) {
            alert("Erreur réseau lors de la création");
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm("Supprimer cette publicité ?")) return;
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
            alert("Erreur envoi notification");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                        Régie Publicitaire (Mobile Ads)
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gérez les bannières et les notifications sponsorisées pour les étudiants.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" /> Nouvelle Pub
                </button>
            </div>

            {isCreating && (
                <div className="bg-[#111827]/80 border border-blue-500/30 rounded-3xl p-8 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-white uppercase italic tracking-widest text-sm">Configuration de la publicité</h3>
                        <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white">Fermer</button>
                    </div>
                    <form onSubmit={handleCreateAd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Titre Interne</label>
                                <input type="text" value={newAd.title} onChange={e => setNewAd({ ...newAd, title: e.target.value })} className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" placeholder="ex: Promo Apple Store" required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Image de la bannière (Fichier)</label>
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
                                        className="w-full bg-[#0B0F19] border border-white/5 border-dashed border-2 rounded-xl px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all"
                                    >
                                        <Upload className={`w-8 h-8 mb-2 ${selectedFile ? 'text-emerald-500' : 'text-slate-500'}`} />
                                        <span className="text-xs font-bold text-slate-400">
                                            {selectedFile ? selectedFile.name : "Cliquez pour uploader l'image"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lien de redirection</label>
                                <input type="text" value={newAd.linkUrl} onChange={e => setNewAd({ ...newAd, linkUrl: e.target.value })} className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" placeholder="https://partners.com/..." required />
                            </div>
                        </div>
                        <div className="space-y-4 border-l border-white/5 pl-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Limite Notifications / Jour / Pub</label>
                                <input type="number" value={newAd.dailyLimit} onChange={e => setNewAd({ ...newAd, dailyLimit: parseInt(e.target.value) })} className="w-full bg-[#0B0F19] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" min="1" max="10" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 font-bold">Titre Notification (Push)</label>
                                <input type="text" value={newAd.pushTitle} onChange={e => setNewAd({ ...newAd, pushTitle: e.target.value })} className="w-full bg-[#0B0F19] border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white" placeholder="Promo exclusive pour vous !" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 font-bold">Message Push</label>
                                <textarea value={newAd.pushBody} onChange={e => setNewAd({ ...newAd, pushBody: e.target.value })} className="w-full bg-[#0B0F19] border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white resize-none" rows={2} placeholder="Cliquez pour découvrir l'offre étudiant du moment." />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                                Activer la Campagne
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />)
                ) : ads.length === 0 ? (
                    <div className="md:col-span-2 bg-[#111827]/30 border border-white/5 border-dashed rounded-3xl p-20 text-center">
                        <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-10" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucune publicité en cours</p>
                    </div>
                ) : (
                    ads.map(ad => (
                        <div key={ad.id} className="bg-[#111827]/50 border border-white/5 rounded-[32px] overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col shadow-2xl">
                            <div className="h-40 bg-slate-800 relative group-hover:bg-slate-700 transition-colors">
                                {ad.imageUrl ? (
                                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center italic text-slate-600 text-xs uppercase tracking-widest">Aperçu indisponible</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${ad.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                        {ad.isActive ? 'En ligne' : 'Inactif'}
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-6 right-6">
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter truncate">{ad.title}</h4>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Quota Journalier</p>
                                        <p className="text-sm font-black text-white">{ad.sentToday} / {ad.dailyLimit}</p>
                                        <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (ad.sentToday / ad.dailyLimit) * 100)}%` }} />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Dernier Envoi</p>
                                        <p className="text-sm font-black text-slate-400">{ad.lastSentAt ? new Date(ad.lastSentAt).toLocaleTimeString() : '---'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleNotify(ad.id)}
                                        disabled={ad.sentToday >= ad.dailyLimit}
                                        className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Bell className="w-4 h-4" /> Notifier Étudiants
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAd(ad.id)}
                                        className="w-12 h-12 flex items-center justify-center bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 rounded-2xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
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
