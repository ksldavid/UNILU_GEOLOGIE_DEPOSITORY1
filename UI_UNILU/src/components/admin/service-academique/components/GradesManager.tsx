import { useState } from 'react';
import { FileText, CheckCircle, X, AlertCircle, TrendingUp, Send, MessageSquare } from 'lucide-react';

interface GradeChangeRequest {
    id: string;
    professor: string;
    professorInitials: string;
    student: string;
    course: string;
    courseCode: string;
    oldGrade: string;
    newGrade: string;
    justification: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
}

const MOCK_REQUESTS: GradeChangeRequest[] = [
    {
        id: '1',
        professor: 'Prof. Jean Martin',
        professorInitials: 'JM',
        student: 'Alice Konan',
        course: 'Mathématiques Appliquées',
        courseCode: 'MAT201',
        oldGrade: '12.5',
        newGrade: '14.0',
        justification: 'Erreur de comptabilisation des points de la question 3. L\'étudiant mérite 1.5 points de plus pour sa démonstration complète du théorème de Pythagore appliqué aux coordonnées cartésiennes.',
        date: '2023-12-20',
        status: 'pending'
    },
    {
        id: '2',
        professor: 'Prof. Alice Leroy',
        professorInitials: 'AL',
        student: 'Marc Lwamba',
        course: 'Géologie Structurale',
        courseCode: 'GEO301',
        oldGrade: '08.0',
        newGrade: '10.0',
        justification: 'Réévaluation de la copie suite à la séance de consultation. La moyenne a été ajustée car l\'étudiant a bien répondu aux questions sur les failles inverses.',
        date: '2023-12-18',
        status: 'pending'
    },
    {
        id: '3',
        professor: 'Prof. Paul Mwepu',
        professorInitials: 'PM',
        student: 'Sophie Tshimabanga',
        course: 'Pétrologie',
        courseCode: 'GEO202',
        oldGrade: '15.0',
        newGrade: '16.5',
        justification: 'Bonus accordé pour la qualité exceptionnelle du rapport de laboratoire sur l\'analyse des roches métamorphiques.',
        date: '2023-12-15',
        status: 'approved'
    },
    {
        id: '4',
        professor: 'Prof. Marie Kalala',
        professorInitials: 'MK',
        student: 'Jean Kabeya',
        course: 'Minéralogie',
        courseCode: 'GEO101',
        oldGrade: '11.0',
        newGrade: '13.0',
        justification: 'Erreur de saisie lors de l\'encodage initial des notes.',
        date: '2023-12-10',
        status: 'rejected',
        rejectionReason: 'La justification fournie est insuffisante. Veuillez fournir des preuves documentaires de l\'erreur de saisie.'
    },
];

export function GradesManager() {
    const [requests, setRequests] = useState<GradeChangeRequest[]>(MOCK_REQUESTS);
    const [selectedRequest, setSelectedRequest] = useState<GradeChangeRequest | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Statistics
    const courseStats = requests.reduce((acc, req) => {
        const key = `${req.course} (${req.courseCode})`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedCourseStats = Object.entries(courseStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const handleApprove = (requestId: string) => {
        setRequests(requests.map(req =>
            req.id === requestId ? { ...req, status: 'approved' as const } : req
        ));
        if (selectedRequest?.id === requestId) {
            setSelectedRequest({ ...selectedRequest, status: 'approved' });
        }
    };

    const handleReject = (requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        if (request) {
            setSelectedRequest(request);
            setIsRejectModalOpen(true);
        }
    };

    const confirmReject = () => {
        if (selectedRequest && rejectionReason.trim()) {
            setRequests(requests.map(req =>
                req.id === selectedRequest.id
                    ? { ...req, status: 'rejected' as const, rejectionReason }
                    : req
            ));
            setIsRejectModalOpen(false);
            setRejectionReason('');
            setSelectedRequest(null);
        }
    };

    const filteredRequests = requests.filter(req =>
        filterStatus === 'all' ? true : req.status === filterStatus
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Filters */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                <h2 className="text-2xl font-bold text-[#1B4332] mb-4">Demandes de Changement de Notes</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${filterStatus === 'all'
                                ? 'bg-[#1B4332] text-white'
                                : 'bg-gray-100 text-[#52796F] hover:bg-gray-200'
                            }`}
                    >
                        Toutes ({requests.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${filterStatus === 'pending'
                                ? 'bg-orange-500 text-white'
                                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            }`}
                    >
                        En attente ({requests.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('approved')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${filterStatus === 'approved'
                                ? 'bg-green-500 text-white'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                    >
                        Approuvées ({requests.filter(r => r.status === 'approved').length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('rejected')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${filterStatus === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                    >
                        Refusées ({requests.filter(r => r.status === 'rejected').length})
                    </button>
                </div>
            </div>

            {/* Requests List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map(request => (
                    <div
                        key={request.id}
                        className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold">
                                    {request.professorInitials}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1B4332]">{request.professor}</h3>
                                    <p className="text-sm text-[#52796F]">{request.course} • {request.courseCode}</p>
                                    <p className="text-xs text-[#52796F]">Étudiant: {request.student}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                        request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {request.status === 'pending' ? 'En attente' :
                                        request.status === 'approved' ? 'Approuvée' : 'Refusée'}
                                </span>
                                <span className="text-xs text-[#52796F]">{request.date}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-xs text-red-600 font-medium mb-1">Ancienne note</p>
                                <p className="text-2xl font-bold text-red-700">{request.oldGrade}/20</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <p className="text-xs text-green-600 font-medium mb-1">Nouvelle note</p>
                                <p className="text-2xl font-bold text-green-700">{request.newGrade}/20</p>
                            </div>
                        </div>

                        <div className="bg-[#F1F8F4] p-4 rounded-xl border border-[#1B4332]/5 mb-4">
                            <p className="text-xs font-bold text-[#1B4332] mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Justification
                            </p>
                            <p className="text-sm text-[#52796F] italic">"{request.justification}"</p>
                        </div>

                        {request.status === 'rejected' && request.rejectionReason && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                                <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Motif du refus
                                </p>
                                <p className="text-sm text-red-600 italic">"{request.rejectionReason}"</p>
                            </div>
                        )}

                        {request.status === 'pending' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleApprove(request.id)}
                                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approuver
                                </button>
                                <button
                                    onClick={() => handleReject(request.id)}
                                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Refuser
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Statistics */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10">
                <h3 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Cours avec le plus de demandes
                </h3>
                <div className="space-y-3">
                    {sortedCourseStats.map(([course, count], index) => (
                        <div key={course} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-[#1B4332]">{course}</p>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full bg-[#1B4332] rounded-full transition-all duration-500"
                                        style={{ width: `${(count / Math.max(...Object.values(courseStats))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-[#1B4332]">{count} demande{count > 1 ? 's' : ''}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rejection Modal */}
            {isRejectModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl border border-red-500/20 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-red-600 p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Refuser la demande
                                </h3>
                                <p className="text-sm text-white/80 mt-1">{selectedRequest.professor} - {selectedRequest.course}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsRejectModalOpen(false);
                                    setRejectionReason('');
                                }}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#1B4332] mb-2">
                                    Motif du refus *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Expliquez pourquoi cette demande est refusée..."
                                    className="w-full h-32 p-3 border border-[#1B4332]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsRejectModalOpen(false);
                                        setRejectionReason('');
                                    }}
                                    className="flex-1 py-3 text-[#52796F] hover:bg-[#F1F8F4] rounded-[16px] font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={!rejectionReason.trim()}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[16px] font-bold shadow-lg shadow-red-600/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Envoyer le refus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
