"use client";

import { BarChart3, AlertTriangle, Users, BookOpen, Database, Plus, Trash2, FileText, CheckCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function AuditorView() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState({
    total: 0,
    complex: 0,
    pending: 0,
    resolvedAuto: 0,
    irrelevant: 0,
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("relevant");
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbSaving, setKbSaving] = useState(false);
  const [kbSuccess, setKbSuccess] = useState(false);
  const [kbOpen, setKbOpen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    let unsubscribe: () => void;
    
    const subscribeMetrics = () => {
      try {
        if (!db) return;
        const q = query(collection(db, "audits"), orderBy("created_at", "desc"), limit(20));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          
          let complexCount = 0;
          let pendingCount = 0;
          let resolvedAutoCount = 0;
          let irrelevantCount = 0;

          docs.forEach((doc: any) => {
            if (doc.status === "irrelevant") {
              irrelevantCount++;
            } else {
              if (doc.is_complex) complexCount++;
              if (doc.status === "pending") pendingCount++;
              if (!doc.is_complex) resolvedAutoCount++;
            }
          });

          setMetrics({
            total: docs.length,
            complex: complexCount,
            pending: pendingCount,
            resolvedAuto: resolvedAutoCount,
            irrelevant: irrelevantCount
          });
          
          setRecentAudits(docs);
        });
      } catch (err) {
        console.error("Error subscribing to metrics", err);
      }
    };

    if (isAuthenticated) {
      subscribeMetrics();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  // Knowledge Base real-time listener
  useEffect(() => {
    if (!isAuthenticated || !db) return;
    const unsubscribeKb = onSnapshot(collection(db, "knowledge_base"), (snapshot) => {
      setKbEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribeKb();
  }, [isAuthenticated]);

  const handleAddKbEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) return;
    setKbSaving(true);
    try {
      await addDoc(collection(db, "knowledge_base"), {
        title: kbTitle.trim(),
        content: kbContent.trim(),
        created_at: new Date().toISOString()
      });
      setKbTitle("");
      setKbContent("");
      setKbSuccess(true);
      setTimeout(() => setKbSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving KB entry", err);
    }
    setKbSaving(false);
  };

  const handleDeleteKbEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, "knowledge_base", id));
    } catch (err) {
      console.error("Error deleting KB entry", err);
    }
  };

  if (!mounted || isLoading || !isAuthenticated) return null;
  return (
    <div className="max-w-6xl mx-auto px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="text-primary" /> Radar Operativo de Ghost Auditory
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Vulnerabilidades por dependencia clínica y logística</p>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-2 text-sm text-gray-500 font-medium">
          Última actualización: Hace 5 min
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border-l-8 border-l-primary shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <BookOpen size={18} />
            <span className="font-bold truncate">Consultas Totales</span>
          </div>
          <div className="text-4xl font-extrabold text-foreground">{metrics.total}</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border-l-8 border-l-[#388E3C] shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Users size={18} />
            <span className="font-bold truncate">Resolución IA</span>
          </div>
          <div className="text-4xl font-extrabold text-[#388E3C]">
            {metrics.total > 0 ? Math.round((metrics.resolvedAuto / metrics.total) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-l-8 border-l-[#D32F2F] shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <AlertTriangle size={18} className="text-[#D32F2F]" />
            <span className="font-bold truncate">Dudas Escaladas</span>
          </div>
          <div className="text-4xl font-extrabold text-[#D32F2F]">{metrics.complex}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-l-8 border-l-gray-300 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <AlertTriangle size={18} className="text-gray-400" />
            <span className="font-bold truncate">Nada que ver</span>
          </div>
          <div className="text-4xl font-extrabold text-gray-400">{metrics.irrelevant}</div>
        </div>
      </div>

      {/* Big Data / Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#E5A93C]/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#F57C00] text-sm font-bold mb-1">Pendientes de Revisión</p>
            <p className="text-2xl font-extrabold text-foreground">{metrics.pending} <span className="text-sm font-medium text-gray-400">en bandeja</span></p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-primary/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-primary text-sm font-bold mb-1">Resueltas Automáticamente</p>
            <p className="text-2xl font-extrabold text-foreground">{metrics.resolvedAuto} <span className="text-sm font-medium text-gray-400">por Ghosty</span></p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold mb-1">Costo Ahorrado Estimado</p>
            <p className="text-2xl font-extrabold text-foreground">${metrics.resolvedAuto * 1500} <span className="text-sm font-medium text-gray-400">COP</span></p>
          </div>
        </div>
      </div>

      {/* Knowledge Base Manager */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setKbOpen(!kbOpen)}
          className="w-full flex items-center justify-between p-8 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Database size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-foreground">Base de Conocimiento Personalizada</h3>
              <p className="text-gray-500 text-sm font-medium">Agrega información de cualquier empresa o área — Ghosty la usará al responder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full border border-primary/20">{kbEntries.length} entradas</span>
            <ChevronDown size={20} className={`text-gray-400 transition-transform ${kbOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {kbOpen && (
            <div className="overflow-hidden">
              <div className="px-8 pb-8 space-y-6">
                {/* Add new entry form */}
                <form onSubmit={handleAddKbEntry} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <Plus size={18} className="text-primary" /> Agregar Nueva Entrada de Conocimiento
                  </h4>
                  <input
                    type="text"
                    value={kbTitle}
                    onChange={(e) => setKbTitle(e.target.value)}
                    placeholder='Título (Ej: "Tarifas de Grooming 2025" o "FAQ Recursos Humanos")'
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-foreground font-medium placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <textarea
                    value={kbContent}
                    onChange={(e) => setKbContent(e.target.value)}
                    placeholder="Pega aquí la información completa: precios, procedimientos, políticas, FAQs, etc. Ghosty leerá TODO esto antes de responder."
                    rows={6}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-foreground font-medium placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                  <div className="flex items-center justify-between">
                    {kbSuccess && (
                      <span className="text-[#388E3C] font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 size={18} /> ¡Entrada guardada! Ghosty ya tiene acceso.
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={kbSaving}
                      className="ml-auto bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      {kbSaving ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                      ) : (
                        <><Plus size={18} /> Guardar en Base de Conocimiento</>
                      )}
                    </button>
                  </div>
                </form>

                {/* Existing entries list */}
                {kbEntries.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-500 text-sm uppercase tracking-wider">Entradas Activas ({kbEntries.length})</h4>
                    {kbEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-primary/20 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 flex-shrink-0 mt-0.5">
                            <FileText size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-foreground">{entry.title}</h5>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{entry.content}</p>
                            <span className="text-xs text-gray-300 font-medium mt-1 block">{new Date(entry.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteKbEntry(entry.id)}
                          className="ml-4 p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                          title="Eliminar entrada"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 font-medium">
                    <Database size={40} className="mx-auto mb-3 opacity-30" />
                    Aún no hay entradas. Agrega información y Ghosty la aprenderá al instante.
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Main Interactions Table */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h3 className="text-2xl font-bold text-foreground">Últimas Interacciones de Auditoría</h3>
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab("relevant")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "relevant" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-foreground"
              }`}
            >
              Relevantes
            </button>
            <button
              onClick={() => setActiveTab("irrelevant")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "irrelevant" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-foreground"
              }`}
            >
              Nada que ver
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {recentAudits
            .filter(item => activeTab === "relevant" ? item.status !== "irrelevant" : item.status === "irrelevant")
            .length > 0 ? recentAudits
            .filter(item => activeTab === "relevant" ? item.status !== "irrelevant" : item.status === "irrelevant")
            .map((item, i) => (
            <div 
              key={item.id}
              className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
                item.status === 'irrelevant' ? 'bg-gray-50 border-gray-200' :
                item.is_complex ? 'bg-[#FFFDF9] border-[#E5A93C]/30' : 'bg-white border-primary/20'
              }`}
            >
              <div className="flex-1">
                <h4 className="font-bold text-xl text-foreground mb-2">"{item.query}"</h4>
                <p className="text-sm font-bold text-gray-500">
                  {item.status === 'irrelevant' ? "🚫 Nada que ver (Fuera de dominio)" :
                   item.is_complex ? "⚠️ Escalado al Experto (Falta de conocimiento local)" : "✅ Automatización Exitosa"}
                </p>
                {item.answer && item.status !== 'irrelevant' && (
                  <p className="text-md text-gray-600 mt-3 line-clamp-3 leading-relaxed bg-gray-50 p-3 rounded-xl">
                    {item.is_complex && <span className="text-xs font-bold text-primary mr-2">Respuesta del Senior:</span>}
                    {item.answer}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-3 ml-6">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider ${
                  item.status === 'irrelevant' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                  item.status === 'pending' ? 'bg-yellow-100 text-[#F57C00] border-yellow-200' :
                  item.status === 'resolved' ? 'bg-[#388E3C]/10 text-[#388E3C] border-[#388E3C]/20' :
                  'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {item.status === 'irrelevant' ? 'NADA QUE VER' : item.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 font-medium">{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-16 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No hay interacciones registradas aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
