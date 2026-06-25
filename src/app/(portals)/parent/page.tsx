import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, BookOpen, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { payFee, sendMessage } from "./actions";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";



export default async function ParentDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect('/');
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          attendances: {
            orderBy: { date: 'desc' },
            take: 5
          },
          grades: {
            include: { subject: true },
            orderBy: { date: 'desc' },
            take: 5
          }
        }
      }
    }
  });

  if (!parent || parent.students.length === 0) {
    return <div>No children associated with this account.</div>;
  }

  const child = parent.students[0];
  const todayAtt = child.attendances.find(a => new Date(a.date).toDateString() === new Date().toDateString());
  const recentGrades = child.grades;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SchoolSnapshot role={session.user.role} />
      
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-800 dark:text-slate-100">{child.name}'s Timeline</h1>
        <p className="text-slate-500 mt-1">Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Fee Management */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-orange-500" /> Fee Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Term 2 Tuition Fee</p>
                <p className="text-xs text-slate-500 mt-1">Due by: Oct 15, 2026</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">₹1,250</p>
                <form action={payFee}>
                  <button type="submit" className="text-xs font-semibold bg-orange-600 text-white px-4 py-1.5 rounded-lg mt-1 hover:bg-orange-700 transition-colors shadow-sm active:scale-95">
                    Pay Now
                  </button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Teacher */}
        <Card className="glass-card md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-blue-500" /> Quick Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Class Teacher: Meena Krishnan</p>
            <form action={sendMessage} className="space-y-4">
              <textarea 
                name="message"
                required
                className="w-full h-20 p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="Send a message..."
              />
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm active:scale-95">
                Send Message
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-orange-200 to-transparent -translate-x-1/2 rounded-full"></div>
        <div className="space-y-8">
          
          {/* Attendance Event */}
          {todayAtt && (
            <div className="relative flex items-center md:justify-between w-full">
              <div className="hidden md:block w-5/12 text-right pr-8">
                <span className="text-sm font-semibold text-slate-500">{new Date(todayAtt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className={`absolute left-8 md:left-1/2 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center -translate-x-1/2 shadow-sm z-10 ${todayAtt.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'}`}>
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <div className="w-full md:w-5/12 pl-16 md:pl-8">
                <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-transform">
                  <CardContent className="p-4 bg-white/60 dark:bg-slate-900/60">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Attendance Logged</h3>
                    <p className="text-sm text-slate-500">Marked as {todayAtt.status}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Grades Events */}
          {recentGrades.map((grade, idx) => (
            <div key={grade.id} className={`relative flex items-center md:justify-between w-full ${idx % 2 === 0 ? 'flex-row-reverse' : ''}`}>
              <div className={`hidden md:block w-5/12 ${idx % 2 === 0 ? 'pl-8 text-left' : 'pr-8 text-right'}`}>
                <span className="text-sm font-semibold text-slate-500">{new Date(grade.date).toLocaleDateString()}</span>
              </div>
              <div className="absolute left-8 md:left-1/2 w-6 h-6 rounded-full bg-blue-500 border-4 border-white dark:border-slate-950 flex items-center justify-center -translate-x-1/2 shadow-sm z-10">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <div className={`w-full md:w-5/12 pl-16 ${idx % 2 === 0 ? 'md:pr-8 md:pl-0 text-left md:text-right' : 'md:pl-8'}`}>
                <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-transform">
                  <CardContent className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{grade.subject.name} Grade Updated</h3>
                    <p className="text-sm text-slate-500">Scored {grade.score}% (Max: {grade.maxScore})</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
