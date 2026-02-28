import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, Clock, User, Shield, LogIn } from 'lucide-react';

const LocationDiagnostic: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState<any>(null);

    const runDiagnostic = () => {
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
                    const token = localStorage.getItem('token');

                    setMessage('Envoi des données au serveur...');
                    
                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/diagnostic/location`, {
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
                    <h1 className="text-2xl font-bold">Diagnostic GPS</h1>
                    <p className="text-indigo-100 mt-2">Vérification de votre position et de votre session</p>
                </div>

                <div className="p-8">
                    {status === 'idle' && (
                        <div className="text-center">
                            <p className="text-slate-600 mb-8">
                                Ce test permet de diagnostiquer les problèmes de pointage en vérifiant que votre téléphone envoie les bonnes coordonnées au serveur.
                            </p>
                            <button
                                onClick={runDiagnostic}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                                <Shield className="w-5 h-5" />
                                Lancer le Diagnostic
                            </button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                            <p className="text-slate-600 font-medium">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl border border-green-100">
                                <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-green-900">Données transmises</h3>
                                    <p className="text-green-700 text-sm">{message}</p>
                                </div>
                            </div>

                            {details && (
                                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2"><User size={14}/> Étudiant</span>
                                        <span className="font-semibold text-slate-900">{details.studentName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> Session</span>
                                        <span className={`font-semibold ${details.tokenExpired ? 'text-red-600' : 'text-green-600'}`}>
                                            {details.tokenExpired ? 'Expirée' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3 mt-3">
                                        <span className="text-slate-500">Distance au Campus</span>
                                        <span className="font-bold text-indigo-600 text-lg">
                                            {details.distanceKm} km
                                        </span>
                                    </div>
                                </div>
                            )}

                            {details?.tokenExpired && (
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                    <p className="text-amber-800 text-sm mb-3">
                                        Votre session a expiré. Vous devez vous reconnecter pour que le pointage fonctionne.
                                    </p>
                                    <a 
                                        href="/login" 
                                        className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                                    >
                                        <LogIn size={16} /> Se connecter maintenant
                                    </a>
                                </div>
                            )}

                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full text-slate-500 font-medium py-2 hover:text-slate-700 transition-colors"
                            >
                                Recommencer le test
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6 text-center">
                            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 inline-block mx-auto">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Échec du diagnostic</h3>
                            <p className="text-slate-600">{message}</p>
                            
                            <button
                                onClick={runDiagnostic}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all"
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
