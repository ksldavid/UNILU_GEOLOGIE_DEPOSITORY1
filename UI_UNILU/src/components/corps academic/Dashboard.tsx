import { useState, useEffect } from "react";
import { BookOpen, Clock, Users, Megaphone, X, Send, Search } from "lucide-react";
import type { Page } from "../../App";
import { professorService } from "../../services/professor";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementType, setAnnouncementType] = useState('all_courses');
  const [announcementText, setAnnouncementText] = useState("");
  const [targetStudent, setTargetStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [targetLevel, setTargetLevel] = useState("");
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await professorService.getDashboard();
        setData(dashboardData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getCourseStyles = (title: string) => {
    const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      { bg: "bg-blue-100", text: "text-blue-600" },
      { bg: "bg-purple-100", text: "text-purple-600" },
      { bg: "bg-teal-100", text: "text-teal-600" },
      { bg: "bg-orange-100", text: "text-orange-600" },
      { bg: "bg-pink-100", text: "text-pink-600" },
      { bg: "bg-indigo-100", text: "text-indigo-600" }
    ];
    return colors[hash % colors.length];
  };

  const todaysCourses = data?.todaySchedule ? data.todaySchedule.map((c: any) => {
    const styles = getCourseStyles(c.title);
    return {
      title: c.title,
      code: c.code,
      time: c.time,
      timeDetail: c.timeDetail,
      icon: BookOpen,
      iconBg: styles.bg,
      iconColor: styles.text
    };
  }) : [];

  // Fallback if no courses
  if (todaysCourses.length === 0 && !loading) {
    // Optional: Display a message or leave empty.
  }

  const stats = [
    { label: "Étudiants", value: data?.stats.studentCount || '0', change: "Total" },
    { label: "Cours Actifs", value: data?.stats.courseCount || '0', change: "En charge" }
  ];

  const handleSendAnnouncement = async () => {
    if (!announcementText) return;
    try {
      setLoading(true);
      const payload: any = {
        title: `Annonce de ${data?.professorName || 'votre professeur'}`,
        content: announcementText,
        type: 'GENERAL',
        target: announcementType === 'all_courses' ? 'ALL_STUDENTS' : (announcementType === 'specific_class' ? 'ACADEMIC_LEVEL' : 'SPECIFIC_USER'),
      };

      if (announcementType === 'specific_class') {
        const selectedLevel = data?.myLevels?.find((l: any) => l.name === targetLevel);
        payload.academicLevelId = selectedLevel?.id;
      }
      if (announcementType === 'specific_student') {
        payload.targetUserId = targetStudent;
      }

      await professorService.createAnnouncement(payload);

      alert("Annonce diffusée avec succès !");
      setShowAnnouncementModal(false);
      setAnnouncementText("");
      setTargetStudent("");
      setTargetLevel("");
      setSelectedStudentLabel("");

      // Refresh dashboard to see new announcement if needed
      const dashboardData = await professorService.getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la diffusion de l'annonce");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSearch = async () => {
    try {
      const students = await professorService.getStudents();
      setAllStudents(students);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (showAnnouncementModal && allStudents.length === 0) {
      fetchStudentsForSearch();
    }
  }, [showAnnouncementModal]);

  const handleStudentSearch = (query: string) => {
    setTargetStudent(query);
    if (query.length > 1) {
      const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-700 rounded-3xl p-10 mb-10 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative z-10">
          <h1 className="text-white text-3xl md:text-5xl font-bold mb-2 tracking-tight">
            Espace Enseignant
          </h1>
          <h2 className="text-teal-100 text-2xl md:text-3xl font-light mb-6 opacity-90">
            Faculté de Géologie
          </h2>
          <p className="text-teal-50 text-lg max-w-2xl leading-relaxed opacity-80">
            Bienvenue sur votre tableau de bord académique. Gérez vos cours, consultez vos horaires et communiquez avec vos étudiants en toute simplicité.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Cours de la journée</h3>
            <button
              onClick={() => onNavigate('planning')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2 transition-colors"
            >
              Voir l'agenda
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {todaysCourses.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-500">
                Aucun cours aujourd'hui
              </div>
            ) : todaysCourses.map((course: any, index: number) => {
              const Icon = course.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${course.iconBg} w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-7 h-7 ${course.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">{course.title}</h4>
                      <p className="text-gray-600">{course.code}</p>
                    </div>
                    <div className="text-right">
                      <div className={`
                        inline-block px-3 py-1 rounded-full text-sm font-medium mb-2
                        ${course.time === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                      `}>
                        {course.time}
                      </div>
                      {course.timeDetail && (
                        <div className="text-gray-900 font-semibold">{course.timeDetail}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Faculty Announcements */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              Annonces Récentes
            </h3>

            <div className="space-y-4">
              {data?.announcements?.length > 0 ? (
                data.announcements.map((ann: any) => (
                  <div key={ann.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${ann.target === 'ALL_STUDENTS' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ann.target === 'ALL_STUDENTS' ? 'bg-indigo-50 text-indigo-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                        {ann.target === 'ALL_STUDENTS' ? 'Annonce Générale' : 'Annonce Faculté'}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(ann.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-teal-700 transition-colors">{ann.title}</h4>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {ann.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-200">
                  <Megaphone className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p>Aucune annonce pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        {/* Stats Sidebar */}
        <div className="lg:col-span-1 space-y-8">

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Statistiques
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-2">{stat.value}</div>
                  <div className="text-gray-900 font-semibold mb-1">{stat.label}</div>
                  <div className="text-gray-500 text-sm font-medium bg-gray-50 inline-block px-2 py-1 rounded-md">{stat.change}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-5 text-lg">Actions rapides</h4>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('courses')}
                className="w-full group flex items-center gap-4 px-4 py-3.5 bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700 rounded-xl transition-all border border-transparent hover:border-teal-100"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <span className="font-semibold text-sm">Gérer mes cours</span>
              </button>
              <button
                onClick={() => onNavigate('planning')}
                className="w-full group flex items-center gap-4 px-4 py-3.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl transition-all border border-transparent hover:border-blue-100"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-sm">Voir mon planning</span>
              </button>
              <button
                onClick={() => onNavigate('students')}
                className="w-full group flex items-center gap-4 px-4 py-3.5 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl transition-all border border-transparent hover:border-purple-100"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-semibold text-sm">Voir étudiants</span>
              </button>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="w-full group flex items-center gap-4 px-4 py-3.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-700 rounded-xl transition-all border border-transparent hover:border-orange-100"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Megaphone className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-semibold text-sm">Faire une annonce</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  Nouvelle Annonce
                </h3>
                <p className="text-teal-50 text-sm mt-1">Diffusez un message à vos étudiants</p>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">À qui s'adresse l'annonce ?</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'all_courses', label: 'Tous mes cours' },
                    { id: 'specific_class', label: 'Une classe particulière' },
                    { id: 'specific_student', label: 'Un étudiant en particulier' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setAnnouncementType(option.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${announcementType === option.id
                        ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-gray-100 hover:border-teal-200 text-gray-600'
                        }`}
                    >
                      <span className="font-medium text-sm">{option.label}</span>
                      {announcementType === option.id && <div className="w-2 h-2 bg-teal-600 rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {announcementType === 'specific_class' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionnez la classe</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-sm font-medium"
                  >
                    <option value="">Choisir une classe...</option>
                    {data?.myLevels?.map((level: any) => (
                      <option key={level.id} value={level.name}>
                        {level.displayName || level.name}
                      </option>
                    ))}
                    {(!data?.myLevels || data.myLevels.length === 0) && (
                      <option disabled>Aucune classe trouvée</option>
                    )}
                  </select>
                </div>
              )}

              {announcementType === 'specific_student' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher l'étudiant</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nom ou Matricule..."
                      value={selectedStudentLabel || targetStudent}
                      onChange={(e) => {
                        setSelectedStudentLabel("");
                        handleStudentSearch(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-sm"
                    />
                    {filteredStudents.length > 0 && !selectedStudentLabel && (
                      <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        {filteredStudents.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setTargetStudent(s.id);
                              setSelectedStudentLabel(`${s.name} (${s.id})`);
                              setFilteredStudents([]);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-teal-50 border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <p className="text-sm font-bold text-gray-900">{s.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium font-mono">{s.id} • {s.academicLevel}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu du message</label>
                <textarea
                  rows={4}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-gray-700 resize-none text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 py-3 px-4 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={!announcementText}
                  className="flex-2 py-3 px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:shadow-none text-sm"
                >
                  <Send className="w-4 h-4" />
                  Diffuser l'annonce
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
