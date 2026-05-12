"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock } from "lucide-react";

export default function LoginView() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      router.push("/auditor");
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white p-10 rounded-3xl relative overflow-hidden shadow-xl border border-gray-100"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 mx-auto mb-6 shadow-sm">
          <Shield size={32} className="text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">Acceso Administrativo</h1>
        <p className="text-center text-gray-500 text-sm mb-8 font-medium">Ingresa tus credenciales para acceder a los paneles de control de Solo Huellas.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Credencial Única (Usuario/Contraseña)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu ID..."
                className={`w-full bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl py-3 pl-12 pr-4 text-foreground font-medium placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
              />
            </div>
            {error && <p className="text-red-500 font-bold text-xs mt-2 text-center">Credenciales incorrectas. Intenta de nuevo.</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold text-lg transition-all hover-lift flex items-center justify-center gap-2 mt-4 shadow-md"
          >
            Ingresar al Sistema <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
