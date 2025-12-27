import { useState } from 'react';
import { Send, MessageSquare, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';

interface Message {
    id: string;
    subject: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'resolved';
    date: string;
    response?: string;
}

const MOCK_MESSAGES: Message[] = [
    {
        id: '1',
        subject: 'Problème d\'accès au système de notes',
        content: 'Impossible d\'accéder au module de saisie des notes depuis ce matin. Message d\'erreur: "Session expirée".',
        priority: 'high',
        status: 'resolved',
        date: '2023-12-20',
        response: 'Problème résolu. Il s\'agissait d\'un bug dans le système d\'authentification. Mise à jour déployée.'
    },
    {
        id: '2',
        subject: 'Demande de création de compte professeur',
        content: 'Nouveau professeur recruté: Dr. Mukendi. Besoin d\'un compte avec accès aux modules de notes et planning.',
        priority: 'medium',
        status: 'in-progress',
        date: '2023-12-18'
    },
];

export function TechnicalSupport() {
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [newMessage, setNewMessage] = useState({
        subject: '',
        content: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
    });

    const handleSendMessage = () => {
        if (newMessage.subject.trim() && newMessage.content.trim()) {
            const message: Message = {
                id: Date.now().toString(),
                subject: newMessage.subject,
                content: newMessage.content,
                priority: newMessage.priority,
                status: 'pending',
                date: new Date().toISOString().split('T')[0]
            };
            setMessages([message, ...messages]);
            setIsNewMessageModalOpen(false);
            setNewMessage({ subject: '', content: '', priority: 'medium' });
            alert('Message envoyé au service technique !');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'in-progress': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'resolved': return 'Résolu';
            case 'in-progress': return 'En cours';
            default: return 'En attente';
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
                {messages.map(message => (
                    <div
                        key={message.id}
                        className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-[#1B4332] text-lg">{message.subject}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(message.priority)}`}>
                                        {message.priority === 'urgent' ? 'Urgent' :
                                            message.priority === 'high' ? 'Haute' :
                                                message.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                    </span>
                                </div>
                                <p className="text-sm text-[#52796F]">{message.date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(message.status)}`}>
                                {getStatusLabel(message.status)}
                            </span>
                        </div>

                        <div className="bg-[#F1F8F4] p-4 rounded-xl border border-[#1B4332]/5 mb-4">
                            <p className="text-sm text-[#1B4332] flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{message.content}</span>
                            </p>
                        </div>

                        {message.response && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Réponse du service technique
                                </p>
                                <p className="text-sm text-green-900">{message.response}</p>
                            </div>
                        )}

                        {message.status === 'pending' && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                                <Clock className="w-4 h-4" />
                                <span>En attente de traitement...</span>
                            </div>
                        )}
                    </div>
                ))}

                {messages.length === 0 && (
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
                                    <option value="low">Basse</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="high">Haute</option>
                                    <option value="urgent">Urgent</option>
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
                                        setNewMessage({ subject: '', content: '', priority: 'medium' });
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
