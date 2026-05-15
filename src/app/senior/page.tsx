"use client";

import { motion } from "framer-motion";
import { Inbox, Flame, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function SeniorView() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingDoubts, setPendingDoubts] = useState<any[]>([]);
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
          const pending = docs.filter((d: any) => d.status === "pending");
          setPendingDoubts(pending);
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
    };
  }, [isAuthenticated]);

  if (!mounted || isLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Inbox className="text-primary" /> Bandeja de Entrada Operativa
        </h1>
        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/20">
          {pendingDoubts.length} Dudas Pendientes
        </span>
      </div>

      <div className="space-y-4">
        {pendingDoubts.length > 0 ? (
          pendingDoubts.map((doubt, idx) => (
            <motion.div
              key={doubt.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden border-l-4 border-l-foreground-muted shadow-sm border border-gray-100"
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
    </div>
  );
}
