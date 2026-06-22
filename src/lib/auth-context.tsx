"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type Role = "SUPER_ADMIN" | "PRINCIPAL" | "CLASS_TEACHER" | "PARENT" | "STUDENT";

interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  contextId?: string; // class id, student id, etc.
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  impersonate: (role: Role) => void;
}

const mockUsers: Record<Role, User> = {
  SUPER_ADMIN: { id: "U1", name: "Sarah Admin", role: "SUPER_ADMIN", avatar: "/avatars/admin.png" },
  PRINCIPAL: { id: "U2", name: "Dr. Matthews", role: "PRINCIPAL", avatar: "/avatars/principal.png" },
  CLASS_TEACHER: { id: "U3", name: "Meena Krishnan", role: "CLASS_TEACHER", avatar: "/avatars/teacher.png", contextId: "9A" },
  PARENT: { id: "U4", name: "Rahul Patel", role: "PARENT", avatar: "/avatars/parent.png" },
  STUDENT: { id: "U5", name: "Aarav Patel", role: "STUDENT", avatar: "/avatars/student.png", contextId: "S001" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // On mount, auto-login as teacher for demo if no user
  useEffect(() => {
    const saved = localStorage.getItem("edu_auth_role");
    if (saved && mockUsers[saved as Role]) {
      setUser(mockUsers[saved as Role]);
    } else {
      setUser(mockUsers.CLASS_TEACHER);
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem("edu_auth_role", u.role);
    routeToDashboard(u.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("edu_auth_role");
    router.push("/");
  };

  const impersonate = (role: Role) => {
    login(mockUsers[role]);
  };

  const routeToDashboard = (role: Role) => {
    if (role === "SUPER_ADMIN" || role === "PRINCIPAL") router.push("/admin");
    else if (role === "CLASS_TEACHER") router.push("/teacher");
    else if (role === "PARENT") router.push("/parent");
    else if (role === "STUDENT") router.push("/student");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, impersonate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
