"use client";

import { useState } from "react";
import TopNav from "./TopNav";
import SideNav from "./SideNav";

interface ShellUser {
  role: string;
  name?: string | null;
}

export default function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleMenu() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ui-bg dark:bg-black font-sans">
      <SideNav
        role={user.role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onCollapseToggle={() => setCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav user={user} onMenuToggle={toggleMenu} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
