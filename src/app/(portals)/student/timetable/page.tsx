import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

const prisma = new PrismaClient();

export default async function StudentTimetablePage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { classroom: true }
  });

  const timetable = [
    { time: "08:00 AM", subject: "Mathematics", teacher: "Mr. Davis", room: "Room 101", type: "core" },
    { time: "09:00 AM", subject: "Physics", teacher: "Ms. Sarah", room: "Lab 3", type: "science" },
    { time: "10:00 AM", subject: "Break", teacher: "-", room: "Cafeteria", type: "break" },
    { time: "10:30 AM", subject: "English Lit", teacher: "Mrs. Smith", room: "Room 105", type: "language" },
    { time: "11:30 AM", subject: "History", teacher: "Mr. Brown", room: "Room 102", type: "core" },
    { time: "12:30 PM", subject: "Lunch Break", teacher: "-", room: "Cafeteria", type: "break" },
    { time: "01:30 PM", subject: "Physical Ed.", teacher: "Coach Mark", room: "Gymnasium", type: "activity" }
  ];

  const getColor = (type: string) => {
    switch (type) {
      case 'core': return "border-blue-500 bg-blue-50 dark:bg-blue-900/10";
      case 'science': return "border-purple-500 bg-purple-50 dark:bg-purple-900/10";
      case 'language': return "border-orange-500 bg-orange-50 dark:bg-orange-900/10";
      case 'break': return "border-slate-300 bg-slate-50 dark:bg-slate-800/30 opacity-60";
      case 'activity': return "border-green-500 bg-green-50 dark:bg-green-900/10";
      default: return "border-slate-200 bg-white";
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <PageHeader 
        title="My Timetable" 
        description={`Today's schedule for Class ${student?.classroom?.name || "9A"}`}
      />

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[5.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
        {timetable.map((slot, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2">
              <Clock size={16} />
            </div>

            <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border-l-4 shadow-sm ${getColor(slot.type)} ml-10 md:ml-0`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-100">{slot.subject}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{slot.time}</span>
              </div>
              {slot.type !== 'break' && (
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mt-2">
                  <span>{slot.teacher}</span>
                  <span>{slot.room}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
