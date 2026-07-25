import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { TermsGuard } from "@/components/auth/TermsGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión de Territorios",
  description: "Sistema de gestión de territorios y asignaciones",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <TermsGuard>
          {children}
        </TermsGuard>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
