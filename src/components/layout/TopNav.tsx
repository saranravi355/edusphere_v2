"use client";

import { Bell, Search, LogOut, Menu } from "lucide-react";
import { logout } from "@/app/actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTranslation } from "react-i18next";

interface TopNavUser {
  role: string;
  name?: string | null;
}

export default function TopNav({
  user,
  onMenuToggle,
}: {
  user: TopNavUser;
  onMenuToggle: () => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-black border-b border-ui-border dark:border-zinc-800 sticky top-0 z-30 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-zinc-800"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        {/* Brand shown on mobile where the sidebar is hidden */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-heading">
            E
          </div>
          <span className="font-heading font-extrabold text-lg tracking-tight text-navy-900 dark:text-white hidden sm:block">
            EduSphere <span className="text-xs font-bold text-blue-500 align-top ml-0.5">AlphaV1</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium text-slate-500 transition-colors cursor-pointer">
          <Search size={16} />
          <span className="w-32 text-left" suppressHydrationWarning>{t('nav.search_placeholder', 'Search...')}</span>
          <span className="ml-4 text-xs bg-white dark:bg-black px-1.5 py-0.5 rounded shadow-sm" suppressHydrationWarning>{t('nav.search_shortcut', 'Ctrl+K')}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Language Switcher */}
        <div className="relative group">
          <button className="flex items-center gap-1 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-zinc-800">
            <span className="text-sm font-bold" suppressHydrationWarning>{t('nav.language_label', 'A/अ')}</span>
            <span className="text-xs uppercase font-medium" suppressHydrationWarning>{(i18n.language || 'en').slice(0, 2).toUpperCase()}</span>
          </button>
          <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50 w-40">
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1">
                {[
                  { code: 'en', key: 'nav.english', fallback: 'English', flag: '🇺🇸' },
                  { code: 'hi', key: 'nav.hindi', fallback: 'Hindi', flag: '🇮🇳' },
                  { code: 'ta', key: 'nav.tamil', fallback: 'Tamil', flag: '🇮🇳' },
                  { code: 'kn', key: 'nav.kannada', fallback: 'Kannada', flag: '🇮🇳' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${i18n.language === lang.code ? 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}>
                    <div className="flex items-center gap-2"><span className="text-lg">{lang.flag}</span> <span suppressHydrationWarning>{t(lang.key, lang.fallback)}</span></div>
                    {i18n.language === lang.code && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative group">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:bg-zinc-800 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
          </button>
          <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50 w-80">
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200" suppressHydrationWarning>{t('nav.notifications', 'Notifications')}</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" suppressHydrationWarning>{t('nav.mark_all_read', 'Mark all read')}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="p-3 border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Bell size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Emergency Drill</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fire drill scheduled at 11:00 AM.</p>
                  <p className="text-[10px] text-slate-400 mt-1">10 mins ago</p>
                </div>
              </div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 text-center">
              <span className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer" suppressHydrationWarning>{t('nav.view_all', 'View all')}</span>
            </div>
          </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy-900 dark:text-slate-100 leading-none">{user.name || "User"}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            {(user.name || "U")[0]}
          </div>

          <form action={logout}>
            <button type="submit" className="ml-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
