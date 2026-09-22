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
    title: '¡Ahora agregamos vymc al sistema!',
    body: 'Elegí el sistema al que querés entrar.',
    active: false,
  },
  {
    id: 'filtro-no-asignados',
    type: 'megaphone',
    title: '¡Nuevo! Territorios no asignados por periodo',
    body: 'En Resumen y en la lista de Territorios ahora podés filtrar qué territorios no se asignaron hace 1, 3 o 6 meses, en un periodo específico o nunca. También podés preguntarle al copiloto.',
    active: true,
  },
]
