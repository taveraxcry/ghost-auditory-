"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Inbox, BarChart3, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 px-8 py-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden p-1">
              <Image src="/logo.png" alt="Ghost Auditory Logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Ghost<span className="text-white/50 font-normal">Auditory</span></span>
          </div>
          <Link href="/" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
            Volver al Oráculo
          </Link>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden p-1">
            <Image src="/logo.png" alt="Ghost Auditory Logo" width={28} height={28} className="object-contain" />
          </div>
        </Link>
        <span className="text-xl font-bold tracking-tight text-white hidden sm:block">Ghost<span className="text-white/50 font-normal">Auditory</span></span>
      </div>
      
      {!isLoading && (
        <div className="flex gap-1 p-1.5 bg-white/[0.02] rounded-full border border-white/[0.05] shadow-inner">
          <Link href="/" className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${pathname === '/' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <Search size={16} /> Junior
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/senior" className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${pathname === '/senior' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                <Inbox size={16} /> Senior
              </Link>
              <Link href="/auditor" className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${pathname === '/auditor' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                <BarChart3 size={16} /> Auditor
              </Link>
            </>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {!isLoading && isAuthenticated ? (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white/90">Administrador</p>
              <p className="text-xs text-white/50">Solo Huellas</p>
            </div>
            <button onClick={logout} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition-colors" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </>
        ) : !isLoading ? (
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-colors">
            <Shield size={16} /> Acceso Admin
          </Link>
        ) : <div className="w-24"></div>}
      </div>
    </nav>
  );
}
