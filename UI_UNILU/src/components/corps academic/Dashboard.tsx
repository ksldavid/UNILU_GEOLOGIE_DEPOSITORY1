import { useState } from "react";
import { BookOpen, FileCheck, Clock, Users, Megaphone, X, Send, Search } from "lucide-react";
import type { Page } from "../../App";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementType, setAnnouncementType] = useState('all_courses');
  const [announcementText, setAnnouncementText] = useState("");
  const [targetStudent, setTargetStudent] = useState("");

  const todaysCourses = [
    {
      title: "Géologie Structurale",
      code: "Amph B - L2 Géologie",
      time: "Aujourd'hui",
      timeDetail: "08:30",
      icon: BookOpen,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Correction Examens",
      code: "Minéralogie - 45 copies restantes",
      time: "Urgent",
      timeDetail: "",
      icon: FileCheck,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600"
    }
  ];

  const stats = [
    { label: "Étudiants", value: "124", change: "" },
    { label: "Cours Actifs", value: "3", change: "En cours" }
  ];

  const handleSendAnnouncement = () => {
    // Logic to send announcement would go here
    alert(`Annonce envoyée aux: ${announcementType}${targetStudent ? ' (' + targetStudent + ')' : ''}`);
    setShowAnnouncementModal(false);
    setAnnouncementText("");
    setTargetStudent("");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 rounded-2xl p-12 mb-8 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <h1 className="text-white text-4xl font-semibold mb-3">
            Espace Enseignant,
          </h1>
          <h2 className="text-white text-4xl font-semibold mb-6">
            Faculté de Géologie
          </h2>
          <p className="text-teal-50 text-lg max-w-2xl">
            Gérez vos cours, consultez vos horaires et communiquez avec vos étudiants.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Cours de la journée</h3>
            <button className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2 transition-colors">
              Voir l'agenda
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {todaysCourses.map((course, index) => {
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
          <div className="mt-8 bg-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Annonces Faculté
                </div>
                <h4 className="font-semibold text-lg mb-2">Réunion départementale</h4>
                <p className="text-blue-50">
                  La prochaine réunion du département de géologie aura lieu le 24 Novembre à 14h00 en salle des professeurs.
                </p>
              </div>
              <div className="text-sm text-blue-100 ml-4 whitespace-nowrap">
                Il y a 2h
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="lg:col-span-1">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Statistiques Rapides</h3>

          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-5xl font-bold text-teal-600 mb-2">{stat.value}</div>
                <div className="text-gray-900 font-semibold mb-1">{stat.label}</div>
                <div className="text-gray-500 text-sm">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Actions rapides</h4>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('courses')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium">Gérer mes cours</span>
              </button>
              <button
                onClick={() => onNavigate('planning')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Voir mon planning</span>
              </button>
              <button
                onClick={() => onNavigate('students')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Voir étudiants</span>
              </button>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Megaphone className="w-5 h-5" />
                <span className="font-medium">Faire une annonce</span>
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

              {(announcementType === 'specific_class') && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionnez la/les classe(s)</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-sm">
                    <option>Licence 1 - Géologie</option>
                    <option>Licence 2 - Géologie</option>
                    <option>Licence 3 - Géologie</option>
                    <option>Master 1 - Géologie</option>
                    <option>Master 2 - Géologie</option>
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
                      value={targetStudent}
                      onChange={(e) => setTargetStudent(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-sm"
                    />
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
