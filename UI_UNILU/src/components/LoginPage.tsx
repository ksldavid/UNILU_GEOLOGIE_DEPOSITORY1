import { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Shield, Play, Pause, GraduationCap, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContactSupportModal } from './ContactSupportModal';
import logoImage from '../assets/da1a2f529aca98b88831def6f2dc64f21ceb1b65.png';
import slide1 from '../assets/slide1.png';
import slide2 from '../assets/slide2.png';
import slide3 from '../assets/slide3.png';
import slide4 from '../assets/slide4.png';

const slides = [
    {
        image: slide1,
        title: "Faculté de Science et Technologie",
        subtitle: "Département de Géologie",
        quote: "À la découverte de la force de la terre."
    },
    {
        image: slide2,
        title: "Expertise Académique",
        subtitle: "Portail collaboratif UNILU",
        quote: "La géologie : lire dans le livre ouvert de la nature."
    },
    {
        image: slide3,
        title: "Innovation Numérique",
        subtitle: "Gestion moderne des cursus",
        quote: "Le temps est le meilleur architecte de la terre."
    },
    {
        image: slide4,
        title: "Réussite Étudiante",
        subtitle: "Votre avenir commence ici",
        quote: "Étudier le passé de la terre pour construire son futur."
    }
];

interface LoginPageProps {
    onLogin: (id: string, password: string, role: 'STUDENT' | 'USER') => Promise<'SUCCESS' | 'AUTH_FAILED' | 'ROLE_MISMATCH'>;
    onAdminAccess: () => void;
}

export default function LoginPage({ onLogin, onAdminAccess }: LoginPageProps) {
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<'student' | 'academic'>('student');
    const [showContactModal, setShowContactModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [roleMismatch, setRoleMismatch] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [isPlaying]);

    const handleLogin = async () => {
        if (studentId.trim() && password.trim()) {
            setIsLoading(true);
            setError(false);
            setRoleMismatch(false);
            try {
                const targetRole = activeTab === 'student' ? 'STUDENT' : 'USER';
                const result = await onLogin(studentId.trim(), password.trim(), targetRole);
                if (result === 'ROLE_MISMATCH') setRoleMismatch(true);
                else if (result === 'AUTH_FAILED') setError(true);
            } catch (err) {
                setError(true);
            } finally {
                setIsLoading(false);
            }
        } else {
            alert('Veuillez remplir tous les champs');
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-950 relative overflow-hidden font-['Outfit']">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#009485]/10 blur-[150px] -mr-96 -mt-96 rounded-full animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] -ml-48 -mb-48 rounded-full" />

            {/* Left Section - Cinematic Hero */}
            <div className="hidden lg:flex flex-[1.4] relative overflow-hidden bg-slate-900 m-6 rounded-[50px] shadow-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <img src={slides[currentSlide].image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                <div className="relative z-10 flex flex-col justify-between p-20 w-full">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                        <img src={logoImage} alt="UNILU Logo" className="w-48 h-auto drop-shadow-2xl" />
                    </motion.div>

                    <div className="max-w-2xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -30, opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="w-12 h-1 bg-[#009485] rounded-full" />
                                        <span className="text-[#00E5BC] font-black text-xs uppercase tracking-[0.4em]">{slides[currentSlide].subtitle}</span>
                                    </div>
                                    <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase whitespace-pre-line">
                                        {slides[currentSlide].title}
                                    </h1>
                                </div>
                                <p className="text-xl text-slate-300 font-medium italic opacity-80 pl-4 border-l-2 border-white/20">
                                    "{slides[currentSlide].quote}"
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={onAdminAccess} className="p-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white transition-all hover:scale-110">
                            <Shield className="w-6 h-6" />
                        </button>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white transition-all hover:scale-110">
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Section - Minimalist Premium Form */}
            <div className="flex-1 flex flex-col justify-center items-center px-12 lg:px-20 relative z-20">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md space-y-12"
                >
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#009485]" />
                            <span className="text-[#009485] font-black text-[10px] uppercase tracking-[0.4em]">Portail Officiel</span>
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tighter leading-none">Connexion<span className="text-[#009485]">.</span></h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">Accédez à votre écosystème académique UNILU - Géologie.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Premium Tabs */}
                        <div className="flex p-2 bg-slate-900 border border-white/5 rounded-[30px] shadow-2xl">
                            <button
                                onClick={() => { setActiveTab('student'); setError(false); setRoleMismatch(false); }}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-[#009485] text-white shadow-xl shadow-teal-950/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <GraduationCap className="w-4 h-4" /> Étudiant
                            </button>
                            <button
                                onClick={() => { setActiveTab('academic'); setError(false); setRoleMismatch(false); }}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'academic' ? 'bg-[#009485] text-white shadow-xl shadow-teal-950/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Users className="w-4 h-4" /> Académique
                            </button>
                        </div>

                        {/* Login Form */}
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-6">ID UTILISATEUR</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 transition-colors group-focus-within:text-[#00E5BC]" />
                                    <input
                                        type="text"
                                        placeholder={activeTab === 'student' ? "Ex: 2023001" : "Matricule"}
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        className="w-full h-20 pl-16 pr-8 bg-slate-900/50 border border-white/10 rounded-[30px] text-white font-bold placeholder:text-slate-700 outline-none focus:bg-slate-900 focus:border-[#009485] focus:ring-4 focus:ring-teal-500/5 transition-all text-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-6">MOT DE PASSE</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 transition-colors group-focus-within:text-[#00E5BC]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                        className="w-full h-20 pl-16 pr-20 bg-slate-900/50 border border-white/10 rounded-[30px] text-white font-bold placeholder:text-slate-700 outline-none focus:bg-slate-900 focus:border-[#009485] focus:ring-4 focus:ring-teal-500/5 transition-all text-lg"
                                    />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {(error || roleMismatch) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-[24px]">
                                        <p className="text-rose-400 text-xs font-black uppercase tracking-widest text-center">
                                            {error ? "Identifiants Invalides" : `Changement d'onglet requis: ${activeTab === 'student' ? 'Corps Académique' : 'Étudiant'}`}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full h-20 bg-white hover:bg-[#009485] text-slate-950 hover:text-white rounded-[30px] font-black text-[13px] uppercase tracking-[0.4em] transition-all duration-500 shadow-2xl flex items-center justify-center gap-6 group disabled:bg-slate-800 disabled:text-slate-500 active:scale-95"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>Authentification <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-4 text-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                            Difficultés d'accès ? Contactez le
                            <button onClick={() => setShowContactModal(true)} className="ml-2 text-[#00E5BC] hover:underline">Support Académique</button>
                        </p>
                    </div>
                </motion.div>
            </div>

            <ContactSupportModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className={className}><Users className="w-full h-full" /></motion.div>;
}
