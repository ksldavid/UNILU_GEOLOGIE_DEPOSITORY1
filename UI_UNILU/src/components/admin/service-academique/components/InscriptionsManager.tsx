import { useState, useEffect } from 'react';
import { Search, ChevronRight, UserPlus, BookOpen, FileText, CheckCircle, X, Ban, MessageCircle, AlertTriangle, School, Trash2, GraduationCap, Users, Copy, Eye, EyeOff, Lock, Hash, Key } from 'lucide-react';
import { userService } from '../../../../services/user';
import { API_URL } from '../../../../services/config';

// Types definitons
type Role = 'student' | 'professor' | 'assistant';
type Status = 'active' | 'blocked';

interface Grade {
  id: string;
  name: string;
  score: number;
  max: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  level: string;
  teachingRole?: 'professor' | 'assistant'; // Nouveau: pour distinguer Titulaire vs Assistant
}

interface StudentCourse extends Course {
  attendance: number;
  grade: string;
  grades: Grade[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  avatarColor: string;
  // Student props
  promotion?: string;
  enrolledCourses?: StudentCourse[];
  // Staff props
  teachingCourses?: Course[];
  title?: string;
}

// Mock Data (Garder pour les dropdowns de cours pour l'instant)
const AVAILABLE_COURSES: Course[] = [
  { id: 'c1', name: 'Cristallographie', code: 'GEO101', level: 'Bac 1' },
  { id: 'c2', name: 'Mathématiques I', code: 'MAT101', level: 'Bac 1' },
  { id: 'c3', name: 'Minéralogie', code: 'GEO201', level: 'Bac 2' },
  { id: 'c4', name: 'Pétrologie Magmatique', code: 'GEO202', level: 'Bac 2' },
  { id: 'c5', name: 'Stratigraphie', code: 'GEO203', level: 'Bac 2' },
  { id: 'c6', name: 'Géochimie', code: 'GEO301', level: 'Bac 3' },
  { id: 'c7', name: 'Cartographie', code: 'GEO302', level: 'Bac 3' },
  { id: 'c8', name: 'Paléontologie', code: 'GEO303', level: 'Bac 3' },
  { id: 'c9', name: 'Sédimentologie', code: 'GEO304', level: 'Bac 3' },
  { id: 'c10', name: 'Géologie Structurale', code: 'GEO305', level: 'Bac 3' },
  { id: 'c11', name: 'Physique Élémentaire', code: 'PHY001', level: 'Préscience' },
  { id: 'c12', name: 'Chimie Générale', code: 'CHM001', level: 'Préscience' },
  { id: 'c13', name: 'Gîtologie', code: 'GEO401', level: 'Master 1' },
  { id: 'c14', name: 'Hydrogéologie', code: 'GEO402', level: 'Master 1' },
  { id: 'c15', name: 'Exploration Minière', code: 'GEO501', level: 'Master 2' },
  { id: 'c16', name: 'Gestion de Projets Miniers', code: 'GEO502', level: 'Master 2' },
];

// Mock Data (Garder pour référence ou fallback si besoin, mais on va charger via API)
const INITIAL_USERS: User[] = [];

export function InscriptionsManager() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'student' | 'academic'>('student');
  const [filterClass, setFilterClass] = useState<string>('all');

  // Fetch Users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // On récupère tout le monde pour l'instant
        const apiUsers = await userService.getAllUsers();

        // DEBUG FRONTEND : Inspection des données brutes
        if (apiUsers.length > 0) {
          console.log("🐛 Données reçues du Backend (Premier user) :", apiUsers[0]);
          console.log("🐛 Inscriptions brutes :", (apiUsers[0] as any)._debugStudentEnrollments);
        }

        // Mapping des données API vers le format interne du composant
        // Mapping des données API vers le format interne du composant
        const formattedUsers: User[] = apiUsers
          .map((u: any) => {
            let role: Role | null = null;
            if (u.systemRole === 'STUDENT') {
              role = 'student';
            } else if (u.professorProfile) {
              role = 'professor';
            }

            if (!role || u.systemRole === 'ADMIN') return null;

            const color = role === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600';

            let promotion = 'Non inscrit';
            if (role === 'student' && u.studentEnrollments && u.studentEnrollments.length > 0) {
              const levelName = u.studentEnrollments[0]?.academicLevel?.name;
              if (levelName) promotion = levelName;
            }

            let title = undefined;
            if (role === 'professor' && u.professorProfile?.title) {
              title = u.professorProfile.title;
            } else if (role === 'professor') {
              title = 'Enseignant';
            }

            // Mapping des cours étudiants
            const enrolledCourses = u.studentCourseEnrollments?.map((enrollment: any) => ({
              id: enrollment.course.id,
              name: enrollment.course.name,
              code: enrollment.course.code,
              attendance: 85, // Valeur par défaut pour l'instant (car non dispo directement ici)
              grade: 'N/A',
              grades: []
            })) || [];

            // Mapping des cours professeurs
            const teachingCourses = u.enrollments?.map((enrollment: any) => ({
              id: enrollment.course.code,
              name: enrollment.course.name,
              code: enrollment.course.code,
              teachingRole: enrollment.role === 'PROFESSOR' ? 'professor' : 'assistant',
              studentsCount: 0
            })) || [];

            return {
              id: u.id,
              name: u.name,
              email: u.email,
              role: role,
              status: 'active',
              avatarColor: color,
              promotion: role === 'student' ? promotion : undefined,
              enrolledCourses: enrolledCourses,
              teachingCourses: teachingCourses,
              title: title
            };
          })
          .filter((u: User | null): u is User => u !== null);

        setUsers(formattedUsers);
      } catch (error) {
        console.error("Erreur chargement utilisateurs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Modal States
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    title: ''
  });

  const handleEditClick = (user: User) => {
    setEditFormData({
      name: user.name,
      email: user.email,
      title: user.title || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateUser(selectedUser.id, editFormData);

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, name: editFormData.name, email: editFormData.email, title: editFormData.title }
          : u
      ));

      setSelectedUser(prev => prev ? {
        ...prev,
        name: editFormData.name,
        email: editFormData.email,
        title: editFormData.title
      } : null);

      setIsEditModalOpen(false);
      alert("Informations mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Une erreur est survenue lors de la mise à jour.");
    }
  };

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserType, setNewUserType] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    postNom: '',
    prenom: '',
    classe: '',
    titre: '',
    whatsapp: '',
    email: '',
    idNumber: '',
    password: '',
    sex: 'M',
    birthday: '',
    nationality: 'Congolaise'
  });

  const fetchSuggestions = async () => {
    if (!formData.nom && !formData.prenom) return;
    try {
      const token = sessionStorage.getItem('token');
      const fullName = `${formData.nom} ${formData.prenom}`;
      const res = await fetch(`${API_URL}/admin/credentials/suggest?role=${newUserType === 'student' ? 'student' : 'prof'}&name=${encodeURIComponent(fullName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          idNumber: data.id,
          password: data.password
        }));
      }
    } catch (error) {
      console.error("Erreur suggestions:", error);
    }
  };

  const handleNameBlur = () => {
    if (!formData.idNumber || !formData.password) {
      fetchSuggestions();
    }
  };

  const resetForm = () => {
    setNewUserType(null);
    setFormData({
      nom: '',
      postNom: '',
      prenom: '',
      classe: '',
      titre: '',
      whatsapp: '',
      email: '',
      idNumber: '',
      password: '',
      sex: 'M',
      birthday: '',
      nationality: 'Congolaise'
    });
    setIsAddModalOpen(false);
  };

  const handleSubmit = () => {
    // Simulation d'envoi au service technique
    alert("Les informations ont été envoyées au service technique avec succès !");
    resetForm();
  };

  // Assign Course State & Handlers
  const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
  const [assignCourseData, setAssignCourseData] = useState({
    name: '',
    code: '',
    role: 'professor'
  });
  const [courseSearch, setCourseSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAssignSubmit = () => {
    if (!selectedUser) return;
    alert(`La demande d'assignation du cours "${assignCourseData.name}" à ${selectedUser.name} (en tant que ${assignCourseData.role === 'professor' ? 'Titulaire' : 'Assistant'}) a été envoyée.`);
    setIsAssignCourseModalOpen(false);
    setAssignCourseData({ name: '', code: '', role: 'professor' });
    setCourseSearch('');
  };

  // Justify Absence State & Handlers
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [justifyData, setJustifyData] = useState({
    courseId: '',
    session: '',
    reason: ''
  });

  // Student Enrollment State
  const [isStudentEnrollModalOpen, setIsStudentEnrollModalOpen] = useState(false);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const handleStudentEnroll = (course: Course) => {
    if (!selectedUser) return;

    setEnrollingCourseId(course.id);

    // Simulate API call
    setTimeout(() => {
      alert(`Demande d'inscription pour ${selectedUser.name} au cours de ${course.name} (${course.code}) envoyée.`);
      setEnrollingCourseId(null);
      // Logic to actually add course would go here
    }, 800);
  };

  // Block User State & Handlers
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);

  const handleBlockUser = (user: User) => {
    if (user.status === 'blocked') {
      // Unblock immediately without complex confirmation, or simple confirm
      if (confirm(`Voulez-vous réactiver l'accès pour ${user.name} ?`)) {
        performBlockAction(user.id);
      }
    } else {
      // Open modal for blocking
      setUserToBlock(user);
      setIsBlockModalOpen(true);
    }
  };

  // Course Details State
  const [courseDetails, setCourseDetails] = useState<StudentCourse | null>(null);

  const performBlockAction = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'blocked' : 'active' };
      }
      return u;
    }));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status: prev.status === 'active' ? 'blocked' : 'active' } : null);
    }
  };

  const confirmBlockUser = () => {
    if (userToBlock) {
      performBlockAction(userToBlock.id);
      setIsBlockModalOpen(false);
      setUserToBlock(null);
    }
  };

  const handleJustifySubmit = () => {
    if (!selectedUser) return;
    const course = selectedUser.enrolledCourses?.find(c => c.id === justifyData.courseId);
    if (!course) return;

    alert(`La justification d'absence pour l'étudiant ${selectedUser.name} au cours de "${course.name}" (Séance: ${justifyData.session}) a été envoyée au professeur responsable.`);
    setIsJustifyModalOpen(false);
    setJustifyData({ courseId: '', session: '', reason: '' });
  };

  const handleUnenroll = (courseId: string) => {
    if (!selectedUser) return;
    const course = selectedUser.enrolledCourses?.find(c => c.id === courseId);
    const confirmMsg = course
      ? `Voulez-vous vraiment désinscrire ${selectedUser.name} du cours de ${course.name} ?`
      : `Voulez-vous vraiment désinscrire ${selectedUser.name} de ce cours ?`;

    if (!confirm(confirmMsg)) return;

    setUsers(users.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          enrolledCourses: u.enrolledCourses?.filter(c => c.id !== courseId)
        };
      }
      return u;
    }));

    setSelectedUser(prev => prev ? {
      ...prev,
      enrolledCourses: prev.enrolledCourses?.filter(c => c.id !== courseId)
    } : null);

    alert(`L'étudiant ${selectedUser.name} a été désinscrit du cours.`);
  };

  const handleRemoveTeachingCourse = (courseId: string) => {
    if (!selectedUser) return;
    const course = selectedUser.teachingCourses?.find(c => c.id === courseId);
    if (!confirm(`Voulez-vous vraiment retirer le cours "${course?.name}" de la charge horaire de ${selectedUser.name} ?`)) return;

    setUsers(users.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          teachingCourses: u.teachingCourses?.filter(c => c.id !== courseId)
        };
      }
      return u;
    }));

    setSelectedUser(prev => prev ? {
      ...prev,
      teachingCourses: prev.teachingCourses?.filter(c => c.id !== courseId)
    } : null);

    alert(`Le cours a été retiré de la charge horaire.`);
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesView = viewMode === 'student'
      ? user.role === 'student'
      : (user.role === 'professor' || user.role === 'assistant');

    // Filtre par classe (seulement si vue étudiant est active)
    let matchesClass = true;
    if (viewMode === 'student' && filterClass !== 'all') {
      matchesClass = user.promotion?.includes(filterClass) || false;
    }

    return matchesSearch && matchesView && matchesClass;
  });



  const handleDeleteUser = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'student': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">Étudiant</span>;
      case 'professor': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium border border-green-200">Corps Académique</span>;
      case 'assistant': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium border border-green-200">Corps Académique</span>;
    }
  };

  // Affichage du loading si nécessaire (placé ici pour respecter les règles des Hooks)
  if (loading && users.length === 0) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#1B4332] font-medium">Chargement des effectifs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left List Panel */}
      <div className={`flex flex-col bg-white/80 backdrop-blur-sm rounded-[24px] border border-[#1B4332]/10 transition-all duration-300 ${selectedUser ? 'w-1/3' : 'w-full'}`}>
        {/* Header Search & Filter */}
        <div className="p-6 border-b border-[#1B4332]/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#1B4332]">
                {viewMode === 'student' ? 'Effectif étudiants' : 'Corps Académique'}
              </h2>
              <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-widest opacity-60">Service Académique</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2.5 rounded-[16px] text-sm font-semibold hover:bg-[#2D6A4F] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nouvelle Inscription</span>
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#F1F8F4] px-3 py-2 rounded-xl border border-[#1B4332]/5">
              <Search className="w-4 h-4 text-[#52796F]" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent border-none outline-none text-sm w-full text-[#1B4332]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-[#F1F8F4] p-1 rounded-xl border border-[#1B4332]/5">
              <button
                onClick={() => setViewMode('student')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'student'
                  ? 'bg-white text-[#1B4332] shadow-sm'
                  : 'text-[#52796F] hover:text-[#1B4332]'
                  }`}
              >
                Étudiants
              </button>
              <button
                onClick={() => setViewMode('academic')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'academic'
                  ? 'bg-white text-[#1B4332] shadow-sm'
                  : 'text-[#52796F] hover:text-[#1B4332]'
                  }`}
              >
                Corps Académique
              </button>
            </div>

            {viewMode === 'student' && (
              <select
                className="bg-[#F1F8F4] px-3 py-2 rounded-xl border border-[#1B4332]/5 text-sm text-[#1B4332] outline-none cursor-pointer animate-in fade-in slide-in-from-left-2 duration-200"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">Toutes les promotions</option>
                <option value="Prescience">Prescience</option>
                <option value="Licence 1 (B1)">Licence 1 (B1)</option>
                <option value="Licence 2 (B2)">Licence 2 (B2)</option>
                <option value="Licence 3 (B3)">Licence 3 (B3)</option>
                <optgroup label="Master 1">
                  <option value="Master 1 (Exploration)">M1 Exploration & Géo. Minières</option>
                  <option value="Master 1 (Hydro)">M1 Environnement & Hydrogéologie</option>
                  <option value="Master 1 (Géotechnique)">M1 Géotechnique</option>
                </optgroup>
                <optgroup label="Master 2">
                  <option value="Master 2 (Exploration)">M2 Exploration & Géo. Minières</option>
                  <option value="Master 2 (Hydro)">M2 Environnement & Hydrogéologie</option>
                  <option value="Master 2 (Géotechnique)">M2 Géotechnique</option>
                </optgroup>
              </select>
            )}

            {/* Compteur de résultats */}
            <div className="flex items-center gap-2 bg-[#1B4332]/10 px-3 py-1.5 rounded-full">
              <Users className="w-4 h-4 text-[#1B4332]" />
              <span className="text-sm font-semibold text-[#1B4332]">
                {filteredUsers.length}
              </span>
              <span className="text-xs text-[#52796F]">
                {viewMode === 'student' ? 'étudiants' : 'membres'}
              </span>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`flex items-center gap-4 p-4 rounded-[16px] cursor-pointer transition-all border ${selectedUser?.id === user.id
                ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-lg transform scale-[1.02]'
                : 'hover:bg-white border-transparent hover:border-[#1B4332]/10'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.avatarColor} ${selectedUser?.id === user.id ? 'bg-white/20 text-white' : ''}`}>
                <span className="font-bold">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-bold truncate">{user.name}</p>
                  {user.status === 'blocked' && <Ban className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <span className="capitalize">{user.role}</span>
                  {user.title && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1 italic">{user.title}</span>}
                  {user.promotion && <span>• {user.promotion}</span>}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${selectedUser?.id === user.id ? 'text-white' : 'text-[#1B4332]/30'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedUser && (
        <div className="w-2/3 bg-white/80 backdrop-blur-sm rounded-[24px] border border-[#1B4332]/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Profile Header */}
          <div className="p-8 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[24px] flex items-center justify-center text-3xl font-bold border border-white/20 shadow-xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedUser.name}</h2>
                  <div className="flex items-center gap-3 text-white/80">
                    {getRoleBadge(selectedUser.role)}
                    <button
                      onClick={() => alert(`Envoi d'un message à ${selectedUser.name}`)}
                      className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
                      title="Envoyer un message"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => handleBlockUser(selectedUser)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedUser.status === 'blocked'
                  ? 'bg-green-500/20 text-green-100 hover:bg-green-500/30'
                  : 'bg-red-500/20 text-red-100 hover:bg-red-500/30'
                  }`}
              >
                {selectedUser.status === 'blocked' ? (
                  <><CheckCircle className="w-4 h-4" /> Débloquer le compte</>
                ) : (
                  <><Ban className="w-4 h-4" /> Bloquer l'accès</>
                )}
              </button>

              {selectedUser.role === 'student' && (
                <>
                  <button
                    onClick={() => setIsStudentEnrollModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Inscrire à un cours
                  </button>
                </>
              )}

              {(selectedUser.role === 'professor' || selectedUser.role === 'assistant') && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleEditClick(selectedUser)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setIsCredentialsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#74C69D] text-[#1B4332] text-sm font-bold transition-all hover:shadow-lg active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    Voir Identifiants
                  </button>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#F1F8F4]">

            {/* Student View */}
            {selectedUser.role === 'student' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1B4332]">Cursus Académique</h3>
                  <span className="text-sm font-medium text-[#52796F]">{selectedUser.promotion}</span>
                </div>

                {selectedUser.enrolledCourses && selectedUser.enrolledCourses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedUser.enrolledCourses.map(course => (
                      <div key={course.id} className="bg-white rounded-[20px] p-6 border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${course.attendance < 50 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                              }`}>
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#1B4332]">{course.name}</h4>
                              <p className="text-xs text-[#52796F] font-medium">{course.code} • {course.level}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUnenroll(course.id)}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg text-xs font-medium transition-colors"
                            >
                              Désinscrire
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          {/* Attendance Tracker */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-[#52796F]">Présence</span>
                              <span className={`text-sm font-bold ${course.attendance < 50 ? 'text-red-500' : 'text-[#1B4332]'
                                }`}>{course.attendance}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${course.attendance < 50 ? 'bg-red-500' : 'bg-[#1B4332]'
                                  }`}
                                style={{ width: `${course.attendance}%` }}
                              />
                            </div>
                          </div>

                          {/* Grades */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#52796F]">Moyenne</span>
                              <span className="font-bold text-[#1B4332]">{course.grade}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-[24px] border border-dashed border-[#1B4332]/20">
                    <BookOpen className="w-12 h-12 text-[#1B4332]/20 mx-auto mb-3" />
                    <p className="text-[#52796F] font-medium">Aucun cours inscrit pour le moment</p>
                    <button
                      onClick={() => setIsStudentEnrollModalOpen(true)}
                      className="mt-4 text-sm text-[#1B4332] font-bold hover:underline"
                    >
                      Inscrire à un cours
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Teaching Staff View */}
            {/* Teaching Staff View */}
            {(selectedUser.role === 'professor' || selectedUser.role === 'assistant') && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#1B4332]">Charge Horaire</h3>
                    {selectedUser.title && <p className="text-[#52796F] text-sm font-medium mt-1">{selectedUser.title}</p>}
                  </div>
                  <button
                    onClick={() => setIsAssignCourseModalOpen(true)}
                    className="text-sm text-[#1B4332] font-medium hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" /> Assigner un cours
                  </button>
                </div>

                {selectedUser.teachingCourses && selectedUser.teachingCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.teachingCourses.map(course => (
                      <div key={course.id} className="bg-white p-6 rounded-[20px] border border-[#1B4332]/10 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#1B4332]/5 rounded-xl flex items-center justify-center">
                            <School className="w-5 h-5 text-[#1B4332]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-[#1B4332]">{course.name}</h4>
                              {course.teachingRole === 'professor' ? (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">Titulaire</span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">Assistant</span>
                              )}
                            </div>
                            <p className="text-xs text-[#52796F]">{course.code}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={() => handleRemoveTeachingCourse(course.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-[24px] border border-dashed border-[#1B4332]/20">
                    <School className="w-12 h-12 text-[#1B4332]/20 mx-auto mb-3" />
                    <p className="text-[#52796F] font-medium">Pas de cours dispensés</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Add User Modal */}
      {
        isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl border border-[#1B4332]/10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-[#1B4332] p-6 text-white flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Nouvelle Inscription
                  </h3>
                  <p className="text-[#FEFCF3]/80 text-sm mt-1">
                    {!newUserType ? "Sélectionnez le type de profil" :
                      newUserType === 'student' ? "Profil Étudiant" : "Profil Corps Académique"}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                {!newUserType ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setNewUserType('student')}
                      className="flex flex-col items-center gap-4 p-6 rounded-[20px] border-2 border-[#1B4332]/10 hover:border-[#1B4332] hover:bg-[#D8F3DC]/30 transition-all group"
                    >
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                      </div>
                      <span className="font-bold text-[#1B4332]">Étudiant</span>
                    </button>

                    <button
                      onClick={() => setNewUserType('professor')}
                      className="flex flex-col items-center gap-4 p-6 rounded-[20px] border-2 border-[#1B4332]/10 hover:border-[#1B4332] hover:bg-[#D8F3DC]/30 transition-all group"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <School className="w-8 h-8 text-green-600" />
                      </div>
                      <span className="font-bold text-[#1B4332]">Corps Académique</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">Nom *</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          onBlur={handleNameBlur}
                          className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          placeholder="Ex: Kabeya"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">Post-nom *</label>
                        <input
                          type="text"
                          value={formData.postNom}
                          onChange={(e) => setFormData({ ...formData, postNom: e.target.value })}
                          className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          placeholder="Ex: Tshimbakala"
                        />
                      </div>
                    </div>

                    {newUserType === 'student' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1B4332] mb-1">Prénom *</label>
                          <input
                            type="text"
                            value={formData.prenom}
                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                            onBlur={handleNameBlur}
                            className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                            placeholder="Ex: Jean"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1B4332] mb-1">Classe *</label>
                          <select
                            value={formData.classe}
                            onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                            className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="prescience">Préscience</option>
                            <option value="bac1">Bachelor 1</option>
                            <option value="bac2">Bachelor 2</option>
                            <option value="bac3">Bachelor 3</option>
                            <option value="master1">Master 1</option>
                            <option value="master2">Master 2</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {(newUserType === 'professor' || newUserType === 'assistant') && (
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">Titre Académique *</label>
                        <select
                          value={formData.titre}
                          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                          className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="po">Professeur Ordinaire</option>
                          <option value="pe">Professeur Émérite</option>
                          <option value="pa">Professeur Associé</option>
                          <option value="ct">Chef de Travaux</option>
                          <option value="assistant">Assistant</option>
                          <option value="assistant2">Assistant de Recherche</option>
                        </select>
                      </div>
                    )}

                    {newUserType === 'student' && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1B4332] mb-1">Sexe *</label>
                          <select
                            value={formData.sex}
                            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                            className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          >
                            <option value="M">Masculin</option>
                            <option value="F">Féminin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1B4332] mb-1">Date de Naissance</label>
                          <input
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1B4332] mb-1">Nationalité</label>
                          <input
                            type="text"
                            value={formData.nationality}
                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                            className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                            placeholder="Ex: Congolaise"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">WhatsApp *</label>
                        <input
                          type="text"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          placeholder="+243..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">Email {newUserType === 'student' && "(Optionnel)"}</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                          placeholder="exemple@unilu.cd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">Identifiant Suggéré</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52796F]" />
                          <input
                            type="text"
                            value={formData.idNumber}
                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                            className="w-full pl-10 p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors font-bold text-blue-600"
                            placeholder="Généré automatiquement..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1B4332] mb-1">Mot de passe Suggéré</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52796F]" />
                          <input
                            type="text"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-10 p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors font-mono font-bold text-emerald-600"
                            placeholder="Généré automatiquement..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[#1B4332]/10 flex justify-between items-center bg-[#F1F8F4]/50">
                {newUserType ? (
                  <button
                    onClick={() => setNewUserType(null)}
                    className="px-4 py-2 text-[#52796F] hover:bg-black/5 rounded-[12px] font-medium transition-colors"
                  >
                    Retour
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-[#52796F] hover:bg-black/5 rounded-[12px] font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  {newUserType && (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[12px] font-medium shadow-lg shadow-[#1B4332]/20 transition-all transform hover:scale-105"
                    >
                      Envoyer au service technique
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Assign Course Modal */}
      {
        isAssignCourseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Assignation de Cours
                  </h3>
                  <p className="text-[#FEFCF3]/80 text-sm mt-1">
                    Pour {selectedUser?.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignCourseModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">Rechercher un cours (Code ou Intitulé)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52796F]" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        setShowSuggestions(true);
                        // Also clear current selection if user types
                        if (assignCourseData.code && e.target.value !== assignCourseData.name) {
                          setAssignCourseData(prev => ({ ...prev, name: '', code: '' }));
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full pl-10 p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                      placeholder="Ex: GEO304 ou Géochimie"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && courseSearch.length > 0 && !assignCourseData.code && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#1B4332]/10 rounded-[12px] shadow-lg max-h-48 overflow-y-auto">
                      {AVAILABLE_COURSES.filter(c =>
                        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        c.code.toLowerCase().includes(courseSearch.toLowerCase())
                      ).map(course => (
                        <button
                          key={course.id}
                          onClick={() => {
                            setAssignCourseData({ ...assignCourseData, name: course.name, code: course.code });
                            setCourseSearch(`${course.name} (${course.code})`);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#F1F8F4] flex justify-between items-center group"
                        >
                          <span className="text-[#1B4332] font-medium">{course.name}</span>
                          <span className="text-xs px-2 py-1 bg-[#F1F8F4] group-hover:bg-white rounded text-[#52796F]">{course.code}</span>
                        </button>
                      ))}
                      {AVAILABLE_COURSES.filter(c =>
                        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        c.code.toLowerCase().includes(courseSearch.toLowerCase())
                      ).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">Aucun cours trouvé</div>
                        )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-2">Rôle dans ce cours</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAssignCourseData({ ...assignCourseData, role: 'professor' })}
                      className={`p-3 rounded-[12px] border transition-all flex flex-col items-center gap-2 ${assignCourseData.role === 'professor'
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white border-[#1B4332]/10 text-[#52796F] hover:bg-[#F1F8F4]'
                        }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-bold">Titulaire</span>
                    </button>
                    <button
                      onClick={() => setAssignCourseData({ ...assignCourseData, role: 'assistant' })}
                      className={`p-3 rounded-[12px] border transition-all flex flex-col items-center gap-2 ${assignCourseData.role === 'assistant'
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white border-[#1B4332]/10 text-[#52796F] hover:bg-[#F1F8F4]'
                        }`}
                    >
                      <School className="w-5 h-5" />
                      <span className="text-sm font-bold">Assistant</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAssignCourseModalOpen(false)}
                    className="flex-1 py-3 text-[#52796F] hover:bg-[#F1F8F4] rounded-[16px] font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAssignSubmit}
                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[16px] font-medium transition-colors shadow-lg shadow-[#1B4332]/20"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Justify Absence Modal */}
      {
        isJustifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Justifier une absence
                  </h3>
                  <p className="text-[#FEFCF3]/80 text-sm mt-1">
                    Pour {selectedUser?.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsJustifyModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">Cours concerné</label>
                  <select
                    value={justifyData.courseId}
                    onChange={(e) => setJustifyData({ ...justifyData, courseId: e.target.value })}
                    className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                  >
                    <option value="">Sélectionner un cours...</option>
                    {selectedUser?.enrolledCourses?.map(course => (
                      <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">Séance / Date</label>
                  <input
                    type="text"
                    value={justifyData.session}
                    onChange={(e) => setJustifyData({ ...justifyData, session: e.target.value })}
                    className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                    placeholder="Ex: Séance du 20 Décembre - 8h"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">Motif / Commentaire</label>
                  <textarea
                    value={justifyData.reason}
                    onChange={(e) => setJustifyData({ ...justifyData, reason: e.target.value })}
                    className="w-full p-3 bg-[#F1F8F4] border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors resize-none"
                    rows={3}
                    placeholder="Raison de l'absence..."
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-3 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    Cette demande sera envoyée directement au professeur titulaire du cours pour validation.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsJustifyModalOpen(false)}
                    className="flex-1 py-3 text-[#52796F] hover:bg-[#F1F8F4] rounded-[16px] font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleJustifySubmit}
                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-[16px] font-medium transition-colors shadow-lg shadow-[#1B4332]/20"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Student Enroll Modal */}
      {
        isStudentEnrollModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl border border-[#1B4332]/10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Inscription aux cours
                  </h3>
                  <p className="text-[#FEFCF3]/80 text-sm mt-1">
                    Pour l'étudiant {selectedUser.name} — {selectedUser.promotion}
                  </p>
                </div>
                <button
                  onClick={() => setIsStudentEnrollModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 border-b border-[#1B4332]/10 bg-[#F1F8F4]/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52796F]" />
                  <input
                    type="text"
                    value={enrollSearchTerm}
                    onChange={(e) => setEnrollSearchTerm(e.target.value)}
                    className="w-full pl-10 p-3 bg-white border border-[#1B4332]/10 rounded-[12px] outline-none focus:border-[#1B4332] transition-colors"
                    placeholder="Rechercher un cours par nom ou code..."
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F8F4]">
                {['Préscience', 'Bac 1', 'Bac 2', 'Bac 3', 'Master 1', 'Master 2'].map(level => {
                  const levelCourses = AVAILABLE_COURSES.filter(c =>
                    c.level === level &&
                    (c.name.toLowerCase().includes(enrollSearchTerm.toLowerCase()) ||
                      c.code.toLowerCase().includes(enrollSearchTerm.toLowerCase()))
                  );

                  if (levelCourses.length === 0 && enrollSearchTerm) return null;

                  const isExpanded = expandedLevels.includes(level);

                  return (
                    <div key={level} className="bg-white rounded-[20px] border border-[#1B4332]/10 overflow-hidden shadow-sm">
                      <button
                        onClick={() => toggleLevel(level)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-bold text-[#1B4332] flex items-center gap-2">
                          <span className="w-2 h-8 bg-[#1B4332] rounded-full"></span>
                          {level}
                          <span className="ml-2 text-xs font-medium text-[#52796F] bg-[#F1F8F4] px-2 py-1 rounded-full">
                            {levelCourses.length} cours
                          </span>
                        </h4>
                        <ChevronRight className={`w-5 h-5 text-[#52796F] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-[#1B4332]/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {levelCourses.map(course => {
                            const isEnrolled = selectedUser.enrolledCourses?.some(ec => ec.id === course.id);
                            return (
                              <div key={course.id} className="flex items-center justify-between p-4 rounded-[16px] border border-[#1B4332]/5 hover:border-[#1B4332]/20 bg-[#F1F8F4] hover:bg-white transition-all group">
                                <div>
                                  <h5 className="font-bold text-[#1B4332]">{course.name}</h5>
                                  <p className="text-xs text-[#52796F] font-medium">{course.code}</p>
                                </div>
                                {isEnrolled ? (
                                  <span className="flex items-center gap-1 text-xs font-bold text-[#1B4332] bg-[#D8F3DC] px-3 py-1.5 rounded-full animate-in zoom-in duration-300">
                                    <CheckCircle className="w-3 h-3" />
                                    Inscrit
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStudentEnroll(course)}
                                    disabled={enrollingCourseId === course.id}
                                    className={`px-4 py-2 border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${enrollingCourseId === course.id
                                      ? 'bg-[#1B4332] text-white cursor-wait w-[100px] justify-center'
                                      : 'bg-white border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332] hover:text-white'
                                      }`}
                                  >
                                    {enrollingCourseId === course.id ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="animate-pulse">Envoi...</span>
                                      </>
                                    ) : (
                                      'Inscrire'
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {levelCourses.length === 0 && (
                            <p className="text-sm text-[#52796F] italic col-span-2 text-center py-4">Aucun cours disponible pour ce niveau.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      }
      {/* Block Confirmation Modal */}
      {
        isBlockModalOpen && userToBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-red-500/20 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-red-600 p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Confirmation de blocage
                  </h3>
                </div>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="font-medium text-[#1B4332] text-lg">
                  Êtes-vous sûr de vouloir bloquer l'accès pour <span className="font-bold">{userToBlock.name}</span> ?
                </p>

                <div className="bg-red-50 border border-red-100 rounded-[16px] p-4 space-y-3">
                  <p className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Conséquences immédiates :
                  </p>
                  <ul className="text-sm text-red-700 space-y-2 list-disc pl-5">
                    <li>L'utilisateur ne pourra plus se connecter à la plateforme.</li>
                    <li>Il ne pourra plus accéder à ses cours, notes ou ressources.</li>
                    <li>Toute activité académique en cours sera immédiatement suspendue.</li>
                    {userToBlock.role !== 'student' && (
                      <li>Il ne pourra plus gérer ses cours ou encoder des cotes.</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsBlockModalOpen(false)}
                    className="flex-1 py-3 text-[#52796F] hover:bg-[#F1F8F4] rounded-[16px] font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmBlockUser}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[16px] font-bold shadow-lg shadow-red-600/20 transition-all transform hover:scale-105"
                  >
                    Bloquer l'accès
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* Course Details Modal */}
      {
        courseDetails && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1B4332] p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Détails du cours
                  </h3>
                  <p className="text-[#FEFCF3]/80 text-sm mt-1">
                    {courseDetails.name} ({courseDetails.code})
                  </p>
                </div>
                <button
                  onClick={() => setCourseDetails(null)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Attendance Section */}
                <div className="bg-[#F1F8F4] p-5 rounded-[20px] border border-[#1B4332]/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-[#1B4332] flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Taux de présence
                    </h4>
                    <span className={`text-lg font-bold ${courseDetails.attendance < 50 ? 'text-red-500' : 'text-[#1B4332]'}`}>
                      {courseDetails.attendance}%
                    </span>
                  </div>
                  <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-[#1B4332]/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${courseDetails.attendance < 50 ? 'bg-red-500' : 'bg-[#1B4332]'}`}
                      style={{ width: `${courseDetails.attendance}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#52796F] mt-2 italic">
                    {courseDetails.attendance < 50
                      ? "Attention : Le taux de présence est critique."
                      : "Le taux de présence est satisfaisant."}
                  </p>
                </div>

                {/* Grades Section */}
                <div>
                  <h4 className="font-bold text-[#1B4332] flex items-center gap-2 mb-4">
                    <GraduationCap className="w-4 h-4" />
                    Interrogations & Examens
                  </h4>
                  <div className="space-y-3">
                    {courseDetails.grades.map(grade => (
                      <div key={grade.id} className="flex items-center justify-between p-4 bg-white border border-[#1B4332]/10 rounded-[16px] shadow-sm hover:shadow-md transition-all">
                        <div>
                          <p className="font-bold text-[#1B4332]">{grade.name}</p>
                          <p className="text-xs text-[#52796F]">Évaluation</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${grade.score < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {grade.score}/{grade.max}
                          </div>
                        </div>
                      </div>
                    ))}
                    {courseDetails.grades.length === 0 && (
                      <div className="text-center py-8 text-[#52796F] italic bg-[#F1F8F4]/50 rounded-[16px] border border-dashed border-[#1B4332]/10">
                        Aucune interrogation enregistrée pour ce cours.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F1F8F4] border-t border-[#1B4332]/10 flex justify-end">
                <button
                  onClick={() => setCourseDetails(null)}
                  className="px-6 py-2 bg-white border border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332] hover:text-white rounded-xl font-medium transition-all shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Credentials Modal - Optimized & Smaller Version */}
      {
        isCredentialsModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-[360px] shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1B4332] p-5 text-white relative">
                <button
                  onClick={() => {
                    setIsCredentialsModalOpen(false);
                    setShowPassword(false);
                  }}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#74C69D]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Identifiants</h3>
                    <p className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Personnel Académique</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Profile Bio Small */}
                <div className="flex items-center gap-3 p-3 bg-[#F1F8F4] rounded-xl border border-[#1B4332]/5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${selectedUser.avatarColor}`}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1B4332] leading-tight">{selectedUser.name}</p>
                    <p className="text-[10px] text-[#52796F]">{selectedUser.title || 'Enseignant'}</p>
                  </div>
                </div>

                {/* Credentials Fields Compact */}
                <div className="space-y-3">
                  {/* ID (Login) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider ml-1">Matricule (Login)</label>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 group">
                      <span className="flex-1 font-mono text-sm font-bold text-[#1B4332]">{selectedUser.id}</span>
                      <button
                        onClick={() => handleCopy(selectedUser.id, 'id')}
                        className="p-1.5 hover:bg-[#1B4332]/10 rounded-lg transition-colors text-[#52796F]"
                      >
                        {copiedField === 'id' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider ml-1">Email</label>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 group">
                      <span className="flex-1 text-[12px] font-medium text-[#1B4332] truncate">{selectedUser.id.toLowerCase()}@unilu.cd</span>
                      <button
                        onClick={() => handleCopy(`${selectedUser.id.toLowerCase()}@unilu.cd`, 'email')}
                        className="p-1.5 hover:bg-[#1B4332]/10 rounded-lg transition-colors text-[#52796F]"
                      >
                        {copiedField === 'email' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Placeholder */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider ml-1">Mot de passe</label>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 group">
                      <span className="flex-1 text-[12px] font-medium text-[#1B4332]">
                        {showPassword ? '••••••••' : '********'}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 hover:bg-[#1B4332]/10 rounded-lg transition-colors text-[#52796F]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCredentialsModalOpen(false);
                    setShowPassword(false);
                  }}
                  className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#14332a] transition-all active:scale-[0.97]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Professor Modal */}
      {
        isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-[#1B4332]/10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1B4332] p-5 text-white flex justify-between items-center">
                <h3 className="text-lg font-bold">Modifier les informations</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#52796F] uppercase tracking-wider ml-1">Nom Complet</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-[#1B4332]/30 text-[#1B4332] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#52796F] uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-[#1B4332]/30 text-[#1B4332] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#52796F] uppercase tracking-wider ml-1">Titre Académique</label>
                  <select
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-[#1B4332]/30 text-[#1B4332] font-medium"
                  >
                    <option value="Enseignant">Enseignant</option>
                    <option value="PhD">PhD (Docteur)</option>
                    <option value="Professeur">Professeur</option>
                    <option value="Prof. Associé">Prof. Associé</option>
                    <option value="Prof. Emérite">Prof. Emérite</option>
                    <option value="Chef de Travaux">Chef de Travaux</option>
                    <option value="Assistant">Assistant</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-100 text-[#52796F] py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="flex-1 bg-[#1B4332] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#14332a] transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

