"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Star, Zap } from "lucide-react";

interface Props {
  show: boolean;
  qualityLevel: string;
  gpAmount: number;
  bonusAmount?: number;
  onComplete: () => void;
}

const qualityConfig: Record<string, { icon: any; color: string; label: string }> = {
  basica: { icon: Zap, color: "#F57C00", label: "Respuesta Básica" },
  intermedia: { icon: Coins, color: "#388E3C", label: "Respuesta Intermedia" },
  compleja: { icon: Star, color: "#008080", label: "Respuesta Compleja" },
};

export default function GhostPointsToast({ show, qualityLevel, gpAmount, bonusAmount, onComplete }: Props) {
  const config = qualityConfig[qualityLevel] || qualityConfig.intermedia;
  const Icon = config.icon;

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 flex items-center gap-4"
          style={{ borderLeft: `4px solid ${config.color}` }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
            <Icon size={24} style={{ color: config.color }} />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg flex items-center gap-2">
              +{gpAmount} GP <span style={{ color: config.color }}>{config.label}</span>
            </p>
            {bonusAmount && bonusAmount > 0 ? (
              <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                <Sparkles size={14} className="text-accent" /> +{bonusAmount} GP de bonos incluidos
              </p>
            ) : (
              <p className="text-sm text-gray-500 font-medium">¡Sigue así!</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
