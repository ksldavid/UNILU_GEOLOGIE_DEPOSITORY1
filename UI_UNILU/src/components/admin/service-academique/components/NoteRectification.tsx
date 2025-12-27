import { X, Check } from "lucide-react";

interface NoteRequest {
  id: string;
  professor: string;
  initials: string;
  course: string;
  oldGrade: string;
  newGrade: string;
  status: "pending" | "approved" | "rejected";
}

const noteRequests: NoteRequest[] = [
  {
    id: "1",
    professor: "Prof. Jean Martin",
    initials: "JM",
    course: "Mathématiques Appliquées • L2",
    oldGrade: "12.5",
    newGrade: "14.0",
    status: "pending",
  },
  {
    id: "2",
    professor: "Prof. Alice Leroy",
    initials: "AL",
    course: "Droit Constitutionnel • L1",
    oldGrade: "08.0",
    newGrade: "10.0",
    status: "pending",
  },
  {
    id: "3",
    professor: "Dr. Marc Dubois",
    initials: "MD",
    course: "Physique Quantique • L3",
    oldGrade: "15.5",
    newGrade: "16.5",
    status: "pending",
  },
];

interface NoteRectificationProps {
  showAll?: boolean;
}

export function NoteRectification({ showAll = false }: NoteRectificationProps) {
  const displayRequests = showAll ? noteRequests : noteRequests.slice(0, 2);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl mb-1">Rectification de présence en attente</h3>
          <p className="text-sm text-muted-foreground">
            Demandes de professeurs en attente de validation
          </p>
        </div>
        {!showAll && (
          <button className="text-sm text-primary hover:underline">Voir tout</button>
        )}
      </div>

      <div className="space-y-4">
        {displayRequests.map((request) => (
          <div
            key={request.id}
            className="bg-muted/30 rounded-[20px] p-4 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm text-primary">{request.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-1">{request.professor}</p>
                  <p className="text-sm text-muted-foreground mb-3">{request.course}</p>
                  
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">NOTE INITIALE</p>
                      <p className="line-through text-muted-foreground">{request.oldGrade}</p>
                    </div>
                    <div className="w-6 h-px bg-border"></div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">NOUVELLE</p>
                      <p className="text-primary">{request.newGrade}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 hover:bg-destructive/10 rounded-[12px] transition-colors">
                  <X className="w-5 h-5 text-destructive" />
                </button>
                <button className="p-2 bg-primary hover:bg-primary/90 rounded-[12px] transition-colors">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
