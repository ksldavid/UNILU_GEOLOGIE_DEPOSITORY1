import { useState, useEffect } from "react";
import { Calendar, BookOpen, Clock, MapPin, User as UserIcon, Megaphone, TrendingUp, CheckCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { StudentPage } from "./StudentSidebar";
import welcomeImage from 'C:/Users/david/.gemini/antigravity/brain/53c4dfde-fc85-4e54-9476-b7bb61acbf4a/student_welcome_bg_1766793550723.png';

interface StudentDashboardProps {
  onNavigate: (page: StudentPage) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  const geologyMessages = [
    "Ce semestre, vous explorerez la géologie, une science aux applications vastes : mines, génie civil, environnement et hydrogéologie.",
    "La minéralogie que vous étudiez est essentielle pour l'industrie minière du Katanga et la valorisation de nos ressources.",
    "Le cours de Géologie Structurale est fondamental pour comprendre la déformation des roches et localiser les gisements.",
    "L'hydrogéologie vous permettra de maîtriser la gestion des ressources en eau, un enjeu majeur pour le développement durable."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % geologyMessages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const upcomingCourses = [
    { id: '1', title: 'Pétrographie', time: '10:00 - 12:00', room: 'Amphi A', professor: 'Dr. Mukendi', type: 'Cours Magistral', color: 'bg-blue-500' },
    { id: '2', title: 'Stratigraphie', time: '14:00 - 16:00', room: 'Salle 203', professor: 'Pr. Kabeya', type: 'Travaux Pratiques', color: 'bg-emerald-500' },
    { id: '3', title: 'Géomorphologie', time: '16:30 - 18:30', room: 'Amphi B', professor: 'Dr. Tshimanga', type: 'Cours Magistral', color: 'bg-indigo-500' },
  ];

  const announcements = [
    {
      id: '1',
      title: 'Sortie terrain - Formation des Kundelungu',
      content: 'Inscription obligatoire avant le 22 décembre pour la sortie terrain du 24 décembre.',
      date: 'Aujourd\'hui',
      type: 'Sortie',
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      id: '2',
      title: 'Examen de mi-session - Minéralogie',
      content: 'L\'examen aura lieu le 18 janvier 2026. Révision conseillée des chapitres 1 à 5.',
      date: 'Hier',
      type: 'Examen',
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    },
  ];

  const stats = [
    { label: 'Moyenne Générale', value: '7.6', sub: '/ 10', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Assiduité', value: '94', sub: '%', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Matières en cours', value: '6', sub: 'Cours', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-[1600px] mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={item}
        className="relative h-64 rounded-[40px] overflow-hidden shadow-2xl group"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${welcomeImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent flex flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-white text-5xl font-black mb-4 tracking-tight">
              Bonjour, <span className="text-teal-400">Mohamed</span> 👋
            </h1>
            <div className="h-20">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-gray-200 text-xl font-medium max-w-2xl leading-relaxed"
              >
                {geologyMessages[messageIndex]}
              </motion.p>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-10 right-10">
          <button
            onClick={() => onNavigate('grades')}
            className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3 shadow-xl"
          >
            Voir mes résultats <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={item}
            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="w-2 h-2 rounded-full bg-gray-100" />
            </div>
            <div>
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">{stat.value}</span>
                <span className="text-sm font-bold text-gray-400">{stat.sub}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Today's Timeline */}
        <motion.div
          variants={item}
          className="xl:col-span-2 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Planning du jour</h3>
              <p className="text-gray-400 text-sm font-bold">Lundi 23 Décembre 2025</p>
            </div>
            <button
              onClick={() => onNavigate('planning')}
              className="flex items-center gap-2 text-teal-600 font-black text-xs uppercase tracking-widest hover:bg-teal-50 px-5 py-3 rounded-2xl transition-all"
            >
              Voir le planning complet <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-50">
            {upcomingCourses.map((course, idx) => (
              <div key={idx} className="relative pl-12 group">
                <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10 group-hover:border-teal-500 transition-colors`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${course.color}`} />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white transition-all">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg uppercase tracking-wider">{course.type}</span>
                      <span className="text-sm font-bold text-gray-400 flex items-center gap-1.5 text-end italic">
                        <Clock className="w-3.5 h-3.5" /> {course.time}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-1">{course.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-bold">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-300" /> {course.room}</span>
                      <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4 text-gray-300" /> {course.professor}</span>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all active:scale-95">
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Announcements & Quick Actions */}
        <div className="space-y-8">
          <motion.div
            variants={item}
            className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Megaphone className="w-6 h-6 text-teal-400" />
                Dernières Annonces
              </h3>
              <button
                onClick={() => onNavigate('announcements')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann, i) => (
                <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${ann.color.split(' ')[0]} ${ann.color.split(' ')[1]}`}>
                      {ann.type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{ann.date}</span>
                  </div>
                  <h4 className="text-sm font-bold mb-2 group-hover:text-teal-400 transition-colors">{ann.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: 'Documents', icon: BookOpen, color: 'bg-indigo-50 text-indigo-600', page: 'courses' },
              { label: 'Planning', icon: Calendar, color: 'bg-emerald-50 text-emerald-600', page: 'planning' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => onNavigate(action.page as StudentPage)}
                className="p-6 bg-white border border-gray-100 rounded-[32px] hover:shadow-xl transition-all group text-left"
              >
                <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-900">{action.label}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
