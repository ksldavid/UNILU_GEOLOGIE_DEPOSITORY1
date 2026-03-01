import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, Clock, User, Shield, LogIn, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { API_URL } from '../../services/config';
import { authService } from '../../services/auth';

const LocationDiagnostic: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'not-logged' | 'logging-in'>('idle');
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState<any>(null);

    // Login form state
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setStatus('not-logged');
        }
    }, []);

    const handleInternalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginId || !password) return;

        setStatus('logging-in');
        setLoginError('');

        try {
            await authService.login(loginId, password);
            // After successful login, the token is in localStorage/sessionStorage
            // We can now run the diagnostic
            runDiagnostic();
        } catch (err: any) {
            setStatus('not-logged');
            setLoginError(err.message || 'Échec de la connexion');
        }
    };

    const runDiagnostic = () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setStatus('not-logged');
            return;
        }

        setStatus('loading');
        setMessage('Récupération de votre position GPS...');

        if (!navigator.geolocation) {
            setStatus('error');
            setMessage("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude, accuracy } = position.coords;
                    const token = sessionStorage.getItem('token');

                    setMessage('Envoi des données au serveur...');

                    const response = await fetch(`${API_URL}/diagnostic/location`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            latitude,
                            longitude,
                            accuracy
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        setStatus('success');
                        setMessage('Diagnostic envoyé avec succès !');
                        setDetails(result.data);
                    } else {
                        setStatus('error');
                        setMessage(result.message || 'Erreur lors de l\'envoi du diagnostic.');
                        if (response.status === 401) {
                            setStatus('not-logged');
                        }
                    }
                } catch (error) {
                    setStatus('error');
                    setMessage('Impossible de contacter le serveur.');
                }
            },
            (error) => {
                setStatus('error');
                let errorMsg = 'Erreur GPS : ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += "Permission refusée. Veuillez activer la localisation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += "Position indisponible.";
                        break;
                    case error.TIMEOUT:
                        errorMsg += "Délai d'attente dépassé.";
                        break;
                    default:
                        errorMsg += "Erreur inconnue.";
                }
                setMessage(errorMsg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
                {/* Header Section */}
                <div className="bg-indigo-600 p-10 text-center text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Shield size={120} />
                    </div>
                    <div className="bg-white/20 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner">
                        <MapPin className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Diagnostic GPS</h1>
                    <p className="text-indigo-100 mt-3 font-bold text-sm uppercase tracking-widest opacity-80">Vérification de Session & Géozonage</p>
                </div>

                <div className="p-10">
                    {/* Integrated Login Form */}
                    {(status === 'not-logged' || status === 'logging-in') && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-900 italic uppercase italic tracking-tight">Identification</h2>
                                <p className="text-slate-500 font-bold mt-2 text-sm">Veuillez entrer vos identifiants pour continuer le diagnostic.</p>
                            </div>

                            <form onSubmit={handleInternalLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Identifiant / Matricule</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={loginId}
                                            onChange={(e) => setLoginId(e.target.value)}
                                            placeholder="Ex: 202300123"
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-300 text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-14 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-300 text-slate-700"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3">
                                        <XCircle size={18} />
                                        {loginError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'logging-in'}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[24px] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 italic uppercase tracking-[0.2em] relative overflow-hidden group active:scale-95 disabled:opacity-50"
                                >
                                    {status === 'logging-in' ? (
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    ) : (
                                        <>
                                            Connexion Directe
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                                Une fois connecté, le diagnostic GPS se lancera automatiquement sans que vous ayez à re-scanner.
                            </p>
                        </div>
                    )}

                    {/* Standard Diagnostic Flows */}
                    {status === 'idle' && (
                        <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <p className="text-slate-600 font-bold italic leading-relaxed text-lg">
                                "Prêt à vérifier votre position et l'état de votre session sur le serveur."
                            </p>
                            <button
                                onClick={runDiagnostic}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[28px] transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 italic uppercase tracking-[0.2em] active:scale-95"
                            >
                                <Shield className="w-8 h-8" />
                                Lancer le Diagnostic
                            </button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="text-center py-16 animate-in fade-in duration-300">
                            <div className="relative w-28 h-28 mx-auto mb-10">
                                <div className="absolute inset-0 border-8 border-indigo-50 rounded-full"></div>
                                <div className="absolute inset-0 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <MapPin className="absolute inset-0 m-auto text-indigo-200 w-10 h-10 animate-pulse" />
                            </div>
                            <p className="text-slate-900 font-black italic uppercase tracking-[0.1em] text-lg">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">
                            <div className="flex items-center gap-5 bg-green-50 p-6 rounded-[30px] border-2 border-green-100/50 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <CheckCircle size={80} className="text-green-600" />
                                </div>
                                <div className="bg-green-500 p-3 rounded-2xl text-white shadow-lg shadow-green-200">
                                    <CheckCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-black text-green-900 italic uppercase tracking-tight">Rapport Envoyé</h3>
                                    <p className="text-green-700 text-sm font-bold opacity-80">{message}</p>
                                </div>
                            </div>

                            {details && (
                                <div className="space-y-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-inner relative overflow-hidden">
                                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><User size={14} /> Étudiant</span>
                                        <span className="font-black text-slate-900 italic text-sm">{details.studentName}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Clock size={14} /> Session Token</span>
                                        <span className={`font-black italic px-4 py-1.5 rounded-full text-[10px] border ${details.tokenExpired ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {details.tokenExpired ? 'EXPIRÉ' : 'VALIDE'}
                                        </span>
                                    </div>

                                    <div className="pt-8 flex flex-col items-center">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Distance relative au Campus</div>
                                        <div className="relative">
                                            <span className="font-black text-indigo-600 text-6xl italic tracking-tighter tabular-nums">
                                                {details.distanceKm}
                                            </span>
                                            <span className="text-xl font-black text-indigo-400 uppercase italic ml-2">km</span>
                                        </div>
                                        <div className={`mt-6 inline-flex items-center gap-3 font-black underline-offset-4 decoration-2 italic px-8 py-3 rounded-[24px] shadow-lg ${details.onCampus ? 'bg-green-600 text-white shadow-green-200' : 'bg-red-600 text-white shadow-red-200'}`}>
                                            {details.onCampus ? 'DANS LE PÉRIMÈTRE ✅' : 'HORS ZONE ❌'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] py-4 hover:text-indigo-600 transition-all border-t border-slate-100"
                            >
                                / Nouveau Diagnostic /
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-8 text-center animate-in slide-in-from-top-4 duration-500">
                            <div className="bg-red-50 p-8 rounded-[35px] inline-flex items-center justify-center shadow-inner border border-red-100 relative">
                                <XCircle className="w-16 h-16 text-red-500" />
                                <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-sm border border-red-50">
                                    <Shield className="w-6 h-6 text-red-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic uppercase italic tracking-tight">Rapport d'échec</h3>
                                <p className="text-slate-500 font-bold mt-3 text-lg">{message}</p>
                            </div>

                            <button
                                onClick={runDiagnostic}
                                className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[24px] shadow-2xl shadow-slate-200 transition-all active:scale-95 italic uppercase tracking-[0.2em]"
                            >
                                Réessayer l'envoi
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationDiagnostic;
