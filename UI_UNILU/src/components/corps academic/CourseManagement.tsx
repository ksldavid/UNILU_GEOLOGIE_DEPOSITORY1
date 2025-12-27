import { useState, useRef } from "react";
import {
  ArrowLeft, FileText, Users, ClipboardList, UserPlus, FilePlus,
  Settings2, BarChart3, UploadCloud, ChevronRight, Loader2, CheckCircle2,
  Search, Filter, Plus, Calendar, Trophy, Download, Trash2, Eye, Mail,
  AlertTriangle, X, UserCheck, Send, History
} from "lucide-react";
import type { Course } from "../../App";

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setPendingFile(event.target.files[0]);
    }
  };

  const confirmUpload = () => {
    if (pendingFile) {
      simulateUpload();
      setPendingFile(null);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
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

  const students = [
    { id: 1, name: "Jean-Pierre Kabamba", matricule: "24-GEOL-101", attendance: 92, grade: 15.5 },
    { id: 2, name: "Sarah Mujinga", matricule: "24-GEOL-102", attendance: 85, grade: 14.2 },
    { id: 3, name: "Marc Tshilenge", matricule: "24-GEOL-103", attendance: 78, grade: 12.8 },
    { id: 4, name: "Dorcas Mwamba", matricule: "24-GEOL-104", attendance: 95, grade: 16.1 },
    { id: 5, name: "Alain Kasongo", matricule: "24-GEOL-105", attendance: 65, grade: 10.5 },
  ];

  const globalStudents = [
    { id: 10, name: "Bénédicte Kalenga", matricule: "24-GEOL-201", email: "benedicte@unilu.ac.cd" },
    { id: 11, name: "Chris Mukendi", matricule: "24-GEOL-202", email: "chris@unilu.ac.cd" },
    { id: 12, name: "Arlette Ngoy", matricule: "24-GEOL-203", email: "arlette@unilu.ac.cd" },
    { id: 13, name: "David Muteba", matricule: "24-GEOL-204", email: "david@unilu.ac.cd" },
  ];

  const modifHistory = [
    {
      id: 1,
      studentName: "Marc Tshilenge",
      examTitle: "Interrogation 1",
      oldGrade: 12.8,
      newGrade: 14.5,
      date: "25 Déc 2025",
      status: "Validé",
      reason: "Erreur de transcription lors de la saisie initiale.",
      adminNote: "Note mise à jour après vérification de la copie physique."
    },
    {
      id: 2,
      studentName: "Alain Kasongo",
      examTitle: "Interrogation 1",
      oldGrade: 10.5,
      newGrade: 12.0,
      date: "26 Déc 2025",
      status: "Refusé",
      reason: "Omission d'un bonus accordé en classe.",
      adminNote: "Absence de preuve tangible (copie non signée par le professeur)."
    },
    {
      id: 3,
      studentName: "Sarah Mujinga",
      examTitle: "Interrogation 1",
      oldGrade: 14.2,
      newGrade: 15.5,
      date: "27 Déc 2025",
      status: "En cours",
      reason: "Réévaluation après réclamation sur la question 4.",
      adminNote: ""
    }
  ];

  const filteredGlobalStudents = globalStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeSubView === 'students') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
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
              <input type="text" placeholder="Rechercher par nom ou matricule..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all outline-none" />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold"><Filter className="w-4 h-4" /> Filtres</button>
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
                {students.map((student) => (
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
                        {student.grade}/20
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                      <button className="p-2.5 hover:bg-teal-50 rounded-xl text-teal-600 transition-colors opacity-0 group-hover:opacity-100">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                  onClick={() => {
                    // Logic to delete would go here
                    setStudentToDelete(null);
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
                {filteredGlobalStudents.length > 0 ? (
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
                          <div className="text-xs text-gray-400 font-bold">{s.matricule}</div>
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
                      <div className="text-sm text-teal-600 font-bold uppercase tracking-widest">{selectedStudentToAdd.matricule}</div>
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
                  onClick={() => {
                    // Logic to add student would go here
                    setActiveSubView('students');
                    setSelectedStudentToAdd(null);
                    setSearchQuery("");
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
              <input type="text" placeholder="Ex: Examen de mi-parcours" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Type</label>
                <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-orange-500">
                  <option>Interrogation</option>
                  <option>Examen Final</option>
                  <option>TP / Labo</option>
                  <option>Rapport</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Pondération (%)</label>
                <input type="number" placeholder="20" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-orange-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Date de l'épreuve</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input type="date" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-orange-500" />
              </div>
            </div>
            <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 active:scale-95">Créer l'évaluation</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'manage-exams') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
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
          {[
            { title: "Interrogation 1", date: "15 Nov 2025", type: "Interro", status: "Publié", points: "Saisis" },
            { title: "Examen Semestriel", date: "12 Déc 2025", type: "Examen", status: "Non publié", points: "-" },
            { title: "TP Minéralogie", date: "05 Déc 2025", type: "TP", status: "Non publié", points: "Partiel" },
          ].map((exam, i) => (
            <div key={i} className="bg-white border border-gray-100 p-6 rounded-3xl flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${exam.type === 'Examen' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {exam.date}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> {exam.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-300 uppercase mb-1">Diffusion</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${exam.status === 'Publié' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {exam.status}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setActiveSubView('exam-details');
                  }}
                  className="bg-gray-50 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-100"
                >
                  Voir l'épreuve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubView === 'exam-details') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
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
            <button className="bg-orange-50 text-orange-700 font-black px-8 py-4 rounded-2xl hover:bg-orange-100 transition-all shadow-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Publier tous les points
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50 flex gap-4 bg-gray-50/30">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher un étudiant..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 transition-all outline-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Étudiant</th>
                  <th className="px-8 py-5">Points / 20</th>
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
                {students.map((student) => {
                  const isPublished = selectedExam?.status === 'Publié';
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
                          defaultValue={selectedExam?.points === "Saisis" || isPublished ? student.grade : ""}
                          placeholder="-"
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
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 ${course.role === 'Assistant'
                                ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
                                }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Publier
                            </button>
                            <button
                              disabled={course.role === 'Assistant'}
                              className={`p-2.5 rounded-xl transition-colors ${course.role === 'Assistant'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'hover:bg-red-50 text-red-500'
                                }`}
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
                      {selectedStudentForModif?.grade} / 20
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nouvelle note à attribuer</label>
                  <input
                    type="number"
                    max="20"
                    placeholder="Entrez la nouvelle note..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-900 text-sm"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
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
                  onClick={() => {
                    setIsSubmittingModif(true);
                    setTimeout(() => {
                      alert("Demande de modification transmise au service académique avec succès.");
                      setIsSubmittingModif(false);
                      setShowModifModal(false);
                      setModifFile(null);
                      setModifReason("");
                      setNewGrade("");
                    }, 1500);
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
    const examStats = [
      { id: 0, title: "Vue Globale (Semestre)", success: 78, failure: 22, avg: 12.4, total: 124, enrolled: 128 },
      { id: 1, title: "Interrogation 1", success: 85, failure: 15, avg: 14.2, total: 122, enrolled: 128 },
      { id: 2, title: "Interrogation 2", success: 62, failure: 38, avg: 10.8, total: 118, enrolled: 128 },
      { id: 3, title: "TP Minéralogie", success: 94, failure: 6, avg: 16.5, total: 124, enrolled: 128 },
    ];

    const currentStats = examStats.find(s => s.id === selectedExamId) || examStats[0];

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
            <div className="text-4xl font-black text-emerald-600 relative z-10">{currentStats.success}%</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-4 relative z-10">Admission ≥ 10/20</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Échec</h3>
            <div className="text-4xl font-black text-rose-500 relative z-10">{currentStats.failure}%</div>
            <p className="text-[10px] text-rose-500 font-bold mt-4 relative z-10">Échecs {"<"} 10/20</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Moyenne</h3>
            <div className="text-4xl font-black text-teal-600 relative z-10">{currentStats.avg}</div>
            <p className="text-[10px] text-teal-600 font-bold mt-4 relative z-10">Moyenne de classe</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Inscrits</h3>
            <div className="text-4xl font-black text-blue-600 relative z-10">{currentStats.enrolled}</div>
            <p className="text-[10px] text-blue-600 font-bold mt-4 relative z-10">Effectif théorique</p>
          </div>

          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-gray-400 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Absents</h3>
            <div className="text-4xl font-black text-fuchsia-600 relative z-10">
              {Math.round(((currentStats.enrolled - currentStats.total) / currentStats.enrolled) * 100)}%
            </div>
            <p className="text-[10px] text-fuchsia-600 font-bold mt-4 relative z-10">Taux d'absence</p>
          </div>

          <div className="bg-[#1B4332] p-6 rounded-[40px] shadow-xl relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>
            <h3 className="text-teal-400/60 mb-2 uppercase text-[10px] tracking-widest relative z-10 font-black">Évalués</h3>
            <div className="text-4xl font-black relative z-10">{currentStats.total}</div>
            <p className="text-teal-400 text-[10px] font-bold mt-4 relative z-10">Présents à l'épreuve</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl">
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

            <button className="mt-12 bg-gray-50 text-gray-900 px-10 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all border border-gray-100 shadow-sm active:scale-95">
              Exporter le rapport PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'assignments') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
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
                  <input type="text" placeholder="Ex: Rapport de sortie géologique - Kolwezi" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20" />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 ml-1">Consignes / Instructions</label>
                  <textarea rows={4} placeholder="Décrivez les attentes, le format attendu (PDF uniquement), etc." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20 resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 ml-1">Date d'échéance</label>
                    <input type="date" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 ml-1">Heure limite</label>
                    <input type="time" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500/20" />
                  </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Règle de durée limitée</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Une fois l'heure limite passée, le bouton de dépôt sera automatiquement désactivé pour les étudiants. Aucun retard ne sera accepté par le système.
                    </p>
                  </div>
                </div>

                <button className="w-full bg-[#3C096C] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#5A189A] transition-all shadow-xl shadow-fuchsia-900/10 active:scale-95">Lancer le travail</button>
              </div>
            </div>
          </div>

          {/* Right: Active Assignments */}
          <div className="w-full lg:w-[400px] space-y-6">
            <h2 className="text-xl font-black text-gray-900 px-2 mt-2">Dépôts en cours</h2>

            <div className="bg-[#10002B] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-bl-full -mr-12 -mt-12"></div>

              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                Actif
              </div>

              <h3 className="text-xl font-bold mb-2">TP Pétrographie</h3>
              <p className="text-gray-400 text-sm mb-6">Termine dans : <span className="text-fuchsia-400 font-black">2j 14h 05m</span></p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 font-bold">Progression des dépôts</span>
                  <span className="text-white font-black">45 / 124</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500 w-[36%]"></div>
                </div>
              </div>

              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition-all border border-white/5">
                Voir les copies (45)
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Settings2 className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-black text-gray-900">Historique</h3>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Examen de terrain", date: "12 Oct 2025", count: 118 },
                  { title: "Étude sismique", date: "05 Oct 2025", count: 124 }
                ].map((past, idx) => (
                  <div key={idx} className="group p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-fuchsia-100 hover:bg-white transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-black text-gray-900 line-clamp-1">{past.title}</div>
                      <div className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-black uppercase">Fermé</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-bold">{past.count} copies • {past.date}</span>
                      <button className="flex items-center gap-1.5 text-xs font-black text-fuchsia-600 hover:text-fuchsia-700 transition-colors bg-fuchsia-50 px-3 py-1.5 rounded-xl">
                        <Download className="w-3.5 h-3.5" />
                        ZIP
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubView === 'modif-history') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
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
                {modifHistory.map((item) => (
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
                ))}
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
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-2xl hover:translate-y-[-4px] transition-all cursor-pointer group border-b-4 border-b-gray-50 hover:border-b-teal-500">
              <div className="flex items-start justify-between mb-6">
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-blue-600">
                  <FileText className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"><Download className="w-5 h-5" /></button>
                </div>
              </div>
              <h3 className="font-black text-gray-900 text-lg mb-2 line-clamp-1">Chapitre {i} - Minéralogie.pdf</h3>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                <span>PDF</span>
                <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                <span>2.4 MB</span>
              </div>
            </div>
          ))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl hover:shadow-xl hover:border-teal-100 transition-all cursor-pointer group">
              <div className="flex items-center gap-5">
                <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:rotate-6 transition-all">
                  <FileText className="w-8 h-8 text-red-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="font-black text-gray-900 text-lg group-hover:text-teal-700 transition-colors">Support_Géologie_2025_{i}.pdf</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">PDF</span>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">2.4 MB</span>
                  </div>
                </div>
              </div>
              <div className="bg-teal-50 p-3 rounded-xl text-teal-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <Download className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
