import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [theme, setTheme] = useState('');
  const [activeTime, setActiveTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi
    setTimeout(() => {
      alert('Votre demande de support administratif a été envoyée avec succès.');
      setFullName('');
      setStudentId('');
      setWhatsapp('');
      setTheme('');
      setActiveTime('');
      setMessage('');
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  const themes = [
    "Problème de Connexion",
    "Réinitialisation Mot de Passe",
    "Erreur d'Identifiant",
    "Problème de Dossier Académique",
    "Support Technique",
    "Autre"
  ];

  const timeSlots = [
    "Matin (08h - 12h)",
    "Après-midi (12h - 16h)",
    "Fin de journée (16h - 20h)",
    "Flexible (Toute la journée)"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ backdropFilter: 'blur(120px)', WebkitBackdropFilter: 'blur(120px)' }}
            className="fixed inset-0 bg-black/60 z-[9999]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 bg-white shadow-2xl w-full max-w-md z-[10000] overflow-hidden pointer-events-auto flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-700 px-8 py-10 flex items-center justify-between shadow-lg">
              <div>
                <h2 className="text-white text-2xl font-bold">Support Administratif</h2>
                <p className="text-teal-100 text-sm mt-1">Département de Géologie</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="space-y-6">
                  {/* Nom Complet */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nom Complet</label>
                    <div className="relative group">
                      <Input
                        key="input-fullname"
                        type="text"
                        placeholder="Ex: David Kasali"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-4 h-14 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* ID Etudiant */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">ID / Matricule</label>
                    <div className="relative group">
                      <Input
                        key="input-studentid"
                        type="text"
                        placeholder="Ex: 202300123"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="pl-4 h-14 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Whatspp */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Numéro WhatsApp</label>
                    <div className="relative group">
                      <Input
                        key="input-whatsapp"
                        type="tel"
                        placeholder="+243 XXX XXX XXX"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="pl-4 h-14 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Thématique</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full h-14 pl-4 pr-10 bg-slate-50 border-slate-100 border rounded-xl focus:bg-white focus:outline-none transition-all font-medium text-slate-700"
                      required
                    >
                      <option value="" disabled>Choisir un thème</option>
                      {themes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Active Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Disponibilité</label>
                    <div className="relative group">
                      <select
                        value={activeTime}
                        onChange={(e) => setActiveTime(e.target.value)}
                        className="w-full h-14 pl-4 pr-10 appearance-none bg-slate-50 border-slate-100 border rounded-xl focus:bg-white focus:outline-none transition-all font-medium text-slate-700"
                        required
                      >
                        <option value="" disabled>Quand êtes-vous actif ?</option>
                        {timeSlots.map((ts) => (
                          <option key={ts} value={ts}>{ts}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Détails</label>
                    <textarea
                      rows={4}
                      placeholder="Expliquez votre problème ici..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white transition-all resize-none font-medium text-slate-700"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/20 transition-all active:scale-[0.98] mt-4"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Envoi...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 uppercase tracking-widest text-xs">
                      Envoyer ma demande
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
