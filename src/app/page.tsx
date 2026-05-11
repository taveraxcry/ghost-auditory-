"use client";

import { useState } from "react";
import { Search, Flame, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function JuniorView() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isComplex, setIsComplex] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearched(true);
    setAnswer("");
    setIsComplex(false);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data.isComplex || data.answer.includes("COMPLEJA") || !res.ok) {
        setIsComplex(true);
      } else {
        setAnswer(data.answer);
      }
    } catch (err) {
      console.error(err);
      setIsComplex(true);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
          El Oráculo Operativo
        </h1>
        <p className="text-xl text-white/60 font-medium">
          Clínica & Pet Shop Solo Huellas
        </p>
      </motion.div>

      <motion.form 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        onSubmit={handleSearch} 
        className="w-full relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative glass-panel rounded-2xl flex items-center p-2 pl-6">
          <Search className="text-white/40" size={24} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. ¿Cómo programar una entrega de última milla?"
            className="w-full bg-transparent border-none outline-none px-4 py-4 text-lg text-white placeholder-white/30"
          />
          <button 
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            Buscar <ArrowRight size={18} />
          </button>
        </div>
      </motion.form>

      {searched && isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full glass-panel rounded-2xl p-8 border border-white/10 text-center"
        >
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">El Oráculo está pensando...</p>
        </motion.div>
      )}

      {searched && !isLoading && !isComplex && answer && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full glass-panel rounded-2xl p-8 border border-green-500/20 relative overflow-hidden text-left"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            Respuesta del Oráculo
          </h3>
          <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{answer}</p>
        </motion.div>
      )}

      {searched && !isLoading && isComplex && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 w-full glass-panel rounded-2xl p-8 border border-accent/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
          <div className="text-center relative z-10">
            <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-4 border border-accent/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <Search size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Conocimiento Complejo / Privado</h3>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              El Oráculo ha detectado que esta duda es compleja o requiere intervención humana. Se ha guardado el registro en Firebase. Dispara una bengala para alertar a la gerencia.
            </p>
            <button className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-xl font-bold transition-all hover-lift flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <Flame size={20} />
              Lanzar Bengala de Auxilio
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
          <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 text-center">Búsquedas Frecuentes Hoy</h4>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Pago Contra Entrega", "Cross-docking Bultos", "Agendamiento Cirugía", "Protocolo Dropshipping"].map((tag) => (
              <span key={tag} onClick={() => {setQuery(tag); setSearched(true);}} className="px-4 py-2 rounded-full glass-panel text-sm text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border border-white/5 hover:border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
