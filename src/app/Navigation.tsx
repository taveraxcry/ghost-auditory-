"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Inbox, BarChart3, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";
import GhostPointsBadge from "@/components/GhostPointsBadge";

export default function Navigation() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden p-1">
              <Image src="/logo.png" alt="Ghost Auditory Logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Ghost<span className="text-foreground-muted font-normal">Auditory</span></span>
          </div>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            Volver a la auditoría
          </Link>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden p-1">
            <Image src="/logo.png" alt="Ghost Auditory Logo" width={28} height={28} className="object-contain" />
          </div>
        </Link>
        <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">Ghost<span className="font-normal opacity-70">Auditory</span></span>
      </div>
      
      {!isLoading && (
        <div className="flex gap-2 p-1">
          <Link href="/" className={`px-6 py-2.5 rounded-t-xl text-sm font-bold transition-all flex items-center gap-2 border-b-4 ${pathname === '/' ? 'bg-primary/5 text-primary border-primary' : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-foreground'}`}>
            <Search size={18} /> Junior
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/senior" className={`px-6 py-2.5 rounded-t-xl text-sm font-bold transition-all flex items-center gap-2 border-b-4 ${pathname === '/senior' ? 'bg-primary/5 text-primary border-primary' : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-foreground'}`}>
                <Inbox size={18} /> Senior
              </Link>
              <Link href="/auditor" className={`px-6 py-2.5 rounded-t-xl text-sm font-bold transition-all flex items-center gap-2 border-b-4 ${pathname === '/auditor' ? 'bg-primary/5 text-primary border-primary' : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-foreground'}`}>
                <BarChart3 size={18} /> Auditor
              </Link>
            </>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {!isLoading && isAuthenticated ? (
          <>
            <GhostPointsBadge />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-foreground">Administrador</p>
              <p className="text-xs text-gray-500 font-medium">Solo Huellas</p>
            </div>
            <button onClick={logout} className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 text-sm font-semibold hover:bg-red-100 transition-colors" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </>
        ) : !isLoading ? (
          <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-sm font-bold text-foreground shadow-sm transition-colors">
            <Shield size={16} /> Acceso Admin
          </Link>
        ) : <div className="w-24"></div>}
      </div>
    </nav>
  );
}
