import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import { sendMessage } from "../actions";

export const dynamic = "force-dynamic";

type Contact = { id: string; name: string; subtitle: string; lastAt: number };

export default async function TeacherMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER", "PRINCIPAL"].includes(session.user.role)) {
    redirect("/");
  }
  const me = session.user.id;

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: "asc" },
  });

  // Contacts: parents of the students in the classes this teacher owns, so the
  // teacher can start a conversation with any family — plus anyone they've
  // already exchanged messages with (covers the reply loop).
  const teacher = await prisma.teacher.findUnique({
    where: { userId: me },
    include: {
      classes: {
        include: {
          students: { include: { parent: { include: { user: true } } } },
        },
      },
    },
  });

  const contacts = new Map<string, Contact>();
  for (const m of messages) {
    const other = m.senderId === me ? m.receiver : m.sender;
    const at = m.createdAt.getTime();
    const existing = contacts.get(other.id);
    if (!existing || at > existing.lastAt) {
      contacts.set(other.id, { id: other.id, name: other.name, subtitle: "Parent / guardian", lastAt: at });
    }
  }
  for (const cls of teacher?.classes ?? []) {
    for (const s of cls.students) {
      const pu = s.parent?.user;
      if (pu && !contacts.has(pu.id)) {
        contacts.set(pu.id, {
          id: pu.id,
          name: pu.name,
          subtitle: `${s.name}'s parent · ${cls.name}`,
          lastAt: 0,
        });
      }
    }
  }
  const contactList = [...contacts.values()].sort((a, b) => b.lastAt - a.lastAt);

  const { with: withParam } = await searchParams;
  const selectedId = withParam && contacts.has(withParam) ? withParam : contactList[0]?.id;
  const selected = selectedId ? contacts.get(selectedId) : undefined;

  const thread = selectedId
    ? messages.filter((m) => m.senderId === selectedId || m.receiverId === selectedId)
    : [];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-6xl">
      <PageHeader
        title="Messages"
        description="Reply to parents and reach out to the families in your classes."
      />

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex mt-4">
        {/* Conversation list */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Families</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contactList.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {contactList.map((c) => {
                  const last = [...messages].reverse().find((m) => m.senderId === c.id || m.receiverId === c.id);
                  const isActive = c.id === selectedId;
                  return (
                    <Link
                      key={c.id}
                      href={`/teacher/messages?with=${c.id}`}
                      className={`block p-4 transition-colors ${
                        isActive ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{c.name}</span>
                        {last && (
                          <span className="text-xs text-slate-400">{last.createdAt.toLocaleDateString("en-GB")}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{last ? last.content : c.subtitle}</p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm">No families to message yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Active conversation */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {selected ? (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{selected.name}</h3>
                <p className="text-xs text-slate-500">{selected.subtitle}</p>
              </div>

              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3">
                {thread.length > 0 ? (
                  thread.map((m) => {
                    const mine = m.senderId === me;
                    return (
                      <div
                        key={m.id}
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          mine
                            ? "self-end bg-blue-600 text-white rounded-tr-sm"
                            : "self-start bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm">{m.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                          {m.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-3 text-slate-200 dark:text-slate-700" />
                    <p className="text-sm">Start the conversation with {selected.name}.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <form className="flex gap-2" action={sendMessage}>
                  <input type="hidden" name="receiverId" value={selected.id} />
                  <input
                    type="text"
                    name="content"
                    required
                    autoComplete="off"
                    placeholder={`Message ${selected.name}...`}
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <MessageSquare className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
              <p>No families available to message yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
