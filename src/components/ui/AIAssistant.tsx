"use client";

import { Sparkles, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIAssistant({ role }: { role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);

  let assistantName = "EduBot AI";
  let defaultGreeting = "Hi! I am your EduBot AI. How can I help you today?";
  
  if (role === "CLASS_TEACHER" || role === "SUBJECT_TEACHER") {
    assistantName = "Teaching Coach AI";
    defaultGreeting = "Hello! Do you need help calculating grading curves or logging incidents?";
  }
  if (role === "PARENT") {
    assistantName = "Parent Assistant";
    defaultGreeting = "Hi there! Want to know your child's bus ETA or check the latest grades?";
  }
  if (role === "SUPER_ADMIN" || role === "PRINCIPAL") {
    assistantName = "Platform AI";
    defaultGreeting = "Welcome back. Shall I run the Sentiment NLP engine or predict resource depletion?";
  }

  const [messages, setMessages] = useState([
    { role: "bot", content: defaultGreeting }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: query }]);
    setQuery("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      
      let response = "I've analyzed that request. Here is the data you need!";
      if (role === "PARENT") response = "I checked the live database. Route 04 is on time and arriving at your stop in 12 minutes.";
      if (role === "SUPER_ADMIN") response = "Scanning NLP data now. Found 1 critical flag for Lucas Taylor (NLP Score: 0.88).";
      if (role === "CLASS_TEACHER") response = "The class average is currently 74.2%. Applying a 5% curve will bring the median to a B grade.";

      setMessages(prev => [...prev, { role: "bot", content: response }]);
    }, 1500);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col h-[500px]"
          >
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-bold text-sm">{assistantName}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="flex-1 p-4 bg-slate-50 dark:bg-black/20 flex flex-col overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 rounded-2xl rounded-bl-sm p-3 shadow-sm flex items-center gap-2 text-sm">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <form onSubmit={handleSend} className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask me anything..." 
                  className="w-full text-sm bg-slate-100 dark:bg-zinc-800 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-black rounded-xl pl-4 pr-10 py-2.5 outline-none transition-all text-slate-800 dark:text-slate-100"
                />
                <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
