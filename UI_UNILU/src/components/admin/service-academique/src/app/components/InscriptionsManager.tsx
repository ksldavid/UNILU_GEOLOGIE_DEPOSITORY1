import { User, Mail, Phone, CreditCard, CircleCheck, CircleX, Calendar } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: string;
  photo: string;
  registrationDate: string;
  tuitionPaid: boolean;
  tuitionAmount: string;
  courses: string[];
  status: "pending" | "active" | "rejected";
}

const students: Student[] = [
  {
    id: "L3-2024-1245",
    name: "Amélie Rousseau",
    email: "amelie.rousseau@univ.edu",
    phone: "+243 812 345 678",
    level: "Licence 3",
    photo: "",
    registrationDate: "2024-09-15",
    tuitionPaid: true,
    tuitionAmount: "1,200 USD",
    courses: ["Physique Quantique", "Mécanique des Fluides", "Thermodynamique"],
    status: "pending",
  },
  {
    id: "L2-2024-0892",
    name: "David Kimba",
    email: "david.kimba@univ.edu",
    phone: "+243 899 234 567",
    level: "Licence 2",
    photo: "",
    registrationDate: "2024-09-12",
    tuitionPaid: true,
    tuitionAmount: "1,000 USD",
    courses: ["Chimie Organique", "Biologie Cellulaire"],
    status: "pending",
  },
];

export function InscriptionsManager() {
  return (
    <div className="space-y-6">
      {students.map((student) => (
        <div
          key={student.id}
          className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border hover:shadow-lg transition-all"
        >
          <div className="flex gap-6">
            {/* Student Photo */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-[20px] flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Student Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl mb-1">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">{student.id}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {student.level}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Inscrit le {new Date(student.registrationDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-muted/30 rounded-[16px] p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Minerval (Frais de scolarité)</span>
                  </div>
                  {student.tuitionPaid ? (
                    <span className="flex items-center gap-1 text-sm text-green-700">
                      <CircleCheck className="w-4 h-4" />
                      Payé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-orange-700">
                      <CircleX className="w-4 h-4" />
                      En attente
                    </span>
                  )}
                </div>
                <p className="text-lg">{student.tuitionAmount}</p>
              </div>

              {/* Enrolled Courses */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Cours inscrits</p>
                <div className="flex flex-wrap gap-2">
                  {student.courses.map((course, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-xs"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {student.status === "pending" && (
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[16px] transition-colors">
                    <CircleCheck className="w-5 h-5" />
                    <span>Activer l'accès portail</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 rounded-[16px] transition-colors">
                    <CircleX className="w-5 h-5" />
                    <span>Refuser</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
