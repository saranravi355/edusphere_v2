import PageHeader from "@/components/ui/PageHeader";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, Search } from "lucide-react";

const prisma = new PrismaClient();

export default async function ParentMessagesPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id }
      ]
    },
    include: {
      sender: true,
      receiver: true
    },
    orderBy: { sentAt: 'desc' }
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-6xl">
      <PageHeader 
        title="Messages" 
        description="Communicate with teachers and school administration."
      />

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex mt-4">
        {/* Sidebar: Conversation List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {messages.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {messages.map(msg => {
                  const isSentByMe = msg.senderId === session.user.id;
                  const otherUser = isSentByMe ? msg.receiver : msg.sender;
                  return (
                    <div key={msg.id} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{otherUser.name}</span>
                        <span className="text-xs text-slate-400">{new Date(msg.sentAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{msg.content}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm">No conversations yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Active Conversation */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {messages.length > 0 ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {messages[0].senderId === session.user.id ? messages[0].receiver.name : messages[0].sender.name}
                  </h3>
                  <p className="text-xs text-slate-500">Staff Member</p>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                {/* Mocking a single conversation thread for the active selection */}
                <div className={`self-start max-w-[80%] p-3 rounded-2xl rounded-tl-sm ${messages[0].senderId === session.user.id ? 'bg-blue-600 text-white self-end rounded-tl-2xl rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                  <p className="text-sm">{messages[0].content}</p>
                  <span className="text-[10px] opacity-70 mt-1 block">
                    {new Date(messages[0].sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <form className="flex gap-2" action={async () => {
                  "use server";
                  // Mock reply action
                }}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <MessageSquare className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
              <p>Select a conversation or start a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
