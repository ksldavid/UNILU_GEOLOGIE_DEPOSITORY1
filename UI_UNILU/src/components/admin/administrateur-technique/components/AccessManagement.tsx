import { API_URL } from '../../../../services/config';
import { useState, useEffect, useCallback } from 'react';
import {
    Search, UserPlus, FileDown,
    Key, ShieldAlert, Trash2, Filter, ChevronLeft,
    ChevronRight, RefreshCw, ShieldCheck, User as UserIcon,
    GraduationCap, School, Settings, Eye, Ban,
    UserCircle, Mail, Globe,
    Activity, X, Lock
} from 'lucide-react';

export function AccessManagement({ onOpenNewUser }: { onOpenNewUser: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('Tous les Rôles');
    const [selectedStatus, setSelectedStatus] = useState('Tous les Statuts');
    const [selectedClass, setSelectedClass] = useState('Toutes les Classes');
    const [inspectedUser, setInspectedUser] = useState<any>(null);
    const [editingPasswordUser, setEditingPasswordUser] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const limit = 50;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = new URLSearchParams({
                search: searchTerm,
                role: selectedRole,
                status: selectedStatus,
                className: selectedClass,
                page: String(currentPage),
                limit: String(limit)
            });
            const res = await fetch(`${API_URL}/admin/users?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotalPages(data.pagination.totalPages);
                setTotalUsers(data.pagination.total);
            }
        } catch (error) {
            console.error("Erreur chargement utilisateurs:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedRole, selectedStatus, selectedClass, currentPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRole, selectedStatus, selectedClass]);

    const handleToggleStatus = async (user: any) => {
        const newStatus = user.status === 'Actif' ? 'Inactif' : 'Actif';
        if (!window.confirm(`Voulez-vous vraiment ${user.status === 'Actif' ? 'bloquer' : 'débloquer'} l'accès pour ${user.name} ?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/users/${user.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Erreur statut:", error);
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (!window.confirm(`ACTION IRRÉVERSIBLE : Supprimer définitivement le compte de ${user.name} ?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/users/${user.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Utilisateur supprimé.");
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || "Erreur lors de la suppression.");
            }
        } catch (error) {
            console.error("Erreur suppression:", error);
        }
    };

    const handleExportLogs = () => {
        setIsExporting(true);
        // Export only current filtered/paginated users for simplicity, or we could fetch all but it's heavier
        const logs = [
            "Timestamp,UserID,Name,Role,Status,Class",
            ...users.map(u => `${new Date().toISOString()},${u.id},${u.name},${u.role},${u.status},${u.class}`)
        ].join('\n');

        setTimeout(() => {
            const blob = new Blob([logs], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `unilu-users-export-${new Date().toISOString().split('T')[0]}.csv`);
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
        } else if (action === 'Bloquer' || action === 'Débloquer' || action.includes('accès')) {
            handleToggleStatus(user);
        } else if (action === 'Supprimer' || action === 'Suppression') {
            handleDeleteUser(user);
        } else {
            alert(`${action} pour ${user.name}`);
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
                    <p className="text-slate-500 text-sm mt-1 font-medium italic underline decoration-blue-500/30">Affichage de {limit} utilisateurs par page.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg hidden lg:block">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total: {totalUsers}</p>
                    </div>
                    <button
                        onClick={handleExportLogs}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all border border-slate-700 disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <FileDown className="w-4 h-4 text-blue-400" />}
                        {isExporting ? 'Génération...' : 'Exporter CSV'}
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
                        placeholder="Rechercher par nom ou identifiant (Matricule)..."
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
                        <option>Prescience</option>
                        <option>Licence 1 (B1)</option>
                        <option>Licence 2 (B2)</option>
                        <option>Licence 3 (B3)</option>
                        <option>Master 1 (Exploration)</option>
                        <option>Master 1 (Géotechnique)</option>
                        <option>Master 1 (Hydro)</option>
                        <option>Master 2 (Exploration)</option>
                        <option>Master 2 (Géotechnique)</option>
                        <option>Master 2 (Hydro)</option>
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
                <button
                    onClick={fetchUsers}
                    className="p-2.5 bg-[#0B0F19] text-slate-500 hover:text-white border border-slate-800 rounded-xl transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table wrapper */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
                {loading && users.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synchronisation Directory...</p>
                    </div>
                ) : (
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
                                {users.length > 0 ? users.map((u) => (
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
                                                    onClick={() => handleToggleStatus(u)}
                                                    title={u.status === 'Actif' ? 'Révoquer l\'accès' : 'Rétablir l\'accès'}
                                                    className={`p-2 rounded-xl border transition-all shadow-sm ${u.status === 'Actif'
                                                        ? 'bg-orange-600/10 text-orange-400 border-orange-500/20 hover:bg-orange-600 hover:text-white'
                                                        : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                                                        }`}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u)}
                                                    title="Suppression irréversible" className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-600 uppercase font-black text-xs tracking-[0.3em]">
                                            Aucun utilisateur trouvé
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination controls */}
                <div className="px-6 py-4 bg-[#0B0F19]/50 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">
                        Affichage : <span className="text-white">{(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalUsers)}</span> sur {totalUsers}
                    </p>
                    <div className="flex items-center gap-2">
                        <PaginationButton
                            icon={<ChevronLeft className="w-4 h-4" />}
                            disabled={currentPage === 1 || loading}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        />

                        {/* Generative page numbers logic */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Show pages around current page
                            let pageNum = currentPage;
                            if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;

                            if (pageNum <= 0 || pageNum > totalPages) return null;

                            return (
                                <PaginationButton
                                    key={pageNum}
                                    label={String(pageNum).padStart(2, '0')}
                                    active={currentPage === pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                />
                            );
                        })}

                        <PaginationButton
                            icon={<ChevronRight className="w-4 h-4" />}
                            disabled={currentPage === totalPages || totalPages === 0 || loading}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        />
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
                    onSuccess={fetchUsers}
                />
            )}
        </div>
    );
}

function PasswordEditModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!newPassword) return alert("Veuillez saisir un mot de passe.");
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/users/${user.id}/password`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: newPassword })
            });
            if (res.ok) {
                alert(`Mot de passe mis à jour pour ${user.name}`);
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Erreur reset password:", error);
        } finally {
            setIsSaving(false);
        }
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
                                className="w-full bg-[#0B0F19] border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-xl text-white font-mono outline-none focus:border-blue-500/50 transition-all font-black"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nouveau code..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-900 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-800">
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
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
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-[#111827] w-full max-w-2xl rounded-[32px] border border-white/5 shadow-[0_0_100px_rgba(37,99,235,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
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

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon={<Mail className="w-4 h-4" />} label="Email Académique" value={user.email} />
                        <InfoItem icon={<Globe className="w-4 h-4" />} label="Promotion / Service" value={user.class} />
                    </div>

                    <div className="bg-slate-900/40 p-6 rounded-[24px] border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Détails de l'Accès
                        </h4>
                        <p className="text-xs text-slate-400">Le matricule <span className="text-white font-mono font-bold">{user.id}</span> est actuellement {user.status === 'Actif' ? 'autorisé' : 'bloqué'} sur le réseau UNILU.</p>
                    </div>
                </div>

                <div className="p-6 bg-[#0B0F19]/50 border-t border-white/5 flex gap-3">
                    <button onClick={onModifyPassword} className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                        Reset PW
                    </button>
                    <button onClick={() => onAction(user.status === 'Actif' ? 'Bloquer' : 'Débloquer', user)} className="flex-1 py-3 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                        {user.status === 'Actif' ? 'Bloquer' : 'Débloquer'}
                    </button>
                    <button onClick={() => onAction('Supprimer', user)} className="flex-1 py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
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

function RoleBadge({ role, color }: any) {
    const icons: any = {
        'Service Académique': <School className="w-3.5 h-3.5" />,
        'Admin Technique': <Settings className="w-3.5 h-3.5" />,
        'Étudiant': <GraduationCap className="w-3.5 h-3.5" />,
        'Professeur': <UserCircle className="w-3.5 h-3.5" />
    };

    return (
        <span className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-${color}-500/5 border-${color}-500/20 text-${color}-400 shadow-sm`}>
            {icons[role] || <UserIcon className="w-3.5 h-3.5" />} {role}
        </span>
    );
}

function PaginationButton({ label, icon, active, disabled, onClick }: any) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${active
                ? 'bg-blue-600 text-white shadow-lg'
                : disabled
                    ? 'text-slate-700 cursor-not-allowed opacity-30 px-2'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
        >
            {label || icon}
        </button>
    );
}



