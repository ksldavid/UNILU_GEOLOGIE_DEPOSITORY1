import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Clock, LogOut } from 'lucide-react';

interface AutoLogoutProps {
    onLogout: () => void;
    timeoutMinutes?: number;
    warningMinutes?: number;
}

export const AutoLogout: React.FC<AutoLogoutProps> = ({
    onLogout,
    timeoutMinutes = 5, // 5 minutes pour le test
    warningMinutes = 2    // 2 minutes d'avertissement pour le test
}) => {
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(warningMinutes * 60);
    const lastActivityRef = useRef<number>(Date.now());
    const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
    const WARNING_MS = warningMinutes * 60 * 1000;

    // Fonction pour réinitialiser le timer
    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        if (showWarning) {
            setShowWarning(false);
            setTimeLeft(warningMinutes * 60);
        }
    }, [showWarning, warningMinutes]);

    // Écouter les événements d'activité
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    // Vérifier l'inactivité périodiquement
    useEffect(() => {
        checkIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - lastActivityRef.current;

            if (inactiveTime >= TIMEOUT_MS) {
                // Temps écoulé -> Déconnexion
                clearInterval(checkIntervalRef.current!);
                onLogout();
            } else if (inactiveTime >= (TIMEOUT_MS - WARNING_MS)) {
                // Entrée dans la zone d'avertissement
                if (!showWarning) {
                    setShowWarning(true);
                }
            }
        }, 10000); // Vérifier toutes les 10 secondes

        return () => {
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        };
    }, [onLogout, TIMEOUT_MS, WARNING_MS, showWarning]);

    // Gérer le compte à rebours de l'avertissement
    useEffect(() => {
        if (showWarning) {
            warningIntervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(warningIntervalRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
            setTimeLeft(warningMinutes * 60);
        }

        return () => {
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
        };
    }, [showWarning, warningMinutes]);

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden">
                <div className="bg-rose-500 p-8 text-white text-center relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <Clock className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Session bientôt expirée</h3>
                    <p className="text-rose-100 opacity-90">Pour votre sécurité, vous allez être déconnecté par inactivité.</p>
                </div>

                <div className="p-8 text-center">
                    <div className="mb-6">
                        <span className="text-5xl font-black text-gray-900 tracking-tighter">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Temps restant</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 text-left mb-8">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 font-medium">
                            Toute modification non enregistrée sera perdue lors de la déconnexion automatique.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onLogout}
                            className="py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                        <button
                            onClick={resetTimer}
                            className="py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all text-sm shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Rester connecté
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
