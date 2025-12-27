import { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Shield, Play, Pause } from 'lucide-react';
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
        title: "Faculté des sciences et technologies : Departement de géologie",
        subtitle: "Portail Professeur, Assistant et Étudiant",
        quote: "À la découverte de la force de la terre."
    },
    {
        image: slide2,
        title: "Faculté des sciences et technologies : Departement de géologie",
        subtitle: "Portail Professeur, Assistant et Étudiant",
        quote: "La géologie : lire dans le livre ouvert de la nature."
    },
    {
        image: slide3,
        title: "Faculté des sciences et technologies : Departement de géologie",
        subtitle: "Portail Professeur, Assistant et Étudiant",
        quote: "Le temps est le meilleur architecte de la terre."
    },
    {
        image: slide4,
        title: "Faculté des sciences et technologies : Departement de géologie",
        subtitle: "Portail Professeur, Assistant et Étudiant",
        quote: "Étudier le passé de la terre pour construire son futur."
    }
];

interface LoginPageProps {
    onLogin: (id: string, password: string, role: 'student' | 'academic') => void;
    onAdminAccess: () => void;
}

export default function LoginPage({ onLogin, onAdminAccess }: LoginPageProps) {
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [activeTab, setActiveTab] = useState<'student' | 'academic'>('student');
    const [showContactModal, setShowContactModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [isPlaying]);

    const handleLogin = () => {
        if (studentId.trim() && password.trim()) {
            setIsLoading(true);
            setError(false);

            setTimeout(() => {
                if (studentId === 'davidksl' && password === 'davidksl') {
                    setIsLoading(false);
                    setError(true);
                } else {
                    onLogin(studentId, password, activeTab);
                    setIsLoading(false);
                }
            }, 1800);
        } else {
            alert('Veuillez remplir tous les champs');
        }
    };

    const handleAdminAccess = () => {
        onAdminAccess();
    };

    return (
        <div className="min-h-screen flex bg-white relative">
            {/* Left Section - Hero */}
            <div className="hidden lg:flex split-hero relative overflow-hidden">
                {/* Slideshow Background */}
                <div className="absolute inset-0">
                    <AnimatePresence>
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0"
                        >
                            <img
                                src={slides[currentSlide].image}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>
                    {/* Subtle bottom gradient for text readability only */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full">
                    {/* Floating Shield Logo Top Left */}
                    <div className="animate-fadeIn">
                        <img
                            src={logoImage}
                            alt="UNILU Logo"
                            className="w-44 h-auto drop-shadow-xl"
                        />
                    </div>

                    {/* Text content at bottom left - MORE RAISED */}
                    <div className="mb-48">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h1 className="text-6xl font-black text-white leading-[1.1] mb-4 max-w-2xl drop-shadow-lg">
                                    {slides[currentSlide].title}
                                </h1>
                                <p className="text-2xl text-white font-bold opacity-90 mb-6 drop-shadow-md">
                                    {slides[currentSlide].subtitle}
                                </p>
                                <div className="orange-line" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>


            {/* Controls Group - Bottom Left */}
            <div className={`absolute bottom-8 left-8 z-50 flex items-center gap-3 transition-opacity duration-300 ${showContactModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <button
                    onClick={handleAdminAccess}
                    className="p-3 bg-black/20 lg:bg-white/10 backdrop-blur-md rounded-full border border-white/20 transition-all text-white hover:scale-110 active:scale-95 shadow-lg"
                    title="Accès Administration"
                >
                    <Shield className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-black/20 lg:bg-white/10 backdrop-blur-md rounded-full border border-white/20 transition-all text-white hover:scale-110 active:scale-95 shadow-lg"
                    title={isPlaying ? "Arrêter le défilement" : "Lancer le défilement"}
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
            </div>

            {/* Right Section - Login Form */}
            <div className={`flex-1 split-form flex flex-col items-center p-8 bg-white relative transition-all duration-500 ${showContactModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="w-full max-w-sm flex flex-col min-h-full pt-4 pb-12">
                    {/* Welcome Text at Top */}
                    <div className="text-center mb-4">
                        <h2 className="text-6xl font-bold mb-4 text-slate-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em' }}>
                            Bienvenue
                        </h2>
                        <h3 className="text-xl font-bold text-teal-600 mb-2 tracking-wide uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            UNIVERSITE DE LUBUMBASHI
                        </h3>
                        <p className="text-gray-500 text-sm font-medium">Portail de la Faculté de Géologie</p>
                    </div>

                    <div className="flex-1 flex flex-col pt-4">
                        <div className="mb-4 flex justify-center lg:justify-start lg:ml-1">
                            {/* Décoration subtile */}
                            <div className="w-12 h-1.5 bg-teal-500/10 rounded-full" />
                        </div>

                        {/* Pill-style Role Tabs */}
                        <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
                            <button
                                onClick={() => setActiveTab('student')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'student'
                                    ? 'bg-white text-teal-600 shadow-sm border border-gray-100'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Étudiant
                            </button>
                            <button
                                onClick={() => setActiveTab('academic')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'academic'
                                    ? 'bg-white text-teal-600 shadow-sm border border-gray-100'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Corps Académique
                            </button>
                        </div>

                        {/* Login Form - Removed mt-auto to raise the form */}
                        <motion.div
                            className="space-y-6 pb-4"
                            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Student ID Field */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2.5 ml-1">
                                    {activeTab === 'student' ? 'Numéro Étudiant' : 'Identifiant Personnel'}
                                </label>
                                <div className="relative">
                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        type="text"
                                        placeholder={activeTab === 'student' ? 'Ex: 202300123' : 'Matricule'}
                                        value={studentId}
                                        onChange={(e) => {
                                            setStudentId(e.target.value);
                                            if (error) setError(false);
                                        }}
                                        className={`w-full pl-12 pr-4 py-4 bg-gray-50/50 border rounded-2xl text-slate-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${error
                                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-gray-200 focus:ring-teal-500/20 focus:border-teal-500/50'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2.5 ml-1">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (error) setError(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleLogin();
                                            }
                                        }}
                                        className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 border rounded-2xl text-slate-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${error
                                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-gray-200 focus:ring-teal-500/20 focus:border-teal-500/50'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-red-500 text-xs font-bold mt-2 ml-1"
                                        >
                                            Identifiant ou mot de passe incorrect.
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Se souvenir de moi</span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className={`w-full h-14 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center relative overflow-hidden active:scale-[0.98] disabled:cursor-not-allowed mt-2`}
                            >
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div
                                            key="loader"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex gap-1.5"
                                        >
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-white rounded-full"
                                                    animate={{
                                                        y: [0, -6, 0],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        repeat: Infinity,
                                                        delay: i * 0.1,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="content"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-2"
                                        >
                                            Se connecter
                                            <ArrowRight className="w-5 h-5" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>


                        </motion.div>
                    </div>

                    {/* Footer Section */}
                    <div className={`mt-auto pt-10 transition-opacity duration-300 ${showContactModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <div className="h-px bg-gray-100 w-full mb-8" />
                        <div className="text-center text-xs text-gray-500">
                            Vous rencontrez un problème technique ?{' '}
                            <button
                                onClick={() => setShowContactModal(true)}
                                className="text-slate-600 font-bold hover:underline"
                            >
                                Support administratif
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Support Modal / Questionnaire */}
            <ContactSupportModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
            />

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s ease-out;
                }
            `}</style>
        </div>
    );
}