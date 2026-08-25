import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Módulos nativos/complejos que deben resolverse en runtime, no empaquetarse
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "xlsx"],

  async redirects() {
    return [
      // ── Compatibilidad rutas viejas → nuevas (paso 6 unificación) ──
      { source: '/dashboard', destination: '/territorios', permanent: false },
      { source: '/dashboard/publishers', destination: '/territorios/publicadores', permanent: false },
      { source: '/dashboard/tutorial', destination: '/territorios/tutorial', permanent: false },
      { source: '/admin/territories', destination: '/territorios/lista', permanent: false },
      { source: '/admin/assignments', destination: '/territorios/asignaciones', permanent: false },
      { source: '/admin/history', destination: '/territorios/historial', permanent: false },
      { source: '/admin/maps', destination: '/territorios/mapas', permanent: false },
      { source: '/admin/users', destination: '/admin/usuarios', permanent: false },
      { source: '/admin/congregations', destination: '/admin/congregaciones', permanent: false },
      { source: '/vymc/weeks', destination: '/vymc/programas', permanent: false },
      { source: '/vymc/weeks/:id', destination: '/vymc/programas/:id', permanent: false },
      { source: '/vymc/publishers', destination: '/vymc/publicadores', permanent: false },
    ]
  },
};

export default nextConfig;
