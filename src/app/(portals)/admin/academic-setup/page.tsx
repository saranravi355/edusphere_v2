import PageHeader from "@/components/ui/PageHeader";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, CalendarDays } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AcademicSetupPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader 
        title="Academic Setup & Import" 
        description="Bulk upload timetables, grade rosters, and section assignments via CSV or Excel."
      />

      <Link href="/admin/academic-setup/calendar" className="group block">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-sm flex items-center justify-between text-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} />
            <div>
              <p className="font-bold">Academic Calendar</p>
              <p className="text-xs text-emerald-100">Terms, holidays and exam windows — sync national and IB calendars.</p>
            </div>
          </div>
          <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Open →</span>
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timetables Upload */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Master Timetables</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Upload the global timetable schedule for all classes.</p>
          
          <div className="w-full border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
            <UploadCloud className="mx-auto text-slate-400 group-hover:text-blue-500 mb-2" size={24} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Select File</span>
          </div>
          <button className="w-full mt-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
            Download Template
          </button>
        </div>

        {/* Grades & Roster Upload */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center mb-4">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Historical Grades</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Import legacy gradebooks and transcript records.</p>
          
          <div className="w-full border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
            <UploadCloud className="mx-auto text-slate-400 group-hover:text-green-500 mb-2" size={24} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Select File</span>
          </div>
          <button className="w-full mt-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
            Download Template
          </button>
        </div>

        {/* Section Assignments */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Class Sections</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Assign students and teachers to class sections.</p>
          
          <div className="w-full border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
            <UploadCloud className="mx-auto text-slate-400 group-hover:text-purple-500 mb-2" size={24} />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Select File</span>
          </div>
          <button className="w-full mt-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
            Download Template
          </button>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">Recent Imports</h3>
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">sections_2026_fall.csv</p>
                <p className="text-xs text-slate-500">Imported 450 records by System Admin</p>
              </div>
            </div>
            <span className="text-sm text-slate-400">2 hours ago</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">timetables_master_v2.xlsx</p>
                <p className="text-xs text-slate-500">Failed: 12 scheduling conflicts found</p>
              </div>
            </div>
            <span className="text-sm text-slate-400">Yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
}
