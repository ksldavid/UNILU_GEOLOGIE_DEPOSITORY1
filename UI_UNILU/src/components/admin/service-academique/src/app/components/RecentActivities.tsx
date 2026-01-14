import { Clock, CircleCheck, CircleAlert, UserPlus, FileText } from "lucide-react";

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
              className="flex items-start gap-3 p-3 rounded-[16px] hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                    activity.type === "success"
                      ? "bg-accent"
                      : activity.type === "warning"
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm">{activity.title}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
