import PageHeader from "@/components/ui/PageHeader";
import { Users, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

export default function ClassesPage() {
  const dummyClasses = [
    { id: "10a", name: "10A Science", students: 32, schedule: "Mon, Wed, Fri", time: "09:00 AM" },
    { id: "10b", name: "10B Science", students: 28, schedule: "Tue, Thu", time: "11:00 AM" },
    { id: "9a", name: "9A Physics", students: 30, schedule: "Mon, Thu", time: "01:00 PM" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Classes" 
        description="View and manage the classes you are assigned to teach."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyClasses.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{c.name}</h3>
              <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                <Users size={18} />
              </span>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Users size={14} /> {c.students} Students Enrolled
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <BookOpen size={14} /> Curriculum: Standard
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock size={14} /> {c.schedule} • {c.time}
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/teacher/attendance" className="flex-1 py-2 text-center text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                Attendance
              </Link>
              <Link href="/teacher/assignments" className="flex-1 py-2 text-center text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg transition-colors">
                Assignments
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
