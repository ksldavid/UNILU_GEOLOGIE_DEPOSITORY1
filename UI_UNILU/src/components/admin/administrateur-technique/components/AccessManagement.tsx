import { useState } from 'react';
import {
    Search, UserPlus, FileDown,
    Key, ShieldAlert, Trash2, Filter, ChevronLeft,
    ChevronRight, RefreshCw, ShieldCheck, User,
    GraduationCap, School, Settings, Eye, EyeOff, Ban, Shield,
    UserCircle, Mail, Globe,
    Activity, History as HistoryIcon, Zap, CheckCircle2, X, Lock
} from 'lucide-react';

const users = [
    {
        id: 'USR-9821-AC',
        name: 'Sophie Dubois',
        role: 'Service Académique',
        status: 'Actif',
        lastLogin: 'Il y a 2h 15m',
        avatar: 'SD',
        color: 'purple',
        class: 'Admin',
        email: 's.dubois@unilu.ac.cd',
        password: 'UNILU-PASS-22'
    },
    {
        id: 'ADM-0042-RT',
        name: 'Marc Renard',
        role: 'Admin Technique',
        status: 'Actif',
        lastLogin: 'En ligne',
        avatar: 'MR',
        color: 'blue',
        class: 'System',
        email: 'm.renard@unilu.ac.cd',
        password: 'ADMIN-RT-2024'
    },
    {
        id: 'STD-2023-882',
        name: 'Julie Lefebvre',
        role: 'Étudiant',
        status: 'Inactif',
        lastLogin: 'Il y a 5 jours',
        avatar: 'JL',
        color: 'slate',
        class: 'L1 Géologie',
        email: 'j.lefebvre@unilu.ac.cd',
        password: 'STUDENT-JL-99'
    },
    {
        id: 'STD-2024-112',
        name: 'David Kasongo',
        role: 'Étudiant',
        status: 'Actif',
        lastLogin: 'En ligne',
        avatar: 'DK',
        color: 'slate',
        class: 'L2 Mines',
        email: 'd.kasongo@unilu.ac.cd',
        password: 'KASONGO-D-2024'
    },
    {
        id: 'PRF-7721-SC',
        name: 'Pierre Bertrand',
        role: 'Professeur',
        status: 'Actif',
        lastLogin: 'Il y a 12h',
        avatar: 'PB',
        color: 'emerald',
        class: 'Corps Académique',
        email: 'p.bertrand@unilu.ac.cd',
        password: 'PROF-B-7721'
    }
];

export function AccessManagement({ onOpenNewUser }: { onOpenNewUser: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('Tous les Rôles');
    const [selectedStatus, setSelectedStatus] = useState('Tous les Statuts');
    const [selectedClass, setSelectedClass] = useState('Toutes les Classes');
    const [inspectedUser, setInspectedUser] = useState<any>(null);
    const [editingPasswordUser, setEditingPasswordUser] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'Tous les Rôles' || u.role === selectedRole;
        const matchesStatus = selectedStatus === 'Tous les Statuts' || u.status === selectedStatus;
        const matchesClass = selectedClass === 'Toutes les Classes' || u.class === selectedClass;

        return matchesSearch && matchesRole && matchesStatus && matchesClass;
    });

    const handleExportLogs = () => {
        setIsExporting(true);
        const logs = [
            "Timestamp,UserID,Name,Action,Status",
            `2024-10-21 14:15,${users[1].id},Marc Renard,System Login,Success`,
            `2024-10-21 15:30,${users[0].id},Sophie Dubois,Modified Permissions for STD-2024,Success`,
            `2024-10-21 16:05,${users[3].id},David Kasongo,Downloaded Transcript,Success`,
            `2024-10-21 16:45,${users[4].id},Pierre Bertrand,Uploaded Grade Sheet,Success`,
            "2024-10-21 17:12,TECH-ADMIN,David,Exported Access Management Logs,Success"
        ].join('\n');

        setTimeout(() => {
            const blob = new Blob([logs], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `unilu-access-logs-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsExporting(false);
        }, 1200);
    };

    const handleAction = (action: string, user: any) => {
        if (action === 'Édition des droits' || action === 'Réinitialiser Mot de passe') {
            setEditingPasswordUser(user);
            setInspectedUser(null);
        } else {
            alert(`${action} pour ${user.name} (${user.id})`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-500" /> Gestion des Accès (Users)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic underline decoration-blue-500/30">Interface d'administration des identifiants et privilèges systèmes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportLogs}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all border border-slate-700 disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <FileDown className="w-4 h-4 text-blue-400" />}
                        {isExporting ? 'Génération...' : 'Exporter logs'}
                    </button>
                    <button
                        onClick={onOpenNewUser}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-600/20"
                    >
                        <UserPlus className="w-4 h-4" /> Nouvel Utilisateur
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou identifiant..."
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                        className="bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-8 py-2.5 text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        <option>Tous les Rôles</option>
                        <option>Admin Technique</option>
                        <option>Professeur</option>
                        <option>Étudiant</option>
                        <option>Service Académique</option>
                    </select>
                </div>
                <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                        className="bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-8 py-2.5 text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option>Toutes les Classes</option>
                        <option>L1 Géologie</option>
                        <option>L2 Mines</option>
                        <option>L3 Exploration</option>
                        <option>M1 Géo-ressources</option>
                        <option>M2 Environnement</option>
                    </select>
                </div>
                <div className="relative">
                    <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                        className="bg-[#0B0F19] border border-slate-800 rounded-xl pl-11 pr-8 py-2.5 text-xs font-bold text-slate-300 outline-none appearance-none cursor-pointer focus:border-blue-500/50"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option>Tous les Statuts</option>
                        <option>Actif</option>
                        <option>Inactif</option>
                    </select>
                </div>
                <button className="p-2.5 bg-[#0B0F19] text-slate-500 hover:text-white border border-slate-800 rounded-xl transition-all">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Table wrapper with horizontal scroll */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto custom-scrollbar-horizontal text-slate-300">
                    <table className="w-full border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-800/50 bg-slate-800/20">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[280px]">Utilisateur & Identifiant</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[180px]">Rôle Système</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[120px]">État</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[180px]">Dernière Activité</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Contrôle Accès</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/10 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs bg-${u.color}-500/10 text-${u.color}-500 border border-${u.color}-500/20 shadow-inner`}>
                                                {u.avatar}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{u.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <UserCircle className="w-3 h-3 text-slate-600" />
                                                    <span className="text-[10px] font-mono text-slate-500 font-bold tracking-tighter uppercase">{u.id}</span>
                                                    <span className="text-[8px] bg-blue-500/10 text-blue-500/70 px-1.5 py-0.5 rounded ml-2 font-black uppercase">{u.class}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <RoleBadge role={u.role} color={u.color} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Actif' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${u.status === 'Actif' ? 'text-emerald-500' : 'text-red-500'}`}>{u.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter opacity-70 italic">{u.lastLogin}</span>
                                    </td>
                                    <td className="px-6 py-5 min-w-[240px]">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setInspectedUser(u)}
                                                title="Inspecter l'utilisateur" className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAction('Édition des droits', u)}
                                                title="Modifier le mot de passe / Droits" className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAction(u.status === 'Actif' ? 'Révoquer l\'accès' : 'Rétablir l\'accès', u)}
                                                title={u.status === 'Actif' ? 'Révoquer l\'accès' : 'Rétablir l\'accès'}
                                                className={`p-2 rounded-xl border transition-all shadow-sm ${u.status === 'Actif'
                                                    ? 'bg-orange-600/10 text-orange-400 border-orange-500/20 hover:bg-orange-600 hover:text-white'
                                                    : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                                                    }`}
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAction('Reset Security Token', u)}
                                                title="Reset Security Token" className="p-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAction('Suppression', u)}
                                                title="Suppression irréversible" className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-[#0B0F19]/50 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Registre : <span className="text-white">1 - {filteredUsers.length}</span> / TOTAL : <span className="text-blue-500">{users.length}</span></p>
                    <div className="flex items-center gap-2">
                        <PaginationButton icon={<ChevronLeft className="w-4 h-4" />} disabled />
                        <PaginationButton label="01" active />
                        <PaginationButton label="02" />
                        <PaginationButton label="03" />
                        <PaginationButton label="..." disabled />
                        <PaginationButton icon={<ChevronRight className="w-4 h-4" />} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            {inspectedUser && (
                <UserInspectionModal
                    user={inspectedUser}
                    onClose={() => setInspectedUser(null)}
                    onAction={handleAction}
                    onModifyPassword={() => {
                        setEditingPasswordUser(inspectedUser);
                        setInspectedUser(null);
                    }}
                />
            )}

            {editingPasswordUser && (
                <PasswordEditModal
                    user={editingPasswordUser}
                    onClose={() => setEditingPasswordUser(null)}
                />
            )}
        </div>
    );
}

function PasswordEditModal({ user, onClose }: { user: any, onClose: () => void }) {
    const [newPassword, setNewPassword] = useState(user.password);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            alert(`Mot de passe mis à jour pour ${user.name}`);
            setIsSaving(false);
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
            <div className="bg-[#111827] w-full max-w-md rounded-[32px] border border-blue-500/30 shadow-[0_0_100px_rgba(37,99,235,0.2)] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                            <Key className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Éditer l'Accès</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{user.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nouveau Mot de Passe</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                            <input
                                type="text"
                                className="w-full bg-[#0B0F19] border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-xl text-white font-mono outline-none focus:border-blue-500/50 transition-all font-black tracking-widest"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-slate-600 italic leading-relaxed">
                            "Le changement sera effectif dès la prochaine connexion de l'utilisateur."
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-900 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-800">
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserInspectionModal({ user, onClose, onAction, onModifyPassword }: { user: any, onClose: () => void, onAction: (a: string, u: any) => void, onModifyPassword: () => void }) {
    const [showPass, setShowPass] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-[#111827] w-full max-w-2xl rounded-[32px] border border-white/5 shadow-[0_0_100px_rgba(37,99,235,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/5 to-transparent">
                    <div className="flex gap-4 items-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg bg-${user.color}-500/10 text-${user.color}-500 border border-${user.color}-500/20`}>
                            {user.avatar}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{user.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-blue-400 font-black uppercase tracking-widest">{user.id}</span>
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${user.status === 'Actif' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon={<Mail className="w-4 h-4" />} label="Email Académique" value={user.email} />
                        <InfoItem icon={<Globe className="w-4 h-4" />} label="Promotion / Service" value={user.class} />
                    </div>

                    {/* Password Section */}
                    <div className="bg-[#0B0F19] p-6 rounded-[24px] border border-blue-500/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                <Key className="w-4 h-4" /> Paramètres d'Accès Sécurisés
                            </h4>
                            <button
                                onClick={onModifyPassword}
                                className="text-[9px] font-black uppercase bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                            >
                                Modifier
                            </button>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <Lock className="w-4 h-4 text-slate-600" />
                            <div className="flex-1">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Mot de Passe Actuel</p>
                                <p className="text-base font-mono font-black text-white tracking-[0.2em]">
                                    {showPass ? user.password : '••••••••••••'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPass(!showPass)}
                                className="p-2 bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Stats / Activity Overview */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" /> Aperçu de l'Activité Systèmes
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <QuickStats label="Connexions/Mois" value="28" icon={<HistoryIcon className="w-3 h-3" />} />
                            <QuickStats label="Actions/Semaine" value="156" icon={<Zap className="w-3 h-3" />} />
                            <QuickStats label="Score Sécurité" value="98%" icon={<ShieldCheck className="w-3 h-3" />} color="emerald" />
                        </div>
                    </div>

                    {/* Recent Logs for this User */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4 text-purple-500" /> Journal d'Événements Récents
                        </h4>
                        <div className="bg-[#0B0F19] rounded-2xl border border-white/5 divide-y divide-white/5">
                            <LogLine time="14:22" action="Authentification Réussie" details="IP: 197.12.3.4 (Lubumbashi)" status="success" />
                            <LogLine time="15:05" action="Modification Profil" details="Mise à jour de l'adresse email" status="info" />
                            <LogLine time="Hier" action="Échec Connexion" details="Mot de passe incorrect" status="warning" />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#0B0F19]/50 border-t border-white/5 flex gap-3">
                    <button
                        onClick={() => onAction('Réinitialiser Mot de passe', user)}
                        className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Reset PW
                    </button>
                    <button
                        onClick={() => onAction(user.status === 'Actif' ? 'Bloquer' : 'Débloquer', user)}
                        className="flex-1 py-3 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        {user.status === 'Actif' ? 'Bloquer' : 'Débloquer'}
                    </button>
                    <button
                        onClick={() => onAction('Supprimer', user)}
                        className="flex-1 py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon, label, value }: any) {
    return (
        <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{value}</p>
        </div>
    );
}

function QuickStats({ label, value, icon, color = 'blue' }: any) {
    return (
        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center justify-between">
                <span className={`text-lg font-black text-${color}-400`}>{value}</span>
                <div className={`p-1 rounded bg-${color}-500/10 text-${color}-500`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function LogLine({ time, action, details, status }: any) {
    const statusColors: any = {
        success: 'text-emerald-500 bg-emerald-500/10',
        info: 'text-blue-500 bg-blue-500/10',
        warning: 'text-orange-500 bg-orange-500/10'
    };
    return (
        <div className="p-3 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-slate-600 w-10">{time}</span>
                <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{action}</p>
                    <p className="text-[9px] text-slate-500">{details}</p>
                </div>
            </div>
            <CheckCircle2 className={`w-3 h-3 ${statusColors[status].split(' ')[0]}`} />
        </div>
    );
}

function RoleBadge({ role, color }: any) {
    const icon: any = {
        'Service Académique': <School className="w-3.5 h-3.5" />,
        'Admin Technique': <Settings className="w-3.5 h-3.5" />,
        'Étudiant': <GraduationCap className="w-3.5 h-3.5" />,
        'Professeur': <User className="w-3.5 h-3.5" />
    };

    return (
        <span className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-${color}-500/5 border-${color}-500/20 text-${color}-400 shadow-sm`}>
            {icon[role]} {role}
        </span>
    );
}

function PaginationButton({ label, icon, active, disabled }: any) {
    return (
        <button
            disabled={disabled}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${active
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : disabled
                    ? 'text-slate-700 cursor-not-allowed opacity-30 px-2'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
        >
            {label || icon}
        </button>
    );
}
