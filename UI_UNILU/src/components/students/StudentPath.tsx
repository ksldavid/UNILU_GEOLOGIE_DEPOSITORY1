import { useState, useEffect } from "react";
import { CheckCircle2, Info, RefreshCw, BookOpen, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

interface ManagedCourse {
    code: string;
    name: string;
    isActive: boolean;
}

export function StudentPath() {
    const [courses, setCourses] = useState<ManagedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await studentService.getCourseManagement();
            setCourses(data);
        } catch (error) {
            console.error("Erreur lors de la récupération des cours:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (courseCode: string, currentStatus: boolean) => {
        setUpdating(courseCode);
        try {
            await studentService.toggleCourseActive(courseCode, !currentStatus);
            setCourses(prev => prev.map(c =>
                c.code === courseCode ? { ...c, isActive: !currentStatus } : c
            ));
        } catch (error) {
            console.error("Erreur toggle:", error);
        } finally {
            setUpdating(null);
        }
    };

    const filteredCourses = courses.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'active' && c.isActive) ||
            (filter === 'inactive' && !c.isActive);
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-6 w-96" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-24 rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Configuration de mon Parcours</h1>
                <p className="text-gray-500 font-medium tracking-tight">Sélectionnez les cours que vous devez suivre cette année. Décochez les cours que vous avez déjà validés (éliminés).</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 mb-8 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800 leading-relaxed font-medium">
                    <strong>Note importante :</strong> Les cours que vous désactivez n'apparaîtront plus dans votre emploi du temps, vos annonces, ni dans les listes d'appel des professeurs. Vous ne serez donc pas marqué absent pour ces cours.
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un cours..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    {(['all', 'active', 'inactive'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'all' ? 'Tous' : f === 'active' ? 'À suivre' : 'Éliminés'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredCourses.map((course) => (
                        <motion.div
                            layout
                            key={course.code}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`p-6 rounded-[32px] border transition-all duration-300 flex items-center justify-between group ${course.isActive
                                ? 'bg-white border-gray-100 hover:border-blue-200'
                                : 'bg-gray-50/50 border-transparent opacity-75'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl transition-colors ${course.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{course.code}</span>
                                        {!course.isActive && (
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] font-black uppercase tracking-wider">Éliminé</span>
                                        )}
                                    </div>
                                    <h3 className={`font-bold transition-colors ${course.isActive ? 'text-gray-900' : 'text-gray-500'
                                        }`}>{course.name}</h3>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggle(course.code, course.isActive)}
                                disabled={updating === course.code}
                                className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${updating === course.code ? 'bg-gray-100 cursor-wait' :
                                    course.isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95'
                                        : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                                    }`}
                            >
                                {updating === course.code ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : course.isActive ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                                        <div className="w-3 h-3 bg-current rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Aucun cours trouvé</h3>
                    <p className="text-gray-500">Essayez de modifier votre recherche ou vos filtres</p>
                </div>
            )}
        </div>
    );
}
