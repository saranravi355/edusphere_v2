import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getStudentProgramme } from "@/lib/students/programme";
import ProgrammeProvider from "@/components/students/ProgrammeProvider";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }
  // Read once here so every student page — the AI previews especially — can
  // show the DP or MYP version without looking the student up itself.
  const programme = await getStudentProgramme(session.user.id);
  return <ProgrammeProvider programme={programme}>{children}</ProgrammeProvider>;
}
