import { useState, useEffect } from "react";
import {
    LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2,
    AlertTriangle, Trash2, Send, X, ArrowLeft,
    ShieldAlert, Zap, Info, User
} from "lucide-react";
import { API_URL } from "../../services/config";

interface Message {
    id: string;
    senderId: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
}

interface Ticket {
    id: string;
    subject: string;
    category: "SUPPORT_TECHNIQUE" | "SUPPORT_ACADEMIQUE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    createdAt: string;
    updatedAt: string;
    messages?: Message[];
}

export function Support() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);

    const fetchTickets = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSelectTicket = async (ticket: Ticket) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/tickets/${ticket.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const fullTicket = await res.json();
                setSelectedTicket(fullTicket);
            }
        } catch (error) {
            console.error("Error fetching ticket details:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket || sendingMessage) return;

        setSendingMessage(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticketId: selectedTicket.id,
                    content: newMessage,
                    isAdmin: false
                })
            });

            if (res.ok) {
                setNewMessage("");
                await handleSelectTicket(selectedTicket);
                fetchTickets();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleDeleteTicket = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Voulez-vous vraiment supprimer ce ticket ? Cette action est irréversible.")) return;

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/tickets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setTickets(tickets.filter(t => t.id !== id));
                if (selectedTicket?.id === id) setSelectedTicket(null);
            } else {
                const err = await res.json();
                alert(err.message || "Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Error deleting ticket:", error);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'URGENT': return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-200"><Zap className="w-3 h-3" /> Critique</span>;
            case 'HIGH': return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest border border-orange-200"><AlertTriangle className="w-3 h-3" /> Haute</span>;
            case 'MEDIUM': return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200"><Info className="w-3 h-3" /> Moyenne</span>;
            default: return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">Basse</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RESOLVED': return <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Résolu</span>;
            case 'IN_PROGRESS': return <span className="text-blue-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Clock className="w-3 h-3 animate-spin" /> En cours</span>;
            case 'CLOSED': return <span className="text-slate-400 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">Clos</span>;
            default: return <span className="text-orange-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">Ouvert</span>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                            <LifeBuoy className="w-6 h-6" />
                        </div>
                        Centre d'Assistance
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">Contactez le support technique ou académique pour toute demande.</p>
                </div>
                <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-teal-600/20 transition-all active:scale-95 flex items-center gap-3"
                >
                    <Plus className="w-5 h-5" /> Nouveau Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: Tickets List */}
                <div className={`lg:col-span-4 space-y-4 ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
                    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm h-[calc(100vh-280px)] flex flex-col">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Mes Demandes</h3>
                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg text-[10px] font-black">{tickets.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {loading ? (
                                <div className="p-12 text-center opacity-50">
                                    <div className="w-8 h-8 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="font-bold text-sm">Aucune demande en cours</p>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => handleSelectTicket(ticket)}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer group mb-2 ${selectedTicket?.id === ticket.id
                                            ? 'bg-teal-50 border-teal-500/30'
                                            : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            {getPriorityBadge(ticket.priority)}
                                        </div>
                                        <h4 className={`font-bold text-sm mb-2 truncate ${selectedTicket?.id === ticket.id ? 'text-teal-900' : 'text-gray-900'}`}>
                                            {ticket.subject}
                                        </h4>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${ticket.category === 'SUPPORT_TECHNIQUE' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'
                                                    }`}>
                                                    {ticket.category === 'SUPPORT_TECHNIQUE' ? 'Technique' : 'Académique'}
                                                </span>
                                                {getStatusBadge(ticket.status)}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteTicket(ticket.id, e)}
                                                className="p-2 text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 active:scale-90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Content: Conversation View */}
                <div className={`lg:col-span-8 ${selectedTicket ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
                    {selectedTicket ? (
                        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-2xl h-[calc(100vh-280px)] flex flex-col scale-in">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-black text-gray-900 text-lg tracking-tight">{selectedTicket.subject}</h3>
                                            {getPriorityBadge(selectedTicket.priority)}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                            <span className="uppercase tracking-widest">{selectedTicket.id.split('-')[0]}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="text-teal-600">{selectedTicket.category === 'SUPPORT_TECHNIQUE' ? 'Support Technique' : 'Support Académique'}</span>
                                        </div>
                                    </div>
                                </div>
                                {getStatusBadge(selectedTicket.status)}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50 space-y-6">
                                {selectedTicket.messages?.map((msg, i) => (
                                    <div
                                        key={msg.id || i}
                                        className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-[80%] flex items-end gap-3 ${msg.isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.isAdmin ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-white text-teal-600 border-teal-100'
                                                }`}>
                                                {msg.isAdmin ? <ShieldAlert className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>
                                            <div className={`p-4 rounded-[24px] shadow-sm relative ${msg.isAdmin
                                                ? 'bg-white border border-gray-100 rounded-bl-none'
                                                : 'bg-teal-600 text-white rounded-br-none'
                                                }`}>
                                                {msg.isAdmin && (
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">Agent Support</div>
                                                )}
                                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                <div className={`text-[8px] font-bold mt-2 uppercase tracking-[0.1em] ${msg.isAdmin ? 'text-gray-400' : 'text-teal-200'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t border-gray-50 flex items-center gap-4 shrink-0">
                                <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Répondre au ticket..."
                                        disabled={selectedTicket.status === 'CLOSED'}
                                        className="flex-1 bg-gray-50 border border-transparent rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-teal-500/50 transition-all font-medium text-sm disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sendingMessage || selectedTicket.status === 'CLOSED'}
                                        className="w-14 h-14 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                                    >
                                        {sendingMessage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-6 h-6" />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 opacity-50">
                            <div className="w-24 h-24 bg-gray-100 rounded-[40px] flex items-center justify-center text-gray-300 mx-auto shadow-inner">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Aucune Demande Sélectionnée</h3>
                                <p className="text-xs font-bold text-gray-400 mt-2">Choisissez un ticket pour voir la conversation ou lancez-en un nouveau.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showNewTicketModal && (
                <NewTicketModal
                    onClose={() => setShowNewTicketModal(false)}
                    onSuccess={() => {
                        fetchTickets();
                        setShowNewTicketModal(false);
                    }}
                />
            )}
        </div>
    );
}

function NewTicketModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState<"SUPPORT_TECHNIQUE" | "SUPPORT_ACADEMIQUE">("SUPPORT_TECHNIQUE");
    const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject,
                    category,
                    priority,
                    message
                })
            });

            if (res.ok) {
                onSuccess();
            } else {
                alert("Erreur lors de la création du ticket");
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in">
                <div className="bg-teal-600 p-8 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tight uppercase">Ouvrir un Nouveau Dossier</h3>
                        <p className="text-teal-100 text-xs font-bold mt-1 uppercase tracking-widest opacity-80">Assistance Personnalisée UNILU / Géologie</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Sujet / Problème</label>
                        <input
                            required
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Ex: Erreur lors de l'encodage des cotes..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-teal-500/50 transition-all font-bold text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Service Destinataire</label>
                            <div className="flex flex-col gap-2">
                                {[
                                    { id: 'SUPPORT_TECHNIQUE', label: 'Support Technique', sub: 'Bugs, App, Accès', icon: ShieldAlert, color: 'blue' },
                                    { id: 'SUPPORT_ACADEMIQUE', label: 'Support Académique', sub: 'Syllabus, Horaires', icon: Info, color: 'purple' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setCategory(opt.id as any)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${category === opt.id ? `bg-${opt.color}-50 border-${opt.color}-200 shadow-sm` : 'bg-white border-gray-100 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${category === opt.id ? `bg-${opt.color}-600 text-white shadow-lg` : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            <opt.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={`font-black text-xs uppercase tracking-tight ${category === opt.id ? `text-${opt.color}-900` : 'text-gray-900'}`}>{opt.label}</p>
                                            <p className="text-[9px] font-bold text-gray-400">{opt.sub}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Niveau d'Urgence</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'LOW', label: 'Basse', color: 'slate' },
                                    { id: 'MEDIUM', label: 'Moyenne', color: 'blue' },
                                    { id: 'HIGH', label: 'Haute', color: 'orange' },
                                    { id: 'URGENT', label: 'URGENT', color: 'red' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setPriority(opt.id as any)}
                                        className={`py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${priority === opt.id
                                            ? `bg-${opt.color}-600 text-white border-${opt.color}-500 shadow-md`
                                            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Description Détaillée</label>
                        <textarea
                            required
                            rows={5}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Décrivez votre situation précisément pour une aide rapide..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-[24px] p-5 outline-none focus:bg-white focus:border-teal-500/50 transition-all font-medium text-sm leading-relaxed resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !subject || !message}
                            className="flex-[1.5] py-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-teal-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Zap className="w-4 h-4" /> Valider & Envoyer</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
