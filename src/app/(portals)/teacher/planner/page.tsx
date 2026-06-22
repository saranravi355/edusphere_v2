import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Plus, BookOpen, Clock } from "lucide-react";

export default async function TeacherPlannerPage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const lessons = [
    { day: "Monday", subject: "Mathematics", topic: "Quadratic Equations Intro", time: "08:00 AM", class: "9A", status: "Completed" },
    { day: "Tuesday", subject: "Mathematics", topic: "Factoring Quadratics", time: "09:00 AM", class: "9A", status: "Upcoming" },
    { day: "Wednesday", subject: "Mathematics", topic: "Completing the Square", time: "11:30 AM", class: "9A", status: "Upcoming" },
    { day: "Thursday", subject: "Mathematics", topic: "Quadratic Formula", time: "10:30 AM", class: "9A", status: "Upcoming" },
    { day: "Friday", subject: "Mathematics", topic: "Weekly Quiz & Review", time: "08:00 AM", class: "9A", status: "Upcoming" }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader 
        title="Lesson Planner" 
        description="Schedule your weekly curriculum topics and activities."
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">
            <Plus size={16} /> Add Lesson
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
          const dayLessons = lessons.filter(l => l.day === day);
          return (
            <div key={day} className="flex flex-col gap-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-center pb-2 border-b border-slate-200 dark:border-slate-800">
                {day}
              </h3>
              {dayLessons.length > 0 ? dayLessons.map((lesson, idx) => (
                <Card key={idx} className="glass-card hover:-translate-y-1 transition-transform cursor-pointer border-blue-100 dark:border-blue-900/50">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        Class {lesson.class}
                      </span>
                      {lesson.status === 'Completed' ? (
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Completed" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-orange-400" title="Upcoming" />
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                      {lesson.topic}
                    </h4>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-1">
                      <Clock size={12} /> {lesson.time}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs py-8">
                  No lessons scheduled
                </div>
              )}
              
              <button className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  );
}
