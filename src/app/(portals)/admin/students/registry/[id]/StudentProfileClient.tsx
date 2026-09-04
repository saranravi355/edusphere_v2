"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, X, Camera, Trash2, GraduationCap, Phone,
  Users, BookOpen, CalendarCheck, HeartHandshake,
} from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { formatDate } from "@/lib/dates";
import { updateStudentProfile, uploadStudentPhotoAction, removeStudentPhoto } from "./actions";
import type { StudentProfile } from "./types";

const card = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6";
const label = "block text-xs font-medium text-slate-500 mb-1";
const input =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-700 dark:text-slate-300 text-sm outline-none focus:border-blue-500";

function Field({ term, value }: { term: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase font-bold text-slate-400 mb-0.5">{term}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">{value === null || value === undefined || value === "" ? "—" : value}</p>
    </div>
  );
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function StudentProfileClient({ student: s }: { student: StudentProfile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useActionState(updateStudentProfile, undefined);
  const [photoState, photoAction] = useActionState(uploadStudentPhotoAction, undefined);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const age = calcAge(s.dateOfBirth);
  const attendancePct = s.attendanceTotal > 0 ? Math.round((s.attendancePresent / s.attendanceTotal) * 100) : null;
  const gradedSubjects = s.ibSubjects.filter((sub) => typeof sub.currentGrade === "number");
  const overallIbAverage = gradedSubjects.length
    ? (gradedSubjects.reduce((n, sub) => n + (sub.currentGrade ?? 0), 0) / gradedSubjects.length).toFixed(1)
    : null;

  async function handleRemovePhoto() {
    if (!window.confirm("Remove this student's photo?")) return;
    setRemovingPhoto(true);
    await removeStudentPhoto(s.id);
    setRemovingPhoto(false);
    router.refresh();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/students/registry"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Student Registry
        </Link>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Pencil size={14} aria-hidden /> Edit Profile
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200"
          >
            <X size={14} aria-hidden /> Close editing
          </button>
        )}
      </div>

      {/* Identity strip */}
      <div className={`${card} flex flex-col sm:flex-row items-start sm:items-center gap-5`}>
        <PhotoBlock studentId={s.id} photoUrl={s.photoUrl} name={s.name} photoInput={photoInput} photoAction={photoAction} photoState={photoState} onRemove={handleRemovePhoto} removing={removingPhoto} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.name}</h1>
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${s.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400"}`}>
              {s.isActive ? "Active" : "Inactive"}
            </span>
            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{s.curriculum}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {s.className ? `${s.className}` : "Unassigned class"}{s.gradeLevel !== null ? ` · Grade ${s.gradeLevel}` : ""}{s.section ? ` · Section ${s.section}` : ""}
          </p>
          <p className="text-xs text-slate-400 font-mono mt-1">Student ID / Admission No. {s.registrationNo}</p>
        </div>
      </div>

      <form action={updateAction} className="space-y-6">
        <input type="hidden" name="studentId" value={s.id} />
        {editing && <FormFeedback state={updateState} />}

        {/* Basic Information */}
        <section className={card}>
          <SectionTitle icon={GraduationCap} title="Personal Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field term="Full Name" value={s.name} />
            {editing ? (
              <div>
                <label className={label}>Date of Birth</label>
                <input type="date" name="dateOfBirth" defaultValue={s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : ""} className={input} />
              </div>
            ) : (
              <Field term="Date of Birth" value={s.dateOfBirth ? formatDate(s.dateOfBirth, "dMonYyyy") : null} />
            )}
            <Field term="Age" value={age !== null ? `${age} years` : null} />
            {editing ? (
              <div>
                <label className={label}>Gender</label>
                <select name="gender" defaultValue={s.gender ?? ""} className={input}>
                  <option value="">Not specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            ) : (
              <Field term="Gender" value={s.gender} />
            )}
            <Field term="Class" value={s.className} />
            <Field term="Grade" value={s.gradeLevel} />
            {editing ? (
              <div>
                <label className={label}>Section</label>
                <input name="section" defaultValue={s.section ?? ""} placeholder="e.g. A" className={input} />
              </div>
            ) : (
              <Field term="Section" value={s.section} />
            )}
            {editing ? (
              <div>
                <label className={label}>Academic Year</label>
                <input name="academicYear" defaultValue={s.academicYear ?? ""} placeholder="e.g. 2026-27" className={input} />
              </div>
            ) : (
              <Field term="Academic Year" value={s.academicYear} />
            )}
            {editing ? (
              <div>
                <label className={label}>Roll Number</label>
                <input name="rollNumber" defaultValue={s.rollNumber ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Roll Number" value={s.rollNumber} />
            )}
            <Field term="Admission Number" value={s.registrationNo} />
          </div>
          {editing && (
            <p className="text-xs text-slate-400 mt-4">
              Full name, IB programme, and class assignment are managed from Student Registration and class transfer, not from here.
            </p>
          )}
        </section>

        {/* Contact Information */}
        <section className={card}>
          <SectionTitle icon={Phone} title="Contact Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field term="Student Email" value={s.email ?? "No portal login"} />
            {editing ? (
              <div>
                <label className={label}>Student Phone Number</label>
                <input name="phone" type="tel" defaultValue={s.phone ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Student Phone Number" value={s.phone} />
            )}
            {editing ? (
              <div>
                <label className={label}>City</label>
                <input name="city" defaultValue={s.city ?? ""} className={input} />
              </div>
            ) : (
              <Field term="City" value={s.city} />
            )}
            {editing ? (
              <div>
                <label className={label}>State</label>
                <input name="state" defaultValue={s.state ?? ""} className={input} />
              </div>
            ) : (
              <Field term="State" value={s.state} />
            )}
            {editing ? (
              <div>
                <label className={label}>Country</label>
                <input name="country" defaultValue={s.country ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Country" value={s.country} />
            )}
          </div>
          <div className="mt-5">
            {editing ? (
              <div>
                <label className={label}>Residential Address</label>
                <textarea name="address" rows={2} defaultValue={s.address ?? ""} className={`${input} resize-none`} />
              </div>
            ) : (
              <Field term="Residential Address" value={s.address} />
            )}
          </div>
        </section>

        {/* Parent / Guardian Information */}
        <section className={card}>
          <SectionTitle icon={Users} title="Parent / Guardian Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {editing ? (
              <div>
                <label className={label}>Father&apos;s Name</label>
                <input name="fatherName" defaultValue={s.fatherName ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Father's Name" value={s.fatherName} />
            )}
            {editing ? (
              <div>
                <label className={label}>Father&apos;s Contact Number</label>
                <input name="fatherPhone" type="tel" defaultValue={s.fatherPhone ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Father's Contact Number" value={s.fatherPhone} />
            )}
            {editing ? (
              <div>
                <label className={label}>Father&apos;s Email</label>
                <input name="fatherEmail" type="email" defaultValue={s.fatherEmail ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Father's Email" value={s.fatherEmail} />
            )}
            {editing ? (
              <div>
                <label className={label}>Mother&apos;s Name</label>
                <input name="motherName" defaultValue={s.motherName ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Mother's Name" value={s.motherName} />
            )}
            {editing ? (
              <div>
                <label className={label}>Mother&apos;s Contact Number</label>
                <input name="motherPhone" type="tel" defaultValue={s.motherPhone ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Mother's Contact Number" value={s.motherPhone} />
            )}
            {editing ? (
              <div>
                <label className={label}>Mother&apos;s Email</label>
                <input name="motherEmail" type="email" defaultValue={s.motherEmail ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Mother's Email" value={s.motherEmail} />
            )}
            <Field term="Guardian Name" value={s.guardianName ?? "No portal guardian linked"} />
            <Field term="Guardian Contact Number" value={s.guardianPhone} />
            {editing ? (
              <div>
                <label className={label}>Emergency Contact Name</label>
                <input name="emergencyContactName" defaultValue={s.emergencyContactName ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Emergency Contact Name" value={s.emergencyContactName} />
            )}
            {editing ? (
              <div>
                <label className={label}>Emergency Contact Number</label>
                <input name="emergencyContactPhone" type="tel" defaultValue={s.emergencyContactPhone ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Emergency Contact Number" value={s.emergencyContactPhone} />
            )}
          </div>
          {s.guardianName && (
            <p className="text-xs text-slate-400 mt-4">
              Guardian name and contact number come from this student&apos;s linked Parent portal account — update them from Admin → Users, not here.
            </p>
          )}
        </section>

        {/* Academic Information */}
        <section className={card}>
          <SectionTitle icon={BookOpen} title="Academic Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            {editing ? (
              <div>
                <label className={label}>Previous School</label>
                <input name="previousSchool" defaultValue={s.previousSchool ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Previous School" value={s.previousSchool} />
            )}
            <Field term="Admission Date" value={formatDate(s.admissionDate, "dMonYyyy")} />
            <Field term="Overall Grade (IB 1-7 average)" value={overallIbAverage ? `${overallIbAverage} / 7` : gradedSubjects.length === 0 && s.curriculum !== "PYP" ? "Not yet graded" : null} />
          </div>

          {s.curriculum === "PYP" ? (
            <p className="text-sm text-slate-500">PYP uses continuous assessment (portfolios, observations, reflections) rather than formal subject grades.</p>
          ) : s.ibSubjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-400">
                    <th className="py-1.5 pr-4 font-medium">Subject</th>
                    <th className="py-1.5 pr-4 font-medium">Level</th>
                    <th className="py-1.5 pr-4 font-medium">Current</th>
                    <th className="py-1.5 font-medium">Predicted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                  {s.ibSubjects.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-1.5 pr-4 text-slate-700 dark:text-slate-200">{sub.subjectName}</td>
                      <td className="py-1.5 pr-4 text-slate-500">{sub.level}</td>
                      <td className="py-1.5 pr-4 font-bold text-slate-800 dark:text-slate-100">{sub.currentGrade ?? "—"}{sub.currentGrade ? "/7" : ""}</td>
                      <td className="py-1.5 text-slate-500">{sub.predictedGrade ?? "—"}{sub.predictedGrade ? "/7" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No subject records yet.</p>
          )}

          {s.recentAssessments.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Recent published assessments</p>
              <div className="divide-y divide-slate-50 dark:divide-zinc-800">
                {s.recentAssessments.map((a) => (
                  <div key={a.id} className="py-2 flex items-center justify-between text-sm gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.subjectName} · {formatDate(a.date, "dMonYyyy")}</p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 shrink-0">{a.grade}/7</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Attendance & Performance */}
        <section className={card}>
          <SectionTitle icon={CalendarCheck} title="Attendance & Performance" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <Field term="Attendance" value={attendancePct !== null ? `${attendancePct}%` : "No records yet"} />
            <Field term="Days Present" value={`${s.attendancePresent} / ${s.attendanceTotal}`} />
            <Field term="Learning Needs" value={s.learningNeeds ?? "None noted"} />
          </div>
          {s.recentGrades.length > 0 && (
            <div className="pt-5 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Recent test scores</p>
              <div className="divide-y divide-slate-50 dark:divide-zinc-800">
                {s.recentGrades.map((g) => (
                  <div key={g.id} className="py-2 flex items-center justify-between text-sm gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{g.subjectName}</p>
                      <p className="text-xs text-slate-500">{g.examName}</p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 shrink-0">{g.score}/{g.maxScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Health & Support */}
        <section className={card}>
          <SectionTitle icon={HeartHandshake} title="Health & Support" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {editing ? (
              <div>
                <label className={label}>Blood Group</label>
                <input name="bloodGroup" defaultValue={s.bloodGroup ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Blood Group" value={s.bloodGroup} />
            )}
            {editing ? (
              <div>
                <label className={label}>Allergies</label>
                <input name="allergies" defaultValue={s.allergies ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Allergies" value={s.allergies} />
            )}
            {editing ? (
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={label}>Learning Needs</label>
                <input name="learningNeeds" defaultValue={s.learningNeeds ?? ""} className={input} />
              </div>
            ) : (
              <Field term="Learning Needs / IEP" value={s.learningNeeds} />
            )}
          </div>
        </section>

        {editing && (
          <div className="flex items-center gap-3">
            <SubmitButton pendingText="Saving…" className="!bg-blue-600 hover:!bg-blue-700 !text-white">
              Save Changes
            </SubmitButton>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2.5 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200">
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof GraduationCap; title: string }) {
  return (
    <h2 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-4">
      <Icon size={16} className="text-slate-400" aria-hidden /> {title}
    </h2>
  );
}

function PhotoBlock({
  studentId, photoUrl, name, photoInput, photoAction, photoState, onRemove, removing,
}: {
  studentId: string;
  photoUrl: string | null;
  name: string;
  photoInput: React.RefObject<HTMLInputElement | null>;
  photoAction: (formData: FormData) => void;
  photoState: { error?: string; success?: string } | undefined;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <div className="shrink-0 flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 flex items-center justify-center">
        {photoUrl ? (
          // Uploaded photos are user-supplied files served from Vercel Blob, not
          // Next/Image's optimizer-known domain list - a plain <img> avoids configuring
          // remotePatterns for a host that changes per-blob-store.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Camera size={28} className="text-slate-300 dark:text-zinc-600" aria-hidden />
        )}
      </div>
      <form action={photoAction} className="flex flex-col items-center gap-1">
        <input type="hidden" name="studentId" value={studentId} />
        <input
          ref={photoInput}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.form?.requestSubmit()}
        />
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300"
        >
          {photoUrl ? "Replace photo" : "Upload photo"}
        </button>
        {photoUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="text-[11px] font-medium text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-60"
          >
            <Trash2 size={11} aria-hidden /> {removing ? "Removing…" : "Remove"}
          </button>
        )}
      </form>
      {(photoState?.error) && <p className="text-[10px] text-red-500 max-w-[110px] text-center">{photoState.error}</p>}
    </div>
  );
}
