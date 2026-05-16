"use client";

import { useState, useEffect } from "react";
import { Search, Flame, ArrowRight, Lightbulb, TrendingUp, Syringe, Shield, Stethoscope, Package } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export default function JuniorView() {
  const { uid } = useAuth();

  // Initialize state from sessionStorage directly (no race condition)
  const [savedState] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("ghosty_state");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [query, setQuery] = useState(savedState?.query || "");
  const [searched, setSearched] = useState(savedState?.searched || false);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState(savedState?.answer || "");
  const [isComplex, setIsComplex] = useState(savedState?.isComplex || false);
  const [isIrrelevant, setIsIrrelevant] = useState(savedState?.isIrrelevant || false);
  const [bengalaSent, setBengalaSent] = useState(savedState?.bengalaSent || false);
  const [pendingAuditId, setPendingAuditId] = useState<string | null>(savedState?.pendingAuditId || null);

  // Save state to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem("ghosty_state", JSON.stringify({
      query, searched, answer, isComplex, isIrrelevant, bengalaSent, pendingAuditId
    }));
  }, [query, searched, answer, isComplex, isIrrelevant, bengalaSent, pendingAuditId]);

  // Polling: checa cada 3s si el Senior ya respondió
  useEffect(() => {
    if (!pendingAuditId || !bengalaSent || !db) return;

    const checkResolved = async () => {
      try {
        const snap = await getDoc(doc(db, "audits", pendingAuditId));
        if (snap.exists()) {
          const d = snap.data();
          if (d.status === "resolved" && d.answer) {
            setAnswer(d.answer);
            setIsComplex(false);
            setBengalaSent(false);
            setPendingAuditId(null);
            return true;
          }
        }
      } catch (_) {}
      return false;
    };

    checkResolved(); // chequeo inmediato
    const timer = setInterval(async () => {
      const ok = await checkResolved();
      if (ok) clearInterval(timer);
    }, 3000);

    return () => clearInterval(timer);
  }, [pendingAuditId, bengalaSent]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 5) return;
    
    setIsLoading(true);
    setSearched(true);
    setAnswer("");
    setIsComplex(false);
    setIsIrrelevant(false);
    setBengalaSent(false);

    try {
      // DIRECTO a la IA — sin pasos intermedios
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        let errMsg = "Error " + res.status;
        try { const e = await res.json(); if (e.error) errMsg = e.error; } catch(_){}
        setAnswer("⚠️ " + errMsg);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      
      if (data.isIrrelevant) {
        setIsIrrelevant(true);
      } else if (data.isComplex) {
        setIsComplex(true);
      } else {
        setAnswer(data.answer || "");
      }

      // MOSTRAR RESPUESTA PRIMERO, guardar en Firebase DESPUÉS (fire-and-forget)
      setIsLoading(false);

      // Guardar en background — no bloquea la UI
      if (db) {
        const finalIsComplex = data.isComplex;
        const finalStatus = data.isIrrelevant ? "irrelevant" : (finalIsComplex ? "draft_complex" : "resolved");
        addDoc(collection(db, "audits"), {
          query,
          answer: (finalIsComplex || data.isIrrelevant) ? "" : (data.answer || ""),
          status: finalStatus,
          is_complex: finalIsComplex,
          created_at: new Date().toISOString(),
          askedBy: uid || "junior",
        }).catch(() => {});
      }
      return;

    } catch (err) {
      console.error("Search error:", err);
      setAnswer("⚠️ Error de conexión. Intenta de nuevo.");
    }
    
    setIsLoading(false);
  };

  const handleReset = () => {
    setQuery("");
    setSearched(false);
    setAnswer("");
    setIsComplex(false);
    setIsIrrelevant(false);
    setBengalaSent(false);
    setPendingAuditId(null);
    sessionStorage.removeItem("ghosty_state");
  };

  const triggerSearch = (text: string) => {
    setQuery(text);
    setTimeout(() => {
      const form = document.getElementById("junior-search-form") as HTMLFormElement;
      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 50);
  };

  const handleEscalate = async () => {
    if (bengalaSent) return; // Prevenir duplicados
    setBengalaSent(true); // Bloquear inmediatamente
    setIsComplex(true);
    setAnswer("");
    try {
      const docRef = await addDoc(collection(db, "audits"), {
        query: `${query}`,
        answer: "",
        status: "pending",
        is_complex: true,
        created_at: new Date().toISOString(),
        askedBy: uid || "junior",
      });
      setPendingAuditId(docRef.id);
    } catch (e) {
      console.error(e);
      setBengalaSent(false); // Permitir reintentar si falló
    }
  };

  // Parse answer for suggestions
  const parsedAnswer = (() => {
    const parts = answer.split("¿Qué más necesitas saber?");
    if (parts.length > 1) {
      const mainText = parts[0].trim();
      const rawSuggestions = parts[1].split("\n").filter(line => line.trim().startsWith("-"));
      const suggestions = rawSuggestions.map(line => line.replace(/^-\s*/, "").trim());
      return { mainText, suggestions };
    }
    return { mainText: answer, suggestions: [] };
  })();

  return (
    <div className="max-w-4xl mx-auto px-6 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
          ¡Hola! 👋 Soy Ghosty
        </h1>
        <p className="text-3xl text-foreground font-bold mb-4">
          Tu asistente de conocimiento
        </p>
        <p className="text-lg text-gray-500 font-medium">
          Haz tu pregunta y encuentra respuestas de tu equipo experto.
        </p>
      </motion.div>

      <form 
        id="junior-search-form"
        onSubmit={handleSearch} 
        className="w-full relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-primary/20 rounded-[30px] blur-md opacity-50 group-hover:opacity-70 transition duration-500"></div>
        <div className="relative bg-white/80 backdrop-blur-md rounded-[25px] p-3 pl-8 border-2 border-primary/10 hover:border-primary/30 shadow-lg group-hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-2">
            <Search className="text-gray-400 group-focus-within:text-primary transition-colors mt-4 flex-shrink-0" size={26} />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).form?.requestSubmit(); } }}
              placeholder="Ej. ¿A qué edad se aplica la primera vacuna de un cachorro?"
              rows={1}
              style={{ minHeight: "56px", maxHeight: "200px" }}
              onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 200) + "px"; }}
              className="w-full bg-transparent border-none outline-none px-4 py-4 text-xl text-foreground placeholder-gray-400/70 font-medium resize-none overflow-y-auto"
            />
            <button 
              type="submit"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-[20px] font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 flex-shrink-0 mt-1"
            >
              Buscar <ArrowRight size={18} className="icon-bounce" />
            </button>
          </div>
        </div>
      </form>

      {searched && isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center"
        >
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold text-lg">Ghosty está procesando tu pregunta...</p>
          <p className="text-gray-400 font-medium text-sm mt-2">Esto puede tardar hasta 30 segundos. Por favor espera ⏳</p>
        </motion.div>
      )}

      {searched && !isLoading && !isComplex && !isIrrelevant && answer && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full bg-white rounded-3xl p-8 border-l-4 border-l-primary shadow-md relative overflow-hidden text-left"
        >
          <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            Respuesta de Ghosty
          </h3>
          <div className="text-gray-700 leading-relaxed mb-6 text-lg prose max-w-none prose-headings:text-foreground prose-headings:font-bold prose-h3:text-2xl prose-h3:mt-4 prose-h3:mb-2 prose-strong:text-foreground prose-strong:font-extrabold prose-ul:list-disc prose-ul:pl-6 prose-li:my-1">
            <ReactMarkdown>{parsedAnswer.mainText}</ReactMarkdown>
          </div>
          
          {parsedAnswer.suggestions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lightbulb size={16} className="text-accent" /> ¿Qué más necesitas saber?
              </h4>
              <div className="flex flex-col gap-2">
                {parsedAnswer.suggestions.map((sug, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => triggerSearch(sug)}
                    className="text-left px-5 py-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 rounded-xl text-foreground font-medium transition-colors flex items-center justify-between group"
                  >
                    <span>{sug}</span>
                    <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-6">
            <button 
              onClick={handleEscalate}
              className="text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 group"
            >
              <Flame size={16} className="group-hover:scale-110 transition-transform" /> ¿No te convence? Escalar al experto
            </button>
            <button 
              onClick={handleReset}
              className="text-sm bg-primary hover:bg-primary-hover text-white border border-primary/20 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover-lift"
            >
              Hacer otra pregunta <ArrowRight size={16} className="icon-bounce" />
            </button>
          </div>
        </motion.div>
      )}

      {searched && !isLoading && isIrrelevant && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden"
        >
          <div className="text-center relative z-10">
            <h3 className="text-3xl font-bold mb-4 text-foreground">Nada que ver</h3>
            <p className="text-gray-500 mb-4 max-w-lg mx-auto text-lg">
              Esta pregunta está fuera de mis dominios. Recuerda que solo respondo sobre veterinaria, nutrición, la operación de Solo Huellas, y temas universitarios de gestión/auditoría del conocimiento.
            </p>
            <button 
              onClick={handleReset}
              className="mt-8 text-sm bg-white hover:bg-gray-50 border border-gray-200 text-foreground px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover-lift mx-auto"
            >
              Volver al buscador
            </button>
          </div>
        </motion.div>
      )}

      {searched && !isLoading && isComplex && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full bg-white rounded-3xl p-10 border-2 border-accent shadow-lg relative overflow-hidden"
        >
          <div className="text-center relative z-10">
            <div className="w-20 h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-6 border border-accent/20">
              <Search size={40} />
            </div>
            {!bengalaSent ? (
              <>
                <h3 className="text-3xl font-bold mb-4 text-foreground">Conocimiento Privado / Complejo</h3>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto text-lg">
                  Ghosty ha detectado que esta duda requiere intervención de un especialista de Solo Huellas.
                </p>
                <button 
                  onClick={handleEscalate}
                  className="bg-accent hover:bg-yellow-600 text-white px-10 py-5 rounded-[20px] font-extrabold text-xl transition-all hover-lift flex items-center gap-3 mx-auto shadow-xl"
                >
                  <Flame size={24} />
                  🚀 LANZAR BENGALA DE AUXILIO
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-green-50 text-green-700 border-2 border-green-300 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto mb-4">
                  ✅ Pregunta enviada al equipo Senior
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 max-w-lg w-full">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Tu pregunta:</p>
                  <p className="text-foreground font-medium">&quot;{query}&quot;</p>
                </div>
                <div className="flex items-center gap-3 text-accent font-bold text-lg mb-2">
                  <div className="animate-spin w-5 h-5 border-3 border-accent border-t-transparent rounded-full"></div>
                  Esperando respuesta del experto...
                </div>
                <p className="text-gray-400 font-medium text-sm">No cierres esta ventana. La respuesta aparecerá aquí automáticamente.</p>
              </div>
            )}
            
            <button 
              onClick={handleReset}
              className="mt-8 text-sm bg-white hover:bg-gray-50 border border-gray-200 text-foreground px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover-lift mx-auto"
            >
              {bengalaSent ? "Dejar de esperar y volver" : "Volver al buscador"}
            </button>
          </div>
        </motion.div>
      )}

      {!searched && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 w-full"
        >
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-8 text-center flex items-center justify-center gap-2">
            <TrendingUp size={18} className="text-primary/50" /> Consultas Operativas Frecuentes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { text: "¿A qué edad se aplica la 1ra vacuna de cachorro?", icon: <Syringe size={20} className="text-primary" /> },
              { text: "¿Qué cubre la pastilla NexGard y cuánto dura?", icon: <Shield size={20} className="text-primary" /> },
              { text: "¿Protocolo de urgencia para torsión gástrica?", icon: <Stethoscope size={20} className="text-primary" /> },
              { text: "¿Cuánto tarda un bulto cerrado en vencerse?", icon: <Package size={20} className="text-primary" /> }
            ].map((tag, idx) => (
              <div 
                key={idx} 
                onClick={() => triggerSearch(tag.text)} 
                className="flex items-center gap-4 p-5 bg-white/40 hover:bg-white border border-white/60 hover:border-primary/20 shadow-sm rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group backdrop-blur-sm"
              >
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {tag.icon}
                </div>
                <span className="text-base font-bold text-foreground/80 group-hover:text-primary transition-colors">
                  {tag.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
