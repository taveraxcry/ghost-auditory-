"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { getBalance } from "@/lib/ghostpoints";
import { useAuth } from "@/lib/AuthContext";

export default function GhostPointsBadge() {
  const { uid } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!uid) return;
    getBalance(uid).then((data) => setBalance(data.balance));
  }, [uid]);

  if (!uid || balance === null) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 text-sm font-bold"
    >
      <Coins size={14} />
      <span>{balance}</span>
    </motion.div>
  );
}
