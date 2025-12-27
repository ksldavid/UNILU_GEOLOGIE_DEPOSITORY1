import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const weeklyData = [
  { week: "S35", L1: 85, L2: 90, L3: 78 },
  { week: "S36", L1: 88, L2: 92, L3: 82 },
  { week: "S37", L1: 92, L2: 88, L3: 85 },
  { week: "S38", L1: 87, L2: 94, L3: 89 },
  { week: "S39", L1: 90, L2: 91, L3: 87 },
  { week: "S40", L1: 93, L2: 89, L3: 91 },
  { week: "S41", L1: 88, L2: 95, L3: 86 },
  { week: "S42", L1: 91, L2: 93, L3: 88 },
];

interface AttendanceMonitorProps {
  showDetailed?: boolean;
}

export function AttendanceMonitor({ showDetailed = false }: AttendanceMonitorProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl mb-1">Moniteur de Quotas de Présence</h3>
          <p className="text-sm text-muted-foreground">
            Vue par promotion {showDetailed ? "(Rapport détaillé)" : "(Semaine 42)"}
          </p>
        </div>
        <button className="text-sm text-primary hover:underline">Cette Semaine</button>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="week" stroke="#52796F" />
            <YAxis stroke="#52796F" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Legend />
            <Bar dataKey="L1" fill="#1B4332" radius={[8, 8, 0, 0]} name="Licence 1" />
            <Bar dataKey="L2" fill="#2D6A4F" radius={[8, 8, 0, 0]} name="Licence 2" />
            <Bar dataKey="L3" fill="#95D5B2" radius={[8, 8, 0, 0]} name="Licence 3" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showDetailed && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-muted/30 rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-[#1B4332] rounded"></div>
              <span className="text-sm text-muted-foreground">Licence 1</span>
            </div>
            <p className="text-2xl mb-1">88.5%</p>
            <p className="text-xs text-muted-foreground">Moyenne annuelle</p>
          </div>
          <div className="bg-muted/30 rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-[#2D6A4F] rounded"></div>
              <span className="text-sm text-muted-foreground">Licence 2</span>
            </div>
            <p className="text-2xl mb-1">91.2%</p>
            <p className="text-xs text-muted-foreground">Moyenne annuelle</p>
          </div>
          <div className="bg-muted/30 rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-[#95D5B2] rounded"></div>
              <span className="text-sm text-muted-foreground">Licence 3</span>
            </div>
            <p className="text-2xl mb-1">85.8%</p>
            <p className="text-xs text-muted-foreground">Moyenne annuelle</p>
          </div>
        </div>
      )}
    </div>
  );
}
