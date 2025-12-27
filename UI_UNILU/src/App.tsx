import { useState } from 'react';
import LoginPage from './components/LoginPage';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { StudentDashboard } from './components/students/StudentHome';
import { StudentCourses } from './components/students/StudentCourses';
import { StudentPlanning } from './components/students/StudentPlanning';
import { StudentGrades } from './components/students/StudentGrades';
import { StudentAnnouncements } from './components/students/StudentAnnouncements';
import { StudentSidebar, StudentPage } from './components/students/StudentSidebar';
import { StudentHeader } from './components/students/StudentHeader';
import { Dashboard } from "./components/corps academic/Dashboard";
import { CourseList } from "./components/corps academic/CourseList";
import { CourseManagement } from "./components/corps academic/CourseManagement";
import { AttendanceManagement } from "./components/corps academic/AttendanceManagement";
import { Planning } from "./components/corps academic/Planning";
import { Students } from "./components/corps academic/Students";
import { Sidebar } from "./components/corps academic/Sidebar";
import { Header } from "./components/corps academic/Header";
import { TechnicalDashboard } from './components/admin/administrateur-technique/TechnicalDashboard';
import { AcademicServiceDashboard } from './components/admin/service-academique/AcademicServiceDashboard';


export type Page = 'dashboard' | 'courses' | 'planning' | 'students' | 'course-detail' | 'attendance';
export type UserRole = 'student' | 'academic' | 'admin' | 'service-academique';

export interface Course {
  id: string;
  code: string;
  name: string;
  level: string;
  schedule: string;
  location: string;
  color: string;
  role?: "Professeur" | "Assistant";
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
  const [currentView, setCurrentView] = useState<AppView>('student-login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [studentCurrentPage, setStudentCurrentPage] = useState<StudentPage>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const handleLogin = (id: string, password: string, role: UserRole) => {
    if (id && password) {
      if (role === 'student') {
        setUserData({
          name: 'Mohamed Benali',
          role: 'student',
          class: 'Licence 3 - Géologie',
          id: id,
        });
      } else if (role === 'academic') {
        setUserData({
          name: 'Pr. Kabeya',
          role: 'academic',
          title: 'Doyen - Géologie',
          id: id,
        });
      } else {
        setUserData({
          name: 'Service Académique',
          role: role, // can be 'admin' or 'service-academique'
          title: role === 'admin' ? 'Administrateur Système' : 'Gestion Académique',
          id: id,
        });
      }
      setIsLoggedIn(true);
      setCurrentView('logged-in');
    }
  };

  const handleLogout = () => {
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
        onLogin={handleLogin}
        onAdminAccess={() => setCurrentView('admin-login')}
      />
    );
  }

  if (currentView === 'admin-login') {
    return (
      <AdminLoginPage
        onLogin={(id, pass, role) => handleLogin(id, pass, role as UserRole)}
        onBack={() => setCurrentView('student-login')}
      />
    );
  }

  if (!isLoggedIn || !userData) return null;

  // Student Interface
  if (userData.role === 'student') {
    return (
      <div className="flex h-screen bg-gray-50">
        <StudentSidebar
          currentPage={studentCurrentPage}
          onNavigate={setStudentCurrentPage}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <StudentHeader
            studentData={userData}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto">
            {studentCurrentPage === 'dashboard' && <StudentDashboard onNavigate={setStudentCurrentPage} />}
            {studentCurrentPage === 'courses' && <StudentCourses />}
            {studentCurrentPage === 'planning' && <StudentPlanning />}
            {studentCurrentPage === 'grades' && <StudentGrades />}
            {studentCurrentPage === 'announcements' && <StudentAnnouncements />}
          </main>
        </div>
      </div>
    );
  }

  // Admin (Technical Dashboard)
  if (userData.role === 'admin') {
    return <TechnicalDashboard onLogout={handleLogout} />;
  }

  // Service Académique Dashboard
  if (userData.role === 'service-academique') {
    return <AcademicServiceDashboard onLogout={handleLogout} />;
  }

  // Professor Interface (Corps Académique)
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
          userData={userData}
          onLogout={handleLogout}
          onMenuClick={() => setIsMobileMenuOpen(true)}
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
        </main>
      </div>
    </div>
  );
}