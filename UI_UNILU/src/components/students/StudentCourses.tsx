import { useState } from "react";
import { BookOpen, Clock, MapPin, User, FileText, Download, ArrowLeft, Send, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export function StudentCourses() {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const courses = [
    {
      id: '1',
      code: 'GEO301',
      name: 'Pétrographie',
      professor: 'Dr. Mukendi',
      schedule: 'Lundi & Mercredi 10:00-12:00',
      room: 'Campus Kasapa',
      color: 'from-blue-500 to-blue-600',
      nextSession: 'Lundi 23 Déc, 10:00',
      materials: 8,
      attendance: 92
    },
    {
      id: '2',
      code: 'GEO302',
      name: 'Stratigraphie',
      professor: 'Pr. Kabeya',
      schedule: 'Mardi & Jeudi 14:00-16:00',
      room: 'Campus Kasapa',
      color: 'from-teal-500 to-cyan-600',
      nextSession: 'Mardi 24 Déc, 14:00',
      materials: 6,
      attendance: 85
    },
    {
      id: '3',
      code: 'GEO303',
      name: 'Géomorphologie',
      professor: 'Dr. Tshimanga',
      schedule: 'Mercredi & Vendredi 16:30-18:30',
      room: 'Campus Kasapa',
      color: 'from-green-500 to-emerald-600',
      nextSession: 'Mercredi 23 Déc, 16:30',
      materials: 10,
      attendance: 78
    },
    {
      id: '4',
      code: 'GEO304',
      name: 'Minéralogie',
      professor: 'Dr. Kalombo',
      schedule: 'Lundi & Jeudi 08:00-10:00',
      room: 'Campus Kasapa',
      color: 'from-purple-500 to-purple-600',
      nextSession: 'Lundi 23 Déc, 08:00',
      materials: 12,
      attendance: 95
    }
  ];

  if (selectedCourse) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8 space-y-8 max-w-7xl mx-auto"
      >
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-gray-500 font-bold hover:text-teal-600 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Retour aux cours
        </button>

        {/* Course Info Header */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${selectedCourse.color} opacity-[0.03] -mr-32 -mt-32 rounded-full`} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${selectedCourse.color} flex items-center justify-center shadow-xl`}>
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black uppercase tracking-widest">{selectedCourse.code}</span>
                  <span className="text-teal-600 font-black text-xs uppercase tracking-widest px-3 py-1 bg-teal-50 rounded-lg">Licence 3 - Géologie</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{selectedCourse.name}</h1>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                <div className="p-2 bg-gray-50 rounded-lg"><User className="w-4 h-4 text-gray-400" /></div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Professeur</p>
                  <p className="text-gray-900">{selectedCourse.professor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                <div className="p-2 bg-gray-50 rounded-lg"><MapPin className="w-4 h-4 text-gray-400" /></div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Lieu</p>
                  <p className="text-gray-900">{selectedCourse.room}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                <div className="p-2 bg-gray-50 rounded-lg"><Clock className="w-4 h-4 text-gray-400" /></div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Horaire</p>
                  <p className="text-gray-900">{selectedCourse.schedule}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Materials & Assignments */}
          <div className="lg:col-span-2 space-y-8">

            {/* Devoirs à remettre - Replaced Videos Section */}
            <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <Send className="w-6 h-6 text-teal-400" />
                Devoirs à remettre
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] px-3 py-1 bg-teal-400/10 rounded-full italic">Urgent</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">2 jours restants</span>
                  </div>
                  <h4 className="text-lg font-black mb-4">Rapport d'analyse Structurale</h4>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">Veuillez soumettre votre rapport détaillé sur la formation des Kundelungu au format PDF.</p>
                  <button className="w-full py-4 bg-teal-500 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-400 transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4 rotate-180" /> Déposer mon travail
                  </button>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl opacity-60">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 py-1 bg-white/10 rounded-full italic">Optionnel</span>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">8 jours restants</span>
                  </div>
                  <h4 className="text-lg font-black mb-4">Exercices de Minéralogie</h4>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">Série d'exercices bonus sur les inclusions fluides et les phases minérales.</p>
                  <button className="w-full py-4 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                    Déposer
                  </button>
                </div>
              </div>
            </div>

            {/* Supports de cours */}
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-500" />
                Supports de cours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                        <FileText className="w-5 h-5 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Chapitre {i} - Fondamentaux.pdf</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">PDF • 2.4 MB</p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-gray-900" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Panel */}
          <div className="space-y-6">
            <div className="bg-teal-50 rounded-[32px] p-8 border border-teal-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-teal-900 font-black flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Présence
                  </h3>
                  <p className="text-teal-700/60 text-[10px] font-black uppercase tracking-widest mt-1">Sémestre en cours</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-teal-600 leading-none">{selectedCourse.attendance}%</p>
                </div>
              </div>
              <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${selectedCourse.attendance}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-gray-900 font-black mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Informations & Règles
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <p className="text-gray-600 text-sm font-medium leading-relaxed italic">
                    La présence aux TP est obligatoire pour valider l'unité d'enseignement.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <p className="text-gray-600 text-sm font-medium leading-relaxed italic text-end">
                    Toute absence doit être justifiée dans les 48h auprès du secrétariat.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Mes Cours</h1>
        <p className="text-gray-500 font-medium tracking-tight">Gérez et accédez à vos supports de Licence 3 - Géologie</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -4 }}
            onClick={() => setSelectedCourse(course)}
            className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${course.color} opacity-[0.03] -mr-16 -mt-16 rounded-full transition-transform group-hover:scale-150 duration-700`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-8 relative">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{course.code}</span>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{course.name}</h3>
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
