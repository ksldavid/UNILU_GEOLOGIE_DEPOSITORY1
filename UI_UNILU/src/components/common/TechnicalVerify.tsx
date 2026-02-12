
import { useState, useEffect } from 'react';
import { User, LogOut, ShieldCheck, Smartphone, RefreshCw } from 'lucide-react';

const PERSISTENT_TOKEN_KEY = 'unilu_scan_auth_token';

export function TechnicalVerify() {
    const [userData, setUserData] = useState<any>(null);
    const [scanToken, setScanToken] = useState<string | null>(null);

    useEffect(() => {
        // Collect current state
        const storedUser = sessionStorage.getItem('user');
        const token = localStorage.getItem(PERSISTENT_TOKEN_KEY);

        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }
        setScanToken(token);
    }, []);

    const handleFullLogout = () => {
        // 1. Clear everything
        sessionStorage.clear();
        localStorage.clear(); // Extreme clean

        // 2. Visual feedback then redirect
        alert("Déconnexion complète réussie. Tous les jetons ont été supprimés.");
        window.location.href = "/";
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 rounded-3xl mb-6 shadow-sm border border-amber-100">
                        <ShieldCheck className="w-10 h-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter">Support Technique</h1>
                    <p className="text-gray-500 font-bold text-sm mt-2 italic">Vérification de l'identité locale</p>
                </div>

                <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 shadow-sm mb-8">
                    {userData ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-teal-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-gray-400 uppercase italic">Utilisateur Connecté</p>
                                    <p className="text-lg font-black text-gray-900 italic leading-tight">{userData.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-gray-400 uppercase italic">Identifiant / Matricule</p>
                                    <p className="text-lg font-black text-gray-900 italic tabular-nums leading-tight">{userData.id}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic ${userData.role === 'STUDENT' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                    Rôle: {userData.role}
                                </span>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-gray-400 italic">
                                    Jetton de Scan Persistant: {scanToken ? "✅ Activé" : "❌ Absent"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-400 font-black italic uppercase tracking-widest text-sm mb-2">Aucun utilisateur</p>
                            <p className="text-gray-500 text-xs font-bold leading-relaxed">
                                Aucun identifiant n'est actuellement enregistré dans ce navigateur.
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleFullLogout}
                        className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[20px] font-black text-lg transition-all shadow-xl shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-4 italic"
                    >
                        <LogOut className="w-6 h-6" />
                        TOUT DÉCONNECTER
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-[20px] font-black text-sm transition-all active:scale-95 italic flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        SYNCHRONISER
                    </button>
                </div>

                <p className="mt-10 text-center text-[10px] font-medium text-gray-300 uppercase tracking-[0.2em]">Unilu Hub • Support Technique</p>
            </div>
        </div>
    );
}
