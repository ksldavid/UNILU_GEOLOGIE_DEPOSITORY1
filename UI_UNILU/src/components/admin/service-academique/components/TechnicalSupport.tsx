import { useState, useEffect } from 'react';
import { Send, MessageSquare, AlertCircle, Clock, Wrench, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import { supportService } from '../../../../services/support';

export function TechnicalSupport() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [reply, setReply] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [newMessage, setNewMessage] = useState({
        subject: '',
        content: '',
        priority: 'MEDIUM',
        category: 'Technique'
    });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false);
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
            const data = await supportService.getMyTickets();
            setMessages(data);
        } catch (error) {
            console.error("Erreur chargement tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.subject.trim() && newMessage.content.trim()) {
            try {
                await supportService.createTicket({
                    subject: newMessage.subject,
                    category: newMessage.category,
                    priority: newMessage.priority,
                    message: newMessage.content
                });
                setIsNewMessageModalOpen(false);
                setNewMessage({ subject: '', content: '', priority: 'MEDIUM', category: 'Technique' });
                fetchTickets();
                alert('Message envoyé au service technique !');
            } catch (error) {
                alert('Erreur lors de l\'envoi');
            }
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !reply.trim()) return;
        try {
            await supportService.addMessage(selectedTicket.id, reply);
            setReply('');
            const details = await supportService.getTicketDetails(selectedTicket.id);
            setSelectedTicket(details);
        } catch (error) {
            alert('Erreur envoi réponse');
        }
    };

    const handleSelectTicket = async (ticket: any) => {
        try {
            const details = await supportService.getTicketDetails(ticket.id);
            setSelectedTicket(details);
        } catch (error) {
            console.error("Erreur détails:", error);
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RESOLVED': return 'bg-green-100 text-green-700';
            case 'IN_PROGRESS': return 'bg-orange-100 text-orange-700';
            case 'CLOSED': return 'bg-gray-100 text-gray-700';
            default: return 'bg-blue-50 text-blue-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'RESOLVED': return 'Résolu';
            case 'IN_PROGRESS': return 'En cours';
            case 'CLOSED': return 'Fermé';
            default: return 'Ouvert';
        }
    };

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 min-h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100] bg-[#F1F8F4] p-0 m-0' : ''}`}>
            {selectedTicket ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/50 backdrop-blur-md">
                    {/* Chat Header */}
                    <div className="bg-[#1B4332] p-6 text-white flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => { setSelectedTicket(null); setIsFullscreen(false); }}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {selectedTicket.subject}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-widest ${getPriorityStyle(selectedTicket.priority)}`}>
                                        {selectedTicket.priority}
                                    </span>
                                </h3>
                                <p className="text-xs text-white/70">Ticket ouvert le {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(selectedTicket.status)}`}>
                                {getStatusLabel(selectedTicket.status)}
                            </span>
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 border border-white/10"
                                title={isFullscreen ? "Réduire" : "Plein écran"}
                            >
                                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                {isFullscreen && <span className="text-[10px] font-black uppercase tracking-widest">Quitter</span>}
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#F1F8F4]/50">
                        {selectedTicket.messages?.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] md:max-w-[70%] p-5 rounded-3xl shadow-sm border ${msg.isAdmin
                                    ? 'bg-white border-[#1B4332]/10 rounded-tl-none'
                                    : 'bg-[#1B4332] text-white border-transparent rounded-tr-none'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${msg.isAdmin ? 'text-[#1B4332]' : 'text-[#74C69D]'}`}>
                                            {msg.isAdmin ? 'Support Technique' : 'Moi (Service Académique)'}
                                        </span>
                                        <span className={`text-[9px] font-mono opacity-60 ${msg.isAdmin ? 'text-slate-500' : 'text-white'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {selectedTicket.status === 'OPEN' && (!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                            <div className="text-center py-12 flex flex-col items-center gap-4 opacity-40">
                                <Clock className="w-12 h-12 text-[#1B4332]" />
                                <p className="font-bold uppercase tracking-widest text-xs">En attente de prise en charge par la technique...</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-6 bg-white border-t border-[#1B4332]/10">
                        <div className="max-w-4xl mx-auto flex gap-4">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Taper votre réponse ici..."
                                className="flex-1 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-2xl px-6 py-4 text-sm text-[#1B4332] placeholder-slate-400 outline-none focus:border-[#1B4332]/30 transition-all resize-none min-h-[60px] max-h-[150px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSendReply}
                                disabled={!reply.trim() || selectedTicket.status === 'CLOSED'}
                                className="px-6 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl shadow-lg shadow-[#1B4332]/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale disabled:transform-none"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1B4332] flex items-center gap-2">
                                <Wrench className="w-6 h-6" />
                                Contacter le Service Technique
                            </h2>
                            <p className="text-sm text-[#52796F] mt-1">
                                Signalez vos problèmes techniques ou demandez de l'assistance
                            </p>
                        </div>
                        <button
                            onClick={() => setIsNewMessageModalOpen(true)}
                            className="px-6 py-3 bg-[#1B4332] hover:bg-[#2D5F4C] text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Send className="w-4 h-4" />
                            Nouveau message
                        </button>
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 mb-2">Informations importantes</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Le service technique répond généralement sous 24-48h</li>
                                    <li>• Pour les urgences, utilisez la priorité "Urgent"</li>
                                    <li>• Cliquez sur un message pour voir la discussion complète</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="space-y-4 flex-1">
                        <h3 className="text-xl font-bold text-[#1B4332]">Historique des messages</h3>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-sm text-[#52796F]">Chargement de vos messages...</p>
                            </div>
                        ) : messages.map(message => (
                            <div
                                key={message.id}
                                onClick={() => handleSelectTicket(message)}
                                className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 hover:shadow-md hover:border-[#1B4332]/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-[#1B4332] text-lg group-hover:text-[#2D6A4F] transition-colors">{message.subject}</h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityStyle(message.priority)}`}>
                                                {message.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#52796F]">{new Date(message.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(message.status)}`}>
                                        {getStatusLabel(message.status)}
                                    </span>
                                </div>

                                {message.messages && message.messages.length > 0 && (
                                    <p className="text-sm text-[#52796F] line-clamp-2 italic mt-4 opacity-70">
                                        Dernier message: {message.messages[message.messages.length - 1].content}
                                    </p>
                                )}

                                <div className="flex justify-end mt-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] bg-[#F1F8F4] px-3 py-1 rounded-lg">Voir la discussion →</span>
                                </div>
                            </div>
                        ))}

                        {!loading && messages.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-[24px] border border-[#1B4332]/10">
                                <MessageSquare className="w-12 h-12 text-[#52796F] mx-auto mb-4 opacity-50" />
                                <p className="text-[#52796F]">Aucun message envoyé pour le moment</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* New Message Modal */}
            {isNewMessageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Send className="w-5 h-5" />
                                    Nouveau message au service technique
                                </h3>
                                <p className="text-sm text-white/80 mt-1">Décrivez votre problème ou votre demande</p>
                            </div>
                            <button
                                onClick={() => setIsNewMessageModalOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <AlertCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                    Sujet *
                                </label>
                                <input
                                    type="text"
                                    value={newMessage.subject}
                                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                    placeholder="Ex: Problème d'accès, Demande de compte..."
                                    className="w-full p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                    Priorité
                                </label>
                                <select
                                    value={newMessage.priority}
                                    onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value as any })}
                                    className="w-full p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                                >
                                    <option value="LOW">Basse</option>
                                    <option value="MEDIUM">Moyenne</option>
                                    <option value="HIGH">Haute</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                    Description détaillée *
                                </label>
                                <textarea
                                    value={newMessage.content}
                                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                                    placeholder="Décrivez votre problème en détail..."
                                    className="w-full h-40 p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsNewMessageModalOpen(false);
                                        setNewMessage({ subject: '', content: '', priority: 'MEDIUM', category: 'Technique' });
                                    }}
                                    className="flex-1 py-3 text-[#52796F] hover:bg-[#F1F8F4] rounded-[16px] font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.subject.trim() || !newMessage.content.trim()}
                                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D5F4C] text-white rounded-[16px] font-bold shadow-lg shadow-[#1B4332]/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Envoyer le message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
