import { API_URL } from '../../../../services/config';
import { useState, useCallback, useEffect } from 'react';
import {
    X, UserPlus, ShieldPlus, Key, RefreshCcw,
    GraduationCap, School, Settings,
    ShieldCheck, FileDown, CheckCircle2,
    ShieldAlert, Hash,
    User, Globe, FileText, ChevronDown, Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import uniluLogo from '../../../../assets/unilu-official-logo.png';

const STUDENT_CLASSES = [
    "Prescience",
    "Licence 1 (B1)",
    "Licence 2 (B2)",
    "Licence 3 (B3)",
    "Master 1 (Exploration)",
    "Master 1 (Géotechnique)",
    "Master 1 (Hydro)",
    "Master 2 (Exploration)",
    "Master 2 (Géotechnique)",
    "Master 2 (Hydro)"
];

export function UserModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
    const [role, setRole] = useState('student');
    const [password, setPassword] = useState('');
    const [userId, setUserId] = useState('');

    // Detailed name states
    const [lastName, setLastName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [studentClass, setStudentClass] = useState('Prescience');
    const [isCreated, setIsCreated] = useState(false);

    const fetchSuggestions = useCallback(async () => {
        if (!lastName && !firstName) return;
        try {
            const token = localStorage.getItem('token');
            const fullNameForPass = `${lastName} ${firstName}`;
            const res = await fetch(`${API_URL}/admin/credentials/suggest?role=${role}&name=${encodeURIComponent(fullNameForPass)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserId(data.id);
                setPassword(data.password);
            }
        } catch (error) {
            console.error("Erreur suggestions:", error);
        }
    }, [role, lastName, firstName]);

    // Régénérer uniquement quand le rôle change ou qu'on clique manuellement
    useEffect(() => {
        if (isOpen && !isCreated && (lastName || firstName)) {
            fetchSuggestions();
        }
    }, [role, isOpen, isCreated]);

    const handleRefreshCredentials = () => {
        fetchSuggestions();
    };

    // Initial generation on name blur
    const handleNameBlur = () => {
        if (!userId || !password) {
            fetchSuggestions();
        }
    };

    const downloadPDF = async () => {
        const doc = new jsPDF();
        const primaryBlue = [15, 23, 42]; // Slate 900
        const accentBlue = [37, 99, 235]; // Blue 600
        const dangerRed = [220, 38, 38]; // Red 600

        // Helper for proper capitalization
        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        const displayFullName = `${lastName.toUpperCase()} ${middleName.toUpperCase()} ${firstName.split(' ').map(capitalize).join(' ')}`;
        const honorific = gender === 'M' ? 'M.' : 'Mme';

        // Function to convert image to base64 for jsPDF
        const getBase64 = (url: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => reject('Failed to load image');
                img.src = url;
            });
        };

        let logoBase64 = "";
        try {
            logoBase64 = await getBase64(uniluLogo);
        } catch (e) {
            console.error("Logo failed to load for PDF", e);
        }

        const drawHeader = (pageNumber: number) => {
            if (pageNumber === 1) {
                // Highly solemn Page 1 Header
                doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
                doc.rect(0, 0, 210, 55, 'F');

                // Real Official Logo from project
                if (logoBase64) {
                    doc.addImage(logoBase64, 'PNG', 12, 10, 35, 35);
                }

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', 125, 15, { align: 'center' });

                doc.setFontSize(22);
                doc.text('UNIVERSITÉ DE LUBUMBASHI', 125, 28, { align: 'center' });
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('CENTRE D\'EXCELLENCE - FACULTÉ DES SCIENCES ET TECHNOLOGIES', 125, 37, { align: 'center' });
                doc.setFontSize(8);
                doc.text('DIRECTION DE L\'INFORMATIQUE ET DES SYSTÈMES D\'INFORMATION', 125, 43, { align: 'center' });

                doc.setDrawColor(255, 255, 255);
                doc.setLineWidth(0.3);
                doc.line(75, 48, 175, 48);
            } else {
                // Simple Page 2 Header
                doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
                doc.rect(0, 0, 210, 18, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('UNILU - PROTOCOLE DE SÉCURITÉ ACCÈS RÉSEAU - CONFIDENTIEL', 105, 11, { align: 'center' });
            }
        };

        const drawFooter = (pageNumber: number) => {
            if (pageNumber === 1) {
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text('© UNILU Security Services - Document à usage unique et strictement personnel.', 105, 285, { align: 'center' });
            }
        };

        // PAGE 1: FORMAL WELCOME
        drawHeader(1);

        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Réf: UNILU/DSI/ACC/${new Date().getFullYear()}/${userId}`, 20, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lubumbashi, le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())}`, 190, 75, { align: 'right' });

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Objet : Notification d'activation de compte et paramètres d'accès`, 20, 95);
        doc.text(`A l'attention de ${honorific} ${displayFullName}`, 20, 105);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        let welcomeText = "";
        if (role === 'student') {
            welcomeText = `Nous avons le plaisir de vous confirmer votre enregistrement au sein du réseau académique de l’Université de Lubumbashi pour le compte de l'année académique courante en classe de ${studentClass}.\n\nL'UNILU, fidèle à sa mission d'excellence, met à votre disposition des outils numériques de pointe pour faciliter votre parcours d'apprentissage. Sachez que le corps professoral et technique est mobilisé pour assurer votre encadrement jusqu'à l'obtention de votre titre académique. Ce parcours vise à faire de vous un cadre compétent, un « produit fini » apte à répondre avec rigueur aux exigences du monde professionnel.\n\nEn utilisant les services numériques de l'institution, vous vous engagez à respecter strictement la charte de confidentialité et d'éthique informatique. L'usage de vos identifiants est placé sous votre entière responsabilité. Les paramètres d'accès fournis en page 2 constituent votre identité numérique unique au sein de notre base de données centralisée.\n\nNous vous recommandons une lecture attentive des consignes de sécurité jointes.`;
        } else if (role === 'prof') {
            welcomeText = "Nous tenons à vous exprimer notre satisfaction de vous compter parmi les membres éminents du corps enseignant de la Faculté des Sciences et Technologies. L'Université de Lubumbashi s'efforce de moderniser continuellement ses infrastructures pour soutenir votre mission de transmission du savoir et de recherche scientifique.\n\nCe document marque l'initialisation de vos privilèges numériques. Ces outils sont conçus pour optimiser la gestion de vos cours, l'évaluation des étudiants et la collaboration académique. Vous êtes prié de veiller à la stricte confidentialité de vos paramètres, car toute action initiée depuis votre compte est réputée être de votre fait.\n\nLe service technique reste à votre disposition pour tout accompagnement nécessaire dans l'appropriation de ces nouveaux outils de travail.";
        } else {
            welcomeText = "Votre affectation à l'administration de nos infrastructures critiques vous confère un accès privilégié à des ressources sensibles. La Direction de l'Informatique attend de vous une rigueur absolue dans la manipulation de ces droits.\n\nVous êtes lié par le secret professionnel le plus srict. La sécurité de l'écosystème numérique de l'UNILU repose sur la vigilance de ses administrateurs. Toute compromission, même involontaire, de vos clés d'accès doit être signalée instantanément à votre hiérarchie.\n\nIl vous est demandé d'initialiser votre environnement de travail dès réception de ces paramètres et de procéder à la destruction sécurisée de ce document physique une fois les codes mémorisés.";
        }

        const splitWelcome = doc.splitTextToSize(welcomeText, 175);
        doc.text(splitWelcome, 20, 120, { lineHeightFactor: 1.5 });

        // Formal Signature Blocks on Page 1
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Le Directeur du Service Informatique', 190, 220, { align: 'right' });
        doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setLineWidth(0.5);
        doc.rect(140, 225, 50, 35);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Cachet et Visa DSI', 165, 245, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Ampliation :', 20, 245);
        doc.text('- Secrétariat Académique', 20, 251);
        doc.text('- Intéressé(e)', 20, 257);
        doc.text('- Archives Techniques', 20, 263);

        drawFooter(1);

        // PAGE 2: PURE CREDENTIALS
        doc.addPage();
        drawHeader(2);

        doc.setTextColor(dangerRed[0], dangerRed[1], dangerRed[2]);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('STRICTEMENT CONFIDENTIEL', 105, 55, { align: 'center' });

        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(dangerRed[0], dangerRed[1], dangerRed[2]);
        doc.setLineWidth(1.2);
        doc.rect(15, 65, 180, 50, 'FD');

        doc.setTextColor(dangerRed[0], dangerRed[1], dangerRed[2]);
        doc.setFontSize(13);
        const redAlert = "ATTENTION : TOUTE DIVULGATION DE CES CODES EST UN ACTE DE COMPROMISSION DE SÉCURITÉ. NE COMMUNIQUEZ JAMAIS CES INFORMATIONS PAR TÉLÉPHONE, E-MAIL OU MESSAGE À QUI QUE CE SOIT.";
        const splitRed = doc.splitTextToSize(redAlert, 160);
        doc.text(splitRed, 105, 85, { align: 'center', lineHeightFactor: 1.4 });

        // Identities Box
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(16);
        doc.text('FICHE DE PARAMÈTRES RÉSEAU', 20, 145);
        doc.line(20, 150, 190, 150);

        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(226, 232, 240);
        doc.rect(20, 160, 170, 75, 'FD');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TITULAIRE DU COMPTE :', 30, 180);
        doc.setFont('helvetica', 'normal');
        doc.text(`${honorific} ${displayFullName}`, 90, 180);

        if (role === 'student') {
            doc.setFont('helvetica', 'bold');
            doc.text('CLASSE / PROMOTION :', 30, 190);
            doc.setFont('helvetica', 'normal');
            doc.text(studentClass, 90, 190);
        }

        doc.setFont('helvetica', 'bold');
        doc.text('IDENTIFIANT SYSTÈME :', 30, 205);
        doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
        doc.setFontSize(14);
        doc.text(userId, 95, 205);

        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CODE D\'ACCÈS : ', 30, 222);
        doc.setTextColor(dangerRed[0], dangerRed[1], dangerRed[2]);
        doc.setFontSize(18);
        doc.setFont('courier', 'bold');
        doc.text(password, 95, 222);

        // Official Stamps Page 2
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');

        doc.text('VISA TECHNIQUE DSI', 50, 255, { align: 'center' });
        doc.rect(25, 260, 50, 25);

        doc.text('DIRECTION ACADÉMIQUE', 160, 255, { align: 'center' });
        doc.rect(135, 260, 50, 25);

        const fileName = `${lastName}_credentials`.toLowerCase().replace(/\s/g, '_');
        doc.save(`${fileName}.pdf`);
    };

    const handleCreate = async () => {
        if (!lastName || !firstName || !userId) {
            alert("Le Nom, le Prénom et l'Identifiant sont obligatoires.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const fullName = `${lastName.toUpperCase()} ${middleName.toUpperCase()} ${firstName}`.replace(/\s+/g, ' ').trim();

            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: userId,
                    name: fullName,
                    email: `${userId.toLowerCase()}@unilu.ac.cd`, // On pourrait aussi prendre l'input si besoin
                    password: password,
                    role: role,
                    studentClass: role === 'student' ? studentClass : undefined
                })
            });

            if (res.ok) {
                setIsCreated(true);
                if (onSuccess) onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || "Une erreur est survenue lors de la création.");
            }
        } catch (error) {
            console.error("Erreur création utilisateur:", error);
            alert("Erreur de connexion au serveur.");
        }
    };

    const resetAndClose = () => {
        setIsCreated(false);
        setLastName('');
        setMiddleName('');
        setFirstName('');
        setGender('M');
        setStudentClass('Prescience');
        setUserId('');
        setRole('student');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B0F19]/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
            <div className={`bg-[#111827] w-full ${isCreated ? 'max-w-4xl' : 'max-w-xl'} rounded-[32px] border border-blue-500/30 shadow-[0_0_100px_rgba(37,99,235,0.2)] overflow-hidden animate-in scale-in duration-500 flex flex-col max-h-[95vh] transition-all`}>

                {!isCreated ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/5 to-transparent">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                                    <UserPlus className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Création de Profil</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Globe className="w-3 h-3 text-blue-500" /> UNILU Central Directory
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                            {/* Detailed Name Fields */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-1 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Identification de l'Individu
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-600 ml-1">Nom (Obligatoire)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: MWAMBA"
                                            className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-slate-800"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            onBlur={handleNameBlur}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-600 ml-1">Post-Nom</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: KABANZE"
                                            className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-slate-800"
                                            value={middleName}
                                            onChange={(e) => setMiddleName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-600 ml-1">Prénom (Obligatoire)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Dave"
                                            className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-slate-800"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            onBlur={handleNameBlur}
                                        />
                                    </div>

                                    {/* Gender Field */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-600 ml-1">Sexe</label>
                                        <div className="flex p-1 bg-[#0B0F19] border border-slate-800 rounded-xl h-[46px]">
                                            <button
                                                onClick={() => setGender('M')}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black transition-all ${gender === 'M' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                                            >
                                                MASCULIN
                                            </button>
                                            <button
                                                onClick={() => setGender('F')}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black transition-all ${gender === 'F' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                                            >
                                                FÉMININ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Class Selection Field - Only for Students */}
                                    {role === 'student' && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[9px] font-bold uppercase text-slate-600 ml-1">Classe / Promotion</label>
                                            <div className="relative group">
                                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                                                <select
                                                    value={studentClass}
                                                    onChange={(e) => setStudentClass(e.target.value)}
                                                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-12 pr-10 py-3.5 text-sm text-slate-300 outline-none appearance-none cursor-pointer focus:border-blue-500/50 font-bold"
                                                >
                                                    {STUDENT_CLASSES.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    )}

                                    {/* ID Generator Field */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-600 ml-1 flex justify-between items-center">
                                            <span>Identifiant Système ID</span>
                                            <span className="text-emerald-500/50 text-[8px] tracking-widest font-black">
                                                {role === 'prof' ? 'PROF SERIES' :
                                                    role === 'admin' ? 'TECH SERIES' :
                                                        role === 'academic' ? 'ACAD SERIES' : 'A001 SERIES'}
                                            </span>
                                        </label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                                                <input
                                                    type="text"
                                                    placeholder={`Génération... (Ex: ${role === 'prof' ? 'PROF-123' :
                                                        role === 'admin' ? 'TECH-12' :
                                                            role === 'academic' ? 'ACAD-12' : 'A001-12345'})`}
                                                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-lg text-blue-400 outline-none focus:border-blue-500/50 transition-all font-black"
                                                    value={userId}
                                                    onChange={(e) => setUserId(e.target.value.toUpperCase())}
                                                />
                                            </div>
                                            <button
                                                onClick={handleRefreshCredentials}
                                                className="w-14 h-14 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95 group"
                                                title="Régénérer l'ID"
                                            >
                                                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-1">Affectation & Privilèges</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <RoleButton active={role === 'student'} onClick={() => setRole('student')} icon={<GraduationCap className="w-4 h-4" />} label="Étudiant" />
                                    <RoleButton active={role === 'prof'} onClick={() => setRole('prof')} icon={<School className="w-4 h-4" />} label="Professeur" />
                                    <RoleButton active={role === 'academic'} onClick={() => setRole('academic')} icon={<ShieldPlus className="w-4 h-4" />} label="Admin Académique" />
                                    <RoleButton active={role === 'admin'} onClick={() => setRole('admin')} icon={<Settings className="w-4 h-4" />} label="Admin Système" />
                                </div>
                            </div>

                            {/* Password Box */}
                            <div className="bg-[#0B0F19] p-6 rounded-3xl border border-white/5 space-y-4 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Key className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Génération Clé de Sécurité</span>
                                    </div>
                                    <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">Facile à Retenir</span>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={password}
                                        readOnly
                                        className="flex-1 bg-[#111827] border border-slate-800 rounded-2xl px-5 py-4 text-2xl text-white font-mono text-center outline-none shadow-xl tracking-[0.2em] font-black"
                                    />
                                    <button
                                        onClick={handleRefreshCredentials}
                                        className="px-6 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white transition-all shadow-lg shadow-blue-600/20 active:scale-95 group"
                                    >
                                        <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-[#0B0F19]/50 border-t border-white/5 flex gap-4">
                            <button onClick={onClose} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-2xl font-black text-xs transition-all uppercase tracking-[0.2em] border border-slate-800">
                                Annuler
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-[1.5] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs transition-all uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <ShieldCheck className="w-5 h-5" /> Générer l'Accès
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full animate-in zoom-in duration-700">
                        {/* Final Preview Header */}
                        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-emerald-600/10 to-transparent flex justify-between items-center shrink-0">
                            <div className="flex gap-5 items-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/30 text-emerald-500">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Profil Officiellement Actif</h2>
                                    <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                        <ShieldAlert className="w-3 h-3" /> Certifié par UNILU Systems
                                    </p>
                                </div>
                            </div>
                            <button onClick={resetAndClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* HIGH-END PDF PREVIEW VIEWER */}
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-y-auto custom-scrollbar">

                            {/* Left Side: Instructions & Professional Preview */}
                            <div className="space-y-6">
                                <div className="bg-blue-600/5 rounded-[32px] p-8 border border-blue-500/10 space-y-6">
                                    <div className="flex items-center gap-3 text-blue-400">
                                        <FileText className="w-5 h-5" />
                                        <h4 className="text-xs font-black uppercase tracking-widest">Document de 2 Pages Prêt</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                                        "L'UNILU s'engage à vos côtés. Le document à droite contient votre lettre d'accueil (Page 1) et vos accès sécurisés (Page 2)."
                                    </p>

                                    <div className="bg-[#0B0F19] p-6 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                                            <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Sécurité Critique</h5>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-bold border-l-2 border-red-500/30 pl-4">
                                            Les informations de la page 2 sont strictement confidentielles. Ne les partagez jamais.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-4">
                                        <button
                                            onClick={downloadPDF}
                                            className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-sm transition-all uppercase tracking-[0.1em] shadow-xl hover:bg-blue-50 flex items-center justify-center gap-4 group active:scale-[0.98]"
                                        >
                                            <FileDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                                            Télécharger le PDF (.pdf)
                                        </button>
                                        <button
                                            onClick={resetAndClose}
                                            className="w-full py-4 bg-[#1E293B] hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all uppercase tracking-[0.3em] border border-slate-700 hover:border-blue-500/50 shadow-lg active:scale-95"
                                        >
                                            TERMINER
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Virtual Document Mockup */}
                            <div className="hidden lg:block relative origin-top scale-[0.85]">
                                <div className="bg-white w-full rounded-tr-[100px] rounded-bl-[100px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden text-slate-900 border-l-[15px] border-slate-900">
                                    {/* Virtual Content Page Preview - Very Solemn */}
                                    <div className="p-10 space-y-6">
                                        <div className="text-center border-b-2 border-slate-900 pb-4 relative">
                                            <div className="absolute left-0 top-0 w-8 h-8 opacity-40">
                                                <img src={uniluLogo} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            <p className="text-[6px] font-black uppercase tracking-[0.4em] mb-1">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
                                            <h3 className="text-sm font-black text-slate-900 uppercase">UNIVERSITÉ DE LUBUMBASHI</h3>
                                            <p className="text-[5px] font-bold text-slate-500 uppercase tracking-widest">FACULTÉ DES SCIENCES ET TECHNOLOGIES - DSI</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Notification de Compte</p>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-900 underline underline-offset-4">Objet : Activation de vos paramètres d'accès</p>

                                            <p className="text-[10px] font-black text-slate-900">Cher(e) {gender === 'M' ? 'M.' : 'Mme'} {lastName} {firstName},</p>

                                            <p className="text-[7px] text-slate-700 leading-relaxed text-left">
                                                "Nous avons le plaisir de vous confirmer votre enregistrement au sein du réseau académique de l'Université de Lubumbashi pour le compte de l'année académique courante en classe de {studentClass}... produit fini apte à répondre avec rigueur..."
                                            </p>
                                        </div>

                                        <div className="pt-8 flex justify-end">
                                            <div className="w-32 h-16 border-2 border-slate-100 rounded flex items-center justify-center">
                                                <p className="text-[5px] font-black text-slate-300 uppercase rotate-[-15deg]">VISA DE DIRECTION</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 py-3 text-center">
                                        <p className="text-[8px] font-black text-white uppercase tracking-[0.2em]">DOCUMENT OFFICIEL ET STRICTEMENT CONFIDENTIEL</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RoleButton({ active, icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${active
                ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]'
                : 'bg-[#0B0F19] border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                }`}
        >
            <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800'}`}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
        </button>
    );
}






