import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { NoteRectification } from "./components/NoteRectification";
import { AttendanceMonitor } from "./components/AttendanceMonitor";
import { RecentActivities } from "./components/RecentActivities";
import { MedicalJustifications } from "./components/MedicalJustifications";
import { InscriptionsManager } from "./components/InscriptionsManager";
import { PVControl } from "./components/PVControl";
import { RoomConflicts } from "./components/RoomConflicts";

interface AcademicDashboardAppProps {
  onLogout?: () => void;
}

export default function App({ onLogout }: AcademicDashboardAppProps = {}) {
  const [activeSection, setActiveSection] = useState("supervision");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={onLogout} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeSection === "supervision" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Tableau de Bord</h1>
                <p className="text-muted-foreground">Vue d'ensemble du département</p>
              </div>

              <StatsCards />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NoteRectification />
                <RecentActivities />
              </div>

              <AttendanceMonitor />
            </div>
          )}

          {activeSection === "inscriptions" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Inscriptions</h1>
                <p className="text-muted-foreground">Gestion des dossiers étudiants</p>
              </div>
              <InscriptionsManager />
            </div>
          )}

          {activeSection === "assiduite" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Assiduité & Rectifications</h1>
                <p className="text-muted-foreground">Gestion des absences et justificatifs</p>
              </div>
              <MedicalJustifications />
            </div>
          )}

          {activeSection === "notes" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Notes & PV</h1>
                <p className="text-muted-foreground">Validation des notes et procès-verbaux</p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <NoteRectification showAll />
                <PVControl />
              </div>
            </div>
          )}

          {activeSection === "planning" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Planning</h1>
                <p className="text-muted-foreground">Gestion des horaires et salles</p>
              </div>
              <RoomConflicts />
            </div>
          )}

          {activeSection === "performance" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl mb-2">Performance</h1>
                <p className="text-muted-foreground">Statistiques LMD et rapports</p>
              </div>
              <AttendanceMonitor showDetailed />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
