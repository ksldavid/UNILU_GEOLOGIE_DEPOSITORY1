import { API_URL } from '../../../../services/config';
import { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, ChevronRight, Send, UserPlus, X } from 'lucide-react';
import { supportService } from '../../../../services/support';

export function SupportTicketsAdmin({ onRegister }: { onRegister?: (data: any) => void }) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [reply, setReply] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, OPEN, RESOLVED
    // Removed isFullscreen logic as we now use a modal.
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedTicket(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.adminGetAllTickets();
            setTickets(data);
        } catch (error) {
            console.error("Erreur chargement tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !reply.trim()) return;

        try {
            await supportService.addMessage(selectedTicket.id, reply); // TODO: backend needs to handle isAdmin flag or infer from role
            // Actually our backend addMessage takes {ticketId, content, isAdmin}
            // Let's call it correctly:
            const token = sessionStorage.getItem('token');
            await fetch(`${API_URL}/support/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ticketId: selectedTicket.id,
                    content: reply,
                    isAdmin: true
                })
            });

            setReply('');
            // Refresh details
            const details = await supportService.getTicketDetails(selectedTicket.id);
            setSelectedTicket(details);
            fetchTickets();
        } catch (error) {
            alert('Erreur envoi réponse');
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedTicket) return;
        try {
            await supportService.adminUpdateTicketStatus(selectedTicket.id, status);
            const details = await supportService.getTicketDetails(selectedTicket.id);
            setSelectedTicket(details);
            fetchTickets();
        } catch (error) {
            alert('Erreur mise à jour statut');
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'ALL') return true;
        if (filter === 'Inscription') return t.category === 'Inscription';
        return t.status === filter;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Support Technique</h2>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">Gestion des tickets d'assistance</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('Inscription')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'Inscription' ? 'bg-emerald-600 text-white' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                    >
                        Inscriptions
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'PENDING' ? 'bg-orange-600 text-white' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                    >
                        En attente
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {/* Tickets List - Full Width */}
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-white/5">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase text-slate-600">Chargement...</p>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5">
                                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-xs text-slate-500 uppercase font-black">Aucun ticket</p>
                            </div>
                        ) : filteredTickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`text-left p-6 rounded-3xl border transition-all group relative overflow-hidden bg-slate-900/50 border-white/5 hover:border-blue-500/30 hover:bg-slate-800/50 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">{ticket.subject}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                                        <User className="w-3 h-3" />
                                    </div>
                                    <span className="truncate">{ticket.user?.name || 'Inconnu'}</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5 w-full">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${ticket.status === 'RESOLVED' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                        {ticket.status}
                                    </span>
                                    <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-xs font-bold flex items-center gap-2">
                                        Ouvrir <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ticket Details & Chat - Modal Popup */}
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div
                            className="w-full max-w-6xl h-[90vh] bg-slate-950 border border-white/10 rounded-[32px] shadow-2xl shadow-blue-900/20 flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Detail Header */}
                            <div className="p-6 border-b border-white/5 bg-slate-900/50">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight line-clamp-1">{selectedTicket.subject}</h3>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getPriorityColor(selectedTicket.priority)}`}>
                                                {selectedTicket.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="font-medium text-slate-300">{selectedTicket.user?.name}</span>
                                                <span className="text-slate-600">({selectedTicket.user?.email})</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <div className="flex items-center gap-2 font-mono text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(selectedTicket.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {selectedTicket.category === 'Inscription' && selectedTicket.metadata && (
                                            <button
                                                onClick={() => onRegister?.(selectedTicket.metadata)}
                                                className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 text-[10px] font-black rounded-xl px-4 py-2 uppercase transition-all flex items-center gap-2"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                                Inscrire
                                            </button>
                                        )}

                                        <select
                                            value={selectedTicket.status}
                                            onChange={(e) => handleUpdateStatus(e.target.value)}
                                            className="bg-slate-900 border border-white/10 text-white text-[10px] font-black rounded-xl px-3 py-2 uppercase outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-slate-800"
                                        >
                                            <option value="OPEN">Ouvert</option>
                                            <option value="IN_PROGRESS">En cours</option>
                                            <option value="RESOLVED">Résolu</option>
                                            <option value="CLOSED">Fermé</option>
                                        </select>

                                        <button
                                            onClick={() => setSelectedTicket(null)}
                                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl border border-red-500/20 transition-all duration-300"
                                            title="Fermer"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-950/50">
                                {selectedTicket.messages?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700">
                                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-sm font-medium uppercase tracking-widest opacity-40">Aucun message</p>
                                    </div>
                                ) : (
                                    selectedTicket.messages?.map((msg: any) => (
                                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className="flex flex-col max-w-[80%]">
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${msg.isAdmin ? 'text-blue-400' : 'text-slate-400'}`}>
                                                        {msg.isAdmin ? 'Support' : selectedTicket.user?.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-700 font-mono">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`p-6 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${msg.isAdmin
                                                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-900/20'
                                                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className="p-6 bg-slate-900 border-t border-white/5">
                                <div className="relative flex gap-4 items-end">
                                    <div className="relative flex-1 group">
                                        <textarea
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            placeholder="Écrivez votre réponse ici..."
                                            className="w-full bg-slate-800/50 border border-white/5 rounded-3xl pl-6 pr-6 py-4 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all min-h-[60px] max-h-[150px] resize-none custom-scrollbar"
                                            rows={2}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!reply.trim()}
                                        className="mb-1 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                                        title="Envoyer"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}





