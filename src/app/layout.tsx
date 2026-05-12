import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Navigation from "./Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ghost Auditory | Solo Huellas",
  description: "Sistema de Gestión de Conocimiento Operativo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground`}>
        <AuthProvider>
          <Navigation />
          <main className="pt-28 min-h-screen pb-12">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
