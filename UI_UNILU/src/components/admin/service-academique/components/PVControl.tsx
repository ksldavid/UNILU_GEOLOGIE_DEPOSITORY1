import { Lock, History, Eye, Download, Shield } from "lucide-react";

interface PVRecord {
  id: string;
  session: string;
  department: string;
  submittedBy: string;
  date: string;
  modificationCount: number;
  status: "open" | "sealed";
  changes: ChangeRecord[];
}

interface ChangeRecord {
  id: string;
  studentName: string;
  course: string;
  oldGrade: string;
  newGrade: string;
  modifiedBy: string;
  reason: string;
  timestamp: string;
}

const pvRecords: PVRecord[] = [
  {
    id: "PV-2024-S1-001",
    session: "Semestre 1 - 2024",
    department: "Sciences",
    submittedBy: "Dr. Laurent Dubois",
    date: "2024-10-20",
    modificationCount: 3,
    status: "open",
    changes: [
      {
        id: "1",
        studentName: "Marie Dupont",
        course: "Chimie Organique",
        oldGrade: "12.0",
        newGrade: "14.0",
        modifiedBy: "Prof. Martin",
        reason: "Erreur de saisie lors de la correction",
        timestamp: "2024-10-20 14:30",
      },
      {
        id: "2",
        studentName: "Thomas Chen",
        course: "Physique Quantique",
        oldGrade: "08.5",
        newGrade: "10.0",
        modifiedBy: "Dr. Leroy",
        reason: "Oubli de comptabilisation d'un exercice",
        timestamp: "2024-10-20 15:15",
      },
    ],
  },
  {
    id: "PV-2024-S1-002",
    session: "Semestre 1 - 2024",
    department: "Lettres",
    submittedBy: "Prof. Alice Moreau",
    date: "2024-10-19",
    modificationCount: 1,
    status: "sealed",
    changes: [],
  },
];

export function PVControl() {
  return (
    <div className="space-y-4">
      {pvRecords.map((pv) => (
        <div
          key={pv.id}
          className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg">{pv.id}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    pv.status === "sealed"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {pv.status === "sealed" ? (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Scellé
                    </span>
                  ) : (
                    "Ouvert"
                  )}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{pv.session}</p>
              <p className="text-sm text-muted-foreground">
                Département: {pv.department} • Soumis par {pv.submittedBy}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-muted rounded-[12px] transition-colors">
                <Eye className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-muted rounded-[12px] transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Audit Trail */}
          {pv.changes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm">Historique des modifications ({pv.modificationCount})</h4>
              </div>
              
              <div className="space-y-3">
                {pv.changes.map((change) => (
                  <div
                    key={change.id}
                    className="bg-muted/30 rounded-[16px] p-4 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm mb-1">{change.studentName}</p>
                        <p className="text-xs text-muted-foreground">{change.course}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{change.timestamp}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Ancienne: </span>
                        <span className="line-through text-muted-foreground">{change.oldGrade}</span>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div>
                        <span className="text-xs text-muted-foreground">Nouvelle: </span>
                        <span className="text-primary">{change.newGrade}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground">Raison:</span>
                      <p className="flex-1 italic">{change.reason}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Modifié par {change.modifiedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {pv.status === "open" ? (
              <>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[16px] transition-colors">
                  <Lock className="w-5 h-5" />
                  <span>Sceller la session</span>
                </button>
                <button className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-[16px] transition-colors">
                  <span>Exporter</span>
                </button>
              </>
            ) : (
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted rounded-[16px]">
                <Lock className="w-5 h-5 text-green-600" />
                <span>Session scellée - Aucune modification possible</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
