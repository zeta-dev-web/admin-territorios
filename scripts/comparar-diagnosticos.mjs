// Compara dos reportes JSON generados por diagnostico-territorios.mjs
// Uso:
//   node scripts/comparar-diagnosticos.mjs <base.json> <nuevo.json>
import fs from 'node:fs'

const [basePath, newPath] = process.argv.slice(2)

if (!basePath || !newPath) {
  console.error('Uso: node scripts/comparar-diagnosticos.mjs <base.json> <nuevo.json>')
  process.exit(1)
}

const base = JSON.parse(fs.readFileSync(basePath, 'utf-8'))
const nuevo = JSON.parse(fs.readFileSync(newPath, 'utf-8'))

let diferencias = 0

function line(label, before, after, expectedChange = false) {
  const changed = before !== after
  if (changed && !expectedChange) diferencias += 1
  const marker = !changed ? '✓' : expectedChange ? '↗' : '⚠️'
  console.log(`${marker} ${label.padEnd(24)} antes=${before}  después=${after}${changed ? '  (cambió)' : ''}`)
}

console.log('═══ COMPARACIÓN DE DIAGNÓSTICOS ═══')
console.log(`Base : ${base.generatedAt}`)
console.log(`Nuevo: ${nuevo.generatedAt}\n`)

console.log('── Totales globales ──')
for (const [key, value] of Object.entries(base.inventory.globalTotals ?? {})) {
  // Solo publishers puede crecer (es la tabla nueva); el resto debe quedar igual
  line(key, value, nuevo.inventory?.globalTotals?.[key] ?? 0, key === 'publishers')
}

console.log('\n── Referencias rotas ──')
for (const [key, value] of Object.entries(base.brokenReferences ?? {})) {
  line(key, value, nuevo.brokenReferences?.[key] ?? 0)
}

const sBase = base.driverMemberMatches?.summary ?? {}
const sNuevo = nuevo.driverMemberMatches?.summary ?? {}
console.log('\n── Coincidencias driver ↔ member ──')
line('totalDrivers', sBase.totalDrivers ?? 0, sNuevo.totalDrivers ?? 0)
line('uniqueMatches', sBase.uniqueMatches ?? 0, sNuevo.uniqueMatches ?? 0)

console.log('')
if (diferencias === 0) {
  console.log('✅ Sin cambios inesperados.')
} else {
  console.log(`⚠️  ${diferencias} diferencia(s) inesperada(s). Revisar antes de continuar.`)
  process.exit(2)
}
