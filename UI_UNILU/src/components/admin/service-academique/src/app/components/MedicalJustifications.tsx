import { FileText, Eye, Send, Download, CircleCheck, CircleX } from "lucide-react";

interface MedicalDocument {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  professor: string;
  submittedDate: string;
  absenceDate: string;
  status: "pending" | "approved" | "rejected";
  documentType: string;
}

const documents: MedicalDocument[] = [
  {
    id: "1",
    studentName: "Marie Dupont",
    studentId: "L3-2024-0842",
    course: "Chimie Organique",
    professor: "Prof. Laurent",
    submittedDate: "2024-10-21",
    absenceDate: "2024-10-18",
    status: "pending",
    documentType: "Certificat Médical",
  },
  {
    id: "2",
    studentName: "Thomas Bernard",
    studentId: "L2-2024-1156",
    course: "Analyse Mathématique",
    professor: "Dr. Martin",
    submittedDate: "2024-10-20",
    absenceDate: "2024-10-17",
    status: "pending",
    documentType: "Ordonnance Médicale",
  },
  {
    id: "3",
    studentName: "Sophie Chen",
    studentId: "L1-2024-0923",
    course: "Introduction au Droit",
    professor: "Prof. Leroy",
    submittedDate: "2024-10-19",
    absenceDate: "2024-10-15",
    status: "approved",
    documentType: "Certificat Médical",
  },
];

export function MedicalJustifications() {
  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-4 flex-1">
              {/* Document Icon */}
              <div className="w-16 h-20 bg-muted/50 rounded-[16px] flex items-center justify-center flex-shrink-0 border-2 border-dashed border-border">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>

              {/* Document Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg mb-1">{doc.studentName}</h4>
                    <p className="text-sm text-muted-foreground">{doc.studentId}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      doc.status === "pending"
                        ? "bg-orange-100 text-orange-700"
                        : doc.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {doc.status === "pending"
                      ? "En attente"
                      : doc.status === "approved"
                      ? "Approuvé"
                      : "Rejeté"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type de document</p>
                    <p className="text-sm">{doc.documentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cours concerné</p>
                    <p className="text-sm">{doc.course}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Professeur</p>
                    <p className="text-sm">{doc.professor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date d'absence</p>
                    <p className="text-sm">
                      {new Date(doc.absenceDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Soumis le {new Date(doc.submittedDate).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[16px] transition-colors">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Visualiser</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-[16px] transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm">Télécharger</span>
              </button>
              {doc.status === "pending" && (
                <>
                  <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-[16px] transition-colors">
                    <Send className="w-4 h-4" />
                    <span className="text-sm">Transmettre</span>
                  </button>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-[12px] transition-colors">
                      <CircleCheck className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-[12px] transition-colors">
                      <CircleX className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}