"use client";

import { motion } from "framer-motion";
import { Inbox, Flame, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function SeniorView() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingDoubts, setPendingDoubts] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        if (!db) return; // Fallback si Firebase no tiene llaves
        const q = query(
          collection(db, "audits"), 
          where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingDoubts(docs);
      } catch (error) {
        console.error("Firebase fetch error, using mock data", error);
      }
    };
    if (isAuthenticated) {
      fetchAudits();
    }
  }, [isAuthenticated]);

  if (!mounted || isLoading || !isAuthenticated) return null;
  return (
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Inbox */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Inbox className="text-primary" /> Bandeja de Entrada Operativa
          </h1>
          <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm font-medium">
            3 Dudas Pendientes
          </span>
        </div>

        {pendingDoubts.length > 0 ? (
          pendingDoubts.map((doubt, idx) => (
            <motion.div 
              key={doubt.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-6 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden mb-4"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent/30">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg text-white font-medium group-hover:text-primary-400 transition-colors">{doubt.query}</h3>
                    <p className="text-sm text-white/50">{new Date(doubt.created_at).toLocaleString()} • Área: No asignada</p>
                  </div>
                </div>
                <div className="bg-primary/20 text-primary-400 px-3 py-1 rounded-full text-sm font-bold border border-primary/20 flex items-center gap-1 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  +250 GP
                </div>
              </div>
              <div className="mt-4 flex items-center text-primary font-medium text-sm group-hover:text-primary-hover transition-colors">
                Responder ahora <ArrowRight size={16} className="ml-1" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel p-10 rounded-2xl text-center border-dashed border-white/10">
            <h3 className="text-white/60 mb-2 font-medium">Bandeja Limpia</h3>
            <p className="text-white/40 text-sm">No hay consultas complejas pendientes en este momento o las llaves de Firebase no están configuradas.</p>
          </div>
        )}
      </div>

      {/* Right Column: Gamification */}
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border-primary/20 glow-effect"
        >
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">Tu Saldo</p>
          <div className="text-5xl font-extrabold text-white mb-1 flex items-baseline gap-2">
            1,250 <span className="text-2xl text-primary font-bold">GP</span>
          </div>
          <p className="text-sm text-white/50 mb-6">Equivale a ~2.5 hrs libres de turno</p>
          
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            <Gift size={18} /> Canjear Recompensas
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <h3 className="text-lg font-bold text-white mb-4">Top Expertos de la Clínica</h3>
          <div className="space-y-4">
            {[
              { name: "Vet. Principal", points: "3,400", rank: 1 },
              { name: "Tú (Mostrador)", points: "1,250", rank: 2 },
              { name: "Asesor CRM", points: "900", rank: 3 },
            ].map((user) => (
              <div key={user.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`font-bold w-6 text-center ${user.rank === 1 ? 'text-yellow-400' : 'text-white/40'}`}>#{user.rank}</span>
                  <span className="font-medium text-white/90">{user.name}</span>
                </div>
                <span className="text-primary-400 font-bold text-sm">{user.points} GP</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
