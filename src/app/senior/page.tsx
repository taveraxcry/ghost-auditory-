"use client";

import { motion } from "framer-motion";
import { Inbox, Flame, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function SeniorView() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingDoubts, setPendingDoubts] = useState<any[]>([]);
  const [teamGp, setTeamGp] = useState(0);
  const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const submitReply = async (doubtId: string) => {
    if (!replyText.trim() || !db) return;
    try {
      const docRef = doc(db, "audits", doubtId);
      await updateDoc(docRef, {
        answer: replyText,
        status: "resolved",
      });
      setExpandedDoubtId(null);
      setReplyText("");
    } catch (e) {
      console.error("Failed to submit reply", e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    let unsubscribe: () => void;

    const subscribeAudits = () => {
      try {
        if (!db) return;
        const q = query(
          collection(db, "audits"), 
          orderBy("created_at", "desc")
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
          
          // Filter pending
          const pending = docs.filter((d: any) => d.status === "pending");
          setPendingDoubts(pending);
          
          // Calculate GP (250 points for every resolved complex doubt)
          const resolvedComplex = docs.filter((d: any) => d.status === "resolved" && d.is_complex);
          setTeamGp(resolvedComplex.length * 250);
        });
      } catch (error) {
        console.error("Firebase fetch error", error);
      }
    };
    
    if (isAuthenticated) {
      subscribeAudits();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [isAuthenticated]);

  if (!mounted || isLoading || !isAuthenticated) return null;
  return (
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Inbox */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Inbox className="text-primary" /> Bandeja de Entrada Operativa
          </h1>
          <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/20">
            {pendingDoubts.length} Dudas Pendientes
          </span>
        </div>

        {pendingDoubts.length > 0 ? (
          pendingDoubts.map((doubt, idx) => (
            <motion.div 
              key={doubt.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden mb-4 border-l-4 border-l-foreground-muted shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg text-foreground font-bold group-hover:text-primary transition-colors">{doubt.query}</h3>
                    <p className="text-sm text-gray-400 font-medium">{new Date(doubt.created_at).toLocaleString()} • Área: No asignada</p>
                  </div>
                </div>
                <div className="text-accent text-xl font-extrabold flex items-center gap-1">
                  ⚡ +250 GP
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <div 
                  onClick={() => {
                    setExpandedDoubtId(expandedDoubtId === doubt.id ? null : doubt.id);
                    setReplyText("");
                  }}
                  className="flex items-center text-primary font-bold text-sm hover:text-primary-hover transition-colors cursor-pointer w-fit bg-primary/5 px-4 py-2 rounded-full"
                >
                  {expandedDoubtId === doubt.id ? "Cancelar" : "Responder ahora"} <ArrowRight size={16} className="ml-1" />
                </div>
                
                {expandedDoubtId === doubt.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 flex flex-col gap-3"
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu respuesta experta aquí..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-foreground font-medium placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      rows={4}
                    />
                    <button 
                      onClick={() => submitReply(doubt.id)}
                      className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-colors w-full md:w-auto self-end shadow-sm flex items-center justify-center gap-2"
                    >
                      Enviar Respuesta
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl text-center border-dashed border-2 border-gray-200">
            <h3 className="text-gray-400 mb-2 font-bold text-xl">Bandeja Limpia</h3>
            <p className="text-gray-400 text-sm font-medium">No hay consultas complejas pendientes en este momento.</p>
          </div>
        )}
      </div>

      {/* Right Column: Gamification */}
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-accent/20 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">Fondo de Recompensas</p>
          <div className="text-5xl font-extrabold text-foreground mb-1 flex items-baseline gap-2 relative z-10">
            {teamGp.toLocaleString()} <span className="text-2xl text-accent font-bold">GP</span>
          </div>
          <p className="text-sm text-gray-400 font-medium mb-8 relative z-10">Equivale a ~{((teamGp || 0) / 500).toFixed(1)} hrs libres de turno</p>
          
          <button className="w-full bg-accent hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md relative z-10">
            <Gift size={20} /> Canjear Recompensas
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-foreground mb-6">Top Expertos de la Clínica</h3>
          <div className="space-y-4">
            {[
              { name: "Equipo Conjunto", points: teamGp.toLocaleString(), rank: 1 },
              { name: "Vet. Principal", points: "0", rank: 2 },
              { name: "Asesor CRM", points: "0", rank: 3 },
            ].map((user) => (
              <div key={user.name} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`font-black w-6 text-center ${user.rank === 1 ? 'text-accent text-lg' : 'text-gray-300'}`}>#{user.rank}</span>
                  <span className="font-bold text-foreground">{user.name}</span>
                </div>
                <span className="text-primary font-bold text-sm">{user.points} GP</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
