
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, MapPin, Lock, Smartphone } from 'lucide-react';
import { authService } from '../../services/auth';
import API_URL from '../../services/config';

// Key for storing the "forever" token
const PERSISTENT_TOKEN_KEY = 'unilu_scan_auth_token';

export function AttendanceScan() {
    const [status, setStatus] = useState<'checking-ios' | 'initializing' | 'login-required' | 'getting-location' | 'submitting' | 'success' | 'error'>('checking-ios');
    const [errorDetails, setErrorDetails] = useState<string>('');
    const [successData, setSuccessData] = useState<any>(null);

    // Login Form State
    const [loginId, setLoginId] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // 1. Check iOS on Mount
    useEffect(() => {
        const checkDevice = () => {
            // Simple verify for iOS (iPhone/iPad/iPod)
            // Note: functionality requested "uniquement pour iphone"
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

            if (!isIOS) {
                // Enforce strict iOS check? The user asked "je voudrai que cette fonctionnalite ne marche uniquement que pour iphone".
                // Let's enforce it.
                setStatus('error');
                setErrorDetails('Cette fonctionnalité est exclusivement réservée aux utilisateurs iPhone (iOS).');
                return;
            }

            setStatus('initializing');
        };

        checkDevice();
    }, []);

    // 2. Main Logic Execution
    useEffect(() => {
        if (status === 'initializing') {
            runScanFlow();
        }
    }, [status]);

    const runScanFlow = async () => {
        try {
            // A. Extract Token from URL
            const params = new URLSearchParams(window.location.search);
            const qrToken = params.get('t'); // We'll use 't' as param key

            if (!qrToken) {
                throw new Error("Code QR invalide (Token manquant).");
            }

            // B. Check Auth
            let token = localStorage.getItem(PERSISTENT_TOKEN_KEY);

            // If no local token, check if we have a session token from normal usage (just in case)
            if (!token) {
                const sessionToken = sessionStorage.getItem('token');
                if (sessionToken) {
                    // Migrating session token to persistent storage for this feature
                    localStorage.setItem(PERSISTENT_TOKEN_KEY, sessionToken);
                    token = sessionToken;
                }
            }

            if (!token) {
                setStatus('login-required');
                return;
            }

            // C. Get Location
            setStatus('getting-location');

            if (!navigator.geolocation) {
                throw new Error("La géolocalisation n'est pas supportée par ce navigateur.");
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // D. Submit to Backend
                    await submitAttendance(qrToken, token!, position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    let msg = "Impossible de récupérer votre position.";
                    if (err.code === err.PERMISSION_DENIED) msg = "Vous devez autoriser la localisation pour valider votre présence.";
                    else if (err.code === err.POSITION_UNAVAILABLE) msg = "Signal GPS introuvable (êtes-vous à l'intérieur ?).";
                    else if (err.code === err.TIMEOUT) msg = "Délai d'attente dépassé pour la localisation.";

                    setStatus('error');
                    setErrorDetails(msg);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );

        } catch (err: any) {
            setStatus('error');
            setErrorDetails(err.message || "Une erreur inconnue est survenue.");
        }
    };

    const submitAttendance = async (qrToken: string, token: string, lat: number, long: number) => {
        setStatus('submitting');
        try {
            const response = await fetch(`${API_URL}/attendance/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    qrToken,
                    latitude: lat,
                    longitude: long
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // If 401, maybe token expired?
                if (response.status === 401) {
                    localStorage.removeItem(PERSISTENT_TOKEN_KEY);
                    setStatus('login-required');
                    return;
                }
                throw new Error(data.message || "Erreur lors de la validation.");
            }

            setSuccessData(data);
            setStatus('success');

        } catch (err: any) {
            setStatus('error');
            setErrorDetails(err.message || "Erreur serveur.");
        }
    };

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            // Use existing service but manage token manually
            const response = await authService.login(loginId, loginPass);

            // S'assurer que c'est un étudiant
            if (response.user.role !== 'STUDENT') {
                throw new Error("Seuls les étudiants peuvent utiliser le scan de présence.");
            }

            // Store forever
            localStorage.setItem(PERSISTENT_TOKEN_KEY, response.token);

            // Retry flow
            setIsLoggingIn(false);
            setStatus('initializing'); // Will trigger useEffect to restart flow

        } catch (err: any) {
            alert(err.message || "Connexion échouée");
            setIsLoggingIn(false);
        }
    };

    // --- RENDERING ---

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Oups !</h1>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    {errorDetails}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold active:scale-95 transition-transform"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Bravo !</h1>
                <p className="text-emerald-600 font-bold text-lg mb-8">
                    Présence validée ✅
                </p>
                {successData && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 w-full max-w-sm">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Feedback</p>
                        <p className="text-gray-900 font-medium leading-relaxed mb-4">
                            {successData.message}
                        </p>
                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                style={{ width: `${successData.stats?.attendanceRate || 0}%` }}
                            />
                        </div>
                        <p className="text-right text-xs font-bold text-emerald-600 mt-2">
                            Taux: {successData.stats?.attendanceRate}%
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'login-required') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 animate-in fade-in duration-500">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-6 shadow-xl">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Identification</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Connectez-vous une seule fois pour activer le scan rapide sur cet iPhone.
                        </p>
                    </div>

                    <form onSubmit={handleManualLogin} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Matricule Étudiant"
                                value={loginId}
                                onChange={e => setLoginId(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium transition-all"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Mot de passe"
                                value={loginPass}
                                onChange={e => setLoginPass(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg active:scale-95 transition-all shadow-xl hover:bg-black disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoggingIn && <Loader2 className="w-5 h-5 animate-spin" />}
                            Activer
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-2 justify-center text-xs text-gray-400 font-medium uppercase tracking-widest">
                        <Lock className="w-3 h-3" />
                        Sécurisé & Persistant
                    </div>
                </div>
            </div>
        );
    }

    // Loading / Getting Location State
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    {status === 'getting-location' ? (
                        <MapPin className="w-6 h-6 text-gray-900 animate-bounce" />
                    ) : (
                        <Loader2 className="w-6 h-6 text-gray-400" />
                    )}
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
                {status === 'checking-ios' && "Vérification de l'appareil..."}
                {status === 'initializing' && "Initialisation..."}
                {status === 'getting-location' && "Localisation en cours..."}
                {status === 'submitting' && "Validation de la présence..."}
            </h2>
            <p className="text-gray-400 text-sm font-medium animate-pulse">
                Veuillez patienter un instant
            </p>
        </div>
    );
}
