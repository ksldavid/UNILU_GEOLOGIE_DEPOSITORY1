import { useState, useEffect, useRef } from "react";
import { BookOpen, Clock, MapPin, User, FileText, Download, ArrowLeft, Send, CheckCircle2, AlertCircle, ChevronRight, UploadCloud, Loader2 } from "lucide-react";
import { motion } from "motion/react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCourseClick = async (course: any) => {
    setLoadingDetails(true);
    try {
      const details = await studentService.getCourseDetails(course.code);
      setSelectedCourse(details);
    } catch (error) {
      console.error(error);
      setSelectedCourse(course); // Fallback to list data
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
      // Refresh details to show submission status
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-[40px]" />
        <Skeleton className="h-64 rounded-[40px]" />
        <Skeleton className="h-64 rounded-[40px]" />
        <Skeleton className="h-64 rounded-[40px]" />
      </div>
    </div>
  );


  if (selectedCourse) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-8 space-y-8 max-w-7xl mx-auto ${loadingDetails ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600 transition-colors group px-2 py-1 rounded-lg hover:bg-blue-50 w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Retour aux cours
        </button>

        {/* Course Info Header */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] -mr-32 -mt-32 rounded-full"
            style={{ background: `linear-gradient(to bottom right, ${selectedCourse.colorFrom}, ${selectedCourse.colorTo})` }}
          />

          <div className="relative space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div
                  className="w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-500/10 shrink-0"
                  style={{ background: `linear-gradient(to bottom right, ${selectedCourse.colorFrom}, ${selectedCourse.colorTo})` }}
                >
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap text-[10px] font-black uppercase tracking-widest">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg">{selectedCourse.code}</span>
                    <span className="text-blue-600 px-3 py-1 bg-blue-50 rounded-lg">{academicLevel}</span>
                  </div>
                  <h1 className={`font-black text-gray-900 tracking-tight leading-tight ${selectedCourse.name.length > 50 ? 'text-2xl' :
                    selectedCourse.name.length > 30 ? 'text-3xl' : 'text-4xl'
                    }`}>{selectedCourse.name}</h1>
                </div>
              </div>
            </div>

            {/* Metadata Row - Full width to avoid squeezing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-blue-50/50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                  <User className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] mb-1">Professeur</p>
                  <p className="text-gray-900 font-bold leading-none">{selectedCourse.professor}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-purple-50/50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300">
                  <MapPin className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] mb-1">Lieu d'étude</p>
                  <p className="text-gray-900 font-bold leading-none">{selectedCourse.room}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-orange-50/50 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-colors duration-300">
                  <Clock className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] mb-1">Programmation</p>
                  <p className="text-gray-900 font-bold leading-none">{selectedCourse.schedule}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Materials & Assignments */}
          <div className="lg:col-span-2 space-y-8">

            {/* Devoirs à remettre */}
            <div className="bg-[#0F172A] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-colors duration-700"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24"></div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                      <Send className="w-7 h-7 text-blue-400" />
                    </div>
                    Travaux Pratiques
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] px-4 py-1.5 bg-blue-400/10 rounded-full border border-blue-400/20">
                      En cours
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
                    <div className="py-12 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 border-dashed">
                      <Send className="w-10 h-10 text-white/20 mb-4" />
                      <p className="text-gray-400 font-bold italic">Aucun travail à remettre pour le moment</p>
                    </div>
                  ) : selectedCourse.assignments.filter((a: any) => a.type === 'TP' || a.type === 'TD').map((assignment: any) => {
                    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);

                    return (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 hover:border-white/20 transition-all relative overflow-hidden group/item"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-3 py-1 bg-blue-400/10 rounded-lg border border-blue-400/20 italic">{assignment.type}</span>
                              {assignment.dueDate && (
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isLate ? 'text-rose-400' : 'text-gray-400'}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {isLate ? 'Délai dépassé' : `Échéance : ${new Date(assignment.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                                </div>
                              )}
                            </div>
                            <h4 className="text-xl font-black group-hover/item:text-blue-400 transition-colors uppercase tracking-tight">{assignment.title}</h4>
                            {assignment.submitted && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1 rounded-full border border-emerald-400/20">
                                <CheckCircle2 className="w-3 h-3" /> Remis le {new Date().toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            {assignment.submitted ? (
                              <div className="flex flex-col gap-3 items-end">
                                <div className="px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg shadow-emerald-900/20">
                                  <CheckCircle2 className="w-4 h-4" /> Terminé
                                </div>
                                <a
                                  href={assignment.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-gray-500 hover:text-white font-black uppercase tracking-widest flex items-center gap-2 transition-colors pr-2"
                                >
                                  Modifier le fichier <ChevronRight className="w-3 h-3" />
                                </a>
                              </div>
                            ) : isLate ? (
                              <div className="px-6 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 opacity-60">
                                <AlertCircle className="w-4 h-4" /> Fermé
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAssignmentClick(assignment.id)}
                                disabled={isSubmitting}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50"
                              >
                                {isSubmitting && activeAssignmentId === assignment.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <UploadCloud className="w-5 h-5" />
                                )}
                                Déposer le PDF
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Supports de cours */}
            <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors duration-500"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <FileText className="w-7 h-7 text-indigo-600" />
                    </div>
                    Supports de cours
                  </h3>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-4 py-1.5 bg-indigo-50 rounded-full italic">
                    {selectedCourse.resources?.length || 0} Documents
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {selectedCourse.resources?.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                        <FileText className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-bold italic">Aucun support disponible pour ce cours</p>
                    </div>
                  ) : (
                    <>
                      {selectedCourse.resources.slice(0, showAllResources ? undefined : 4).map((resource: any) => (
                        <motion.a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ x: 4, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="p-5 bg-white border border-gray-100 rounded-[28px] hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group/item flex items-center gap-5"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover/item:bg-indigo-600 transition-colors duration-300 shrink-0 shadow-inner">
                            <FileText className="w-7 h-7 text-indigo-500 group-hover/item:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 group-hover/item:text-indigo-600 transition-colors text-base mb-1 tracking-tight leading-snug break-words">
                              {resource.title}
                            </h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {new Date(resource.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className="text-[10px] text-indigo-500/60 font-black uppercase tracking-widest italic">PDF</span>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 group-hover/item:bg-indigo-50 transition-colors">
                            <Download className="w-4 h-4 text-gray-400 group-hover/item:text-indigo-600" />
                          </div>
                        </motion.a>
                      ))}

                      {selectedCourse.resources.length > 4 && (
                        <button
                          onClick={() => setShowAllResources(!showAllResources)}
                          className="w-full py-4 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center gap-3 group"
                        >
                          {showAllResources ? "Réduire la liste" : `Voir les ${selectedCourse.resources.length - 4} autres documents`}
                          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showAllResources ? "-rotate-90" : "rotate-90"}`} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Panel */}
          <div className="space-y-8">
            {/* Presence Widget */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-500"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black">{selectedCourse.attendance}%</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Présence</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedCourse.attendance}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                  <p className="text-[10px] font-bold italic opacity-80 leading-relaxed text-center">
                    Excellent ! Continuez ainsi pour valider votre semestre.
                  </p>
                </div>
              </div>
            </div>

            {/* Rules Widget */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-12 -mt-12"></div>

              <div className="relative">
                <h3 className="text-gray-900 font-black mb-6 flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  Règles & Infos
                </h3>

                <div className="space-y-6">
                  <div className="flex gap-4 group/item">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0 group-hover/item:scale-150 transition-transform" />
                    <p className="text-gray-500 text-xs font-bold leading-relaxed italic">
                      La présence aux TP est <span className="text-gray-900 not-italic">obligatoire</span> pour valider l'unité d'enseignement.
                    </p>
                  </div>
                  <div className="flex gap-4 group/item">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0 group-hover/item:scale-150 transition-transform" />
                    <p className="text-gray-500 text-xs font-bold leading-relaxed italic">
                      Toute absence doit être justifiée dans les <span className="text-gray-900 not-italic">48h</span> auprès du secrétariat.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50">
                  <button className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                    Voir le règlement complet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const DetailsSkeleton = () => (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-48 rounded-[40px]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-64 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </div>
    </div>
  );

  if (loadingDetails) return <DetailsSkeleton />;


  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Mes Cours</h1>
        <p className="text-gray-500 font-medium tracking-tight">Gérez et accédez à vos supports de {academicLevel}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -4 }}
            onClick={() => handleCourseClick(course)}
            className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${course.color} opacity-[0.03] -mr-16 -mt-16 rounded-full transition-transform group-hover:scale-150 duration-700`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-8 relative">
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0"
                  style={{
                    background: `linear-gradient(to bottom right, ${course.colorFrom}, ${course.colorTo})`
                  }}
                >
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{course.code}</span>
                  <h3 className={`font-black text-gray-900 tracking-tight truncate ${course.name.length > 35 ? 'text-lg' :
                    course.name.length > 25 ? 'text-xl' : 'text-2xl'
                    }`}>{course.name}</h3>
                </div>
              </div>
            </div>

            {/* Icons Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 relative">
              <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                <div className="p-2 bg-gray-50 rounded-lg"><User className="w-4 h-4 text-gray-400" /></div>
                <span>{course.professor}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                <div className="p-2 bg-gray-50 rounded-lg"><MapPin className="w-4 h-4 text-gray-400" /></div>
                <span>{course.room}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 font-bold col-span-2">
                <div className="p-2 bg-gray-50 rounded-lg"><Clock className="w-4 h-4 text-gray-400" /></div>
                <span>{course.schedule}</span>
              </div>
            </div>

            {/* Resources Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-50 relative">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-widest">
                  <FileText className="w-4 h-4" />
                  <span>{course.materials} Docs</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-widest border-l border-gray-100 pl-4">
                  <Send className="w-4 h-4" />
                  <span>{course.assignments} Devoirs</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-teal-600 group-hover:translate-x-1 transition-transform">
                <span className="text-[10px] font-black uppercase tracking-widest text-end italic">Accéder</span>
                <ChevronRight className="w-4 h-4 text-end italic" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
