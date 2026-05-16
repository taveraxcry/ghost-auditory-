"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Coins, Clock, Sun, Flame, History, Sparkles, X, TrendingUp, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { getBalance, redeemGP, getGPHistory } from "@/lib/ghostpoints";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

async function generatePDF(data: { name: string; cedula: string; reward: string; cost: number; date: string }) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const d = new Date(data.date);

  doc.setFontSize(22);
  doc.setTextColor(0, 128, 128);
  doc.text('GHOSTPOINTS', 105, 30, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(10, 37, 64);
  doc.text('VALE DE RECOMPENSA', 105, 45, { align: 'center' });

  doc.setDrawColor(0, 128, 128);
  doc.setLineWidth(0.5);
  doc.line(20, 52, 190, 52);

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  const lines = [
    `Nombre: ${data.name}`,
    `Cedula: ${data.cedula}`,
    `Recompensa: ${data.reward}`,
    `Costo: ${data.cost} GP`,
    `Fecha: ${d.toLocaleDateString('es-CO')}`,
    '',
    'Firma del colaborador: ____________________________',
    '',
    'Firma del supervisor:   ____________________________',
  ];

  let y = 68;
  lines.forEach((line) => {
    doc.text(line, 25, y);
    y += 10;
  });

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Ghost Auditory - Solo Huellas', 105, 270, { align: 'center' });
  doc.text('Este vale es valido por 30 dias calendario', 105, 278, { align: 'center' });

  doc.save(`vale_ghostpoints_${data.reward.replace(/\s+/g, '_')}_${d.toISOString().split('T')[0]}.pdf`);
}

export default function GhostPointsWallet({ open, onClose }: Props) {
  const { uid } = useAuth();
  const [balance, setBalance] = useState(0);
  const [freeHours, setFreeHours] = useState(0);
  const [freeDays, setFreeDays] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gpEarnedToday, setGpEarnedToday] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userCedula, setUserCedula] = useState("");

  const refresh = async () => {
    if (!uid) return;
    const data = await getBalance(uid);
    setBalance(data.balance);
    setFreeHours(data.freeHoursAvailable);
    setFreeDays(data.freeDaysAvailable);
    setStreak(data.currentStreak);
    setGpEarnedToday(data.gpEarnedToday);
    const txns = await getGPHistory(uid);
    setHistory(txns);
  };

  useEffect(() => {
    if (open && uid) {
      refresh();
    }
  }, [open, uid]);

  const handleRedeem = async (type: 'free_hour' | 'free_5hours' | 'free_day') => {
    if (!uid) return;
    if (!userName.trim() || !userCedula.trim()) {
      setShowForm(type);
      return;
    }
    setRedeeming(type);
    const result = await redeemGP(uid, type, userName, userCedula);
    setRedeeming(null);
    if (result.success) {
      const msgs = {
        'free_hour': '1 Hora Libre canjeada',
        'free_5hours': 'Paquete 5 Horas canjeado',
        'free_day': '1 Dia Libre canjeado'
      };
      setRedeemMsg(msgs[type]);
      if (result.pdfData) {
        await generatePDF(result.pdfData);
      }
      setShowForm(null);
      refresh();
    } else {
      setRedeemMsg('Saldo insuficiente');
    }
    setTimeout(() => setRedeemMsg(null), 3000);
  };

  const progressPercent = Math.min((balance / 5200) * 100, 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Coins className="text-primary" size={22} /> GhostPoints Wallet
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
                <p className="text-sm font-bold text-gray-500 mb-1">Saldo disponible</p>
                <p className="text-5xl font-extrabold text-foreground">{balance} <span className="text-2xl text-primary font-bold">GP</span></p>
                <div className="mt-4 flex gap-3">
                  <span className="bg-white/80 text-sm font-bold px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-1.5">
                    <Flame size={14} className="text-accent" /> Racha: {streak} dias
                  </span>
                  <span className="bg-white/80 text-sm font-bold px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-primary" /> Hoy: {gpEarnedToday}/300 GP
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" /> Progreso al Dia Libre (5,200 GP)
                </p>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium mt-1 text-right">{balance.toLocaleString()} / 5,200 GP</p>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-500 mb-3">Canjear GhostPoints</p>
                <p className="text-xs text-gray-400 font-medium mb-3">Ingresa tus datos una vez para generar el vale PDF</p>
                {(showForm || (redeemMsg && !redeemMsg.includes('insuficiente'))) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 mb-4">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-foreground font-medium placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                    <input
                      type="text"
                      value={userCedula}
                      onChange={(e) => setUserCedula(e.target.value)}
                      placeholder="Cedula"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-foreground font-medium placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleRedeem('free_hour')}
                    disabled={redeeming === 'free_hour'}
                    className="bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/30 rounded-2xl p-4 text-left transition-all disabled:opacity-60 flex flex-col items-center text-center justify-center"
                  >
                    <Clock size={20} className="text-primary mb-2" />
                    <p className="font-bold text-foreground text-sm">1 Hora</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">250 GP</p>
                    {redeeming === 'free_hour' && <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mt-2" />}
                  </button>
                  <button
                    onClick={() => handleRedeem('free_5hours')}
                    disabled={redeeming === 'free_5hours'}
                    className="bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/30 rounded-2xl p-4 text-left transition-all disabled:opacity-60 flex flex-col items-center text-center justify-center"
                  >
                    <Clock size={20} className="text-accent mb-2" />
                    <p className="font-bold text-foreground text-sm">5 Horas</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">1,100 GP</p>
                    {redeeming === 'free_5hours' && <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full mt-2" />}
                  </button>
                  <button
                    onClick={() => handleRedeem('free_day')}
                    disabled={redeeming === 'free_day'}
                    className="bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary/30 rounded-2xl p-4 text-left transition-all disabled:opacity-60 flex flex-col items-center text-center justify-center"
                  >
                    <Sun size={20} className="text-accent mb-2" />
                    <p className="font-bold text-foreground text-sm">Dia Libre</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">5,200 GP</p>
                    {redeeming === 'free_day' && <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full mt-2" />}
                  </button>
                </div>
                {redeemMsg && (
                  <p className={`text-sm font-bold mt-2 text-center ${redeemMsg.includes('insuficiente') ? 'text-red-500' : 'text-primary'}`}>
                    {redeemMsg}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                  <History size={16} /> Beneficios acumulados
                </p>
                <div className="flex gap-4">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex-1 text-center border border-gray-100">
                    <p className="text-2xl font-extrabold text-foreground">{freeHours}</p>
                    <p className="text-xs text-gray-500 font-medium">Horas libres</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex-1 text-center border border-gray-100">
                    <p className="text-2xl font-extrabold text-foreground">{freeDays}</p>
                    <p className="text-xs text-gray-500 font-medium">Dias libres</p>
                  </div>
                </div>
              </div>

              {history.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-3">Historial reciente</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {history.slice(0, 10).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'earn' ? 'bg-primary/10' : 'bg-red-50'}`}>
                            {tx.type === 'earn' ? (
                              <Coins size={14} className="text-primary" />
                            ) : (
                              <FileText size={14} className="text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground line-clamp-1" title={tx.question || tx.reason}>
                              {tx.question ? `"${tx.question}"` : tx.reason}
                            </p>
                            {tx.qualityLevel && (
                              <p className="text-xs text-gray-400 font-medium capitalize">{tx.qualityLevel}</p>
                            )}
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === 'earn' ? 'text-primary' : 'text-red-500'}`}>
                          {tx.type === 'earn' ? '+' : ''}{tx.totalAwarded || tx.amount} GP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
