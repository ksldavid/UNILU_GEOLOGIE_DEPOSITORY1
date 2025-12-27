import { useState } from 'react';
import { Search, ChevronRight, UserPlus, BookOpen, FileText, CheckCircle, X, Ban, MessageCircle, AlertTriangle, School, Trash2, GraduationCap, Users } from 'lucide-react';

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
}

interface StudentCourse extends Course {
  attendance: number;
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
}

// Mock Data
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

// Mock Data
const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'Alice Konan',
    email: 'alice.konan@student.unilu.cd',
    role: 'student',
    status: 'active',
    promotion: 'L1 Géologie',
    avatarColor: 'bg-blue-100 text-blue-600',
    enrolledCourses: [
      {
        id: 'c1', name: 'Cristallographie', code: 'GEO101', level: 'Bac 1', attendance: 92,
        grades: [{ id: 't1', name: 'Interro 1', score: 14, max: 20 }, { id: 't2', name: 'TP', score: 16, max: 20 }]
      },
      {
        id: 'c2', name: 'Mathématiques I', code: 'MAT101', level: 'Bac 1', attendance: 85,
        grades: [{ id: 't1', name: 'Partiel', score: 11, max: 20 }]
      },
    ]
  },
  {
    id: '2',
    name: 'Prof. Jean Kabeya',
    email: 'jean.kabeya@unilu.cd',
    role: 'professor',
    status: 'active',
    avatarColor: 'bg-green-100 text-green-600',
    teachingCourses: [
      { id: 'c1', name: 'Cristallographie', code: 'GEO101', level: 'Bac 1' },
      { id: 'c3', name: 'Minéralogie', code: 'GEO201', level: 'Bac 2' }
    ]
  },
  {
    id: '3',
    name: 'Paul Mukendi',
    email: 'paul.mukendi@student.unilu.cd',
    role: 'student',
    status: 'blocked',
    promotion: 'L2 Géologie',
    avatarColor: 'bg-red-100 text-red-600',
    enrolledCourses: [
      {
        id: 'c3', name: 'Minéralogie', code: 'GEO201', level: 'Bac 2', attendance: 45,
        grades: [{ id: 't1', name: 'Interro 1', score: 0, max: 20 }]
      }
    ]
  },
  {
    id: '4',
    name: 'Sarah Mbiya',
    email: 'sarah.mbiya@unilu.cd',
    role: 'assistant',
    status: 'active',
    avatarColor: 'bg-purple-100 text-purple-600',
    teachingCourses: [
      { id: 'c2', name: 'Mathématiques I', code: 'MAT101', level: 'Bac 1' }
    ]
  }
];

export function InscriptionsManager() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'student' | 'academic'>('student');
  const [filterClass, setFilterClass] = useState<string>('all');

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
    email: ''
  });

  const resetForm = () => {
    setNewUserType(null);
    setFormData({
      nom: '',
      postNom: '',
      prenom: '',
      classe: '',
      titre: '',
      whatsapp: '',
      email: ''
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
                <option value="all">Toutes les classes</option>
                <option value="Préscience">Préscience</option>
                <option value="L1">Bachelor 1</option>
                <option value="L2">Bachelor 2</option>
                <option value="L3">Bachelor 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>
            )}
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
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Detailed Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#F1F8F4]">

            {/* Student View */}
            {selectedUser.role === 'student' && selectedUser.enrolledCourses && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1B4332]">Cursus Académique</h3>
                  <span className="text-sm font-medium text-[#52796F]">{selectedUser.promotion}</span>
                </div>

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
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#52796F]">Notes</span>
                            <button
                              onClick={() => setCourseDetails(course)}
                              className="text-xs text-blue-500 hover:underline"
                            >
                              Voir détails
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {course.grades.map(grade => (
                              <div key={grade.id} className="bg-[#F1F8F4] px-3 py-1.5 rounded-lg border border-[#1B4332]/5 flex items-center gap-2">
                                <span className="text-xs text-[#52796F]">{grade.name}</span>
                                <span className="text-xs font-bold text-[#1B4332]">{grade.score}/{grade.max}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teaching Staff View */}
            {(selectedUser.role === 'professor' || selectedUser.role === 'assistant') && selectedUser.teachingCourses && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1B4332]">Charge Horaire</h3>
                  <button
                    onClick={() => setIsAssignCourseModalOpen(true)}
                    className="text-sm text-[#1B4332] font-medium hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" /> Assigner un cours
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.teachingCourses.map(course => (
                    <div key={course.id} className="bg-white p-6 rounded-[20px] border border-[#1B4332]/10 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#1B4332]/5 rounded-xl flex items-center justify-center">
                          <School className="w-5 h-5 text-[#1B4332]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1B4332]">{course.name}</h4>
                          <p className="text-xs text-[#52796F]">{course.code} • {course.level}</p>
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
              </div>
            )}

          </div>
        </div>
      )}
      {/* Add User Modal */}
      {isAddModalOpen && (
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
      {isStudentEnrollModalOpen && selectedUser && (
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
      )}
      {/* Block Confirmation Modal */}
      {isBlockModalOpen && userToBlock && (
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
      )}
      {/* Course Details Modal */}
      {courseDetails && selectedUser && (
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
      )}

    </div >
  );
}