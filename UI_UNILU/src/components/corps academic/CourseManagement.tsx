import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, FileText, Users, ClipboardList, UserPlus, FilePlus,
  Settings2, BarChart3, UploadCloud, ChevronRight, Loader2, CheckCircle2,
  Search, Plus, Calendar, Download, Trash2, Eye, Mail,
  AlertTriangle, X, UserCheck, Send, History, Save
} from "lucide-react";
import { toast } from 'sonner';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Course } from "../../App";
import { professorService } from "../../services/professor";

interface CourseManagementProps {
  course: Course;
  onBack: () => void;
  onTakeAttendance: () => void;
}

type SubView = 'main' | 'students' | 'create-exam' | 'manage-exams' | 'performance' | 'documents' | 'add-student' | 'assignments' | 'exam-details' | 'modif-history';

export function CourseManagement({ course, onBack, onTakeAttendance }: CourseManagementProps) {
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<any>(null);
  const [selectedExamId, setSelectedExamId] = useState<number>(0);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedStudentForModif, setSelectedStudentForModif] = useState<any>(null);
  const [showModifModal, setShowModifModal] = useState(false);
  const [modifReason, setModifReason] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [modifFile, setModifFile] = useState<File | null>(null);
  const [isSubmittingModif, setIsSubmittingModif] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modifFileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [modifHistory, setModifHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedStudentPerformance, setSelectedStudentPerformance] = useState<any | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [loadingCourseStats, setLoadingCourseStats] = useState(false);
  const [newExamData, setNewExamData] = useState({
    title: "",
    type: "INTERROGATION",
    maxPoints: "10",
    date: new Date().toISOString().split('T')[0],
    weight: "1"
  });
  const [tempGrades, setTempGrades] = useState<Record<string, string>>({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'matricule'>('name');
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    instructions: "",
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: "23:59"
  });
  const [isLaunchingAssignment, setIsLaunchingAssignment] = useState(false);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState<any>(null);

  const handleDownloadAllAsZip = async (assignment: any) => {
    if (!assignment.submissions || assignment.submissions.length === 0) {
      alert("Aucune soumission à télécharger.");
      return;
    }

    const zip = new JSZip();
    const folderName = `${course.name}_${assignment.title}`.replace(/[\/\\?%*:|"<>]/g, '_');
    const folder = zip.folder(folderName);

    if (!folder) return;

    alert(`Préparation du dossier compressé...\n${assignment.submissions.length} fichier(s) en cours de traitement.\nLe téléchargement démarrera automatiquement.`);

    try {
      const downloadPromises = assignment.submissions.map(async (sub: any) => {
        try {
          const response = await fetch(sub.fileUrl);
          if (!response.ok) throw new Error("Échec du téléchargement");
          const blob = await response.blob();
          const fileName = `${sub.student?.name || 'Etudiant'}_${assignment.title}.pdf`.replace(/[\/\\?%*:|"<>]/g, '_');
          folder.file(fileName, blob);
        } catch (err) {
          console.error(`Erreur sur le fichier de ${sub.student?.name}:`, err);
        }
      });

      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
    } catch (error) {
      console.error("Erreur ZIP:", error);
      alert("Une erreur est survenue lors de la création du ZIP. Veuillez réessayer ou télécharger les fichiers individuellement.");
    }
  };


  useEffect(() => {
    if (selectedStudentPerformance) {
      const fetchPerformance = async () => {
        setLoadingPerformance(true);
        try {
          const data = await professorService.getStudentPerformance(selectedStudentPerformance.id, course.code);
          setPerformanceData(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingPerformance(false);
        }
      };
      fetchPerformance();
    } else {
      setPerformanceData(null);
    }
  }, [selectedStudentPerformance, course.code]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const courseStudents = await professorService.getStudents(course.code);

      const formattedStudents = courseStudents.map((s: any) => ({
        id: s.id,
        name: s.name,
        matricule: s.id,
        attendance: s.attendance || 0,
        grade: s.grade || 0,
        totalSessions: s.totalSessions || 0,
        presentCount: s.presentCount || 0
      }));
      setStudents(formattedStudents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const data = await professorService.getCourseAssessments(course.code);
      setExams(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const data = await professorService.getCourseResources(course.code);
      setResources(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (activeSubView === 'students' || activeSubView === 'exam-details') {
      fetchStudents();
    }
  }, [activeSubView, course.code, course.name]);

  useEffect(() => {
    if (activeSubView === 'manage-exams' || activeSubView === 'main' || activeSubView === 'assignments') {
      fetchExams();
    }
  }, [activeSubView, course.code]);

  useEffect(() => {
    if (activeSubView === 'documents' || activeSubView === 'main') {
      fetchResources();
    }
  }, [activeSubView, course.code]);

  useEffect(() => {
    if (activeSubView === 'performance') {
      const fetchCoursePerformance = async () => {
        setLoadingCourseStats(true);
        try {
          const data = await professorService.getCoursePerformance(course.code);
          setCourseStats(data);
        } catch (error) {
          console.error(error);
          toast.error("Impossible de charger les statistiques de performance");
        } finally {
          setLoadingCourseStats(false);
        }
      };
      fetchCoursePerformance();
    }
  }, [activeSubView, course.code]);

  useEffect(() => {
    if (selectedExam && selectedExam.grades) {
      const gradesMap: Record<string, string> = {};
      selectedExam.grades.forEach((g: any) => {
        gradesMap[g.studentId] = g.score.toString();
      });
      setTempGrades(gradesMap);
    }
  }, [selectedExam]);

  const handleSaveGrades = async () => {
    if (!selectedExam) return;
    setIsSavingGrades(true);
    try {
      const gradesArray = Object.entries(tempGrades).map(([studentId, score]) => {
        if (score === "") return null;
        const s = parseFloat(score);
        if (s > (selectedExam.maxPoints || 20)) {
          throw new Error(`La note (${s}) dépasse le maximum autorisé pour cette évaluation (${selectedExam.maxPoints}).`);
        }
        return {
          studentId,
          score: s
        };
      }).filter(g => g !== null);
      await professorService.saveGrades(selectedExam.id, gradesArray);
      alert("Notes enregistrées avec succès !");
      fetchExams(); // Pour être sûr d'avoir les données à jour
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de l'enregistrement des notes");
    } finally {
      setIsSavingGrades(false);
    }
  };

  const handlePublishAllGrades = async () => {
    if (!selectedExam) return;
    if (!window.confirm("Êtes-vous sûr de vouloir publier ces points ? Une fois publiés, les étudiants pourront les voir. Les étudiants n'ayant pas de points se verront attribuer un 0 par défaut.")) return;

    try {
      await professorService.publishAssessment(selectedExam.id);
      alert("Points publiés avec succès !");
      // Update local state to reflect change
      setSelectedExam({ ...selectedExam, isPublished: true });
      fetchExams(); // Refresh lists
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la publication");
    }
  };

  const handleCreateExam = async () => {
    if (!newExamData.title.trim()) {
      alert("Veuillez donner un titre à l'évaluation");
      return;
    }
    try {
      await professorService.createAssessment({
        ...newExamData,
        courseCode: course.code
      });
      alert("Évaluation créée avec succès !");
      setNewExamData({
        title: "",
        type: "INTERROGATION",
        maxPoints: "20",
        date: new Date().toISOString().split('T')[0],
        weight: "1"
      });
      setActiveSubView('manage-exams');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création");
    }
  };

  const handleDeleteExam = async (e: React.MouseEvent, examId: number) => {
    e.stopPropagation(); // Empêcher d'ouvrir les détails
    if (!window.confirm("Voulez-vous vraiment supprimer cette épreuve ? Cette action est irréversible et supprimera toutes les notes associées.")) return;

    try {
      await professorService.deleteAssessment(examId);
      alert("Épreuve supprimée avec succès.");
      fetchExams(); // Rafraîchir la liste
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression de l'épreuve.");
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    try {
      await professorService.deleteResource(resourceId);
      // Refresh list
      fetchResources();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du document");
    }
  };

  const handleLaunchAssignment = async () => {
    if (!assignmentData.title || !assignmentData.dueDate || !assignmentData.dueTime) return;
    setIsLaunchingAssignment(true);
    try {
      // Combinaison de la date et de l'heure
      const dueDateTime = new Date(`${assignmentData.dueDate}T${assignmentData.dueTime}`);

      await professorService.createAssessment({
        title: assignmentData.title,
        instructions: assignmentData.instructions,
        type: 'TP',
        maxPoints: 20,
        date: new Date().toISOString(),
        dueDate: dueDateTime.toISOString(),
        courseCode: course.code,
        weight: 1
      });
      alert(`Travail lancé avec succès ! Date limite : ${new Date(dueDateTime).toLocaleString('fr-FR', { hour12: false })}`);
      setAssignmentData({
        title: "",
        instructions: "",
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: "23:59"
      });
      fetchExams(); // Refresh assignments list
    } catch (error) {
      console.error(error);
      alert("Erreur lors du lancement du travail");
    } finally {
      setIsLaunchingAssignment(false);
    }
  };

  const [globalStudents, setGlobalStudents] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setGlobalStudents([]);
        return;
      }
      setIsSearchingGlobal(true);
      try {
        const results = await professorService.searchStudents(searchQuery);
        setGlobalStudents(results);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearchingGlobal(false);
      }
    };

    if (activeSubView === 'add-student') {
      const timer = setTimeout(search, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeSubView]);



  useEffect(() => {
    if (activeSubView === 'modif-history') {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const { gradeService } = await import("../../services/grade");
          const data = await gradeService.getMyRequests();
          setModifHistory(data);
        } catch (error) {
          console.error(error);
          toast.error("Impossible de charger l'historique");
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeSubView]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setPendingFile(event.target.files[0]);
    }
  };

  const confirmUpload = async () => {
    if (pendingFile) {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadSuccess(false);

      try {
        // Simuler une progression visuelle rapide avant l'appel API permanent
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
        }, 200);

        await professorService.uploadResource(course.code, pendingFile.name, pendingFile);

        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadSuccess(true);
        fetchResources(); // Rafraîchir la liste
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error: any) {
        console.error(error);
        alert(error.message || "Erreur lors de l'envoi du document");
      } finally {
        setIsUploading(false);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setPendingFile(e.dataTransfer.files[0]);
    }
  };

  const actions = [
    {
      title: "Prendre la présence",
      description: "Accédez à l'interface de gestion des présences pour chaque séance de cours.",
      icon: ClipboardList,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      onClick: onTakeAttendance
    },
    {
      title: "Voir les étudiants",
      description: "Consultez la liste complète des étudiants inscrits à ce cours et leurs informations.",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      onClick: () => setActiveSubView('students')
    },
    {
      title: "Ajouter un étudiant",
      description: "Inscrire un étudiant déjà présent dans le système pour ce cours spécifique.",
      icon: UserPlus,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      onClick: () => setActiveSubView('add-student')
    },
    {
      title: "Créer une épreuve",
      description: "Planifiez une nouvelle évaluation, interrogation ou examen pour ce cours.",
      icon: FilePlus,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      onClick: () => setActiveSubView('create-exam')
    },
    {
      title: "Gérer les épreuves",
      description: "Consultez l'historique des évaluations, saisissez les points et publiez les résultats.",
      icon: Settings2,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      onClick: () => setActiveSubView('manage-exams')
    },
    {
      title: "Statistiques & Performance",
      description: "Analysez le taux de réussite et les statistiques globales d'assiduité de votre promotion.",
      icon: BarChart3,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      onClick: () => setActiveSubView('performance')
    },
    {
      title: "Travail à durée limitée",
      description: "Créez une zone de dépôt de devoirs avec une date d'échéance stricte pour vos étudiants.",
      icon: Calendar,
      iconBg: "bg-fuchsia-100",
      iconColor: "text-fuchsia-600",
      onClick: () => setActiveSubView('assignments')
    },
    {
      title: "Historique des changements",
      description: "Consultez le statut et les réponses du service académique pour vos demandes de modification.",
      icon: History,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      onClick: () => setActiveSubView('modif-history')
    }
  ];

  const filteredGlobalStudents = globalStudents.filter(s =>
    (s.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (s.id?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Global Components (Modals & Inputs)
  const GlobalComponents = () => (
    <>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* Upload confirmation / progress Modal - ONLY in sub-views */}
      {(pendingFile || isUploading || uploadSuccess) && activeSubView !== 'main' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1B4332] rounded-[44px] p-12 border border-white/10 relative overflow-hidden max-w-2xl w-full shadow-2xl">
            <button
              onClick={() => { setPendingFile(null); setIsUploading(false); setUploadSuccess(false); }}
              className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors z-50"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              {pendingFile && !isUploading && !uploadSuccess && (
                <div className="animate-in zoom-in-95 duration-300 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center mb-8 border border-white/20">
                    <FileText className="w-12 h-12 text-teal-300" />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Prêt à soumettre ?</h3>
                  <div className="px-6 py-3 bg-teal-900/50 rounded-2xl border border-white/5 mb-10">
                    <p className="text-teal-100 font-bold italic truncate max-w-sm">"{pendingFile.name}"</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={cancelUpload} className="px-8 py-4 rounded-2xl font-bold bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10">Annuler</button>
                    <button onClick={confirmUpload} className="px-10 py-5 rounded-2xl font-black bg-white text-teal-900 hover:bg-teal-50 transition-all shadow-xl shadow-teal-900/40 flex items-center gap-3">
                      Confirmer l'envoi
                      <ArrowLeft className="w-6 h-6 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="relative mb-12">
                    <div className="w-32 h-32 border-8 border-teal-500/20 rounded-full animate-spin border-t-white"></div>
                    <Loader2 className="w-12 h-12 text-teal-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Transmission En Cours</h3>
                  <p className="text-teal-400 font-black tracking-[0.3em] text-xs animate-pulse">CRYPTAGE & OPTIMISATION DES PACKETS</p>
                  <div className="w-full bg-white/10 h-6 rounded-full overflow-hidden mt-12 mb-6 p-1.5 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 h-full rounded-full transition-all duration-300 shadow-[0_0_25px_rgba(45,212,191,0.6)]"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-7xl font-black text-white">{uploadProgress}</span>
                    <span className="text-3xl font-bold text-teal-400 mb-2">%</span>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                  <div className="w-32 h-32 bg-emerald-500 rounded-[40px] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(16,185,129,0.5)] border-4 border-white/20 rotate-3">
                    <CheckCircle2 className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-5xl font-black text-white mb-4 tracking-tighter">TERMINE !</h3>
                  <p className="text-teal-100/70 text-xl font-medium">Le document est archivé et disponible pour la promotion.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submissions View Modal */}
      {selectedAssignmentForSubmissions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B011D]/80 backdrop-blur-xl" onClick={() => setSelectedAssignmentForSubmissions(null)}></div>
          <div className="bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="bg-gradient-to-r from-[#10002B] via-[#240046] to-[#3C096C] -m-10 p-10 mb-10 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black">{selectedAssignmentForSubmissions.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-fuchsia-400 font-bold uppercase tracking-widest text-[10px] bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">
                      {selectedAssignmentForSubmissions.submissions?.length || 0} Soumissions reçues
                    </p>
                    <span className="text-white/20">|</span>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{course.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedAssignmentForSubmissions.submissions?.length > 0 && (
                    <button
                      onClick={() => handleDownloadAllAsZip(selectedAssignmentForSubmissions)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl active:scale-95 group"
                    >
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      Tout télécharger (ZIP)
                    </button>
                  )}
                  <button onClick={() => setSelectedAssignmentForSubmissions(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedAssignmentForSubmissions.submissions?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedAssignmentForSubmissions.submissions.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[28px] hover:bg-gray-100 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black">
                            {sub.student?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg">{sub.student?.name}</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Posté le {new Date(sub.submittedAt).toLocaleDateString()} à {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> Voir
                          </a>
                          <a
                            href={sub.fileUrl}
                            download={`${sub.student?.name || 'Etudiant'}_${selectedAssignmentForSubmissions.title}.pdf`}
                            className="bg-white text-gray-900 px-4 py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:bg-gray-50 border border-gray-200"
                          >
                            <Download className="w-4 h-4" /> Télécharger
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Aucune soumission pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (activeSubView === 'students') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Liste des Étudiants</h1>
            <p className="text-gray-500 font-medium">Promotion {course.level} • {course.name}</p>
          </div>
          <button onClick={() => setActiveSubView('add-student')} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-teal-700 hover:-translate-y-1 transition-all">
            <Plus className="w-5 h-5" /> Ajouter un étudiant
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50 flex gap-4 bg-gray-50/30">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou matricule..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="matricule">Matricule</option>
                <option value="attendance">Taux de présence</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5 text-end">Identité</th>
                  <th className="px-8 py-5">Matricule</th>
                  <th className="px-8 py-5">Assiduité</th>
                  <th className="px-8 py-5">Moyenne</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingStudents ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Chargement des étudiants...</p>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16">
                      <div className="text-center">
                        <p className="text-gray-400 font-bold text-sm italic">Aucun étudiant inscrit pour ce cours</p>
                      </div>
                    </td>
                  </tr>
                ) : students.filter(s =>
                  s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.matricule?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16">
                      <div className="text-center">
                        <p className="text-gray-400 font-bold text-sm italic">Aucun résultat trouvé pour "{searchQuery}"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students
                    .filter(s =>
                      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.matricule?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      if (sortBy === 'name') return (a.name || "").localeCompare(b.name || "");
                      if (sortBy === 'matricule') return (a.matricule || "").localeCompare(b.matricule || "");
                      if (sortBy === 'attendance') return (b.attendance || 0) - (a.attendance || 0);
                      return 0;
                    })
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-gray-500 font-bold">{student.matricule}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden min-w-[100px]">
                              <div
                                className={`h-full transition-all duration-1000 ${student.attendance > 80 ? 'bg-emerald-500' : student.attendance > 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${student.attendance}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{student.attendance}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg font-bold">
                            {student.grade}/10
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudentPerformance(student)}
                            className="p-2.5 hover:bg-teal-50 rounded-xl text-teal-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-2.5 hover:bg-red-50 rounded-xl text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Details Modal */}
        {selectedStudentPerformance && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-black">{selectedStudentPerformance.name}</h3>
                  <p className="text-teal-50 text-xs font-mono font-bold tracking-widest opacity-80">{selectedStudentPerformance.id}</p>
                </div>
                <button
                  onClick={() => setSelectedStudentPerformance(null)}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                {loadingPerformance ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-black uppercase tracking-widest text-[10px]">Chargement des données...</p>
                  </div>
                ) : performanceData ? (
                  <>
                    {/* Attendance Stats */}
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Assiduité au cours
                      </h4>
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 font-bold text-sm">Taux de présence global</span>
                          <span className="text-2xl font-black text-gray-900">{performanceData.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-1000 shadow-sm"
                            style={{ width: `${performanceData.attendanceRate}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                          Présent à {performanceData.presentCount} séances sur {performanceData.totalSessions} au total
                        </p>
                      </div>
                    </div>

                    {/* Interro Marks */}
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Résultats des Évaluations
                      </h4>
                      {performanceData.grades.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {performanceData.grades.map((grade: any, i: number) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-teal-300 transition-all hover:shadow-sm group/card">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-black text-gray-900 text-sm group-hover/card:text-teal-600 transition-colors uppercase tracking-tight truncate pr-4">{grade.title}</div>
                                <div className={`text-lg font-black shrink-0 ${grade.score >= (grade.maxPoints / 2) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {grade.score}<span className="text-gray-300 text-xs font-bold">/{grade.maxPoints}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(grade.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                <div className="w-20 bg-gray-50 rounded-full h-1 overflow-hidden">
                                  <div
                                    className={`h-1 rounded-full transition-all duration-1000 ${grade.score >= (grade.maxPoints / 2) ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                    style={{ width: `${(grade.score / grade.maxPoints) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <p className="text-gray-400 font-bold text-xs italic">Aucune note enregistrée</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-rose-500 font-bold text-sm">
                    Erreur de chargement.
                  </div>
                )}
              </div>
              <div className="bg-gray-50 p-4 flex justify-end shrink-0 border-t border-gray-100">
                <button
                  onClick={() => setSelectedStudentPerformance(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {studentToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-red-50">
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-4">Action Irréversible</h3>
              <p className="text-gray-500 text-center mb-8 leading-relaxed">
                Êtes-vous sûr de vouloir retirer <span className="font-black text-gray-900">{studentToDelete.name}</span> de ce cours ? Cette action supprimera également son historique de présence et ses notes actuelles.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="py-4 rounded-2xl font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    try {
                      await professorService.unenrollStudent(studentToDelete.id, course.code);
                      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
                      setStudentToDelete(null);
                      alert("Étudiant retiré avec succès");
                    } catch (error) {
                      console.error(error);
                      alert("Erreur lors de la suppression");
                    }
                  }}
                  className="py-4 rounded-2xl font-black bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeSubView === 'add-student') {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-200">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>
        <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
          <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
            <UserPlus className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Inscrire un étudiant</h1>
          <p className="text-gray-500 mb-10 font-medium">Recherchez un étudiant déjà présent dans la base de données de l'UNILU.</p>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-3 ml-1">Rechercher l'étudiant</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedStudentToAdd(null);
                  }}
                  placeholder="Nom ou Numéro Matricule (ex: 24-GEOL...)"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            {searchQuery.length >= 2 && !selectedStudentToAdd && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
                {isSearchingGlobal ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Recherche en cours...</p>
                  </div>
                ) : filteredGlobalStudents.length > 0 ? (
                  filteredGlobalStudents.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStudentToAdd(s)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-teal-600 font-bold group-hover:bg-teal-600 group-hover:text-white transition-all">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-400 font-bold">{s.id}</div>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-300 group-hover:text-teal-600" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 font-medium italic">
                    Aucun étudiant trouvé pour "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {selectedStudentToAdd && (
              <div className="bg-teal-50/50 border border-teal-100 p-6 rounded-3xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                      {selectedStudentToAdd.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-lg font-black text-gray-900">{selectedStudentToAdd.name}</div>
                      <div className="text-sm text-teal-600 font-bold uppercase tracking-widest">{selectedStudentToAdd.id}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudentToAdd(null)} className="p-2 hover:bg-teal-100 rounded-full text-teal-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/50 p-3 rounded-xl mb-6">
                  <Mail className="w-4 h-4" />
                  {selectedStudentToAdd.email}
                </div>
                <button
                  onClick={async () => {
                    try {
                      await professorService.enrollStudent(selectedStudentToAdd.id, course.code);
                      alert("Étudiant inscrit avec succès !");
                      setActiveSubView('students');
                      setSelectedStudentToAdd(null);
                      setSearchQuery("");
                    } catch (error: any) {
                      console.error(error);
                      alert(error.message || "Erreur lors de l'inscription");
                    }
                  }}
                  className="w-full bg-[#1B4332] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#2D6A4F] transition-all shadow-[0_20px_40px_rgba(27,67,50,0.2)] flex items-center justify-center gap-3 active:scale-95"
                >
                  <UserCheck className="w-6 h-6" />
                  Inscrire l'étudiant
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'create-exam') {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-200">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>
        <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
          <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
            <FilePlus className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-6">Nouvelle Épreuve</h1>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Titre de l'évaluation</label>
              <input
                type="text"
                placeholder="Ex: Examen de mi-parcours"
                value={newExamData.title}
                onChange={(e) => setNewExamData({ ...newExamData, title: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Type</label>
                <select
                  value={newExamData.type}
                  onChange={(e) => setNewExamData({ ...newExamData, type: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-orange-500"
                >
                  <option value="INTERROGATION">Interrogation</option>
                  <option value="EXAM">Examen Final</option>
                  <option value="TP">TP / Labo</option>
                  <option value="TD">TD / Rapport</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Note Max (Points)</label>
                <input
                  type="number"
                  value={newExamData.maxPoints}
                  onChange={(e) => setNewExamData({ ...newExamData, maxPoints: e.target.value })}
                  placeholder="10"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Date de l'épreuve</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="date"
                  value={newExamData.date}
                  onChange={(e) => setNewExamData({ ...newExamData, date: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateExam}
              className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 active:scale-95"
            >
              Créer l'évaluation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'manage-exams') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestion des Épreuves</h1>
          <button onClick={() => setActiveSubView('create-exam')} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/10 hover:bg-orange-600 transition-all">
            <Plus className="w-5 h-5" /> Nouvelle épreuve
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loadingExams ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Chargement...</p>
            </div>
          ) : exams.length > 0 ? (
            exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => {
                  setSelectedExam(exam);
                  setActiveSubView('exam-details');
                }}
                className={`rounded-[32px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex items-center justify-between border ${exam.isPublished
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-white border-gray-100'
                  }`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">{exam.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-orange-600 uppercase tracking-widest">{exam.type}</span>
                      <span className="text-xs text-gray-400 font-bold">• {new Date(exam.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="hidden md:block">
                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${exam.isPublished
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {exam.isPublished ? 'Points Publiés' : 'Brouillon'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteExam(e, exam.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                      title="Supprimer l'épreuve"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-orange-600" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">Aucune épreuve</h3>
              <p className="text-gray-500 text-sm">Créez une nouvelle épreuve pour commencer.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeSubView === 'exam-details') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('manage-exams')} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Retour à la liste
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-black uppercase tracking-widest">
                {selectedExam?.type || 'Évaluation'}
              </span>
              <span className="text-gray-400 font-bold text-sm">• {selectedExam?.date}</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{selectedExam?.title}</h1>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSaveGrades}
              disabled={isSavingGrades}
              className="bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingGrades ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Enregistrer les points
            </button>
            <button
              onClick={handlePublishAllGrades}
              disabled={selectedExam?.isPublished}
              className="bg-orange-50 text-orange-700 font-black px-8 py-4 rounded-2xl hover:bg-orange-100 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {selectedExam?.isPublished ? 'Déjà publié' : 'Publier tous les points'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50 flex gap-4 bg-gray-50/30">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Étudiant</th>
                  <th className="px-8 py-5">Points / {selectedExam?.maxPoints || 10}</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {course.role === 'Assistant' && (
                  <tr>
                    <td colSpan={4} className="px-8 py-4 bg-amber-50 text-amber-800 text-xs font-bold border-b border-amber-100 italic">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        "En tant qu'assistant, l'accès aux points vous est restreint. Veuillez contacter le titulaire du cours pour un besoin précis."
                      </div>
                    </td>
                  </tr>
                )}
                {students
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.matricule.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((student) => {
                    const isPublished = selectedExam?.isPublished;
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/80 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{student.name}</div>
                              <div className="text-xs text-gray-400 font-bold uppercase">{student.matricule}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <input
                            type="number"
                            value={tempGrades[student.id] || ""}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              if (valStr === "") {
                                setTempGrades({ ...tempGrades, [student.id]: "" });
                                return;
                              }
                              const val = parseFloat(valStr);
                              const max = selectedExam?.maxPoints || 10;
                              if (val > max) {
                                alert(`Impossible de dépasser la note maximale de ${max}`);
                                return;
                              }
                              setTempGrades({ ...tempGrades, [student.id]: valStr });
                            }}
                            placeholder="-"
                            max={selectedExam?.maxPoints || 10}
                            min="0"
                            disabled={isPublished || course.role === 'Assistant'}
                            className={`w-20 p-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-gray-900 focus:ring-2 focus:ring-orange-500/20 outline-none text-center placeholder:text-gray-300 ${(isPublished || course.role === 'Assistant') ? 'opacity-70 cursor-not-allowed bg-gray-100' : ''}`}
                          />
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter ${isPublished ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            {isPublished ? 'Publié' : 'Brouillon'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                          {isPublished ? (
                            <button
                              onClick={() => {
                                if (course.role === 'Assistant') {
                                  alert("Action refusée : En tant qu'assistant, vous ne pouvez pas introduire de demande de modification.");
                                  return;
                                }
                                setSelectedStudentForModif(student);
                                setShowModifModal(true);
                              }}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border active:scale-95 ${course.role === 'Assistant'
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100'
                                }`}
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                              Faire une demande de modification
                            </button>
                          ) : (
                            <>
                              <button
                                disabled={course.role === 'Assistant'}
                                onClick={() => {
                                  if (window.confirm(`Voulez-vous vraiment supprimer les points de ${student.name} pour cette épreuve ?`)) {
                                    const newTempGrades = { ...tempGrades };
                                    delete newTempGrades[student.id];
                                    setTempGrades(newTempGrades);
                                  }
                                }}
                                className={`p-2.5 rounded-xl transition-colors ${course.role === 'Assistant'
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-red-50 text-red-500'
                                  }`}
                                title="Effacer la note"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modification Request Modal */}
        {showModifModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white relative shrink-0">
                <button
                  onClick={() => setShowModifModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight">Demande de modification</h3>
                    <p className="text-indigo-100 text-[11px] font-bold opacity-80 uppercase tracking-widest">{selectedExam?.title}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                    Le service académique est soumis à des règles strictes concernant la modification de points, une preuve visible et un pourquoi du changement pourraient faciliter la validation de la demande.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Étudiant</label>
                    <div className="p-2.5 bg-gray-50 rounded-xl font-bold text-gray-900 border border-gray-100 text-sm">
                      {selectedStudentForModif?.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Note actuelle</label>
                    <div className="p-2.5 bg-gray-50 rounded-xl font-bold text-gray-500 border border-gray-100 text-sm">
                      {tempGrades[selectedStudentForModif?.id] || 0} / {selectedExam?.maxPoints || 10}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nouvelle note à attribuer</label>
                  <input
                    type="number"
                    max={selectedExam?.maxPoints || 10}
                    placeholder="Entrez la nouvelle note..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-900 text-sm"
                    value={newGrade}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === "") {
                        setNewGrade("");
                        return;
                      }
                      const val = parseFloat(valStr);
                      const max = selectedExam?.maxPoints || 10;
                      if (val > max) {
                        alert(`Impossible de dépasser la note maximale de ${max}`);
                        return;
                      }
                      setNewGrade(valStr);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Raison du changement</label>
                  <textarea
                    rows={2}
                    placeholder="Pourquoi modifier ces points ?"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-900 resize-none text-sm"
                    value={modifReason}
                    onChange={(e) => setModifReason(e.target.value)}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Preuve de l'erreur (Optionnel)</label>
                  <input
                    type="file"
                    className="hidden"
                    ref={modifFileInputRef}
                    onChange={(e) => setModifFile(e.target.files?.[0] || null)}
                  />
                  {!modifFile ? (
                    <div
                      onClick={() => modifFileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-100 rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <UploadCloud className="w-6 h-6 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide group-hover:text-gray-600 transition-colors">Cliquez pour joindre un justificatif</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-indigo-900 truncate">{modifFile.name}</p>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase">{(modifFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setModifFile(null)}
                        className="p-2 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-3 shrink-0">
                <button
                  onClick={() => {
                    setShowModifModal(false);
                    setModifFile(null);
                    setModifReason("");
                    setNewGrade("");
                  }}
                  className="flex-1 py-3 text-gray-500 font-black text-xs hover:bg-gray-100 rounded-xl transition-colors uppercase tracking-widest"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!selectedStudentForModif || !selectedExam) return;
                    setIsSubmittingModif(true);
                    try {
                      await professorService.requestGradeChange({
                        studentId: selectedStudentForModif.id,
                        assessmentId: selectedExam.id.toString(),
                        newScore: newGrade,
                        reason: modifReason
                      }, modifFile);

                      toast.success("Demande de modification transmise au service académique avec succès.");

                      // Reset and Close
                      setShowModifModal(false);
                      setModifFile(null);
                      setModifReason("");
                      setNewGrade("");
                    } catch (error: any) {
                      toast.error(error.message || "Erreur lors de l'envoi de la demande");
                    } finally {
                      setIsSubmittingModif(false);
                    }
                  }}
                  disabled={!newGrade || !modifReason || isSubmittingModif}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none text-xs uppercase tracking-widest"
                >
                  {isSubmittingModif ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeSubView === 'performance') {
    const examStats = courseStats.length > 0 ? courseStats : [
      { id: 0, title: "Vue Globale (Semestre)", success: 0, failure: 0, avg: 0, total: 0, enrolled: course.studentsCount || 0 },
    ];

    const currentStats = examStats.find(s => s.id === selectedExamId) || examStats[0];

    if (loadingCourseStats) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Analyse des performances en cours...</p>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-bold w-fit">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-bold text-gray-400 ml-3 uppercase tracking-widest">Analyser :</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
              className="bg-gray-50 border-none rounded-xl px-4 py-2 font-black text-gray-900 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer"
            >
              {examStats.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Performance : <span className="text-teal-600">{currentStats.title}</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Réussite</h3>
            <div className={`font-black text-emerald-600 relative z-10 ${currentStats.success.toString().length > 4 ? 'text-2xl' : 'text-3xl'}`}>
              {currentStats.success}%
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-4 relative z-10">Moyenne ≥ 50%</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Échec</h3>
            <div className={`font-black text-rose-500 relative z-10 ${currentStats.failure.toString().length > 4 ? 'text-2xl' : 'text-3xl'}`}>
              {currentStats.failure}%
            </div>
            <p className="text-[10px] text-rose-500 font-bold mt-4 relative z-10">Moyenne {"<"} 50%</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Moyenne</h3>
            <div className="text-3xl font-black text-teal-600 relative z-10">{currentStats.avg}</div>
            <p className="text-[10px] text-teal-600 font-bold mt-4 relative z-10">Moyenne de classe</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Inscrits</h3>
            <div className="text-3xl font-black text-blue-600 relative z-10">{currentStats.enrolled}</div>
            <p className="text-[10px] text-blue-600 font-bold mt-4 relative z-10">Effectif théorique</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Absents</h3>
            <div className="text-3xl font-black text-fuchsia-600 relative z-10">
              {currentStats.enrolled > 0 ? parseFloat((((currentStats.enrolled - currentStats.total) / currentStats.enrolled) * 100).toFixed(2)) : 0}%
            </div>
            <p className="text-[10px] text-fuchsia-600 font-bold mt-4 relative z-10">Taux d'absence</p>
          </div>

          <div className="bg-[#1B4332] p-6 rounded-[40px] shadow-xl relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-teal-400/60 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Évalués</h3>
            <div className="text-3xl font-black relative z-10">{currentStats.total}</div>
            <p className="text-teal-400 text-[10px] font-bold mt-4 relative z-10">Présents à l'épreuve</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-xl font-black text-gray-900 mb-10 self-start">Visualisation des Résultats</h3>

            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Doughnut Chart via Conic Gradient */}
              <div
                className="absolute inset-0 rounded-full shadow-2xl transition-all duration-1000"
                style={{
                  background: `conic-gradient(#10B981 0% ${currentStats.success}%, #F43F5E ${currentStats.success}% 100%)`,
                  mask: 'radial-gradient(transparent 60%, black 61%)',
                  WebkitMask: 'radial-gradient(transparent 60%, black 61%)'
                }}
              ></div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Réussite</span>
                <span className="text-5xl font-black text-emerald-600">{currentStats.success}%</span>
              </div>
            </div>

            <div className="flex gap-12 mt-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                <span className="text-base font-bold text-gray-600">Réussite</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500 shadow-lg shadow-rose-200"></div>
                <span className="text-base font-bold text-gray-600">Échec</span>
              </div>
            </div>

            <button className="mt-12 bg-gray-50 text-gray-900 px-10 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all border border-gray-100 shadow-sm active:scale-95 w-full">
              Exporter le rapport PDF
            </button>
          </div>

          {/* Success/Failure Student Lists */}
          <div className="space-y-6">
            {/* Success List */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm max-h-[500px] flex flex-col">
              <h3 className="text-lg font-black text-emerald-600 mb-6 flex items-center gap-3 uppercase tracking-tight">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Réussites ({currentStats.successList?.length || 0})
              </h3>
              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-3 pr-2">
                {currentStats.successList?.length > 0 ? currentStats.successList.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 group hover:bg-emerald-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-emerald-600 text-xs shadow-sm">
                        {s.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{s.id}</p>
                      </div>
                    </div>
                    <div className="text-emerald-600 font-black text-base">{s.score}<span className="text-[10px] text-emerald-300">/20</span></div>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm italic text-center py-10 font-medium">Aucun étudiant dans cette catégorie</p>
                )}
              </div>
            </div>

            {/* Failure List */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm max-h-[500px] flex flex-col">
              <h3 className="text-lg font-black text-rose-500 mb-6 flex items-center gap-3 uppercase tracking-tight">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                Échecs ({currentStats.failureList?.length || 0} étudiants)
              </h3>
              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-3 pr-2">
                {currentStats.failureList?.length > 0 ? currentStats.failureList.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50 group hover:bg-rose-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-rose-500 text-xs shadow-sm">
                        {s.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{s.id}</p>
                      </div>
                    </div>
                    <div className="text-rose-500 font-black text-base">{s.score}<span className="text-[10px] text-rose-300">/20</span></div>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm italic text-center py-10 font-medium">Aucun étudiant dans cette catégorie</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'assignments') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 hover:text-fuchsia-600 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Create Form */}
          <div className="flex-1 space-y-8">
            <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
              <div className="bg-fuchsia-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                <Calendar className="w-8 h-8 text-fuchsia-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Nouveau Travail</h1>
              <p className="text-gray-500 mb-10 font-medium">Définissez un sujet et une date limite de rendu.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 ml-1">Titre du devoir</label>
                  <input
                    type="text"
                    placeholder="Ex: Rapport de sortie géologique - Kolwezi"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 ml-1">Consignes / Instructions</label>
                  <textarea
                    rows={4}
                    placeholder="Décrivez les attentes, le format attendu (PDF uniquement), etc."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20 resize-none"
                    value={assignmentData.instructions}
                    onChange={(e) => setAssignmentData({ ...assignmentData, instructions: e.target.value })}
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 ml-1">Date d'échéance</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20 font-bold"
                      value={assignmentData.dueDate}
                      onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 ml-1 flex justify-between">
                      <span>Heure d'expiration</span>
                      <span className="text-[10px] text-fuchsia-600">FORMAT 24H</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          placeholder="00"
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20 font-bold text-center text-xl"
                          value={assignmentData.dueTime.split(':')[0]}
                          onChange={(e) => {
                            const hours = e.target.value.padStart(2, '0');
                            const minutes = assignmentData.dueTime.split(':')[1] || '00';
                            setAssignmentData({ ...assignmentData, dueTime: `${hours}:${minutes}` });
                          }}
                        />
                        <span className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-black text-gray-400 uppercase">Heures</span>
                      </div>
                      <span className="text-2xl font-black text-gray-300">:</span>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="00"
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20 font-bold text-center text-xl"
                          value={assignmentData.dueTime.split(':')[1]}
                          onChange={(e) => {
                            const hours = assignmentData.dueTime.split(':')[0] || '00';
                            const minutes = e.target.value.padStart(2, '0');
                            setAssignmentData({ ...assignmentData, dueTime: `${hours}:${minutes}` });
                          }}
                        />
                        <span className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-black text-gray-400 uppercase">Minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4 mt-6">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Règle de durée limitée</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Une fois l'heure limite passée (<span className="font-black text-amber-900">{assignmentData.dueTime}</span>), le bouton de dépôt sera automatiquement désactivé pour les étudiants. Aucun retard ne sera accepté.
                  </p>
                </div>
              </div>

              <button
                onClick={handleLaunchAssignment}
                disabled={isLaunchingAssignment || !assignmentData.title}
                className="w-full bg-[#3C096C] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#5A189A] transition-all shadow-xl shadow-fuchsia-900/10 active:scale-95 disabled:opacity-50"
              >
                {isLaunchingAssignment ? 'Lancement...' : 'Lancer le travail'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Assignments */}
        <div className="w-full lg:w-[400px] space-y-6">
          <h2 className="text-xl font-black text-gray-900 px-2 mt-2">Dépôts en cours</h2>

          {exams.filter(e => e.type === 'TP' && e.dueDate && new Date(e.dueDate) > new Date()).map(assignment => (
            <div key={assignment.id} className="bg-[#10002B] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-bl-full -mr-12 -mt-12 group-hover:bg-fuchsia-500/20 transition-all"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 pr-8">{assignment.title}</h3>
                <div className="flex items-center gap-2 text-fuchsia-400 text-sm font-black uppercase tracking-widest mb-4">
                  <Calendar className="w-4 h-4" />
                  Échéance : {new Date(assignment.dueDate).toLocaleDateString()} à {new Date(assignment.dueDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black">{assignment.submissions?.length || 0}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-black">Dépôts reçus</span>
                  </div>
                  <button
                    onClick={() => setSelectedAssignmentForSubmissions(assignment)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {exams.filter(e => e.type === 'TP' && e.dueDate && new Date(e.dueDate) > new Date()).length === 0 && (
            <div className="bg-[#10002B] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[200px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-bl-full -mr-12 -mt-12"></div>
              <p className="text-gray-400 italic font-medium">Aucun travail en cours</p>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Settings2 className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-black text-gray-900">Historique des TP</h3>
            </div>
            <div className="space-y-4">
              {exams.filter(e => e.type === 'TP' && e.dueDate && new Date(e.dueDate) < new Date()).map(old => (
                <div key={old.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all group">
                  <div className="overflow-hidden pr-2 flex-1">
                    <p className="font-bold text-gray-900 truncate text-sm">{old.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(old.dueDate).toLocaleDateString()} à {new Date(old.dueDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                      <span className="text-[10px] text-gray-300">•</span>
                      <p className="text-[10px] text-fuchsia-600 font-black uppercase">{old.submissions?.length || 0} soumission{(old.submissions?.length || 0) !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedAssignmentForSubmissions(old)}
                      className="p-2 hover:bg-fuchsia-50 rounded-lg text-fuchsia-600 transition-all opacity-0 group-hover:opacity-100"
                      title="Voir les soumissions"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-1 rounded-lg">FINI</span>
                  </div>
                </div>
              ))}
              {exams.filter(e => e.type === 'TP' && e.dueDate && new Date(e.dueDate) < new Date()).length === 0 && (
                <p className="text-gray-400 italic text-sm text-center py-4">Historique vide</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'modif-history') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Historique des Modifications</h1>
          <p className="text-gray-500 font-medium">Suivez l'état de vos demandes de changement de points.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Étudiant & Épreuve</th>
                  <th className="px-8 py-5">Changement</th>
                  <th className="px-8 py-5">Date Demande</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Chargement des données...</p>
                      </div>
                    </td>
                  </tr>
                ) : modifHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <p className="text-gray-400 font-bold italic">Aucune demande de modification enregistrée</p>
                    </td>
                  </tr>
                ) : (
                  modifHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <div className="font-bold text-gray-900">{item.studentName}</div>
                          <div className="text-xs text-indigo-500 font-bold">{item.examTitle}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 font-black text-sm">
                          <span className="text-gray-400">{item.oldGrade}</span>
                          <ArrowLeft className="w-3 h-3 text-gray-300 rotate-180" />
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{item.newGrade}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.status === 'Validé' ? 'text-emerald-600 bg-emerald-50' :
                          item.status === 'Refusé' ? 'text-red-600 bg-red-50' :
                            'text-amber-600 bg-amber-50'
                          }`}>
                          <div className={`w-1 h-1 rounded-full ${item.status === 'Validé' ? 'bg-emerald-500' :
                            item.status === 'Refusé' ? 'bg-red-500' :
                              'bg-amber-500'
                            }`}></div>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => setSelectedHistoryItem(item)}
                          className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Detail Modal */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className={`p-6 text-white flex justify-between items-center ${selectedHistoryItem.status === 'Validé' ? 'bg-emerald-600' :
                selectedHistoryItem.status === 'Refusé' ? 'bg-red-600' :
                  'bg-amber-600'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight">Détails de la demande</h3>
                    <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">{selectedHistoryItem.status}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedHistoryItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Étudiant</div>
                    <div className="font-bold text-gray-900">{selectedHistoryItem.studentName}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Épreuve</div>
                    <div className="font-bold text-indigo-600">{selectedHistoryItem.examTitle}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Justification de l'enseignant</label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-2xl italic font-medium text-gray-600 text-sm border-l-4 border-l-gray-300">
                      "{selectedHistoryItem.reason}"
                    </div>
                  </div>

                  {selectedHistoryItem.status !== 'En cours' && (
                    <div className="animate-in slide-in-from-top-2 duration-500">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Réponse du Service Académique
                      </label>
                      <div className={`mt-2 p-4 rounded-2xl font-bold text-sm border ${selectedHistoryItem.status === 'Validé' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
                        }`}>
                        {selectedHistoryItem.adminNote}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeSubView === 'documents') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
        <GlobalComponents />
        <button onClick={() => setActiveSubView('main')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-gray-900">Archives des documents</h1>
          <button onClick={handleUploadClick} className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-teal-700 hover:-translate-y-1 transition-all active:translate-y-0">
            <UploadCloud className="w-6 h-6" /> Soumettre un document
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadingResources ? (
            <div className="col-span-full text-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Chargement des documents...</p>
            </div>
          ) : resources.length > 0 ? (
            resources.map((res: any) => (
              <div
                key={res.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all"
                  >
                    <FileText className="w-6 h-6" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteResource(res.id);
                    }}
                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{res.title}</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    {new Date(res.uploadedAt).toLocaleDateString()}
                  </p>
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-2">Aucun document</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Vous n'avez pas encore téléversé de documents pour ce cours. Utilisez le bouton "Soumettre un document" pour commencer.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* Breadcrumb Navigation */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour à Mes Cours
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                {course.code}
              </span>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold tracking-wide ${course.role === 'Professeur' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                Rôle : {course.role || 'Professeur'}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Gestion du Cours : {course.name}
            </h1>
            <p className="text-gray-600 text-lg">
              Panel de contrôle pour la gestion académique et pédagogique.
            </p>
          </div>
        </div>
      </div>

      {/* Informations sur le cours */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-50 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-end">Informations sur le cours</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Niveau</div>
            <div className="font-semibold text-gray-900">{course.level}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Salle principale</div>
            <div className="font-semibold text-gray-900">{course.location}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 md:col-span-2">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Horaire hebdomadaire</div>
            <div className="font-semibold text-gray-900 whitespace-pre-line text-sm">{course.schedule}</div>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              onClick={action.onClick}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-teal-200 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-teal-50 transition-colors"></div>

              <div className={`${action.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-7 h-7 ${action.iconColor}`} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10 flex items-center justify-between">
                {action.title}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed relative z-10">
                {action.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Soumettre un document - LARGE BOX */}
      <div className="group">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`bg-gradient-to-br from-teal-600 to-teal-800 rounded-[48px] p-1 text-white shadow-2xl shadow-teal-900/40 transition-all duration-500 ${isUploading || isDragging ? 'scale-[1.02]' : ''}`}>
          <div className={`bg-[#1B4332] rounded-[44px] p-16 border border-white/10 relative overflow-hidden min-h-[450px] flex flex-col items-center justify-center transition-colors ${isDragging ? 'bg-[#255a43]' : ''}`}>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl">
              {!isUploading && !uploadSuccess && !pendingFile && (
                <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/20 shadow-2xl">
                    <UploadCloud className="w-12 h-12 text-teal-300" />
                  </div>
                  <h3 className="text-4xl font-black mb-6 tracking-tight">Soumettre un document</h3>
                  <p className="text-teal-50/70 text-xl mb-12 leading-relaxed">
                    Partagez instantanément syllabus, notes de cours ou exercices avec vos étudiants de façon sécurisée.
                  </p>
                  <button
                    onClick={handleUploadClick}
                    className="bg-white text-teal-900 px-14 py-5 rounded-2xl font-black text-xl hover:bg-teal-50 hover:shadow-2xl hover:shadow-white/20 transition-all flex items-center gap-4 hover:-translate-y-1 active:translate-y-0"
                  >
                    {isDragging ? "Déposez votre fichier ici" : "Sélectionner un fichier"}
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                  </button>
                  {isDragging && (
                    <div className="absolute inset-0 bg-teal-500/10 border-4 border-dashed border-teal-400/50 rounded-[44px] animate-pulse pointer-events-none"></div>
                  )}
                </div>
              )}

              {pendingFile && !isUploading && (
                <div className="animate-in zoom-in-95 duration-300 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center mb-6 border border-white/20">
                    <FileText className="w-10 h-10 text-teal-300" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Voulez-vous soumettre ce document ?</h3>
                  <p className="text-teal-300 font-bold mb-8 italic px-6 py-2 bg-teal-900/50 rounded-lg">"{pendingFile.name}"</p>

                  <div className="flex gap-4">
                    <button
                      onClick={cancelUpload}
                      className="px-8 py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmUpload}
                      className="px-10 py-4 rounded-2xl font-black bg-white text-teal-900 hover:bg-teal-50 transition-all shadow-xl shadow-white/5 active:scale-95"
                    >
                      Confirmer la soumission
                    </button>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="animate-in zoom-in-95 duration-300 w-full max-w-md flex flex-col items-center">
                  <div className="relative mb-10">
                    <div className="w-24 h-24 border-4 border-teal-500/20 rounded-full animate-spin border-t-teal-400"></div>
                    <Loader2 className="w-10 h-10 text-teal-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">Transmission...</h3>
                  <p className="text-teal-300 font-bold mb-10 animate-pulse">OPTIMISATION DU PACKET RESEAU</p>

                  <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden mb-6 p-1 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(45,212,191,0.5)]"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-6xl font-black text-white">{uploadProgress}</span>
                    <span className="text-2xl font-bold text-teal-400 mb-2">%</span>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="animate-in zoom-in fade-in duration-500 flex flex-col items-center">
                  <div className="w-28 h-28 bg-emerald-500 rounded-[36px] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(16,185,129,0.4)] border-4 border-white/20 rotate-3">
                    <CheckCircle2 className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-5xl font-black text-white mb-4 tracking-tighter">TERMINE !</h3>
                  <p className="text-teal-50/80 text-xl font-medium">Le document est archivé et disponible pour la promotion.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Materials Section */}
      <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-bl-full -mr-32 -mt-32"></div>

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-teal-600" />
              Documents récents
            </h3>
            <p className="text-gray-400 text-sm font-medium mt-1 ml-9">Consultation et gestion des fichiers partagés</p>
          </div>
          <button
            onClick={() => setActiveSubView('documents')}
            className="bg-gray-50 text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition-all flex items-center gap-2 group border border-gray-100"
          >
            Voir toute la bibliothèque
            <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.slice(0, 3).map((res: any) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-teal-200 hover:bg-white transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 truncate">{res.title}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase">{new Date(res.uploadedAt).toLocaleDateString()}</p>
                </div>
              </a>
            ))}
            {resources.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 italic">Aucun document récent</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submissions View Modal is now in GlobalComponents */}
    </div>
  );
}
