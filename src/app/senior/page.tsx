"use client";

import { motion } from "framer-motion";
import { Inbox, Flame, ArrowRight, Coins, Sparkles, Gift, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { earnGP, subscribeBalance } from "@/lib/ghostpoints";
import GhostPointsToast from "@/components/GhostPointsToast";
import GhostPointsWallet from "@/components/GhostPointsWallet";

export default function SeniorView() {
  const { isAuthenticated, isLoading, uid } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pendingDoubts, setPendingDoubts] = useState<any[]>([]);
  const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [gpBalance, setGpBalance] = useState(0);
  const [gpStreak, setGpStreak] = useState(0);
  const [gpEarnedToday, setGpEarnedToday] = useState(0);

  const [toast, setToast] = useState<{ show: boolean; qualityLevel: string; gpAmount: number; bonusAmount: number }>({
    show: false, qualityLevel: "", gpAmount: 0, bonusAmount: 0
  });
  const [walletOpen, setWalletOpen] = useState(false);
  const [redeemsOpen, setRedeemsOpen] = useState(false);
  const [redeems, setRedeems] = useState<any[]>([]);

  const submitReply = async (doubtId: string) => {
    if (!replyText.trim() || !db || !uid) return;
    setSubmittingId(doubtId);
    const doubt = pendingDoubts.find(d => d.id === doubtId);
    try {
      const docRef = doc(db, "audits", doubtId);
      await updateDoc(docRef, {
        answer: replyText,
        status: "resolved",
      });

      const res = await fetch("/api/evaluate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: doubt?.query || "", answer: replyText }),
      });
      const evalData = await res.json();
      const qualityLevel = evalData.qualityLevel || "intermedia";
      const gpAmount = evalData.gpAmount || 20;

      const result = await earnGP(uid, gpAmount, `question_${qualityLevel}`, doubtId, doubt?.query || "", qualityLevel);

      await updateDoc(docRef, {
        gpAwarded: gpAmount,
        qualityLevel,
        resolvedAt: new Date().toISOString(),
        resolvedBy: uid,
      });

      setToast({ show: true, qualityLevel, gpAmount: result.totalAwarded, bonusAmount: result.bonusAwarded });
      setExpandedDoubtId(null);
      setReplyText("");
    } catch (e) {
      console.error("Failed to submit reply", e);
    }
    setSubmittingId(null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeBalance(uid, (data) => {
      setGpBalance(data.balance);
      setGpStreak(data.currentStreak);
      setGpEarnedToday(data.gpEarnedToday);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!isAuthenticated || !uid) return;
    let unsubscribe: () => void;

    try {
      if (!db) return;
      const q = query(
        collection(db, "audits"),
        orderBy("created_at", "desc")
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        const pending = docs.filter((d: any) => d.status === "pending" && d.askedBy !== uid);
        setPendingDoubts(pending);
      });
    } catch (error) {
      console.error("Firebase fetch error", error);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, uid]);

  useEffect(() => {
    if (!redeemsOpen || !db) return;
    const q = query(collection(db, "redeems"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRedeems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [redeemsOpen]);

  if (!mounted || isLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-6">
      <GhostPointsToast
        show={toast.show}
        qualityLevel={toast.qualityLevel}
        gpAmount={toast.gpAmount}
        bonusAmount={toast.bonusAmount}
        onComplete={() => setToast(prev => ({ ...prev, show: false }))}
      />
      <GhostPointsWallet open={walletOpen} onClose={() => setWalletOpen(false)} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Inbox className="text-primary" /> Bandeja de Entrada Operativa
        </h1>
        <div className="flex items-center gap-3">
          {gpStreak >= 2 && (
            <span className="bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-bold border border-accent/20 flex items-center gap-1.5">
              <Flame size={14} /> {gpStreak} días
            </span>
          )}
          <button
            onClick={() => setWalletOpen(true)}
            className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/20 flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
          >
            <Coins size={14} /> {gpBalance} GP
          </button>
          <button
            onClick={() => setRedeemsOpen(true)}
            className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-bold border border-accent/20 flex items-center gap-1.5 hover:bg-accent/20 transition-colors"
          >
            <Gift size={14} /> Canjes
          </button>
          <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/20">
            {pendingDoubts.length} Dudas Pendientes
          </span>
        </div>
      </div>

      {/* Modal de Registro de Canjes */}
      {redeemsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setRedeemsOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Gift className="text-accent" size={22} /> Registro de Canjes (Seniors)
              </h2>
              <button onClick={() => setRedeemsOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {redeems.length > 0 ? (
                <div className="space-y-4">
                  {redeems.map((r, i) => (
                    <div key={r.id || i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{r.userName} <span className="text-gray-400 font-medium text-sm ml-2">C.C. {r.userCedula}</span></p>
                        <p className="text-sm text-primary font-medium">{r.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">{r.timestamp ? new Date(r.timestamp.toDate()).toLocaleString() : 'Reciente'}</p>
                      </div>
                      <div className="bg-red-50 text-red-500 font-bold px-3 py-1 rounded-lg border border-red-100">
                        -{r.cost} GP
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 font-medium py-10">No hay canjes registrados aún.</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                      disabled={submittingId === doubt.id}
                      className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-colors w-full md:w-auto self-end shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submittingId === doubt.id ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Evaluando...</>
                      ) : (
                        <><Sparkles size={16} /> Enviar Respuesta</>
                      )}
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
