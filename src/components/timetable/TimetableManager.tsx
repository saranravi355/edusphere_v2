"use client";

import { useState, useEffect, useTransition } from "react";
import { Classroom, Subject, Teacher, User } from "@prisma/client";
import { CalendarDays, BrainCircuit, Wand2, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";
import TimetableGrid from "./TimetableGrid";
import { getTimetable, autoGenerateSchedule, allocateSlot, removeSlot } from "@/app/(portals)/admin/academic-setup/timetable/actions";

type TeacherWithUser = Teacher & { user: User };

export default function TimetableManager({
  classrooms, subjects, teachers
}: {
  classrooms: Classroom[],
  subjects: Subject[],
  teachers: TeacherWithUser[]
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || "");
  const [timetable, setTimetable] = useState<Awaited<ReturnType<typeof getTimetable>>>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [mockErrors, setMockErrors] = useState(0);

  const [allocationModal, setAllocationModal] = useState<{ day: number, period: number } | null>(null);

  const loadTimetable = (id: string) => {
    startTransition(async () => {
      setError("");
      const data = await getTimetable(id);
      setTimetable(data);
    });
  };

  useEffect(() => {
    if (selectedClassroomId) loadTimetable(selectedClassroomId);
  }, [selectedClassroomId]);

  const handleGenerate = () => {
    startTransition(async () => {
      setError("");
      const res = await autoGenerateSchedule(selectedClassroomId);
      if (res?.error) setError(res.error);
      else {
        loadTimetable(selectedClassroomId);
        setMockErrors(Math.floor(Math.random() * 3) + 1); // Mock 1-3 errors
      }
    });
  };

  const handleAllocate = async (fd: FormData) => {
    startTransition(async () => {
      setError("");
      fd.append("classroomId", selectedClassroomId);
      fd.append("dayOfWeek", allocationModal!.day.toString());
      fd.append("period", allocationModal!.period.toString());

      const res = await allocateSlot(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setAllocationModal(null);
        loadTimetable(selectedClassroomId);
      }
    });
  };

  // Convert db entries to grid format
  const gridEntries = timetable.map(t => ({
    id: t.id,
    dayOfWeek: t.dayOfWeek,
    period: t.period,
    subject: t.subject.name,
    teacher: t.teacher?.user?.name || "Unassigned",
    room: t.room || "TBA"
  }));

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Hero Control Panel */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30 mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={150} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Timetable</h2>
            <p className="text-indigo-200 text-sm mb-6 max-w-md leading-relaxed">
              Our AI evaluates permutations to map Teachers, Subjects, and Rooms without overlapping.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
              >
                {isPending ? (
                  <><Wand2 size={18} className="animate-spin"/> Calculating Permutations...</>
                ) : (
                  <><BrainCircuit size={18} /> Auto-Generate Schedule</>
                )}
              </button>

              {mockErrors > 0 && (
                <button
                  onClick={() => setMockErrors(0)}
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 animate-pulse"
                >
                  <AlertTriangle size={18} /> Auto-Resolve {mockErrors} Conflicts
                </button>
              )}
            </div>
          </div>

          {/* Section Selection */}
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 min-w-[300px]">
             <label className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2 block">Target Section</label>
             <select
               value={selectedClassroomId}
               onChange={(e) => setSelectedClassroomId(e.target.value)}
               className="w-full bg-indigo-950/50 border border-indigo-500/50 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-400"
             >
               {classrooms.map(c => (
                 <option key={c.id} value={c.id}>Grade {c.gradeLevel} - {c.name}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity duration-500"}>
        <TimetableGrid
          entries={gridEntries}
          isEditable={true}
          onAllocate={(day, period) => setAllocationModal({ day, period })}
          onEdit={(day, period) => setAllocationModal({ day, period })}
        />
      </div>

      {allocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setAllocationModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Allocate Slot</h3>
            <p className="text-sm text-slate-500 mb-6">Assign a subject, teacher, and room for Day {allocationModal.day}, Period {allocationModal.period}.</p>

            <form action={handleAllocate} className="space-y-4">
              <div>
                <label className="text-sm font-medium dark:text-slate-300 block mb-1">Subject</label>
                <select name="subjectId" required className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500">
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-slate-300 block mb-1">Teacher</label>
                <select name="teacherId" required className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500">
                  <option value="">Select teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-slate-300 block mb-1">Room</label>
                <input name="room" type="text" placeholder="e.g. Lab 4" required className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500" />
              </div>

              <button disabled={isPending} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                {isPending ? "Saving..." : "Save Allocation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
