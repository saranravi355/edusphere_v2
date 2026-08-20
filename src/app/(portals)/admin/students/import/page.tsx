import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BulkImportWizard from "@/components/import/BulkImportWizard";
import type { FieldDef } from "@/lib/bulkImport";
import { importStudents } from "./actions";

export const dynamic = "force-dynamic";

/**
 * This page used to ship its own 458-line copy of the import wizard, forked
 * from the staff one. The two drifted: only this copy validated classrooms,
 * only the shared one had a file size limit, and a fix to either left the
 * other broken. The extra rules this page needs — a class that actually
 * exists, an Indian phone number, a readable date of birth — are expressed as
 * field definitions now, so there is a single upload code path.
 */
const EXAMPLE = [
  "Aarav Sharma", "STU-2026-501", "aarav.sharma@student.edusphere.com", "MYP", "MYP1A", "Male",
  "14/03/2013", "B+", "42 Jayanagar 4th Block, Bengaluru 560011", "Indian", "Kannada",
  "Rohan Sharma", "Priya Sharma", "Architect", "Priya Sharma", "parent.aarav@edusphere.com", "+91 98450 12345",
];

function buildFields(classrooms: string[]): FieldDef[] {
  return [
    { key: "name", label: "Full Name", required: true, aliases: ["name", "fullname", "studentname", "student"] },
    { key: "registrationNo", label: "Registration No", uniqueInFile: true, aliases: ["registrationno", "regno", "admissionno", "rollno", "id"] },
    { key: "email", label: "Student Email", email: true, uniqueInFile: true, aliases: ["email", "studentemail", "loginemail", "emailid"] },
    { key: "curriculum", label: "IB Programme", required: true, enumValues: ["PYP", "MYP", "DP"], aliases: ["curriculum", "programme", "program", "ibprogramme", "ib"] },
    { key: "classroom", label: "Class / Section", oneOf: classrooms, aliases: ["classroom", "class", "section", "homeroom", "grade"] },
    { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
    { key: "dateOfBirth", label: "Date of Birth", date: true, aliases: ["dateofbirth", "dob", "birthdate"] },
    { key: "bloodGroup", label: "Blood Group", aliases: ["bloodgroup", "blood"] },
    { key: "address", label: "Address", aliases: ["address"] },
    { key: "nationality", label: "Nationality", aliases: ["nationality"] },
    { key: "motherTongue", label: "Mother Tongue", aliases: ["mothertongue", "firstlanguage"] },
    { key: "fatherName", label: "Father's Name", aliases: ["fathername", "father"] },
    { key: "motherName", label: "Mother's Name", aliases: ["mothername", "mother"] },
    { key: "motherOccupation", label: "Mother's Occupation", aliases: ["motheroccupation"] },
    { key: "parentName", label: "Parent Name", aliases: ["parentname", "guardian", "guardianname"] },
    { key: "parentEmail", label: "Parent Email", email: true, aliases: ["parentemail", "guardianemail"] },
    {
      key: "parentPhone", label: "Parent Phone", aliases: ["parentphone", "phone", "mobile", "contact", "contactno"],
      // A warning, not an error: a genuine overseas guardian number should not
      // block a student's admission record from being created.
      pattern: { source: "^\\s*\\+?91", message: "Phone not in +91 format", level: "warn" },
    },
  ];
}

export default async function StudentImportPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const classrooms = await prisma.classroom.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Bulk Import Students"
        description="Upload a spreadsheet (Excel or CSV), map the columns, review every row, then commit — creates student records, portal logins and linked parents in one pass."
      />
      <BulkImportWizard
        entityLabel="students"
        fields={buildFields(classrooms.map((c) => c.name))}
        templateExample={EXAMPLE}
        templateFileName="edusphere-student-import-template.xlsx"
        primaryKeys={["name", "registrationNo", "curriculum", "classroom"]}
        importAction={importStudents}
      />
    </div>
  );
}
