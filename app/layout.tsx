import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://territoriosapp.duckdns.org"),
  title: {
    default: "Territorios App",
    template: "%s | Territorios App",
  },
  description:
    "Sistema de gestión de territorios, grupos, conductores y asignaciones para congregaciones.",
  applicationName: "Territorios App",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Territorios App",
    title: "Territorios App",
    description:
      "Organiza grupos, asignaciones y el avance de los territorios de tu congregación.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Territorios App - Gestión de territorios para congregaciones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Territorios App",
    description:
      "Organiza grupos, asignaciones y el avance de los territorios de tu congregación.",
    images: ["/twitter-image.png"],
  },
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
        {children}
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
