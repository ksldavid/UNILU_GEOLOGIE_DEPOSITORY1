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
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6 md:mb-10 text-center md:text-left">
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2 tracking-tight">Mon Parcours</h1>
                <p className="text-gray-500 text-xs md:text-base font-medium tracking-tight px-4 md:px-0">Configurez votre programme académique annuel</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-8 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                    <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="text-[11px] md:text-sm text-blue-800 leading-relaxed font-medium">
                    <strong>Note :</strong> Les cours désactivés seront masqués de votre emploi du temps et des listes d'appel.
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-6 md:mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un module..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white border border-gray-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm"
                    />
                </div>
                <div className="flex bg-white p-1 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                    {(['all', 'active', 'inactive'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 min-w-fit px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
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
                            className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] border transition-all duration-300 flex items-center justify-between group ${course.isActive
                                ? 'bg-white border-gray-100 hover:border-blue-200'
                                : 'bg-gray-50/50 border-transparent opacity-75'
                                }`}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-colors shrink-0 flex items-center justify-center ${course.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0 truncate">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{course.code}</span>
                                        {!course.isActive && (
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[8px] md:text-[9px] font-black uppercase tracking-wider">Éliminé</span>
                                        )}
                                    </div>
                                    <h3 className={`font-black text-sm md:text-base transition-colors truncate ${course.isActive ? 'text-gray-900' : 'text-gray-500'
                                        }`}>{course.name}</h3>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggle(course.code, course.isActive)}
                                disabled={updating === course.code}
                                className={`relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 shrink-0 ml-4 ${updating === course.code ? 'bg-gray-100 cursor-wait' :
                                    course.isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95'
                                        : 'bg-white border-2 border-gray-100 text-gray-300 hover:border-blue-300 hover:text-blue-500'
                                    }`}
                            >
                                {updating === course.code ? (
                                    <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                ) : course.isActive ? (
                                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                                ) : (
                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-current flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-current rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-16 md:py-20 bg-gray-50 rounded-3xl md:rounded-[40px] border-2 border-dashed border-gray-200 px-6">
                    <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase">Aucun cours trouvé</h3>
                    <p className="text-gray-500 text-xs md:text-sm font-medium">Modifiez votre recherche ou vos filtres</p>
                </div>
            )}
        </div>
    );
}
