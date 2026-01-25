import { useState, useEffect, useRef } from "react";
import { BookOpen, Clock, MapPin, User, FileText, Download, ArrowLeft, Send, CheckCircle2, AlertCircle, ChevronRight, UploadCloud, Loader2, GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { studentService } from "../../services/student";
import { Skeleton } from "../Skeleton";

export function StudentCourses() {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [academicLevel, setAcademicLevel] = useState<string>('Étudiant');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
  const [showAllResources, setShowAllResources] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCourseClick = async (course: any) => {
    setLoadingDetails(true);
    try {
      const details = await studentService.getCourseDetails(course.code);
      setSelectedCourse(details);
    } catch (error) {
      console.error(error);
      setSelectedCourse(course);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await studentService.getCourses();
        setAcademicLevel(data.academicLevel || 'Étudiant');
        setCourses(data.courses || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleAssignmentClick = (assignmentId: number) => {
    const assignment = selectedCourse.assignments.find((a: any) => a.id === assignmentId);
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      alert("La date limite est passée.");
      return;
    }
    setActiveAssignmentId(assignmentId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeAssignmentId) return;

    if (file.type !== 'application/pdf') {
      alert("Veuillez sélectionner un fichier PDF.");
      return;
    }

    setIsSubmitting(true);
    try {
      await studentService.submitAssignment(activeAssignmentId.toString(), file);
      alert("Travail déposé avec succès !");
      const details = await studentService.getCourseDetails(selectedCourse.code);
      setSelectedCourse(details);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors du dépôt");
    } finally {
      setIsSubmitting(false);
      setActiveAssignmentId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      <Skeleton className="h-16 w-64 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Skeleton className="h-72 rounded-[48px]" />
        <Skeleton className="h-72 rounded-[48px]" />
        <Skeleton className="h-72 rounded-[48px]" />
        <Skeleton className="h-72 rounded-[48px]" />
      </div>
    </div>
  );

  if (selectedCourse) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-10 space-y-12 max-w-7xl mx-auto">
        <button
          onClick={() => setSelectedCourse(null)}
          className="group flex items-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] hover:text-[#009485] transition-all"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Retour au campus
        </button>

        {/* Detailed Course Header - Premium */}
        <div className="bg-[#0F172A] rounded-[50px] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#009485]/20 to-transparent blur-[100px] -mr-32 -mt-32 rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-28 h-28 rounded-[36px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <BookOpen className="w-12 h-12 text-[#00E5BC]" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">{selectedCourse.code}</span>
                <span className="px-4 py-1.5 bg-[#009485]/20 text-[#00E5BC] rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">{academicLevel}</span>
                {selectedCourse.isFinished && (
                  <span className="px-4 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    ARCHIVÉ
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1]">{selectedCourse.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/5">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#009485] transition-all">
                <User className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Responsable</p>
                <p className="text-base font-bold text-white uppercase">{selectedCourse.professor}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#009485] transition-all">
                <MapPin className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Localisation</p>
                <p className="text-base font-bold text-white uppercase">{selectedCourse.room}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#009485] transition-all">
                <Clock className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horaires</p>
                <p className="text-base font-bold text-white uppercase">{selectedCourse.schedule}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Work Area */}
          <div className="lg:col-span-2 space-y-12">

            {/* Active TPs Section */}
            <div className="bg-[#0F172A] rounded-[50px] p-12 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#009485]/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />

              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black tracking-tight flex items-center gap-5">
                  <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                    <Send className="w-8 h-8 text-[#00E5BC]" />
                  </div>
                  Travaux Pratiques
                </h3>
                <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-[#00E5BC]">Session Ouverte</div>
              </div>

              <div className="space-y-6">
                {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
                  <div className="py-20 text-center bg-white/2 rounded-[40px] border-2 border-dashed border-white/5">
                    <p className="text-slate-500 font-bold italic">Aucune consigne déposée pour le moment.</p>
                  </div>
                ) : selectedCourse.assignments.filter((a: any) => (a.type === 'TP' || a.type === 'TD') && !a.submitted).map((assignment: any) => {
                  const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);
                  return (
                    <motion.div key={assignment.id} className="bg-white/5 border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.08] transition-all group/item">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-[#00E5BC] uppercase tracking-[0.3em] bg-[#009485]/20 px-3 py-1 rounded-lg">PROJET {assignment.type}</span>
                            {assignment.dueDate && <span className={`text-[10px] font-black uppercase tracking-widest ${isLate ? 'text-rose-400' : 'text-slate-500'}`}>Limite: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                          </div>
                          <h4 className="text-2xl font-black tracking-tight uppercase group-hover/item:text-[#00E5BC] transition-colors">{assignment.title}</h4>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed italic border-l-2 border-white/10 pl-6">{assignment.instructions || "Consulter le PDF joint pour les instructions détaillées."}</p>
                        </div>
                        <button
                          onClick={() => handleAssignmentClick(assignment.id)}
                          disabled={isSubmitting || isLate}
                          className="h-20 px-10 bg-[#009485] hover:bg-[#00E5BC] text-white hover:text-slate-950 rounded-[24px] font-black text-[12px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95 shadow-2xl shadow-[#009485]/20"
                        >
                          {isSubmitting && activeAssignmentId === assignment.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 shadow-sm" />}
                          Déposer PDF
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Submissions Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-[#009485] rounded-full" />
                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-widest">Travaux Soumis</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {selectedCourse.assignments?.filter((a: any) => a.submitted).map((assignment: any) => (
                  <div key={assignment.id} className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm hover:shadow-xl transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-950 text-xl tracking-tight uppercase truncate max-w-sm">{assignment.title}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Validé le {new Date(assignment.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={assignment.submissionUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100">
                      <Download className="w-6 h-6" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-widest">Supports de cours</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCourse.resources?.map((resource: any) => (
                  <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm hover:shadow-2xl transition-all group flex items-start gap-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-[#0F172A] group-hover:text-white shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-950 text-lg tracking-tight uppercase leading-tight group-hover:text-[#009485] transition-colors">{resource.title}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Format PDF • {new Date(resource.date).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-10">
            <div className="bg-[#1B4332] rounded-[50px] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#00E5BC]" />
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black tracking-tighter">{selectedCourse.attendance}%</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E5BC]/60">Taux de présence</p>
                  </div>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${selectedCourse.attendance}%` }} className="h-full bg-gradient-to-r from-[#00E5BC] to-emerald-400 rounded-full shadow-[0_0_20px_rgba(0,229,188,0.5)]" />
                </div>
                <p className="text-[10px] font-bold italic text-teal-100/60 mt-6 text-center leading-relaxed">Engagement académique validé sur la période.</p>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-lg font-black text-slate-950 tracking-widest uppercase flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Réglement
              </h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-2 shrink-0" />
                  <p className="text-slate-500 text-xs font-bold leading-relaxed italic">Les TP sont obligatoires et notés sur l'ensemble du semestre.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-2 shrink-0" />
                  <p className="text-slate-500 text-xs font-bold leading-relaxed italic">Tout retard supérieur à 15min est compté comme absence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-12 border-b border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#009485]" />
            <span className="text-[#009485] font-black text-[11px] uppercase tracking-[0.4em]">Campus Numérique</span>
          </div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter">Mes Enseignements<span className="text-[#009485]">.</span></h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">Accédez à vos supports de cours et déposez vos travaux pour le niveau {academicLevel}.</p>
        </div>
        <div className="bg-slate-50 px-8 py-4 rounded-[24px] border border-slate-100 shadow-inner">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{courses.length} Cours Disponibles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -10 }}
            onClick={() => handleCourseClick(course)}
            className={`group relative bg-white rounded-[50px] p-10 shadow-sm border border-slate-100 hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.12)] transition-all cursor-pointer overflow-hidden ${course.status === 'FINISHED' ? 'bg-slate-50/50 grayscale-[0.5]' : ''}`}
          >
            <div className={`absolute top-0 right-0 w-48 h-48 bg-teal-500 opacity-0 group-hover:opacity-[0.03] rounded-bl-[100px] transition-all duration-700 group-hover:scale-125`} />

            <div className="flex items-start justify-between mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-950 shadow-2xl flex items-center justify-center transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500">
                  <BookOpen className="w-10 h-10 text-[#00E5BC]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{course.code}</span>
                    {course.status === 'FINISHED' && (
                      <span className="bg-slate-800 text-[#00E5BC] text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-md">ARCHIVE</span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-slate-950 tracking-tight leading-none uppercase group-hover:text-[#009485] transition-colors">{course.name}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 relative z-10 lg:pr-10">
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-teal-50 group-hover/item:text-[#009485] transition-all">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{course.professor}</span>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-teal-50 group-hover/item:text-[#009485] transition-all">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{course.room}</span>
              </div>
              <div className="flex items-center gap-4 group/item sm:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-teal-50 group-hover/item:text-[#009485] transition-all">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{course.schedule}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-slate-50 relative z-10 transition-colors group-hover:border-teal-100">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <FileText className="w-4 h-4" /> {course.materials} Documents
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <Send className="w-4 h-4" /> {course.assignments} Devoirs
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#009485] font-black tracking-[0.2em] text-[10px] uppercase italic transition-all group-hover:translate-x-2">
                Accéder <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
