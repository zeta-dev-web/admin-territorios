// ⛔ DEPRECADO tras el paso 5 (retiro de Member/Driver).
// Este script consulta tablas que ya no existen. Se conserva como registro histórico.
// Ver docs/unificacion/migracion-retiro-legacy-v1.sql
// ═══════════════════════════════════════════════════════════════════
// DIAGNÓSTICO DE SOLO LECTURA — Unificación Territorios → VYMC
// ═══════════════════════════════════════════════════════════════════
//
// Fase 0 del PLAN_UNIFICACION_TERRITORIOS_VYMC.md
//
// Este script NO modifica datos. Ejecuta únicamente consultas SELECT
// y abre la transacción en modo READ ONLY como garantía adicional.
//
// Uso:
//   node scripts/diagnostico-territorios.mjs
//   (lee DATABASE_URL desde el .env del proyecto)
//
// Salida:
//   - Reporte legible por consola
//   - scripts/diagnostics-output/diagnostico-<fecha>.txt
//   - scripts/diagnostics-output/diagnostico-<fecha>.json
//
import pg from 'pg'
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

config()

const { Client } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL no encontrada en las variables de entorno.')
  process.exit(1)
}

const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'diagnostics-output')
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const timestamp = new Date()
const stamp = timestamp.toISOString().replace(/[:.]/g, '-').slice(0, 19)

// ── Utilidades ──────────────────────────────────────────────────────

/** Normaliza nombres para comparar: minúsculas, sin acentos, espacios colapsados. */
function normalizeName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function maskConnectionString(url) {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`
  } catch {
    return '(connection string no parseable)'
  }
}

const report = {
  generatedAt: timestamp.toISOString(),
  database: maskConnectionString(connectionString),
  readOnly: true,
  inventory: { perTenant: [], globalTotals: {}, nullTenantRows: {} },
  brokenReferences: {},
  duplicateNames: { members: [], drivers: [], emptyNames: {} },
  nameStructure: { members: {}, drivers: {}, examples: {} },
  driverMemberMatches: {
    uniqueMatches: [],
    ambiguousDrivers: [],
    unmatchedDrivers: [],
    summary: {},
  },
  groups: {},
  errors: [],
}

let lines = []
function out(text = '') {
  lines.push(text)
  console.log(text)
}

async function safeQuery(client, label, sql) {
  try {
    const result = await client.query(sql)
    return result.rows
  } catch (error) {
    report.errors.push({ label, message: error.message })
    out(`   ⚠️  Error en "${label}": ${error.message}`)
    return []
  }
}

// ── 1. Inventario ───────────────────────────────────────────────────

async function inventoryPerTenant(client) {
  out('\n═══ 1. INVENTARIO POR CONGREGACIÓN (tenant) ═══')

  const tenants = await safeQuery(client, 'tenants', `
    SELECT id, name FROM "Tenant" ORDER BY name`)

  const TABLES = [
    ['users', '"User"'],
    ['groups', '"Group"'],
    ['members', '"Member"'],
    ['drivers', '"Driver"'],
    ['territories', '"Territory"'],
    ['blocks', '"Block"'],
    ['assignments', '"Assignment"'],
    ['dailyRecords', '"DailyRecord"'],
    ['personalAssignments', '"PersonalAssignment"'],
    ['territoryMaps', '"TerritoryMap"'],
    ['apiKeys', '"ApiKey"'],
  ]

  // Claves siempre como string para evitar sorpresas de coerción
  const totalsByTenant = new Map()
  totalsByTenant.set('__null__', { tenantName: '(SIN TENANT)' })
  for (const t of tenants) {
    totalsByTenant.set(String(t.id), { tenantName: t.name })
  }

  const grandTotals = {}

  for (const [label, table] of TABLES) {
    const rows = await safeQuery(client, `count ${label}`, `
      SELECT "tenantId", COUNT(*)::int AS n FROM ${table} GROUP BY "tenantId"`)
    let total = 0
    for (const row of rows) {
      const key = row.tenantId === null ? '__null__' : String(row.tenantId)
      if (!totalsByTenant.has(key)) {
        totalsByTenant.set(key, { tenantName: `(TENANT INEXISTENTE: ${row.tenantId})` })
      }
      const entry = totalsByTenant.get(key)
      entry[label] = (entry[label] ?? 0) + row.n
      total += row.n
    }
    grandTotals[label] = total
  }

  // Filas con tenantId NULL por tabla
  out('\n   Filas con tenantId NULL:')
  for (const [label, table] of TABLES) {
    const rows = await safeQuery(client, `null tenant ${label}`, `
      SELECT COUNT(*)::int AS n FROM ${table} WHERE "tenantId" IS NULL`)
    const n = rows[0]?.n ?? 0
    report.inventory.nullTenantRows[label] = n
    out(`   ${n > 0 ? '⚠️' : '✓'} ${label}: ${n}`)
  }

  report.inventory.perTenant = [...totalsByTenant.entries()].map(([key, value]) => ({
    key,
    ...value,
  }))
  report.inventory.globalTotals = grandTotals

  out('')
  for (const [key, t] of totalsByTenant) {
    if (Object.keys(t).length === 1 && key === '__null__') continue
    const counts = TABLES.map(([label]) => `${label}=${t[label] ?? 0}`).join('  ')
    out(`   📍 ${t.tenantName}`)
    out(`      ${counts}`)
  }
  out(`\n   TOTALES GLOBALES: ${TABLES.map(([l]) => `${l}=${grandTotals[l]}`).join('  ')}`)
}

// ── 2. Referencias rotas ────────────────────────────────────────────

async function brokenReferences(client) {
  out('\n═══ 2. REFERENCIAS ROTAS ═══')

  const checks = [
    ['members sin grupo existente',
      `SELECT COUNT(*)::int AS n FROM "Member" m LEFT JOIN "Group" g ON g.id = m."groupId" WHERE g.id IS NULL`],
    ['drivers sin grupo existente',
      `SELECT COUNT(*)::int AS n FROM "Driver" d LEFT JOIN "Group" g ON g.id = d."groupId" WHERE g.id IS NULL`],
    ['territorios sin grupo existente',
      `SELECT COUNT(*)::int AS n FROM "Territory" t LEFT JOIN "Group" g ON g.id = t."groupId" WHERE g.id IS NULL`],
    ['asignaciones sin conductor existente',
      `SELECT COUNT(*)::int AS n FROM "Assignment" a LEFT JOIN "Driver" d ON d.id = a."driverId" WHERE d.id IS NULL`],
    ['asignaciones sin territorio existente',
      `SELECT COUNT(*)::int AS n FROM "Assignment" a LEFT JOIN "Territory" t ON t.id = a."territoryId" WHERE t.id IS NULL`],
    ['registros diarios sin asignación existente',
      `SELECT COUNT(*)::int AS n FROM "DailyRecord" dr LEFT JOIN "Assignment" a ON a.id = dr."assignmentId" WHERE a.id IS NULL`],
    ['registros diarios sin bloque existente',
      `SELECT COUNT(*)::int AS n FROM "DailyRecord" dr LEFT JOIN "Block" b ON b.id = dr."blockId" WHERE b.id IS NULL`],
    ['registros diarios sin conductor existente',
      `SELECT COUNT(*)::int AS n FROM "DailyRecord" dr LEFT JOIN "Driver" d ON d.id = dr."driverId" WHERE d.id IS NULL`],
    ['asignaciones personales sin miembro existente',
      `SELECT COUNT(*)::int AS n FROM "PersonalAssignment" pa LEFT JOIN "Member" m ON m.id = pa."memberId" WHERE m.id IS NULL`],
    ['asignaciones personales sin territorio existente',
      `SELECT COUNT(*)::int AS n FROM "PersonalAssignment" pa LEFT JOIN "Territory" t ON t.id = pa."territoryId" WHERE t.id IS NULL`],
    ['bloques sin territorio existente',
      `SELECT COUNT(*)::int AS n FROM "Block" b LEFT JOIN "Territory" t ON t.id = b."territoryId" WHERE t.id IS NULL`],
  ]

  for (const [label, sql] of checks) {
    const rows = await safeQuery(client, label, sql)
    const n = rows[0]?.n ?? 0
    report.brokenReferences[label] = n
    out(`   ${n > 0 ? '⚠️' : '✓'} ${label}: ${n}`)
  }
}

// ── 3. Duplicados y vacíos ──────────────────────────────────────────

async function duplicateNames(client) {
  out('\n═══ 3. NOMBRES DUPLICADOS Y VACÍOS ═══')

  for (const [label, table] of [['members', '"Member"'], ['drivers', '"Driver"']]) {
    const emptyRows = await safeQuery(client, `empty names ${label}`, `
      SELECT COUNT(*)::int AS n FROM ${table} WHERE TRIM(name) = '' OR name IS NULL`)
    const emptyCount = emptyRows[0]?.n ?? 0
    report.duplicateNames.emptyNames[label] = emptyCount
    out(`   ${emptyCount > 0 ? '⚠️' : '✓'} nombres vacíos en ${label}: ${emptyCount}`)

    const dupes = await safeQuery(client, `dupes ${label}`, `
      SELECT m."tenantId", m."groupId", LOWER(TRIM(m.name)) AS norm_name,
             COUNT(*)::int AS cantidad,
             STRING_AGG(DISTINCT COALESCE(t.name, '(sin tenant)'), ' | ') AS tenants,
             STRING_AGG(m.name, ' | ') AS nombres_originales,
             STRING_AGG(m.id, ',') AS ids
      FROM ${table} m
      LEFT JOIN "Tenant" t ON t.id = m."tenantId"
      GROUP BY m."tenantId", m."groupId", LOWER(TRIM(m.name))
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
      LIMIT 100`)
    report.duplicateNames[label] = dupes
    out(`   ${dupes.length > 0 ? '⚠️' : '✓'} nombres duplicados en ${label} (misma congregación + grupo): ${dupes.length}${dupes.length >= 100 ? '+' : ''}`)
    for (const d of dupes.slice(0, 15)) {
      out(`      • "${d.nombres_originales}" ×${d.cantidad} en ${d.tenants || '?'} / grupo ${String(d.groupId).slice(0, 12)}…`)
    }
  }
}

// ── 4. Estructura de nombres (para decidir regla de split) ─────────

async function nameStructure(client) {
  out('\n═══ 4. ESTRUCTURA DE NOMBRES (para decidir cómo dividir nombre/apellido) ═══')

  for (const [label, table] of [['members', '"Member"'], ['drivers', '"Driver"']]) {
    const rows = await safeQuery(client, `name words ${label}`, `
      SELECT TRIM(name) AS nombre FROM ${table} WHERE TRIM(COALESCE(name, '')) <> ''`)
    const buckets = { 1: 0, 2: 0, 3: 0, '4+': 0 }
    const examples = { 1: [], 2: [], 3: [], '4+': [] }
    for (const row of rows) {
      const words = String(row.nombre).split(/\s+/).length
      const bucket = words === 1 ? '1' : words === 2 ? '2' : words === 3 ? '3' : '4+'
      buckets[bucket] += 1
      if (examples[bucket].length < 10) examples[bucket].push(row.nombre)
    }
    report.nameStructure[label] = buckets
    report.nameStructure.examples[label] = examples
    const total = Object.values(buckets).reduce((a, b) => a + b, 0)
    out(`\n   ${label.toUpperCase()} (${total} nombres):`)
    for (const bucket of ['1', '2', '3', '4+']) {
      const pct = total > 0 ? Math.round((buckets[bucket] / total) * 100) : 0
      out(`      ${bucket} palabra(s): ${String(buckets[bucket]).padStart(6)}  (${pct}%)  ej: ${examples[bucket].slice(0, 4).map((e) => `"${e}"`).join(', ') || '—'}`)
    }
  }

  out('\n   ✅ Regla aprobada para dividir nombres:')
  out('      ÚLTIMA palabra = apellido  → "Juan Carlos Beltrán" = Juan Carlos | Beltrán')
  out('      Una sola palabra           → firstName = nombre completo, lastName = ""')
}

// ── 5. Coincidencias Driver ↔ Member (JS puro, sin funciones SQL) ──

async function driverMemberMatches(client) {
  out('\n═══ 5. COINCIDENCIAS DRIVER ↔ MEMBER (vista previa Fase 3) ═══')
  out('   Normalización: minúsculas + sin acentos + espacios colapsados.')
  out('   Coincidencia buscada por: congregación + grupo + nombre normalizado.\n')

  const drivers = await safeQuery(client, 'all drivers', `
    SELECT id, name, "groupId", "tenantId" FROM "Driver"`)
  const members = await safeQuery(client, 'all members', `
    SELECT id, name, "groupId", "tenantId" FROM "Member"`)

  if (drivers.length === 0) {
    out('   No hay conductores registrados.')
    report.driverMemberMatches.summary = {
      totalDrivers: 0, uniqueMatches: 0, ambiguousDrivers: 0, unmatchedDrivers: 0,
    }
    return
  }

  // Índice de miembros por tenant+grupo+nombre normalizado
  const memberIndex = new Map()
  for (const member of members) {
    const norm = normalizeName(member.name)
    if (!norm) continue
    const key = `${String(member.tenantId)}::${String(member.groupId)}::${norm}`
    if (!memberIndex.has(key)) memberIndex.set(key, [])
    memberIndex.get(key).push(member)
  }

  const uniqueMatches = []
  const ambiguousDrivers = []
  const unmatchedDrivers = []

  for (const driver of drivers) {
    const norm = normalizeName(driver.name)
    const key = `${String(driver.tenantId)}::${String(driver.groupId)}::${norm}`
    const candidates = norm ? (memberIndex.get(key) ?? []) : []

    const entry = {
      driver_id: driver.id,
      driver_name: driver.name,
      groupId: driver.groupId,
      tenantId: driver.tenantId,
      coincidencias: candidates.length,
      member_ids: candidates.map((m) => m.id),
    }

    if (candidates.length === 1) uniqueMatches.push(entry)
    else if (candidates.length > 1) ambiguousDrivers.push(entry)
    else unmatchedDrivers.push(entry)
  }

  report.driverMemberMatches.uniqueMatches = uniqueMatches.slice(0, 500)
  report.driverMemberMatches.ambiguousDrivers = ambiguousDrivers.slice(0, 200)
  report.driverMemberMatches.unmatchedDrivers = unmatchedDrivers.slice(0, 200)
  report.driverMemberMatches.summary = {
    totalDrivers: drivers.length,
    uniqueMatches: uniqueMatches.length,
    ambiguousDrivers: ambiguousDrivers.length,
    unmatchedDrivers: unmatchedDrivers.length,
  }

  const s = report.driverMemberMatches.summary
  out(`   Conductores totales:            ${s.totalDrivers}`)
  out(`   ✓ Coincidencia única:           ${s.uniqueMatches}  → migrables automáticamente`)
  out(`   ⚠️  Coincidencias ambiguas:      ${s.ambiguousDrivers}  → requieren revisión manual`)
  out(`   ✗ Sin coincidencia con Member:  ${s.unmatchedDrivers}  → se creará publicador nuevo`)

  for (const a of ambiguousDrivers.slice(0, 15)) {
    out(`      ⚠️  ambiguo: "${a.driver_name}" (grupo ${String(a.groupId).slice(0, 12)}…, ${a.coincidencias} miembros con ese nombre)`)
  }
  for (const u of unmatchedDrivers.slice(0, 15)) {
    out(`      ✗ sin match: "${u.driver_name}" (grupo ${String(u.groupId).slice(0, 12)}…)`)
  }
}

// ── 6. Grupos ───────────────────────────────────────────────────────

async function groupStats(client) {
  out('\n═══ 6. GRUPOS ═══')
  const rows = await safeQuery(client, 'group stats', `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "tenantId" IS NULL)::int AS sin_tenant,
      COUNT(*) FILTER (WHERE TRIM(COALESCE(superintendent, '')) <> '')::int AS con_superintendent,
      COUNT(*) FILTER (WHERE TRIM(COALESCE(auxiliary, '')) <> '')::int AS con_auxiliary
    FROM "Group"`)
  const g = rows[0] ?? {}
  report.groups = {
    total: g.total ?? 0,
    withoutTenant: g.sin_tenant ?? 0,
    superintendentPopulated: g.con_superintendent ?? 0,
    auxiliaryPopulated: g.con_auxiliary ?? 0,
  }
  out(`   Total grupos:                    ${report.groups.total}`)
  out(`   ${report.groups.withoutTenant > 0 ? '⚠️' : '✓'} Grupos sin tenant:              ${report.groups.withoutTenant}`)
  out(`   • Con superintendente (texto):   ${report.groups.superintendentPopulated}  → relación futura con Publisher`)
  out(`   • Con auxiliar (texto):          ${report.groups.auxiliaryPopulated}  → relación futura con Publisher`)
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  out('╔══════════════════════════════════════════════════════╗')
  out('║   DIAGNÓSTICO TERRITORIOS — SOLO LECTURA (FASE 0)   ║')
  out('╚══════════════════════════════════════════════════════╝')
  out(`\n📅 ${timestamp.toLocaleString()}`)
  out(`🔗 Base: ${report.database}`)
  out('🔒 Modo: transacción READ ONLY — este script no modifica datos.')

  const client = new Client({ connectionString })
  await client.connect()

  try {
    // Garantía de solo lectura a nivel de base de datos
    await client.query('BEGIN TRANSACTION READ ONLY')
    await client.query("SET LOCAL statement_timeout = '60s'")

    await inventoryPerTenant(client)
    await brokenReferences(client)
    await duplicateNames(client)
    await nameStructure(client)
    await driverMemberMatches(client)
    await groupStats(client)

    await client.query('ROLLBACK') // cierra la transacción de solo lectura

    out('\n═══ RESUMEN GO / NO-GO PRELIMINAR ═══')
    const nullTotal = Object.values(report.inventory.nullTenantRows).reduce((a, b) => a + b, 0)
    const brokenTotal = Object.values(report.brokenReferences).reduce((a, b) => a + b, 0)
    const s = report.driverMemberMatches.summary
    out(`   Filas sin tenant:                 ${nullTotal === 0 ? '✓ 0' : `⚠️ ${nullTotal}  (requieren asignación de congregación)`}`)
    out(`   Referencias rotas:                ${brokenTotal === 0 ? '✓ 0' : `⚠️ ${brokenTotal}`}`)
    out(`   Ambiguos driver↔member:           ${s.ambiguousDrivers === 0 ? '✓ 0' : `⚠️ ${s.ambiguousDrivers} (resolver antes de migrar)`}`)
    out(`   Conductores sin miembro asociado: ${s.unmatchedDrivers === 0 ? '✓ 0' : `ℹ️  ${s.unmatchedDrivers} (se crearán como publicadores nuevos)`}`)
    out(report.errors.length === 0
      ? '\n✅ Diagnóstico completado sin errores de consulta.'
      : `\n⚠️  Completado con ${report.errors.length} errores de consulta (ver JSON).`)

    // Guardar salidas
    const txtPath = path.join(OUTPUT_DIR, `diagnostico-${stamp}.txt`)
    const jsonPath = path.join(OUTPUT_DIR, `diagnostico-${stamp}.json`)
    fs.writeFileSync(txtPath, lines.join('\n'), 'utf-8')
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8')
    out('\n📄 Reporte guardado en:')
    out(`   ${txtPath}`)
    out(`   ${jsonPath}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error.message)
  process.exit(1)
})
