import { useState, useEffect } from 'react';
import { Send, MessageSquare, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { supportService } from '../../../../services/support';

export function TechnicalSupport() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [newMessage, setNewMessage] = useState({
        subject: '',
        content: '',
        priority: 'MEDIUM',
        category: 'Technique'
    });

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
        <div className="space-y-6 animate-in fade-in duration-500">
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
                            <li>• Décrivez le problème de manière détaillée pour une résolution rapide</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#1B4332]">Historique des messages</h3>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-[#52796F]">Chargement de vos messages...</p>
                    </div>
                ) : messages.map(message => (
                    <div
                        key={message.id}
                        className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-[#1B4332] text-lg">{message.subject}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityStyle(message.priority)}`}>
                                        {message.priority === 'URGENT' ? 'Urgent' :
                                            message.priority === 'HIGH' ? 'Haute' :
                                                message.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
                                    </span>
                                </div>
                                <p className="text-sm text-[#52796F]">{new Date(message.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(message.status)}`}>
                                {getStatusLabel(message.status)}
                            </span>
                        </div>

                        {message.messages && message.messages.length > 0 && (
                            <div className="bg-[#F1F8F4] p-4 rounded-xl border border-[#1B4332]/5 mb-4">
                                <p className="text-sm text-[#1B4332] flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{message.messages[0].content}</span>
                                </p>
                            </div>
                        )}

                        {message.messages && message.messages.some((m: any) => m.isAdmin) && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Réponse du service technique
                                </p>
                                <p className="text-sm text-green-900">
                                    {message.messages.slice().reverse().find((m: any) => m.isAdmin)?.content}
                                </p>
                            </div>
                        )}

                        {message.status === 'OPEN' && !message.messages.some((m: any) => m.isAdmin) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                                <Clock className="w-4 h-4" />
                                <span>En attente de traitement...</span>
                            </div>
                        )}
                    </div>
                ))}

                {!loading && messages.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-[24px] border border-[#1B4332]/10">
                        <MessageSquare className="w-12 h-12 text-[#52796F] mx-auto mb-4 opacity-50" />
                        <p className="text-[#52796F]">Aucun message envoyé pour le moment</p>
                    </div>
                )}
            </div>

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
