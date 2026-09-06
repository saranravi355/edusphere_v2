"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import { FormFeedback, SubmitButton, type ActionState } from "@/components/ui/form";
import { registerStudent } from "./actions";

/**
 * The admission form.
 *
 * Laid out in the same five sections, in the same order, with the same field
 * names as the student profile at /admin/students/registry/[id] — so what the
 * office types here is exactly what that screen reads back, and a newly
 * registered student no longer opens as a page of em-dashes.
 *
 * Only three things on the profile are absent, and each because it is derived
 * rather than entered: Age (from date of birth), Class and Grade (from the
 * assigned classroom), and the IB 1–7 average (from subject grades a teacher
 * records later).
 */

export interface ClassOption {
  id: string;
  name: string;
  gradeLevel: number;
}

const card =
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm";
const label = "text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1";
const input =
  "w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors";
const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5";
const hint = "text-xs text-slate-400 mt-4";

function SectionTitle({ icon: Icon, title }: { icon: typeof GraduationCap; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={18} className="text-blue-600 dark:text-blue-400" aria-hidden />
      <h2 className="font-bold text-slate-800 dark:text-slate-100">{title}</h2>
    </div>
  );
}

function Text({
  name,
  term,
  type = "text",
  placeholder,
  required,
  defaultValue,
}: {
  name: string;
  term: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className={label} htmlFor={name}>
        {term}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={input}
      />
    </div>
  );
}

export default function RegisterStudentClient({
  classes,
  suggestedRegistrationNo,
  currentAcademicYear,
}: {
  classes: ClassOption[];
  suggestedRegistrationNo: string;
  currentAcademicYear: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(registerStudent, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // The office registers several students in a row. Leaving the previous
  // child's details in the boxes is how the wrong address ends up on the
  // wrong record, so a successful save clears the form.
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <FormFeedback state={state} />

      {/* Personal Information */}
      <section className={card}>
        <SectionTitle icon={GraduationCap} title="Personal Information" />
        <div className={grid}>
          <Text name="name" term="Full Name" required placeholder="e.g. Aarav Gupta" />
          <Text name="dateOfBirth" term="Date of Birth" type="date" />
          <div>
            <label className={label} htmlFor="gender">Gender</label>
            <select id="gender" name="gender" defaultValue="" className={input}>
              <option value="">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={label} htmlFor="curriculum">
              IB Programme<span className="text-rose-500"> *</span>
            </label>
            <select id="curriculum" name="curriculum" required defaultValue="MYP" className={input}>
              <option value="PYP">PYP (Primary Years Programme)</option>
              <option value="MYP">MYP (Middle Years Programme)</option>
              <option value="DP">DP (Diploma Programme)</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="classroomId">Class</label>
            <select id="classroomId" name="classroomId" defaultValue="" className={input}>
              <option value="">Not assigned yet</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Grade {c.gradeLevel})
                </option>
              ))}
            </select>
          </div>
          <Text name="section" term="Section" placeholder="e.g. A" />

          <Text name="academicYear" term="Academic Year" defaultValue={currentAcademicYear} placeholder="e.g. 2026-27" />
          <Text name="rollNumber" term="Roll Number" placeholder="e.g. 14" />
          <Text
            name="registrationNo"
            term="Admission Number"
            placeholder={suggestedRegistrationNo || "auto-generated"}
          />
        </div>
        <p className={hint}>
          Leave the admission number blank and the next one in the series
          {suggestedRegistrationNo ? ` (${suggestedRegistrationNo})` : ""} is used. Grade comes from
          the class you assign, and age from the date of birth — neither is typed here.
        </p>
      </section>

      {/* Contact Information */}
      <section className={card}>
        <SectionTitle icon={Phone} title="Contact Information" />
        <div className={grid}>
          <Text name="email" term="Student Email" type="email" placeholder="name@student.edusphere.com" />
          <Text name="phone" term="Student Phone Number" type="tel" placeholder="+91 …" />
          <Text name="city" term="City" defaultValue="Bengaluru" />
          <Text name="state" term="State" defaultValue="Karnataka" />
          <Text name="country" term="Country" defaultValue="India" />
        </div>
        <div className="mt-5">
          <label className={label} htmlFor="address">Residential Address</label>
          <textarea id="address" name="address" rows={3} className={`${input} resize-none`} />
        </div>
        <p className={hint}>
          The student email is their portal login. Leave it blank to enrol the student without a
          portal account — one can be added later from Admin → Users.
        </p>
      </section>

      {/* Parent / Guardian Information */}
      <section className={card}>
        <SectionTitle icon={Users} title="Parent / Guardian Information" />
        <div className={grid}>
          <Text name="fatherName" term="Father's Name" />
          <Text name="fatherPhone" term="Father's Contact Number" type="tel" />
          <Text name="fatherEmail" term="Father's Email" type="email" />

          <Text name="motherName" term="Mother's Name" />
          <Text name="motherPhone" term="Mother's Contact Number" type="tel" />
          <Text name="motherEmail" term="Mother's Email" type="email" />

          <Text name="motherOccupation" term="Mother's Occupation" />
          <Text name="motherMonthlyIncome" term="Mother's Monthly Income" placeholder="₹" />
        </div>

        <hr className="my-6 border-slate-100 dark:border-slate-800" />

        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Guardian portal account</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          The profile screen reads Guardian Name and Guardian Contact Number off the linked parent
          account, so fill these in to have them show there. An address already belonging to a
          parent is reused, which is what links siblings to one family login.
        </p>
        <div className={grid}>
          <Text name="guardianName" term="Guardian Name" />
          <Text name="guardianPhone" term="Guardian Contact Number" type="tel" placeholder="+91 …" />
          <Text name="guardianEmail" term="Guardian Email (portal login)" type="email" />

          <Text name="emergencyContactName" term="Emergency Contact Name" />
          <Text name="emergencyContactPhone" term="Emergency Contact Number" type="tel" />
        </div>
      </section>

      {/* Academic Information */}
      <section className={card}>
        <SectionTitle icon={BookOpen} title="Academic Information" />
        <div className={grid}>
          <Text name="previousSchool" term="Previous School" />
          <Text name="admissionDate" term="Admission Date" type="date" />
        </div>
        <p className={hint}>
          Leave the admission date blank for today. The Overall Grade (IB 1–7 average) on the
          profile is calculated from subject grades as teachers record them — it is not entered
          here.
        </p>
      </section>

      {/* Health & Support */}
      <section className={card}>
        <SectionTitle icon={HeartHandshake} title="Health &amp; Support" />
        <div className={grid}>
          <Text name="bloodGroup" term="Blood Group" placeholder="e.g. O+" />
          <Text name="allergies" term="Allergies" placeholder="e.g. Peanuts" />
          <Text name="learningNeeds" term="Learning Needs" />
        </div>
        <p className={hint}>
          Allergies feed the teacher allergy list and the canteen. Learning needs open an IEP the
          class teacher can build on.
        </p>
      </section>

      <div className="flex items-center gap-4">
        <SubmitButton
          pendingText="Registering…"
          className="!bg-blue-600 hover:!bg-blue-700 !text-white font-bold"
        >
          <UserPlus size={16} aria-hidden /> Register Student
        </SubmitButton>
        <p className="text-xs text-slate-400">Only the full name and IB programme are required.</p>
      </div>
    </form>
  );
}
