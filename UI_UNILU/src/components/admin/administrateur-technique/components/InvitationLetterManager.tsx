import { useState } from 'react';
import { User, Shield, Plus, FileText, Download, X, UserCheck, Users, Briefcase, Settings } from 'lucide-react';
import { jsPDF } from 'jspdf';

type TargetType = 'Etudiant' | 'Corps Académique et Scientifique' | 'Service Académique' | 'Service Technique';

export function InvitationLetterManager() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetType, setTargetType] = useState<TargetType | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        gender: 'M',
        id: '',
        password: ''
    });

    const generatePDF = () => {
        const doc = new jsPDF();
        const { name, gender, id, password } = formData;

        // Colors
        const primaryColor = '#1e3a8a'; // UNILU Blue
        const secondaryColor = '#64748b'; // Slate 500

        // PAGE 1
        // Header
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor('#ffffff');
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('UNIVERSITÉ DE LUBUMBASHI', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('PORTAIL NUMÉRIQUE UNILUHUB', 105, 30, { align: 'center' });

        // Body Page 1
        doc.setTextColor('#000000');
        doc.setFontSize(12);
        const title = gender === 'M' ? `Monsieur le Professeur ${name},` : `Madame la Professeure ${name},`;
        doc.text(title, 20, 60);

        doc.setFont('helvetica', 'bold');
        doc.text('Objet : Déploiement du Portail Numérique UNILUHUB – Invitation et Accès Officiels', 20, 75);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Importance du portail :', 20, 90);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#000000');
        const introTxt = "Dans le cadre de la modernisation des services académiques de l'Université de Lubumbashi, nous avons le plaisir de vous présenter UNILUHUB, votre nouveau portail numérique intégré. Cet outil a été conçu pour simplifier la gestion de vos enseignements et favoriser une interaction fluide avec l'administration et les étudiants. UNILUHUB n'est pas qu'un simple outil informatique ; c'est le fruit d'une volonté de moderniser nos processus académiques en plaçant l'excellence et l'innovation au cœur de notre institution.";
        const splitIntro = doc.splitTextToSize(introTxt, 170);
        doc.text(splitIntro, 20, 100);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Normes de Sécurité et Confidentialité :', 20, 140);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#000000');
        const securityPoints = [
            { t: 'La souveraineté des données :', d: 'Toutes les informations sont hébergées et sécurisées suivant des protocoles de chiffrement avancés.' },
            { t: 'La protection de la vie privée :', d: 'Conformément aux exigences du Service académique, chaque utilisateur garde un contrôle total sur ses informations personnelles.' },
            { t: 'La traçabilité intégrale :', d: 'Chaque action sur le portail est auditée pour prévenir toute tentative d\'usurpation.' }
        ];

        let currentY = 150;
        securityPoints.forEach(point => {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${point.t}`, 25, currentY);
            currentY += 7;
            doc.setFont('helvetica', 'normal');
            const splitD = doc.splitTextToSize(point.d, 160);
            doc.text(splitD, 30, currentY);
            currentY += (splitD.length * 7) + 2;
        });

        // PAGE 2
        doc.addPage();

        // Header Page 2
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 15, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.setFontSize(16);
        doc.text('VOS OUTILS ET VOS ACCÈS', 105, 30, { align: 'center' });

        doc.setFontSize(12);
        doc.text('Fonctionnalités à votre disposition :', 20, 45);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#000000');
        const features = [
            "Gestion de l'Assiduité par QR Code : Prise de présence instantanée en scannant les badges étudiants.",
            "Statistiques et Analytiques : Visualisation dynamique des performances de vos promotions.",
            "Emploi du Temps Connecté : Calendrier en temps réel avec notifications de changements.",
            "Saisie de Notes Sécurisée : Calcul automatique des moyennes et transmission sécurisée.",
            "Interaction Directe : Publication de supports de cours et d'annonces sur les mobiles étudiants."
        ];

        currentY = 55;
        features.forEach(f => {
            const splitF = doc.splitTextToSize(`- ${f}`, 170);
            doc.text(splitF, 20, currentY);
            currentY += (splitF.length * 7) + 3;
        });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Votre Protocole de Sécurité Personnel :', 20, currentY + 10);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#000000');
        currentY += 20;
        doc.text("• Identifiants strictement personnels.", 25, currentY);
        doc.text("• Déconnexion obligatoire sur les terminaux partagés.", 25, currentY + 7);
        doc.text("• Changement de mot de passe requis dès la première connexion.", 25, currentY + 14);

        // Credentials Box
        currentY += 35;
        doc.setDrawColor(primaryColor);
        doc.setLineWidth(1);
        doc.rect(20, currentY, 170, 40);
        doc.setFillColor('#f8fafc');
        doc.rect(21, currentY + 1, 168, 38, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('VOS IDENTIFIANTS D\'ACCÈS', 105, currentY + 10, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor('#000000');
        doc.text(`Identifiant (ID Prof) : ${id}`, 105, currentY + 22, { align: 'center' });
        doc.text(`Mot de passe provisoire : ${password}`, 105, currentY + 32, { align: 'center' });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(secondaryColor);
        doc.text('Ce document est confidentiel. Fait à Lubumbashi, le ' + new Date().toLocaleDateString(), 105, 280, { align: 'center' });

        doc.save(`Lettre_Invitation_${name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section with Plus button */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Générer une lettre d'invitation</h2>
                    <p className="text-slate-500 text-sm font-medium font-mono">Système d'édition de documents officiels</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-110"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {/* List of generated letters (Empty state) */}
            <div className="bg-[#111827]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <FileText className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucune lettre générée</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                    Cliquez sur le bouton plus pour commencer à générer des lettres d'invitation officielles pour le corps enseignant et administratif.
                </p>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    <div className="relative bg-[#111827] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white tracking-tight">Nouvelle Lettre</h3>
                            <button onClick={() => { setIsModalOpen(false); setTargetType(null); }} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            {!targetType ? (
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm mb-6">Sélectionnez le type de destinataire pour la lettre :</p>
                                    <button
                                        onClick={() => setTargetType('Etudiant')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                                    >
                                        <Users className="w-6 h-6 text-slate-500 group-hover:text-blue-500" />
                                        <span className="text-slate-200 font-bold uppercase tracking-widest text-xs">Étudiant</span>
                                    </button>
                                    <button
                                        onClick={() => setTargetType('Corps Académique et Scientifique')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                                    >
                                        <Briefcase className="w-6 h-6 text-slate-500 group-hover:text-blue-500" />
                                        <span className="text-slate-200 font-bold uppercase tracking-widest text-xs text-left">Corps Académique et Scientifique</span>
                                    </button>
                                    <button
                                        onClick={() => setTargetType('Service Académique')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                                    >
                                        <UserCheck className="w-6 h-6 text-slate-500 group-hover:text-blue-500" />
                                        <span className="text-slate-200 font-bold uppercase tracking-widest text-xs">Service Académique</span>
                                    </button>
                                    <button
                                        onClick={() => setTargetType('Service Technique')}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                                    >
                                        <Settings className="w-6 h-6 text-slate-500 group-hover:text-blue-500" />
                                        <span className="text-slate-200 font-bold uppercase tracking-widest text-xs">Service Technique</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button onClick={() => setTargetType(null)} className="text-blue-500 text-xs font-bold uppercase tracking-widest">← Retour</button>
                                        <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">/ {targetType}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nom complet</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="Ex: Prof. Kabange Jean"
                                                    className="w-full bg-[#0B0F19] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Genre</label>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setFormData({ ...formData, gender: 'M' })}
                                                    className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${formData.gender === 'M' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                                >
                                                    Homme
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, gender: 'F' })}
                                                    className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${formData.gender === 'F' ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/20' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                                >
                                                    Femme
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">ID Utilisateur</label>
                                                <div className="relative">
                                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        value={formData.id}
                                                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                                        placeholder="Ex: UNILU-1029"
                                                        className="w-full bg-[#0B0F19] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mot de passe</label>
                                                <div className="relative">
                                                    <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="Mot de passe"
                                                        className="w-full bg-[#0B0F19] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={generatePDF}
                                        disabled={!formData.name || !formData.id}
                                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        <Download className="w-4 h-4" />
                                        Générer le document PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
