"use client";

import { motion } from "framer-motion";
import { BarChart3, AlertTriangle, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuditorView() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (!mounted || isLoading || !isAuthenticated) return null;
  return (
    <div className="max-w-6xl mx-auto px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-primary" /> Radar Operativo Solo Huellas
          </h1>
          <p className="text-white/60 mt-1">Vulnerabilidades por dependencia clínica y logística</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/80">
          Última actualización: Hace 5 min
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-2 text-white/70">
            <BookOpen size={18} />
            <span className="font-medium">Procesos Documentados</span>
          </div>
          <div className="text-4xl font-bold text-white">142</div>
          <div className="text-sm text-green-400 mt-2 font-medium">↑ Reducción del 45% en asimetría de info</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3 mb-2 text-white/70">
            <Users size={18} />
            <span className="font-medium">Factor de Autobús Promedio</span>
          </div>
          <div className="text-4xl font-bold text-white">1.8</div>
          <div className="text-sm text-yellow-400 mt-2 font-medium">Alto Riesgo en Área Clínica</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center gap-3 mb-2 text-white/70 relative z-10">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="font-medium">Monopolios Críticos</span>
          </div>
          <div className="text-4xl font-bold text-red-400 relative z-10">2</div>
          <div className="text-sm text-red-400/80 mt-2 font-medium relative z-10">Requieren intervención urgente</div>
        </motion.div>
      </div>

      {/* Big Data / Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm font-medium mb-1">Tráfico Mensual Base</p>
            <p className="text-2xl font-bold text-white">336 <span className="text-sm font-normal text-white/50">clientes</span></p>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm font-medium mb-1">Ticket Promedio</p>
            <p className="text-2xl font-bold text-white">$20.000 <span className="text-sm font-normal text-white/50">COP</span></p>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm font-medium mb-1">Facturación Mostrador</p>
            <p className="text-2xl font-bold text-white">$6.72M <span className="text-sm font-normal text-white/50">COP/mes</span></p>
          </div>
        </div>
      </div>

      {/* Main Heatmap / Vulnerabilities */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-6">Mapa de Monopolios por Área Operativa</h3>
        
        <div className="space-y-4">
          {[
            { area: "Gestión CMS (WordPress)", expert: "Recepción (Única experta)", concentration: 95, status: "critical" },
            { area: "Configuración CRM / Zoho", expert: "Asesor Externo", concentration: 88, status: "critical" },
            { area: "Logística Última Milla", expert: "Administrador", concentration: 65, status: "warning" },
            { area: "Atención Mostrador Física", expert: "Personal Rotativo (3)", concentration: 20, status: "healthy" },
          ].map((item, i) => (
            <motion.div 
              key={item.area}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`p-5 rounded-xl border flex items-center justify-between ${
                item.status === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                item.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-green-500/5 border-green-500/20'
              }`}
            >
              <div>
                <h4 className="font-bold text-lg text-white mb-1">{item.area}</h4>
                <p className="text-sm text-white/60">Monopolizado por: <span className="text-white/90 font-medium">{item.expert}</span></p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-white/60 mb-2">Dependencia Operativa</div>
                  <div className="w-48 h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.status === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' :
                        item.status === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${item.concentration}%` }}
                    ></div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  item.status === 'critical' ? 'text-red-400' :
                  item.status === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {item.concentration}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
