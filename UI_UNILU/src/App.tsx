import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { StudentDashboard } from './components/students/StudentHome';
import { StudentCourses } from './components/students/StudentCourses';
import { StudentPlanning } from './components/students/StudentPlanning';
import { StudentGrades } from './components/students/StudentGrades';
import { StudentAnnouncements } from './components/students/StudentAnnouncements';
import { StudentSidebar, StudentPage } from './components/students/StudentSidebar';
import { StudentHeader } from './components/students/StudentHeader';
import { StudentPath } from './components/students/StudentPath';
import { Dashboard } from "./components/corps academic/Dashboard";
import { CourseList } from "./components/corps academic/CourseList";
import { CourseManagement } from "./components/corps academic/CourseManagement";
import { AttendanceManagement } from "./components/corps academic/AttendanceManagement";
import { Planning } from "./components/corps academic/Planning";
import { Students } from "./components/corps academic/Students";
import { Sidebar } from "./components/corps academic/Sidebar";
import { Header } from "./components/corps academic/Header";
import { MyAnnouncements } from "./components/corps academic/MyAnnouncements";
import { TechnicalDashboard } from './components/admin/administrateur-technique/TechnicalDashboard';
import { AcademicServiceDashboard } from './components/admin/service-academique/AcademicServiceDashboard';
import { authService } from './services/auth';
import { studentService } from './services/student';
import { professorService } from './services/professor';


export type Page = 'dashboard' | 'courses' | 'planning' | 'students' | 'course-detail' | 'attendance' | 'announcements';
export type UserRole = 'STUDENT' | 'USER' | 'ADMIN' | 'ACADEMIC_OFFICE';

export interface Course {
  id: string;
  code: string;
  name: string;
  level: string;
  schedule: string;
  location: string;
  color: string;
  role?: "Professeur" | "Assistant";
  studentsCount?: number;
}

export interface UserData {
  name: string;
  role: UserRole;
  class?: string;
  id: string;
  title?: string;
}

type AppView = 'student-login' | 'admin-login' | 'logged-in';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [userData, setUserData] = useState<UserData | null>(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  });
  const [currentView, setCurrentView] = useState<AppView>(() => {
    return localStorage.getItem('token') ? 'logged-in' : 'student-login';
  });
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    return (sessionStorage.getItem('currentPage') as Page) || 'dashboard';
  });
  const [studentCurrentPage, setStudentCurrentPage] = useState<StudentPage>(() => {
    return (sessionStorage.getItem('studentCurrentPage') as StudentPage) || 'dashboard';
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const [hasUnreadProfAnnouncements, setHasUnreadProfAnnouncements] = useState(false);

  // Vérifier les nouvelles annonces pour le point rouge et la cloche (Étudiant)
  useEffect(() => {
    if (userData?.role === 'STUDENT' && isLoggedIn) {
      const checkAnnouncements = async () => {
        try {
          const announcements = await studentService.getAnnouncements();
          const hasUnread = announcements.some((ann: any) => !ann.isRead);
          setHasUnreadAnnouncements(hasUnread);
        } catch (err) {
          console.error("Erreur check annonces étudiant:", err);
        }
      };

      checkAnnouncements();
      const interval = setInterval(checkAnnouncements, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [userData, isLoggedIn, studentCurrentPage]); // Trigger check on page change too

  // Vérifier les nouvelles annonces pour le point rouge et la cloche (Professeur)
  useEffect(() => {
    if (userData?.role === 'USER' && isLoggedIn) {
      const checkProfAnnouncements = async () => {
        try {
          const data = await professorService.getDashboard();
          const lastRead = sessionStorage.getItem('lastProfAnnouncementsCheck') || '0';
          const hasUnread = data.announcements?.some((ann: any) => new Date(ann.date).getTime() > parseInt(lastRead));
          setHasUnreadProfAnnouncements(hasUnread);
        } catch (err) {
          console.error("Erreur check annonces prof:", err);
        }
      };

      checkProfAnnouncements();
      const interval = setInterval(checkProfAnnouncements, 60000);
      return () => clearInterval(interval);
    }
  }, [userData, isLoggedIn]);

  // Marquer comme lu quand on arrive sur le tableau de bord (Professeur - les annonces y sont affichées)
  useEffect(() => {
    if (currentPage === 'dashboard' && userData?.role === 'USER') {
      sessionStorage.setItem('lastProfAnnouncementsCheck', Date.now().toString());
      setHasUnreadProfAnnouncements(false);
    }
  }, [currentPage, userData]);

  // Sync pages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem('studentCurrentPage', studentCurrentPage);
  }, [studentCurrentPage]);


  const handleLogin = async (id: string, password: string, role: UserRole): Promise<'SUCCESS' | 'AUTH_FAILED' | 'ROLE_MISMATCH'> => {
    if (id && password) {
      try {
        const response = await authService.login(id, password);
        const { user } = response;
        const actualRole = user.role as UserRole;

        // VÉRIFICATION DE LA COHÉRENCE ENTRE L'ONGLET ET LE RÔLE RÉEL
        if (role === 'STUDENT' && actualRole !== 'STUDENT') {
          return 'ROLE_MISMATCH';
        }
        if (role === 'USER' && actualRole !== 'USER') {
          // On autorise l'admin à accéder à l'interface prof pour gestion/test
          if (actualRole !== 'ADMIN' && actualRole !== 'ACADEMIC_OFFICE') {
            return 'ROLE_MISMATCH';
          }
        }
        if (role === 'ADMIN' && actualRole !== 'ADMIN') {
          return 'ROLE_MISMATCH';
        }
        if (role === 'ACADEMIC_OFFICE' && actualRole !== 'ACADEMIC_OFFICE') {
          return 'ROLE_MISMATCH';
        }

        // Si tout est bon, on connecte
        // Pour les étudiants, récupérer leur niveau académique
        let studentClass = undefined;
        if (actualRole === 'STUDENT') {
          try {
            const dashboardData = await fetch(`${API_URL}/student/dashboard`, {
              headers: {
                'Authorization': `Bearer ${response.token}`
              }
            }).then(r => r.json());
            studentClass = dashboardData.student?.level || 'Étudiant';
          } catch (err) {
            console.error('Error fetching student level:', err);
            studentClass = 'Étudiant';
          }
        }

        setUserData({
          name: user.name,
          role: actualRole,
          id: user.id,
          class: actualRole === 'STUDENT' ? studentClass : undefined,
          title: actualRole !== 'STUDENT' ? 'Membre du Personnel' : undefined,
        });

        setIsLoggedIn(true);
        setCurrentView('logged-in');

        // S'assurer que l'étudiant arrive sur le tableau de bord par défaut
        if (actualRole === 'STUDENT') {
          setStudentCurrentPage('dashboard');
        } else if (actualRole === 'USER') {
          setCurrentPage('dashboard');
        }

        return 'SUCCESS';
      } catch (error) {
        console.error("Erreur de connexion:", error);
        return 'AUTH_FAILED'; // Mauvais mot de passe ou utilisateur inconnu
      }
    }
    return 'AUTH_FAILED';
  };

  const handleLogout = () => {
    authService.logout();
    sessionStorage.removeItem('currentPage');
    sessionStorage.removeItem('studentCurrentPage');
    setIsLoggedIn(false);
    setUserData(null);
    setCurrentPage('dashboard');
    setStudentCurrentPage('dashboard');
    setSelectedCourse(null);
    setCurrentView('student-login');
    setIsMobileMenuOpen(false);
  };
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentPage('course-detail');
  };

  const handleTakeAttendance = () => {
    setCurrentPage('attendance');
  };

  const handleBackToCourses = () => {
    setCurrentPage('courses');
    setSelectedCourse(null);
  };

  // Login Views
  if (currentView === 'student-login') {
    return (
      <LoginPage
        onLogin={(id, pass, role) => handleLogin(id, pass, role)}
        onAdminAccess={() => setCurrentView('admin-login')}
      />
    );
  }

  if (currentView === 'admin-login') {
    return (
      <AdminLoginPage
        onLogin={(id, pass, role) => handleLogin(id, pass, role === 'admin' ? 'ADMIN' : 'ACADEMIC_OFFICE')}
        onBack={() => setCurrentView('student-login')}
      />
    );
  }

  if (!isLoggedIn || !userData) return null;

  // Student Interface
  if (userData.role === 'STUDENT') {
    return (
      <div className="flex h-screen bg-gray-50">
        <StudentSidebar
          currentPage={studentCurrentPage}
          onNavigate={setStudentCurrentPage}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          hasUnreadAnnouncements={hasUnreadAnnouncements}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <StudentHeader
            studentData={{ ...userData, role: 'student' as any }}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            hasUnreadAnnouncements={hasUnreadAnnouncements}
            onBellClick={() => setStudentCurrentPage('announcements')}
          />
          <main className="flex-1 overflow-y-auto">
            {studentCurrentPage === 'dashboard' && <StudentDashboard onNavigate={setStudentCurrentPage} />}
            {studentCurrentPage === 'courses' && <StudentCourses />}
            {studentCurrentPage === 'planning' && <StudentPlanning />}
            {studentCurrentPage === 'grades' && <StudentGrades />}
            {studentCurrentPage === 'announcements' && <StudentAnnouncements />}
            {studentCurrentPage === 'settings' && <StudentPath />}
          </main>
        </div>
      </div>
    );
  }

  // Admin (Technical Dashboard)
  if (userData.role === 'ADMIN') {
    return <TechnicalDashboard onLogout={handleLogout} />;
  }

  // Service Académique Dashboard
  if (userData.role === 'ACADEMIC_OFFICE') {
    return <AcademicServiceDashboard onLogout={handleLogout} />;
  }

  // Professor Interface (Corps Académique)
  if (userData.role === 'USER') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userData={{ ...userData, role: 'academic' as any }}
            onLogout={handleLogout}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            hasUnreadAnnouncements={hasUnreadProfAnnouncements}
            onBellClick={() => setCurrentPage('dashboard')}
          />
          <main className="flex-1 overflow-y-auto">
            {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
            {currentPage === 'courses' && <CourseList onCourseSelect={handleCourseSelect} />}
            {currentPage === 'course-detail' && selectedCourse && (
              <CourseManagement
                course={selectedCourse}
                onBack={handleBackToCourses}
                onTakeAttendance={handleTakeAttendance}
              />
            )}
            {currentPage === 'attendance' && selectedCourse && (
              <AttendanceManagement
                course={selectedCourse}
                onBack={() => setCurrentPage('course-detail')}
              />
            )}
            {currentPage === 'planning' && <Planning />}
            {currentPage === 'students' && <Students />}
            {currentPage === 'announcements' && <MyAnnouncements />}
          </main>
        </div>
      </div>
    );
  }

  return null;
}
