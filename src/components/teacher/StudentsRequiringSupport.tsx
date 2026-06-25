import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Clock } from "lucide-react";
import Link from "next/link";

export default function StudentsRequiringSupport() {
  const alerts = [
    {
      id: "stu_1",
      name: "Kabir Verma",
      type: "attendance",
      severity: "high",
      message: "Attendance dropped below 80% this month (72%).",
    },
    {
      id: "stu_2",
      name: "Ananya Iyer",
      type: "academic",
      severity: "medium",
      message: "Scored < 40% in last two Math assignments.",
    },
    {
      id: "stu_3",
      name: "Rohan Desai",
      type: "behavior",
      severity: "medium",
      message: "3 missing homework submissions this week.",
    }
  ];

  return (
    <Card className="border-orange-200 dark:border-orange-900/50 shadow-sm">
      <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/30">
        <CardTitle className="text-orange-800 dark:text-orange-400 flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5" />
          Intervention Triggers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {alerts.map(alert => (
            <div key={alert.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className={`mt-1 p-1.5 rounded-md ${
                alert.type === 'attendance' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                alert.type === 'academic' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {alert.type === 'attendance' ? <Clock className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <Link href={`/teacher/students/demo/ai-analysis`} className="font-semibold text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {alert.name}
                </Link>
                <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
              </div>
              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                Action
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
