import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, Clock, User, Shield, LogIn } from 'lucide-react';
import { API_URL } from '../../services/config';

const LocationDiagnostic: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'not-logged'>('idle');
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState<any>(null);

    useEffect(() => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
            setStatus('not-logged');
        }
    }, []);

    const runDiagnostic = () => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
                            accuracy,
                            token
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-indigo-600 p-8 text-center text-white">
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold italic">Diagnostic GPS</h1>
                    <p className="text-indigo-100 mt-2 font-medium">Vérification de la présence et du token</p>
                </div>

                <div className="p-8">
                    {status === 'not-logged' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
                                <LogIn className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 italic">SESSION REQUISE</h2>
                                <p className="text-slate-500 font-bold mt-2">
                                    Vous devez être connecté sur ce navigateur pour effectuer le diagnostic.
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 italic uppercase tracking-widest"
                            >
                                Se Connecter d'abord
                            </button>
                            <p className="text-xs text-slate-400 font-medium">
                                Une fois connecté, scannez à nouveau le QR Code.
                            </p>
                        </div>
                    )}

                    {status === 'idle' && (
                        <div className="text-center">
                            <p className="text-slate-600 font-bold mb-8 italic">
                                Ce test permet de voir exactement ce que votre téléphone envoie au serveur (Localisation + Token).
                            </p>
                            <button
                                onClick={runDiagnostic}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 italic uppercase tracking-widest"
                            >
                                <Shield className="w-6 h-6" />
                                Lancer le Diagnostic
                            </button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="text-center py-12">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-slate-900 font-black italic uppercase tracking-widest">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm">
                                <CheckCircle className="w-10 h-10 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="font-black text-green-900 italic uppercase">Données transmises</h3>
                                    <p className="text-green-700 text-sm font-bold">{message}</p>
                                </div>
                            </div>

                            {details && (
                                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2"><User size={14}/> Étudiant</span>
                                        <span className="font-black text-slate-900 italic">{details.studentName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Session Token</span>
                                        <span className={`font-black italic px-3 py-1 rounded-full text-xs ${details.tokenExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {details.tokenExpired ? 'EXPIRÉ' : 'VALIDE'}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 mt-4 flex flex-col items-center">
                                        <span className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Distance au Campus</span>
                                        <span className="font-black text-indigo-600 text-4xl italic tracking-tighter">
                                            {details.distanceKm} <span className="text-lg uppercase">km</span>
                                        </span>
                                        <span className={`mt-2 text-[10px] font-black italic px-4 py-1.5 rounded-full ${details.onCampus ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                            {details.onCampus ? 'DANS LE PÉRIMÈTRE ✅' : 'HORS ZONE ❌'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full text-slate-400 font-black text-xs uppercase tracking-widest py-2 hover:text-slate-600 transition-colors"
                            >
                                Effectuer un nouveau test
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6 text-center">
                            <div className="bg-red-50 p-6 rounded-full inline-flex items-center justify-center shadow-inner border border-red-100">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 italic uppercase">Échec du diagnostic</h3>
                                <p className="text-slate-500 font-bold mt-2">{message}</p>
                            </div>
                            
                            <button
                                onClick={runDiagnostic}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 italic uppercase tracking-widest"
                            >
                                Réessayer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationDiagnostic;
