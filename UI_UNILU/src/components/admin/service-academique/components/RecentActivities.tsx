import { CircleCheck, CircleAlert, UserPlus, FileText } from "lucide-react";

interface Activity {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  description: string;
  time: string;
  icon: any;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "success",
    title: "Validation PV Semestriel",
    description: "Le département Sciences a soumis les résultats finaux",
    time: "10:42 AM",
    icon: CircleCheck,
  },
  {
    id: "2",
    type: "info",
    title: "Inscription Tardive",
    description: "Léa Moreau (L3 Bio) a finalisé son dossier",
    time: "09:15 AM",
    icon: UserPlus,
  },
  {
    id: "3",
    type: "warning",
    title: "Alerte Absences",
    description: "Quota dépassé pour le groupe TD-4 (Histoire)",
    time: "Hier, 16:30",
    icon: CircleAlert,
  },
  {
    id: "4",
    type: "info",
    title: "Maintenance Système",
    description: "Mise à jour des modules de scolarité effectuée avec succès",
    time: "Hier, 14:00",
    icon: FileText,
  },
];

export function RecentActivities() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl mb-1">Activités Récentes</h3>
          <p className="text-sm text-muted-foreground">Flux en temps réel</p>
        </div>
        <button className="text-sm text-primary hover:underline">Voir rapport</button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-[20px] hover:bg-muted/30 transition-all duration-300 group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${activity.type === "success"
                    ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_4px_12px_-2px_rgba(116,198,157,0.1)]"
                    : activity.type === "warning"
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_4px_12px_-2px_rgba(249,115,22,0.1)]"
                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.1)]"
                  }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground tracking-tight">
                    {activity.title}
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {activity.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {activity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}