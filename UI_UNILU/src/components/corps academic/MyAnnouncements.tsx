import { useState, useEffect } from "react";
import { Megaphone, Trash2, Edit3, X, Save, AlertCircle, Clock } from "lucide-react";
import { professorService } from "../../services/professor";
import { motion, AnimatePresence } from "motion/react";

export function MyAnnouncements() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await professorService.getMyAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await professorService.deleteAnnouncement(id);
            setAnnouncements(announcements.filter(a => a.id !== id));
            setIsDeleting(null);
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await professorService.updateAnnouncement(editingAnnouncement.id, editingAnnouncement);
            setAnnouncements(announcements.map(a => a.id === editingAnnouncement.id ? editingAnnouncement : a));
            setEditingAnnouncement(null);
        } catch (error) {
            alert("Erreur lors de la mise à jour");
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Mes Annonces</h1>
                <p className="text-gray-500 font-medium">Gérez et modifiez les messages diffusés à vos étudiants.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                    {announcements.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] p-20 text-center"
                        >
                            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Aucune annonce</h3>
                            <p className="text-gray-500">Vous n'avez pas encore publié d'annonces.</p>
                        </motion.div>
                    ) : (
                        announcements.map((ann) => (
                            <motion.div
                                key={ann.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-teal-500" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-4 py-1.5 bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {ann.type}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            Publié le {new Date(ann.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingAnnouncement(ann)}
                                            className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setIsDeleting(ann.id)}
                                            className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight group-hover:text-teal-600 transition-colors uppercase">
                                    {ann.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed font-medium mb-6">
                                    {ann.content}
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    {ann.academicLevel && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            <Users className="w-4 h-4" />
                                            Cible: {ann.academicLevel.displayName || ann.academicLevel.name}
                                        </div>
                                    )}
                                    {ann.course && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            <BookOpenIcon className="w-4 h-4" />
                                            Cours: {ann.course.name}
                                        </div>
                                    )}
                                </div>

                                {isDeleting === ann.id && (
                                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 z-10 animate-in fade-in zoom-in duration-200">
                                        <div className="text-center max-w-sm">
                                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                            <h4 className="text-xl font-black text-gray-900 mb-2 uppercase">Supprimer l'annonce ?</h4>
                                            <p className="text-gray-500 text-sm font-medium mb-6">Cette action est irréversible. L'annonce ne sera plus visible par les étudiants.</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setIsDeleting(null)}
                                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ann.id)}
                                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                                                >
                                                    Confirmer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Edit Modal */}
            {editingAnnouncement && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-teal-600 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase tracking-tight">Modifier l'annonce</h3>
                                <p className="text-teal-100 text-sm font-medium opacity-80 mt-1">Éditez le titre et le contenu de votre message.</p>
                            </div>
                            <button
                                onClick={() => setEditingAnnouncement(null)}
                                className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titre de l'annonce</label>
                                <input
                                    type="text"
                                    value={editingAnnouncement.title}
                                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-bold text-gray-900"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contenu complet</label>
                                <textarea
                                    value={editingAnnouncement.content}
                                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                                    rows={5}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-medium text-gray-700 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingAnnouncement(null)}
                                    className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-3xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Fermer
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Sauvegarder
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

const Users = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const BookOpenIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
