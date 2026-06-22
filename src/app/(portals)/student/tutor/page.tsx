import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sparkles, Send, Bot } from "lucide-react";

export default async function StudentTutorPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <PageHeader 
        title="AI Tutor" 
        description="Your 24/7 personalized learning assistant."
      />

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col mt-4 overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* Intro Message */}
          <div className="flex items-start gap-4 max-w-[85%]">
            <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-1">
              <Bot size={18} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              <p>Hi {session.user.name.split(' ')[0]}! I'm your EduSphere AI Tutor. <Sparkles className="inline w-4 h-4 text-indigo-500" /></p>
              <p className="mt-2">I noticed you have a Mathematics assignment due tomorrow. Would you like me to explain quadratic equations or help you practice some problems?</p>
            </div>
          </div>

        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form className="relative flex items-center" action={async () => {
            "use server";
          }}>
            <input 
              type="text" 
              placeholder="Ask a question..." 
              className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button type="submit" className="absolute right-2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Send size={14} />
            </button>
          </form>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
            {["Explain Newton's Laws", "Help with algebra", "Practice spelling"].map((suggestion, i) => (
              <button key={i} className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-full transition-colors">
                {suggestion}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
