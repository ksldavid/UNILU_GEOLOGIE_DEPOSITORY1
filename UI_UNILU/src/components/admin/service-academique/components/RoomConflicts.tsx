import { TriangleAlert, MapPin, Clock, Users } from "lucide-react";

interface RoomConflict {
  id: string;
  room: string;
  date: string;
  time: string;
  conflicts: ConflictDetail[];
  severity: "high" | "medium" | "low";
}

interface ConflictDetail {
  professor: string;
  course: string;
  group: string;
  studentCount: number;
}

const conflicts: RoomConflict[] = [
  {
    id: "1",
    room: "Amphi A - Bâtiment Sciences",
    date: "2024-10-25",
    time: "10:00 - 12:00",
    severity: "high",
    conflicts: [
      {
        professor: "Prof. Jean Martin",
        course: "Mathématiques Avancées",
        group: "L3 - Groupe A",
        studentCount: 45,
      },
      {
        professor: "Dr. Alice Leroy",
        course: "Physique Théorique",
        group: "L3 - Groupe B",
        studentCount: 38,
      },
    ],
  },
  {
    id: "2",
    room: "Salle TD-12",
    date: "2024-10-26",
    time: "14:00 - 16:00",
    severity: "medium",
    conflicts: [
      {
        professor: "Prof. Marc Dubois",
        course: "Chimie Organique",
        group: "L2 - TD 4",
        studentCount: 25,
      },
      {
        professor: "Dr. Sophie Chen",
        course: "Biologie Moléculaire",
        group: "L2 - TD 3",
        studentCount: 22,
      },
    ],
  },
];

export function RoomConflicts() {
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-4 flex items-start gap-3">
        <TriangleAlert className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm mb-1">
            {conflicts.length} conflit(s) de salles détecté(s)
          </p>
          <p className="text-xs text-muted-foreground">
            Veuillez arbitrer les réservations en attente
          </p>
        </div>
      </div>

      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className={`bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border-2 ${
            conflict.severity === "high"
              ? "border-orange-500"
              : conflict.severity === "medium"
              ? "border-yellow-500"
              : "border-blue-500"
          }`}
        >
          {/* Conflict Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${
                  conflict.severity === "high"
                    ? "bg-orange-100"
                    : conflict.severity === "medium"
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              >
                <TriangleAlert
                  className={`w-6 h-6 ${
                    conflict.severity === "high"
                      ? "text-orange-600"
                      : conflict.severity === "medium"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}
                />
              </div>
              <div>
                <h3 className="text-lg mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {conflict.room}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conflict.date).toLocaleDateString("fr-FR")}
                  </span>
                  <span>{conflict.time}</span>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                conflict.severity === "high"
                  ? "bg-orange-100 text-orange-700"
                  : conflict.severity === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {conflict.severity === "high"
                ? "Priorité haute"
                : conflict.severity === "medium"
                ? "Priorité moyenne"
                : "Priorité basse"}
            </span>
          </div>

          {/* Conflict Details */}
          <div className="space-y-3 mb-4">
            {conflict.conflicts.map((detail, index) => (
              <div
                key={index}
                className="bg-muted/30 rounded-[16px] p-4 border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="mb-1">{detail.professor}</p>
                    <p className="text-sm text-muted-foreground mb-2">{detail.course}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{detail.group}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {detail.studentCount} étudiants
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[16px] transition-colors text-sm">
                    Attribuer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-[16px] transition-colors">
              Proposer alternative
            </button>
            <button className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[16px] transition-colors">
              Résoudre conflit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}