"use client";

import { useActionState, useState } from "react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { bookMeeting } from "./actions";
import { MEETING_SLOTS, schoolDateString } from "@/lib/meetings";

const field =
  "w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg " +
  "text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function BookingForm({
  teachers,
  students,
  takenByTeacherAndSlot,
}: {
  teachers: { id: string; name: string; subjects: string }[];
  /** The parent's own children. Not `children` — that name is React's. */
  students: { id: string; name: string }[];
  /** `${teacherId}|${yyyy-mm-dd}|${HH:mm}` for every slot already booked. */
  takenByTeacherAndSlot: string[];
}) {
  const [state, action] = useActionState(bookMeeting, undefined);
  const tomorrow = schoolDateString(1);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [date, setDate] = useState(tomorrow);
  const [slot, setSlot] = useState("");

  const taken = new Set(takenByTeacherAndSlot);
  const isTaken = (s: string) => taken.has(`${teacherId}|${date}|${s}`);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={label} htmlFor="mt-teacher">Teacher</label>
        <select
          id="mt-teacher"
          name="teacherId"
          required
          value={teacherId}
          onChange={(e) => { setTeacherId(e.target.value); setSlot(""); }}
          className={field}
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.subjects ? ` (${t.subjects})` : ""}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="mt-child">About</label>
        <select id="mt-child" name="studentId" required defaultValue={students[0]?.id ?? ""} className={field}>
          {students.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="mt-date">Date</label>
        <input
          id="mt-date"
          name="date"
          type="date"
          required
          min={tomorrow}
          value={date}
          onChange={(e) => { setDate(e.target.value); setSlot(""); }}
          className={field}
        />
      </div>

      <div>
        <span className={label}>Available slots</span>
        {/*
          These were four fixed buttons, one struck through as "taken" for
          decoration. Availability comes from the bookings table now, and the
          unique index on (teacher, time) is what actually holds a slot.
        */}
        <div className="grid grid-cols-2 gap-2">
          {MEETING_SLOTS.map((s) => {
            const gone = isTaken(s);
            const selected = slot === s;
            return (
              <button
                key={s}
                type="button"
                disabled={gone}
                aria-pressed={selected}
                onClick={() => setSlot(s)}
                className={`py-2 border rounded text-sm font-medium transition-colors ${
                  gone
                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through dark:border-slate-800 dark:bg-slate-900"
                    : selected
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="slot" value={slot} />
        {MEETING_SLOTS.every(isTaken) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Every slot that day is taken. Try another date.
          </p>
        )}
      </div>

      <div>
        <label className={label} htmlFor="mt-topic">What would you like to discuss? (optional)</label>
        <textarea id="mt-topic" name="topic" rows={2} className={field} placeholder="So the teacher can prepare." />
      </div>

      <FormFeedback state={state} />

      <SubmitButton className="w-full" pendingText="Booking…" disabled={!slot || !teachers.length || !students.length}>
        Confirm booking
      </SubmitButton>
      {!slot && <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Pick a time to continue.</p>}
    </form>
  );
}
