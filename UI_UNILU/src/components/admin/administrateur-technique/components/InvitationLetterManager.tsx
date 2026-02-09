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
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        // Colors & Config
        const primaryColor = '#0f172a'; // Deep Navy for header

        const drawOfficialHeader = () => {
            // Dark Header Box
            doc.setFillColor(primaryColor);
            doc.rect(0, 0, 210, 50, 'F');

            // Logo placeholder
            doc.setFillColor('#FFFFFF');
            doc.rect(15, 8, 35, 35, 'F');
            doc.setTextColor('#000000');
            doc.setFontSize(8);
            doc.text('LOGO', 32, 28, { align: 'center' });

            // Text Header
            doc.setTextColor('#FFFFFF');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', 125, 15, { align: 'center' });

            doc.setFontSize(22);
            doc.text('UNIVERSITÉ DE LUBUMBASHI', 125, 25, { align: 'center' });

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('CENTRE D\'EXCELLENCE - FACULTÉ DE GÉOLOGIE', 125, 35, { align: 'center' });
            doc.setFontSize(10);
            doc.text('DIRECTION DE L\'INFORMATIQUE ET DES SYSTÈMES D\'INFORMATION', 125, 42, { align: 'center' });

            // Separation Line
            doc.setDrawColor('#FFFFFF');
            doc.setLineWidth(0.5);
            doc.line(75, 45, 175, 45);
        };

        // --- PAGE 1 ---
        drawOfficialHeader();

        // Reference and Date
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Réf: UNILU/DSI/ACC/2026/EINOEO', 20, 65);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lubumbashi, le ${today}`, 190, 65, { align: 'right' });

        // Object
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Objet : Notification d\'activation de compte et paramètres d\'accès', 20, 85);

        // Attention
        const salutation = gender === 'M' ? 'M.' : 'Mme';
        doc.text(`A l'attention de ${salutation} ${name.toUpperCase()}`, 20, 95);

        // Body Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const introTxt = "Nous avons le plaisir de vous confirmer votre enregistrement au sein du réseau académique de l'Université de Lubumbashi pour le compte de l'année académique courante.\n\nL'UNILU, fidèle à sa mission d'excellence, met à votre disposition des outils numériques de pointe pour faciliter votre parcours d'apprentissage. Sachez que le corps professoral et technique est mobilisé pour assurer votre encadrement jusqu'à l'obtention de votre titre académique. Ce parcours vise à faire de vous un cadre compétent, un « produit fini » apte à répondre avec rigueur aux exigences du monde professionnel.";
        const splitIntro = doc.splitTextToSize(introTxt, 170);
        doc.text(splitIntro, 20, 110);

        doc.text("Nous vous recommandons une lecture attentive des consignes de sécurité jointes.", 20, 160);

        // Signature Section DSI
        doc.setFont('helvetica', 'bold');
        doc.text('Le Directeur du Service Informatique', 190, 180, { align: 'right' });

        // Stamp Box DSI
        doc.setDrawColor('#0f172a');
        doc.setLineWidth(0.8);
        doc.rect(140, 185, 50, 35);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Cachet et Visa DSI', 165, 205, { align: 'center' });

        // Ampliation
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Ampliation :', 20, 230);
        doc.text('- Secrétariat Académique', 25, 237);
        doc.text('- Intéressé(e)', 25, 244);
        doc.text('- Archives Techniques', 25, 251);

        // Footer Page 1
        doc.setFontSize(8);
        doc.setTextColor('#94a3b8');
        doc.text('© UNILU Security Services - Document à usage unique et strictement personnel.', 105, 285, { align: 'center' });

        // --- PAGE 2 ---
        doc.addPage();
        drawOfficialHeader();

        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('VOS OUTILS ET VOS ACCÈS', 105, 70, { align: 'center' });

        // Features List
        doc.setFontSize(11);
        doc.text('Fonctionnalités à votre disposition :', 20, 85);
        doc.setFont('helvetica', 'normal');
        const features = [
            "Gestion de l'Assiduité par QR Code : Prise de présence instantanée.",
            "Statistiques et Analytiques : Suivi des performances en temps réel.",
            "Emploi du Temps Connecté : Calendrier dynamique et notifications.",
            "Saisie de Notes Sécurisée : Interface de notation protégée.",
            "Interaction Directe : Publication de cours sur mobiles étudiants."
        ];
        let currentY = 95;
        features.forEach(f => {
            doc.text(`• ${f}`, 25, currentY);
            currentY += 8;
        });

        // Credentials Section
        currentY += 15;
        doc.setDrawColor(primaryColor);
        doc.setLineWidth(1.5);
        doc.line(20, currentY, 190, currentY);

        currentY += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('IDENTIFIANTS PERSONNELS', 105, currentY, { align: 'center' });

        currentY += 12;
        doc.setFontSize(14);
        doc.text(`ID : ${id}`, 105, currentY, { align: 'center' });
        currentY += 10;
        doc.text(`MOT DE PASSE : ${password}`, 105, currentY, { align: 'center' });

        // Direction Académique Box
        currentY += 30;
        doc.setFontSize(12);
        doc.text('DIRECTION ACADÉMIQUE', 105, currentY, { align: 'center' });
        doc.setDrawColor('#cbd5e1'); // Light blue-grey for the academic box
        doc.setLineWidth(2);
        doc.rect(55, currentY + 5, 100, 45);

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
