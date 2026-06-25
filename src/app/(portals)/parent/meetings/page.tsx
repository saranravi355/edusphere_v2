import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Video, User } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default async function ParentMeetingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader 
        title="Parent-Teacher Meetings" 
        description="Schedule and manage 1-on-1 consultations with teachers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-blue-500" /> Upcoming Meetings
          </h3>
          
          <Card className="glass-card border-blue-200 dark:border-blue-900/50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <User className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Mr. Davis (Mathematics)</h4>
                    <p className="text-sm text-slate-500">Term 1 Progress Review for Aarav</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 min-w-[200px]">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Calendar size={14} className="text-blue-500" /> Oct 24, 2026
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Clock size={14} className="text-orange-500" /> 04:30 PM - 04:45 PM
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                    <Video size={14} /> Zoom Link Generated
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Join Meeting
                </button>
                <button className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                  Reschedule
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Book New Slot</h3>
          <Card className="glass-card">
            <CardContent className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Teacher</label>
                  <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Mr. Davis (Mathematics)</option>
                    <option>Ms. Sindhu (Physics)</option>
                    <option>Mrs. Smith (English)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Date</label>
                  <input type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Available Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="py-2 border border-blue-500 bg-blue-50 text-blue-700 rounded text-sm font-medium">04:00 PM</button>
                    <button type="button" className="py-2 border border-slate-200 bg-white text-slate-600 rounded text-sm font-medium hover:border-blue-500 transition-colors">04:30 PM</button>
                    <button type="button" className="py-2 border border-slate-200 bg-white text-slate-600 rounded text-sm font-medium hover:border-blue-500 transition-colors">05:00 PM</button>
                    <button type="button" className="py-2 border border-slate-200 bg-slate-100 text-slate-400 rounded text-sm font-medium cursor-not-allowed line-through">05:30 PM</button>
                  </div>
                </div>
                <button type="button" className="w-full mt-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  Confirm Booking
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
