"use client";

import { useAuth, Role } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function ImpersonationBar() {
  const { user, impersonate } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 glass-card p-2 rounded-full flex gap-2 items-center shadow-2xl border border-primary/20">
      <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Viewing as: <strong className="text-primary">{user.role}</strong>
      </span>
      <div className="flex gap-1">
        <Button size="sm" variant={user.role === "SUPER_ADMIN" ? "default" : "ghost"} onClick={() => impersonate("SUPER_ADMIN")} className="rounded-full text-xs h-8">Admin</Button>
        <Button size="sm" variant={user.role === "CLASS_TEACHER" ? "default" : "ghost"} onClick={() => impersonate("CLASS_TEACHER")} className="rounded-full text-xs h-8">Teacher</Button>
        <Button size="sm" variant={user.role === "PARENT" ? "default" : "ghost"} onClick={() => impersonate("PARENT")} className="rounded-full text-xs h-8">Parent</Button>
      </div>
    </div>
  );
}
