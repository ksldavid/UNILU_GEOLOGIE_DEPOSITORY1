import { Users, FileCheck, TrendingUp, Calendar } from "lucide-react";

const stats = [
  {
    label: "Effectif Global",
    value: "2,845",
    change: "+12% vs N-1",
    trend: "up",
    icon: Users,
    bgColor: "bg-green-50",
    iconColor: "text-primary",
  },
  {
    label: "Notes en Attente",
    value: "142",
    change: "Urgent",
    trend: "urgent",
    icon: FileCheck,
    bgColor: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    label: "Taux d'assiduité",
    value: "96.2%",
    change: "En progression",
    trend: "up",
    icon: TrendingUp,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    label: "Sessions Actives",
    value: "18",
    change: "Cette semaine",
    trend: "neutral",
    icon: Calendar,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-[16px] flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            
            <h3 className="text-sm text-muted-foreground mb-1">{stat.label}</h3>
            <p className="text-3xl mb-2">{stat.value}</p>
            
            <div className="flex items-center gap-1">
              {stat.trend === "up" && (
                <TrendingUp className="w-4 h-4 text-accent" />
              )}
              <span
                className={`text-xs ${
                  stat.trend === "urgent"
                    ? "text-orange-500"
                    : stat.trend === "up"
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
