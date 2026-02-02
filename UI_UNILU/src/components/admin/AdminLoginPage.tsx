import React, { useState } from 'react';
import { Eye, EyeOff, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from '../../assets/unilu-official-logo.png';

interface AdminLoginPageProps {
  onLogin: (id: string, password: string, role: 'admin' | 'service-academique') => Promise<void | boolean | 'SUCCESS' | 'AUTH_FAILED' | 'ROLE_MISMATCH'>;
  onBack: () => void;
}

export function AdminLoginPage({ onLogin, onBack }: AdminLoginPageProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<'admin' | 'service-academique'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // On efface les erreurs précédentes

    if (userId.trim() && password.trim()) {
      setIsLoading(true);
      try {
        const result = await onLogin(userId.trim(), password.trim(), activeRole);

        if (result === 'ROLE_MISMATCH') {
          setError("Cet identifiant n'appartient pas à cet onglet (vérifiez si vous êtes au Service Technique ou Académique).");
        } else if (result === 'AUTH_FAILED') {
          setError("L'identifiant ou le mot de passe est incorrect.");
        } else if (result === false) {
          setError("L'identifiant ou le mot de passe est incorrect.");
        }
      } catch (error) {
        setError('Une erreur est survenue lors de la connexion.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Veuillez remplir tous les champs.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F0F4EF] font-sans overflow-hidden relative selection:bg-[#1B4332]/10 selection:text-[#1B4332]">
      {/* Abstract Organic Green Waves with Depth */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#E2EEE2]/40 via-transparent to-[#D5E0D4]/30" />
        <svg
          className="absolute w-full h-full opacity-70 scale-105"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={{
              d: [
                "M-100,200 C150,100 350,600 500,400 C650,200 850,500 1100,300 L1100,1100 L-100,1100 Z",
                "M-100,250 C200,150 400,550 550,450 C700,350 900,450 1100,350 L1100,1100 L-100,1100 Z",
                "M-100,200 C150,100 350,600 500,400 C650,200 850,500 1100,300 L1100,1100 L-100,1100 Z"
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            d="M-100,200 C150,100 350,600 500,400 C650,200 850,500 1100,300 L1100,1100 L-100,1100 Z"
            fill="#C3D3C1"
          />
          <path
            d="M-200,500 C100,300 400,800 600,600 C800,400 900,900 1200,700 L1200,1200 L-200,1200 Z"
            fill="#D5E0D4"
            opacity="0.5"
          />
          <path
            d="M500,-100 C600,100 400,300 700,500 C850,650 1100,400 1100,400 L1100,-100 Z"
            fill="#AFC3AD"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">

        {/* Left Section - Branding & Welcome */}
        <div className="lg:w-[46%] flex flex-col p-8 md:p-12 lg:pt-8 lg:px-24 lg:pb-24 justify-start gap-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="p-2 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm group-hover:bg-white/60 transition-all">
              <img src={logoImage} alt="Logo" className="h-10 w-auto" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#1B4332]/50">Portail Admin</span>
              <span className="text-sm font-bold text-[#1B4332] max-w-[200px] leading-tight">
                Faculté de Science et Technologie
              </span>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-7xl font-serif text-[#1B4332] leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Heureux<br />
              de<br />
              vous<br />
              revoir,<br />
              <span className="opacity-60 italic whitespace-nowrap">administrateur !</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 text-[#1B4332]/70 font-medium"
            >
              <div className="h-px w-12 bg-[#1B4332]/20" />
              <p className="text-lg">Département de géosciences</p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-[#1B4332]/60 max-w-md leading-relaxed"
            >
              Accès sécurisé pour la gestion des strates académiques et administratives de la faculté.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-5"
          >
            <button
              onClick={onBack}
              className="group flex items-center gap-3 bg-white/90 backdrop-blur shadow-xl shadow-black/5 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              RETOUR À L'ACCUEIL
            </button>
          </motion.div>
        </div>

        {/* Right Section - Harmonic Glass Box */}
        <div className="flex-1 flex items-start justify-center p-6 lg:pt-8 lg:p-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[560px] bg-white/50 backdrop-blur-[40px] rounded-[3.5rem] shadow-[0_32px_80px_-16px_rgba(27,67,50,0.1)] border border-white/50 overflow-hidden relative"
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            <div className="p-12 lg:p-16 space-y-12 relative z-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] text-[#1B4332]/40 uppercase">
                  <CheckCircle2 className="w-3 h-3 text-[#1B4332]/30" />
                  AUTHENTIFICATION SÉCURISÉE
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl font-serif text-[#1B4332] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    Connexion au panel <br />
                    <span className="opacity-50">administratif</span>
                  </h2>
                </div>

                {/* Refined Role Switcher */}
                <div className="flex justify-between items-center text-[11px] font-black tracking-[0.2em] text-[#1B4332]/30 uppercase border-b border-[#1B4332]/10 pb-4">
                  <button
                    onClick={() => setActiveRole('admin')}
                    className={`relative py-1 transition-all hover:text-[#1B4332] ${activeRole === 'admin' ? 'text-[#1B4332]' : ''
                      }`}
                  >
                    SERVICE TECHNIQUE
                    {activeRole === 'admin' && (
                      <motion.div layoutId="roleTab" className="absolute -bottom-[17px] left-0 right-0 h-1 bg-[#1B4332] rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveRole('service-academique')}
                    className={`relative py-1 transition-all hover:text-[#1B4332] ${activeRole === 'service-academique' ? 'text-[#1B4332]' : ''
                      }`}
                  >
                    SERVICE ACADÉMIQUE
                    {activeRole === 'service-academique' && (
                      <motion.div layoutId="roleTab" className="absolute -bottom-[17px] left-0 right-0 h-1 bg-[#1B4332] rounded-full" />
                    )}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50 ml-1">Identifiant</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ID"
                      value={userId}
                      onChange={(e) => {
                        setUserId(e.target.value);
                        if (error) setError('');
                      }}
                      className={`w-full h-14 bg-white/40 border-b text-slate-900 placeholder:text-slate-600 focus:bg-white/60 transition-all outline-none font-medium text-lg px-2 rounded-t-xl ${error ? 'border-red-400' : 'border-[#1B4332]/25 focus:border-[#1B4332]'}`}
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <User className={`w-5 h-5 ${error ? 'text-red-400' : 'text-[#1B4332]/20'}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50 ml-1">Mot de passe</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      className={`w-full h-14 bg-white/40 border-b text-slate-900 placeholder:text-slate-400 focus:bg-white/60 transition-all outline-none font-medium text-lg px-2 rounded-t-xl ${error ? 'border-red-400' : 'border-[#1B4332]/25 focus:border-[#1B4332]'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-[#1B4332]/20 hover:text-[#1B4332]'}`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        id="remember"
                        className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
                      />
                      <div className="w-5 h-5 border-2 border-[#1B4332]/20 rounded-md peer-checked:bg-[#1B4332] peer-checked:border-[#1B4332] transition-all" />
                      <CheckCircle2 className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs font-bold text-[#1B4332]/50 group-hover:text-[#1B4332] transition-colors">Se souvenir de moi</span>
                  </label>

                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/30 hover:text-[#1B4332] transition-colors">
                    Besoin d'aide ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-18 bg-[#1B4332] text-white font-black rounded-[2rem] shadow-2xl shadow-[#1B4332]/20 hover:bg-[#123124] hover:translate-y-[-2px] active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-[0.4em] text-xs disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"
                      />
                    ) : (
                      <motion.div
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4"
                      >
                        S'AUTHENTIFIER
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-full group-hover:scale-150 transition-transform" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

              </form>

            </div>

            {/* Footer decoration */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#1B4332]/10 to-transparent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
