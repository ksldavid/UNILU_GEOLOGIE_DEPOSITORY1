import { Megaphone, BookOpen, User, Calendar, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

export function StudentAnnouncements() {
  const announcements = [
    {
      id: '1',
      type: 'urgent',
      icon: AlertCircle,
      title: 'Sortie terrain - Formation des Kundelungu',
      content: 'La sortie terrain prévue le 24 décembre 2025 pour l\'étude de la Formation des Kundelungu est confirmée. Inscription obligatoire avant le 22 décembre. Rendez-vous à 6h00 devant le département. Prévoir : chaussures de marche, chapeau, eau, carnet de terrain.',
      date: 'Il y a 2 jours',
      course: 'Stratigraphie',
      professor: 'Pr. Kabeya',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    {
      id: '2',
      type: 'important',
      icon: AlertTriangle,
      title: 'Examen de mi-session - Minéralogie',
      content: 'L\'examen de Minéralogie aura lieu le 18 janvier 2026 de 8h00 à 11h00 en Amphi A. Révision conseillée des chapitres 1 à 5. Les calculatrices sont autorisées. La classification des minéraux, les propriétés physiques et optiques seront particulièrement évaluées.',
      date: 'Il y a 1 semaine',
      course: 'Minéralogie',
      professor: 'Dr. Kalombo',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700'
    },
    {
      id: '3',
      type: 'info',
      icon: Info,
      title: 'Conférence invitée - Ressources minérales de la RDC',
      content: 'Conférence exceptionnelle sur "Les ressources minérales de la République Démocratique du Congo : défis et perspectives" animée par Dr. Jean-Pierre Mulamba, expert international. Participation vivement recommandée pour tous les étudiants de Licence 3. Certificat de participation disponible.',
      date: 'Il y a 3 jours',
      course: 'Géologie Générale',
      professor: 'Pr. Mwamba',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: '4',
      type: 'success',
      icon: CheckCircle,
      title: 'Résultats TP Pétrographie disponibles',
      content: 'Les résultats des travaux pratiques de Pétrographie (séance du 12 décembre) sont maintenant disponibles sur le portail. Vous pouvez consulter vos notes et les commentaires détaillés. Les étudiants ayant obtenu moins de 12/20 peuvent demander une séance de rattrapage.',
      date: 'Il y a 5 jours',
      course: 'Pétrographie',
      professor: 'Dr. Mukendi',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    {
      id: '5',
      type: 'info',
      icon: Info,
      title: 'Modification horaire - Géomorphologie',
      content: 'Le cours de Géomorphologie du mercredi 23 décembre est déplacé au jeudi 24 décembre de 10h00 à 12h00 en Amphi C. Cette modification est exceptionnelle et concerne uniquement cette semaine. Le programme reste inchangé : étude des processus d\'érosion.',
      date: 'Il y a 1 jour',
      course: 'Géomorphologie',
      professor: 'Dr. Tshimanga',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700'
    },
    {
      id: '6',
      type: 'important',
      icon: AlertTriangle,
      title: 'Projet de cartographie - Date limite',
      content: 'Le projet de cartographie géologique est à rendre avant le 15 janvier 2026 à 17h00. Format requis : carte au 1/25000, rapport de 15 pages minimum, présentation PowerPoint. Les équipes de 3-4 étudiants doivent soumettre leur travail via le portail en ligne.',
      date: 'Il y a 4 jours',
      course: 'Cartographie Géologique',
      professor: 'Dr. Kabamba',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      id: '7',
      type: 'success',
      icon: CheckCircle,
      title: 'Nouvelle collection de roches au laboratoire',
      content: 'Une nouvelle collection de 50 échantillons de roches métamorphiques vient d\'être ajoutée au laboratoire de géologie. Ces échantillons sont disponibles pour consultation et étude. Un catalogue détaillé est accessible à l\'accueil du laboratoire.',
      date: 'Il y a 6 jours',
      course: 'Géologie Structurale',
      professor: 'Pr. Mwamba',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700'
    },
    {
      id: '8',
      type: 'info',
      icon: Info,
      title: 'Bibliographie recommandée - Stratigraphie',
      content: 'Pour approfondir vos connaissances en stratigraphie, consultez l\'ouvrage "Principes de Stratigraphie" de Catuneanu (2006) disponible à la bibliothèque universitaire. Lecture complémentaire fortement recommandée pour la préparation de l\'examen final.',
      date: 'Il y a 2 semaines',
      course: 'Stratigraphie',
      professor: 'Pr. Kabeya',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700'
    },
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent': return 'Urgent';
      case 'important': return 'Important';
      case 'success': return 'Nouvelle';
      default: return 'Information';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Annonces</h1>
        <p className="text-gray-600">Toutes les communications et actualités de vos cours</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 inline-flex gap-2">
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md">
          Toutes
        </button>
        <button className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
          Urgentes
        </button>
        <button className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
          Importantes
        </button>
        <button className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
          Lues
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => {
          const Icon = announcement.icon;
          return (
            <div
              key={announcement.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${announcement.borderColor} hover:shadow-lg transition-all cursor-pointer group`}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${announcement.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 ${announcement.bgColor} ${announcement.textColor} rounded-full font-medium`}>
                          {getTypeLabel(announcement.type)}
                        </span>
                        <span className="text-xs text-gray-500">{announcement.date}</span>
                      </div>
                      <h3 className="text-gray-900 mb-1">{announcement.title}</h3>
                    </div>
                  </div>

                  {/* Body */}
                  <p className="text-gray-600 mb-4 leading-relaxed">{announcement.content}</p>

                  {/* Footer */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="w-4 h-4" />
                      <span>{announcement.course}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{announcement.professor}</span>
                    </div>
                    <button className="ml-auto text-sm text-teal-600 hover:text-teal-700 hover:underline">
                      Marquer comme lu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
