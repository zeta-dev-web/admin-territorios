import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Territorios App',
    short_name: 'Territorios',
    description:
      'Gestión de territorios, grupos, conductores y asignaciones para congregaciones.',
    start_url: '/territorios',
    display: 'standalone',
    background_color: '#081426',
    theme_color: '#0B1830',
    lang: 'es',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
