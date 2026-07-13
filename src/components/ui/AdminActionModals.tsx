"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, AlertTriangle, X } from "lucide-react";
import { onboardTeacher, createAnnouncement } from "@/app/(portals)/admin/actions";

export default function AdminActionModals() {
  const [activeModal, setActiveModal] = useState<"none" | "teacher" | "announcement">("none");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-mount gate before using createPortal (no document during SSR)
    setMounted(true);
  }, []);

  const close = () => setActiveModal("none");

  return (
    <>
      <div className="space-y-4 mt-2">
        <button onClick={() => setActiveModal("teacher")} className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 hover:border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-900/30 dark:hover:bg-purple-900/40 dark:text-purple-300 transition-all cursor-pointer shadow-sm hover:shadow group">
          <span className="font-medium">Onboard New Teacher</span>
          <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        <button onClick={() => setActiveModal("announcement")} className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:hover:bg-blue-900/40 dark:text-blue-300 transition-all cursor-pointer shadow-sm hover:shadow group">
          <span className="font-medium">School-Wide Announcement</span>
          <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {mounted && activeModal !== "none" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={close} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={20} />
            </button>

            {activeModal === "teacher" && (
              <form action={async (fd) => {
                setLoading(true);
                await onboardTeacher(fd);
                setLoading(false);
                close();
              }} className="space-y-4">
                <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-slate-100 mb-4">Onboard Teacher</h3>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input required name="name" type="text" placeholder="Anita Sharma" className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input required name="email" type="email" placeholder="anita.sharma@edusphere.com" className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subjects</label>
                  <input required name="subjects" type="text" placeholder="Mathematics, Physics" className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600" />
                </div>
                <button disabled={loading} type="submit" className="w-full mt-4 py-2.5 bg-royal-600 hover:bg-royal-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md transition-all">
                  {loading ? "Creating..." : "Create Teacher Profile"}
                </button>
              </form>
            )}

            {activeModal === "announcement" && (
              <form action={async (fd) => {
                setLoading(true);
                await createAnnouncement(fd);
                setLoading(false);
                close();
              }} className="space-y-4">
                <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-slate-100 mb-4">Broadcast Announcement</h3>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message Content</label>
                  <textarea required name="message" rows={4} placeholder="Type your announcement here..." className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-royal-600 resize-none" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input type="checkbox" defaultChecked className="rounded text-royal-600" /> Notify Teachers
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input type="checkbox" defaultChecked className="rounded text-royal-600" /> Notify Parents
                  </label>
                </div>
                <button disabled={loading} type="submit" className="w-full mt-4 py-2.5 bg-royal-600 hover:bg-royal-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md transition-all">
                  {loading ? "Broadcasting..." : "Send Announcement"}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
