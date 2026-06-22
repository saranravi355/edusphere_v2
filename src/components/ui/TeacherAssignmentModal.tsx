"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { uploadAssignment } from "@/app/(portals)/teacher/actions";

export default function TeacherAssignmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 hover:text-royal-600 hover:border-royal-300 hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-all font-medium text-sm flex items-center justify-center gap-2">
        <FileText className="w-4 h-4" /> Upload New Assignment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={20} />
            </button>
            
            <form action={async (fd) => {
              setLoading(true);
              await uploadAssignment(fd);
              setLoading(false);
              setIsOpen(false);
            }} className="space-y-4">
              <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-slate-100 mb-4">New Assignment</h3>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assignment Title</label>
                <input required name="title" type="text" placeholder="Chapter 4 Exercise" className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                <input required name="dueDate" type="date" className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instructions</label>
                <textarea required name="instructions" rows={3} placeholder="Complete pages 45-50..." className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600 resize-none" />
              </div>
              <button disabled={loading} type="submit" className="w-full mt-4 py-2.5 bg-royal-600 hover:bg-royal-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md transition-all">
                {loading ? "Uploading..." : "Publish Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
