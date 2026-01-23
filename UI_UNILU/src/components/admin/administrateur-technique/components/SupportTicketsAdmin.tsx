import { API_URL } from '../../../../../services/config';
import { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, ChevronRight, Send } from 'lucide-react';
import { supportService } from '../../../../services/support';

export function SupportTicketsAdmin() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [reply, setReply] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, OPEN, RESOLVED

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
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/support/messages, {
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
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'PENDING' ? 'bg-orange-600 text-white' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                    >
                        En attente
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Tickets List */}
                <div className="w-96 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-white/5">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-black uppercase text-slate-600">Chargement...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5">
                            <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-xs text-slate-500 uppercase font-black">Aucun ticket</p>
                        </div>
                    ) : filteredTickets.map(ticket => (
                        <button
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`w-full text-left p-5 rounded-3xl border transition-all group relative overflow-hidden ${selectedTicket?.id === ticket.id
                                ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                                : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-[9px] text-slate-600 font-mono">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{ticket.subject}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                                <User className="w-3 h-3" />
                                <span className="truncate">{ticket.user?.name || 'Inconnu'}</span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${ticket.status === 'RESOLVED' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                    {ticket.status}
                                </span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedTicket?.id === ticket.id ? 'translate-x-1 text-blue-500' : 'text-slate-700'}`} />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Ticket Details & Chat */}
                <div className="flex-1 bg-slate-900/50 rounded-[32px] border border-white/5 flex flex-col overflow-hidden relative">
                    {selectedTicket ? (
                        <>
                            {/* Detail Header */}
                            <div className="p-8 border-b border-white/5 bg-slate-800/20">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{selectedTicket.subject}</h3>
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-widest ${getPriorityColor(selectedTicket.priority)}`}>
                                                {selectedTicket.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <span>{selectedTicket.user?.name} ({selectedTicket.user?.email})</span>
                                            </div>
                                            <div className="h-4 w-px bg-white/5" />
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(selectedTicket.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedTicket.status}
                                            onChange={(e) => handleUpdateStatus(e.target.value)}
                                            className="bg-slate-800 border border-white/10 text-white text-[10px] font-black rounded-xl px-4 py-2 uppercase outline-none focus:border-blue-500 transition-all cursor-pointer"
                                        >
                                            <option value="OPEN">Ouvert</option>
                                            <option value="IN_PROGRESS">En cours</option>
                                            <option value="RESOLVED">Résolu</option>
                                            <option value="CLOSED">Fermé</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-950/20">
                                {selectedTicket.messages?.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-5 rounded-3xl border ${msg.isAdmin
                                            ? 'bg-blue-600/10 border-blue-500/20 rounded-tr-none'
                                            : 'bg-slate-800/40 border-white/5 rounded-tl-none'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${msg.isAdmin ? 'text-blue-500' : 'text-slate-500'}`}>
                                                    {msg.isAdmin ? 'Support Technique' : selectedTicket.user?.name}
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-mono">
                                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-200 leading-relaxed font-medium">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            <div className="p-6 bg-slate-900 border-t border-white/5">
                                <div className="relative group">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="Taper votre réponse ici..."
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-3xl pl-6 pr-16 py-5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all min-h-[100px] resize-none"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!reply.trim()}
                                        className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sélectionner un ticket pour commencer</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}




