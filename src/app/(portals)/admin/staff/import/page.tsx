import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import BulkImportWizard from "@/components/import/BulkImportWizard";
import type { FieldDef } from "@/lib/bulkImport";
import { importStaff } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Full Name", required: true, aliases: ["name", "fullname", "teacher", "teachername", "staffname"] },
  { key: "email", label: "Email", required: true, email: true, uniqueInFile: true, aliases: ["email", "emailid", "loginemail"] },
  { key: "role", label: "Role", enumValues: ["CLASS_TEACHER", "SUBJECT_TEACHER"], aliases: ["role", "type"] },
  { key: "subjects", label: "Subjects", aliases: ["subjects", "subject", "teaches"] },
  { key: "qualifications", label: "Qualifications", aliases: ["qualifications", "qualification", "degree"] },
  { key: "yearsExperience", label: "Years Experience", numeric: true, aliases: ["yearsexperience", "experience", "yearsofexperience", "exp"] },
  { key: "cpdHours", label: "CPD Hours", numeric: true, aliases: ["cpdhours", "cpd", "pdhours"] },
];

const EXAMPLE = ["Anjali Menon", "anjali.menon@edusphere.com", "SUBJECT_TEACHER", "Physics, Mathematics", "M.Sc Physics, B.Ed", "8", "24"];

export default async function StaffImportPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Bulk Import Staff"
        description="Upload a spreadsheet (Excel or CSV), map the columns, review every row, then commit — creates teacher records and portal logins in one pass."
      />
      <BulkImportWizard
        entityLabel="teachers"
        fields={FIELDS}
        templateExample={EXAMPLE}
        templateFileName="edusphere-staff-import-template.xlsx"
        primaryKeys={["name", "email", "role"]}
        importAction={importStaff}
      />
    </div>
  );
}
