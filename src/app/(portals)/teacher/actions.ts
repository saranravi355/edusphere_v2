"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, STAFF_ROLES } from "@/lib/authz";
import { canMessage } from "@/lib/messaging";

/**
 * markAttendance and bulkMarkPresent used to live here, and both were dead:
 * teacher/page.tsx defines its own inline server actions of the same names,
 * with different signatures, and nothing imported these. Dead was not harmless —
 * a "use server" export is an independently addressable HTTP endpoint whether or
 * not any page calls it, and these two checked only that the caller held some
 * session. Neither checked a role, and neither checked that the student or the
 * class belonged to the caller, so any signed-in account — a parent, or a student
 * marking their own register — could set attendance for any studentId, or mark an
 * entire classId present, attributed to themselves.
 *
 * The live versions in teacher/page.tsx do it correctly: they resolve the
 * caller's own classes through guard(TEACHER_ROLES), reject a status outside the
 * allowed set, and confirm the student is in one of those classes before writing.
 * There is nothing here worth keeping, so this follows the precedent already set
 * in this file for assignGrade and uploadAssignment: delete it.
 */

/*
 * `uploadAssignment` used to live here: a 1.5-second sleep that returned
 * { success: true } and wrote nothing. Its only consumer, TeacherAssignmentModal,
 * was never rendered anywhere. Both are gone — assignments are created through
 * /teacher/assignments, which writes.
 */

export async function sendMessage(formData: FormData) {
  // The messages screen offers the parents of this teacher's own students. The
  // action used to accept whatever receiverId arrived, so that list constrained
  // nobody: any signed-in account could post into any user's inbox under their
  // own name. See lib/messaging.ts for the rule.
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return;

  const receiverId = String(formData.get("receiverId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!receiverId || !content) return;

  if (!(await canMessage(auth.user, receiverId))) return;

  await prisma.message.create({
    data: {
      senderId: auth.user.id,
      receiverId,
      subject: "Teacher message",
      content,
      isRead: false,
    },
  });

  revalidatePath("/teacher/messages");
}
