// ═══════════════════════════════════════════════════════════
// AVISOS Y NOTIFICACIONES DEL INICIO
// Editá este archivo para mostrar mensajes a los usuarios en
// el dashboard principal (/inicio). Se publican con el deploy.
//
// type: 'info' | 'success' | 'warning' | 'megaphone'
// active: false oculta el aviso sin borrarlo.
// modules: opcional — si se indica, solo se muestra en esos módulos.
// ═══════════════════════════════════════════════════════════

export type SiteMessageType = 'info' | 'success' | 'warning' | 'megaphone'

export interface SiteMessage {
  id: string
  type: SiteMessageType
  title: string
  body: string
  active: boolean
  modules?: Array<'TERRITORIES' | 'VYMC'>
}

export const SITE_MESSAGES: SiteMessage[] = [
  {
    id: 'bienvenida-unificada',
    type: 'success',
    title: 'Territorios y VYMC ahora viven juntos',
    body: 'Elegí el sistema al que querés entrar desde las tarjetas de arriba. Este es un aviso de ejemplo: editá lib/site-messages.ts para mostrar los tuyos.',
    active: true,
  },
]
