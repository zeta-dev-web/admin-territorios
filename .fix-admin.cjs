const fs = require('fs')
const f = 'components/common/Sidebar.tsx'
let s = fs.readFileSync(f, 'utf-8').replace(/\r\n/g, '\n')

// 1. Quitar Usuarios/Congregaciones del menú principal de territorios
s = s.replace(/ {2}\{ label: 'Usuarios', icon: Shield, href: '\/admin\/usuarios', adminOnly: true \},\n/, '')
s = s.replace(/ {2}\{ label: 'Congregaciones', icon: Home, href: '\/admin\/congregaciones', adminOnly: true \},\n/, '')

// 2. Ícono chevron
if (!s.includes('ChevronDown')) {
  s = s.replace(
    /import \{([^}]*)\} from 'lucide-react'/,
    (m, inner) => `import {${inner.trim().replace(/\s*$/, '')}, ChevronDown } from 'lucide-react'`
  )
}

// 3. Estado del desplegable
s = s.replace(
  "  const [isAdmin, setIsAdmin] = useState(false)",
  "  const [isAdmin, setIsAdmin] = useState(false)\n  const [isAdminSectionOpen, setIsAdminSectionOpen] = useState(false)"
)

// 4. Sección colapsable en el footer, arriba del toggle/logout (solo ADMIN)
s = s.replace(
  `          {/* Footer */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <ThemeToggle />`,
  `          {/* Footer */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsAdminSectionOpen((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span className="flex-1 text-left">Administración</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdminSectionOpen ? 'rotate-180' : ''}`} />
                </button>
                {isAdminSectionOpen && (
                  <ul className="space-y-1 pl-4">
                    <li>
                      <Link href="/admin/usuarios" onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <Shield className="h-4 w-4" />
                        <span>Usuarios</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/congregaciones" onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <Home className="h-4 w-4" />
                        <span>Congregaciones</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </>
            )}
            <ThemeToggle />`
)

fs.writeFileSync(f, s)
console.log('sección Administración agregada al footer')
