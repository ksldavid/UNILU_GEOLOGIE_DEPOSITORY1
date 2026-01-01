import { useState, useEffect } from 'react';
import { FileText, CheckCircle, X, AlertCircle, TrendingUp, Send, MessageSquare, Loader2, Table, Filter, Download } from 'lucide-react';
import { gradeService } from '../../../../services/grade';
import { courseService } from '../../../../services/course';

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

const ACADEMIC_YEAR = "2024-2025";

export function GradesManager() {
    const [view, setView] = useState<'requests' | 'pv'>('requests');
    const [requests, setRequests] = useState<GradeChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<GradeChangeRequest | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // PV State
    const [levels, setLevels] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
    const [pvData, setPvData] = useState<any>(null);
    const [pvLoading, setPvLoading] = useState(false);
    const [selectedPendingRequest, setSelectedPendingRequest] = useState<any>(null);

    useEffect(() => {
        if (view === 'requests') {
            fetchRequests();
        } else if (levels.length === 0) {
            fetchLevels();
        }
    }, [view]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await gradeService.getGradeChangeRequests();
            setRequests(data);
        } catch (error) {
            console.error("Erreur chargement demandes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLevels = async () => {
        try {
            const data = await courseService.getLevels();
            setLevels(data);
        } catch (error) {
            console.error("Erreur niveaux:", error);
        }
    };

    useEffect(() => {
        if (selectedLevelId !== null) {
            courseService.getCourses(selectedLevelId).then(setCourses).catch(console.error);
        }
    }, [selectedLevelId]);

    const handleFetchPV = async () => {
        if (!selectedCourseCode) return;
        setPvLoading(true);
        try {
            const data = await gradeService.getPV(selectedCourseCode, ACADEMIC_YEAR);
            setPvData(data);
        } catch (error) {
            console.error("Erreur PV:", error);
        } finally {
            setPvLoading(false);
        }
    };

    // Statistics
    const courseStats = requests.reduce((acc, req) => {
        const key = `${req.course} (${req.courseCode})`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedCourseStats = Object.entries(courseStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const handleApprove = async (requestId: string) => {
        try {
            await gradeService.updateRequestStatus(requestId, 'APPROVED');
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status: 'approved' as const } : req
            ));

            // Sync with PV view if loaded
            if (pvData) {
                const updatedPvData = {
                    ...pvData,
                    pvData: pvData.pvData.map((row: any) => {
                        const newGrades = { ...row.grades };
                        const newPending = { ...row.pendingRequests };

                        Object.entries(row.pendingRequests || {}).forEach(([assId, req]: [string, any]) => {
                            if (req.requestId === requestId || req.id === requestId) {
                                newGrades[assId] = req.newScore || req.newGrade;
                                delete newPending[assId];
                            }
                        });

                        return { ...row, grades: newGrades, pendingRequests: newPending };
                    })
                };
                setPvData(updatedPvData);
            }

            if (selectedRequest?.id === requestId) {
                setSelectedRequest({ ...selectedRequest, status: 'approved' });
            }
            if (selectedPendingRequest?.requestId === requestId || selectedPendingRequest?.id === requestId) {
                setSelectedPendingRequest(null);
            }
        } catch (error) {
            alert("Erreur lors de l'approbation");
        }
    };

    const handleReject = (requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        if (request) {
            setSelectedRequest(request);
            setIsRejectModalOpen(true);
        }
    };

    const confirmReject = async () => {
        if (selectedRequest && rejectionReason.trim()) {
            try {
                await gradeService.updateRequestStatus(selectedRequest.id, 'REJECTED', rejectionReason);
                setRequests(requests.map(req =>
                    req.id === selectedRequest.id
                        ? { ...req, status: 'rejected' as const, rejectionReason }
                        : req
                ));

                // Sync with PV view if loaded
                if (pvData) {
                    const updatedPvData = {
                        ...pvData,
                        pvData: pvData.pvData.map((row: any) => {
                            const newPending = { ...row.pendingRequests };
                            let changed = false;

                            Object.entries(row.pendingRequests || {}).forEach(([assId, req]: [string, any]) => {
                                if (req.requestId === selectedRequest.id || req.id === selectedRequest.id) {
                                    delete newPending[assId];
                                    changed = true;
                                }
                            });

                            return changed ? { ...row, pendingRequests: newPending } : row;
                        })
                    };
                    setPvData(updatedPvData);
                }

                setIsRejectModalOpen(false);
                setRejectionReason('');
                setSelectedRequest(null);
            } catch (error) {
                alert("Erreur lors du rejet");
            }
        }
    };

    const filteredRequests = requests.filter(req =>
        filterStatus === 'all' ? true : req.status === filterStatus
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* View Switcher */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#1B4332]/10 w-fit">
                <button
                    onClick={() => setView('requests')}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${view === 'requests' ? 'bg-[#1B4332] text-white shadow-lg' : 'text-[#52796F] hover:bg-gray-50'}`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Rectifications
                </button>
                <button
                    onClick={() => setView('pv')}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${view === 'pv' ? 'bg-[#1B4332] text-white shadow-lg' : 'text-[#52796F] hover:bg-gray-50'}`}
                >
                    <Table className="w-4 h-4" />
                    PV de Délibération
                </button>
            </div>

            {view === 'requests' ? (
                <>
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
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm">
                                <Loader2 className="w-12 h-12 animate-spin text-[#1B4332] mb-4" />
                                <p className="text-[#52796F]">Chargement des demandes...</p>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] border border-[#1B4332]/10 shadow-sm">
                                <FileText className="w-12 h-12 text-[#1B4332] opacity-20 mb-4" />
                                <p className="text-[#52796F]">Aucune demande trouvée</p>
                            </div>
                        ) : filteredRequests.map(request => (
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

                    {/* Statistics - Only show if there are requests to analyze */}
                    {sortedCourseStats.length > 0 && (
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 mt-6">
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
                                                    style={{ width: `${(count / Math.max(...Object.values(courseStats), 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-[#1B4332]">{count} demande{count > 1 ? 's' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-6">
                    {/* PV Filters */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#1B4332]/10 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-bold text-[#1B4332] mb-2 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Promotion
                            </label>
                            <select
                                className="w-full bg-[#F1F8F4] border border-[#1B4332]/10 text-[#1B4332] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                                value={selectedLevelId ?? ''}
                                onChange={(e) => setSelectedLevelId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Sélectionner une promotion</option>
                                {levels.map(level => (
                                    <option key={level.id} value={level.id}>{level.displayName || level.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-bold text-[#1B4332] mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Cours
                            </label>
                            <select
                                className="w-full bg-[#F1F8F4] border border-[#1B4332]/10 text-[#1B4332] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1B4332]/20 disabled:opacity-50"
                                value={selectedCourseCode}
                                onChange={(e) => setSelectedCourseCode(e.target.value)}
                                disabled={!selectedLevelId}
                            >
                                <option value="">Sélectionner un cours</option>
                                {courses.map(course => (
                                    <option key={course.code} value={course.code}>{course.name} ({course.code})</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleFetchPV}
                            disabled={!selectedCourseCode || pvLoading}
                            className="bg-[#1B4332] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#2d5a44] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#1B4332]/20"
                        >
                            {pvLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                            Générer le PV
                        </button>
                    </div>

                    {/* PV Table */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-[#1B4332]/10 overflow-hidden">
                        {pvLoading ? (
                            <div className="flex flex-col items-center justify-center p-20">
                                <Loader2 className="w-12 h-12 animate-spin text-[#1B4332] mb-4" />
                                <p className="text-[#52796F]">Génération du Procès-Verbal...</p>
                            </div>
                        ) : pvData ? (
                            <div className="overflow-x-auto">
                                <div className="p-6 bg-[#1B4332] text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold">Procès-Verbal de Délibération</h3>
                                        <p className="text-sm text-white/80">{courses.find(c => c.code === selectedCourseCode)?.name} ( {selectedCourseCode} ) • {ACADEMIC_YEAR}</p>
                                    </div>
                                    <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Exporter PDF
                                    </button>
                                </div>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#F1F8F4] border-b border-[#1B4332]/10">
                                            <th className="p-4 text-left text-sm font-bold text-[#1B4332] min-w-[200px]">Étudiant</th>
                                            {pvData.assessments.map((ass: any) => (
                                                <th key={ass.id} className="p-4 text-center text-sm font-bold text-[#1B4332]">
                                                    {ass.title}
                                                    <span className="block text-[10px] text-[#52796F] font-normal">/{ass.maxPoints}</span>
                                                </th>
                                            ))}
                                            <th className="p-4 text-center text-sm font-bold text-[#1B4332] bg-[#1B4332]/5">Moyenne</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pvData.pvData.map((row: any) => {
                                            const totalScore = pvData.assessments.reduce((acc: number, ass: any) => acc + (row.grades[ass.id] || 0), 0);
                                            const maxPossible = pvData.assessments.reduce((acc: number, ass: any) => acc + ass.maxPoints, 0);
                                            const average = maxPossible > 0 ? (totalScore / maxPossible) * 20 : 0;

                                            return (
                                                <tr key={row.studentId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-bold text-[#1B4332]">{row.studentName}</p>
                                                        <p className="text-[10px] text-[#52796F]">{row.studentId}</p>
                                                    </td>
                                                    {pvData.assessments.map((ass: any) => {
                                                        const pending = row.pendingRequests?.[ass.id];
                                                        return (
                                                            <td key={ass.id} className="p-4 text-center relative group">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    {row.grades[ass.id] !== undefined ? (
                                                                        <span className={`font-medium ${row.grades[ass.id] < ass.maxPoints / 2 ? 'text-red-500' : 'text-[#1B4332]'}`}>
                                                                            {row.grades[ass.id]}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-300">-</span>
                                                                    )}

                                                                    {pending && (
                                                                        <button
                                                                            onClick={() => setSelectedPendingRequest({ ...pending, studentName: row.studentName, assessmentTitle: ass.title })}
                                                                            className="flex items-center gap-1 bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold hover:bg-orange-200 transition-colors"
                                                                        >
                                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                                            {pending.newScore || pending.newGrade}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-4 text-center bg-[#1B4332]/5">
                                                        <span className={`text-lg font-bold ${average < 10 ? 'text-red-600' : 'text-[#1B4332]'}`}>
                                                            {average.toFixed(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20">
                                <Table className="w-16 h-16 text-[#1B4332] opacity-10 mb-4" />
                                <p className="text-[#52796F]">Sélectionnez un cours pour afficher le PV</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Rectification Modal (from PV) */}
            {selectedPendingRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-orange-500/20 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-orange-500 p-6 text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="w-6 h-6" />
                                Rectification Rapide
                            </h3>
                            <p className="text-orange-50 text-sm mt-1">{selectedPendingRequest.studentName} • {selectedPendingRequest.assessmentTitle}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                <div>
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Demande de</p>
                                    <p className="font-bold text-[#1B4332]">{selectedPendingRequest.professor}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Note Proposée</p>
                                    <p className="text-2xl font-black text-orange-600">{selectedPendingRequest.newScore || selectedPendingRequest.newGrade}/20</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">Justification</p>
                                <p className="text-sm text-[#52796F] italic bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    "{selectedPendingRequest.reason || selectedPendingRequest.justification}"
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setSelectedPendingRequest(null)}
                                    className="flex-1 py-3 text-[#52796F] font-bold hover:bg-gray-100 rounded-2xl transition-colors"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedPendingRequest.requestId || selectedPendingRequest.id)}
                                    className="flex-[2] py-3 bg-[#1B4332] text-white font-bold rounded-2xl shadow-lg shadow-[#1B4332]/20 hover:scale-105 transition-all"
                                >
                                    Approuver & Actualiser PV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
