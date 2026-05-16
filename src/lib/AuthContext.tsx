"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  uid: string | null;
  login: (pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authStatus = localStorage.getItem("ghost_auth");
    if (authStatus === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUid("admin_senior");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, []);

  const login = (pass: string) => {
    // Validating against the requested password
    if (pass === "1006148628") {
      setIsAuthenticated(true);
      setUid("admin_senior");
      localStorage.setItem("ghost_auth", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUid(null);
    localStorage.removeItem("ghost_auth");
    if (pathname === "/senior" || pathname === "/auditor") {
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, uid, login, logout }}>
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
