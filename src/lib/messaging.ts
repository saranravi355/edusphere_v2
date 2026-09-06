import prisma from "@/lib/prisma";

/**
 * Who an account is allowed to send a message to.
 *
 * Both message screens build a contact list — a teacher sees the parents of the
 * students in their own classes, a parent sees their children's class teachers —
 * and both `sendMessage` actions then wrote whatever `receiverId` arrived in the
 * form. A Server Action is an independently addressable endpoint, so that list
 * was decoration: any signed-in account could post a message to any user id in
 * the school, and it would appear in that person's inbox under the sender's real
 * name. A student could message every parent.
 *
 * This is the same rule the two screens already use to decide what to show,
 * written once so the action enforces what the UI implies.
 */
export async function canMessage(
  sender: { id: string; role: string },
  receiverId: string,
): Promise<boolean> {
  if (!receiverId || receiverId === sender.id) return false;

  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
  if (!receiver) return false;

  // Administrators run the school and can already read every conversation.
  if (sender.role === "SUPER_ADMIN" || sender.role === "PRINCIPAL") return true;

  // An existing thread may always be replied to. Both screens list prior
  // correspondents alongside the default contacts, so without this a teacher
  // could not answer a message the office had started.
  const prior = await prisma.message.findFirst({
    where: {
      OR: [
        { senderId: sender.id, receiverId },
        { senderId: receiverId, receiverId: sender.id },
      ],
    },
    select: { id: true },
  });
  if (prior) return true;

  // A teacher may open a conversation with the parent of a student in one of
  // the classes they own.
  if (sender.role === "CLASS_TEACHER" || sender.role === "SUBJECT_TEACHER") {
    const match = await prisma.student.findFirst({
      where: {
        classroom: { teacher: { userId: sender.id } },
        parent: { userId: receiverId },
      },
      select: { id: true },
    });
    return Boolean(match);
  }

  // A parent may open a conversation with the class teacher of one of their
  // own children.
  if (sender.role === "PARENT") {
    const match = await prisma.student.findFirst({
      where: {
        parent: { userId: sender.id },
        classroom: { teacher: { userId: receiverId } },
      },
      select: { id: true },
    });
    return Boolean(match);
  }

  return false;
}
