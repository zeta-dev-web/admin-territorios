// ═══════════════════════════════════════════════════════════════════
// BACKFILL MEMBER/DRIVER → PUBLISHER — Fases 2 y 3 del plan
// ═══════════════════════════════════════════════════════════════════
//
// Requisitos previos:
//   1. Haber ejecutado docs/unificacion/migracion-aditiva-v1.sql
//      (crea "Publisher", "_MigracionMemberAPublisher",
//       "_MigracionDriverAPublisher" y las columnas publisherId).
//   2. Respaldo creado y restauración ensayada.
//
// Uso:
//   node scripts/backfill-publishers.mjs                → SIMULACIÓN (no escribe)
//   node scripts/backfill-publishers.mjs --ejecutar     → aplica cambios
//   node scripts/backfill-publishers.mjs --ejecutar --tenant=<id>  → solo una congregación
//
// Propiedades:
//   - REANUDABLE: los pasos ya registrados en las tablas de
//     correspondencias se omiten; repetir nunca duplica.
//   - POR LOTES: transacciones cortas por chunk de miembros/conductores.
//   - NO resuelve ambigüedades: los conductores con más de un miembro
//     candidato quedan sin migrar y se listan para revisión manual.
//   - Regla de nombres: ÚLTIMA palabra = lastName, resto = firstName.
//
import pg from 'pg'
import { config } from 'dotenv'
import crypto from 'node:crypto'

config()

const { Client } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL no encontrada.')
  process.exit(1)
}

const args = process.argv.slice(2)
const EJECUTAR = args.includes('--ejecutar')
const tenantFilter = args.find((a) => a.startsWith('--tenant='))?.split('=')[1] ?? null

const BATCH_SIZE = 200

function normalizeName(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Regla aprobada: última palabra = apellido; una sola palabra → lastName "". */
function splitName(fullName) {
  const trimmed = String(fullName ?? '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return { firstName: '', lastName: '' }
  const words = trimmed.split(' ')
  if (words.length === 1) return { firstName: words[0], lastName: '' }
  return {
    firstName: words.slice(0, -1).join(' '),
    lastName: words[words.length - 1],
  }
}

const newId = () => crypto.randomUUID()

let skippedAmbiguous = []

async function tableExists(client, name) {
  const rows = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'`,
    [name]
  )
  return rows.rowCount > 0
}

async function requireSchema(client) {
  for (const table of ['Publisher', '_MigracionMemberAPublisher', '_MigracionDriverAPublisher']) {
    if (!(await tableExists(client, table))) {
      console.error(`❌ Falta la tabla "${table}". Ejecutá primero docs/unificacion/migracion-aditiva-v1.sql`)
      process.exit(1)
    }
  }
}

// ── Fase 2: Member → Publisher ──────────────────────────────────────

async function migrateMembers(client, dryRun) {
  const filterSql = tenantFilter ? `AND m."tenantId" = $1` : ''
  const params = tenantFilter ? [tenantFilter] : []

  const pending = await client.query(
    `SELECT m.id, m.name, m."groupId", m."tenantId"
     FROM "Member" m
     LEFT JOIN "_MigracionMemberAPublisher" x ON x."memberId" = m.id
     WHERE x."memberId" IS NULL ${filterSql}
     ORDER BY m.id`
  , params)

  console.log(`\n── FASE 2 · Members pendientes de migrar: ${pending.rowCount}`)

  let created = 0
  for (let i = 0; i < pending.rowCount; i += BATCH_SIZE) {
    const batch = pending.rows.slice(i, i + BATCH_SIZE)
    if (!dryRun) {
      await client.query('BEGIN')
      try {
        for (const member of batch) {
          const { firstName, lastName } = splitName(member.name)
          const publisherId = newId()
          await client.query(
            `INSERT INTO "Publisher" (id, "firstName", "lastName", "isConductor", "groupId", "tenantId")
             VALUES ($1, $2, $3, false, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [publisherId, firstName || member.name.trim(), lastName, member.groupId, member.tenantId]
          )
          await client.query(
            `INSERT INTO "_MigracionMemberAPublisher" ("memberId", "publisherId")
             VALUES ($1, $2) ON CONFLICT ("memberId") DO NOTHING`,
            [member.id, publisherId]
          )
          created += 1
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    } else {
      created += batch.length
    }
  }

  console.log(`   Publicadores creados desde Member: ${created}`)
  return created
}

// ── Fase 3: Driver → isConductor ────────────────────────────────────

async function migrateDrivers(client, dryRun) {
  const filterSql = tenantFilter ? `AND d."tenantId" = $1` : ''
  const params = tenantFilter ? [tenantFilter] : []

  const drivers = await client.query(
    `SELECT d.id, d.name, d."groupId", d."tenantId"
     FROM "Driver" d
     LEFT JOIN "_MigracionDriverAPublisher" x ON x."driverId" = d.id
     WHERE x."driverId" IS NULL ${filterSql}
     ORDER BY d.id`
  , params)

  console.log(`\n── FASE 3 · Conductores pendientes: ${drivers.rowCount}`)

  // Índice memberId → publicador, para vincular conductores.
  // En simulación la tabla de correspondencias aún no tiene filas:
  // se indexa directamente desde "Member" para que el conteo sea realista.
  let memberRows
  if (dryRun) {
    const raw = await client.query(
      `SELECT id, name, "groupId", "tenantId" FROM "Member"`
    )
    memberRows = raw.rows.map((row) => ({
      member_name: row.name,
      groupId: row.groupId,
      tenantId: row.tenantId,
    }))
  } else {
    const mapped = await client.query(
      `SELECT x."memberId", x."publisherId",
              m.name AS member_name, m."groupId", m."tenantId"
       FROM "_MigracionMemberAPublisher" x
       JOIN "Member" m ON m.id = x."memberId"
       JOIN "Publisher" p ON p.id = x."publisherId"`
    )
    memberRows = mapped.rows
  }

  const byKey = new Map()
  for (const row of memberRows) {
    const key = `${String(row.tenantId)}::${String(row.groupId)}::${normalizeName(row.member_name)}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(row)
  }

  let reused = 0
  let createdNew = 0

  for (let i = 0; i < drivers.rowCount; i += BATCH_SIZE) {
    const batch = drivers.rows.slice(i, i + BATCH_SIZE)
    const actions = []

    for (const driver of batch) {
      const key = `${String(driver.tenantId)}::${String(driver.groupId)}::${normalizeName(driver.name)}`
      const candidates = byKey.get(key) ?? []

      if (candidates.length === 1) {
        actions.push({ driver, publisherId: candidates[0].publisherId, estrategia: 'auto', nuevo: null })
      } else if (candidates.length === 0) {
        const { firstName, lastName } = splitName(driver.name)
        actions.push({
          driver,
          publisherId: newId(),
          estrategia: 'nuevo',
          nuevo: { firstName: firstName || driver.name.trim(), lastName },
        })
      } else {
        skippedAmbiguous.push({ id: driver.id, name: driver.name, groupId: driver.groupId, candidates: candidates.length })
      }
    }

    if (!dryRun && actions.length > 0) {
      await client.query('BEGIN')
      try {
        for (const action of actions) {
          if (action.nuevo) {
            await client.query(
              `INSERT INTO "Publisher" (id, "firstName", "lastName", "isConductor", "groupId", "tenantId")
               VALUES ($1, $2, $3, true, $4, $5)
               ON CONFLICT (id) DO NOTHING`,
              [action.publisherId, action.nuevo.firstName, action.nuevo.lastName, action.driver.groupId, action.driver.tenantId]
            )
            createdNew += 1
          } else {
            await client.query(
              `UPDATE "Publisher" SET "isConductor" = true, "updatedAt" = CURRENT_TIMESTAMP
               WHERE id = $1 AND "isConductor" = false`,
              [action.publisherId]
            )
            reused += 1
          }
          await client.query(
            `INSERT INTO "_MigracionDriverAPublisher" ("driverId", "publisherId", "estrategia")
             VALUES ($1, $2, $3) ON CONFLICT ("driverId") DO NOTHING`,
            [action.driver.id, action.publisherId, action.estrategia]
          )
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    } else {
      for (const action of actions) {
        if (action.estrategia === 'nuevo') createdNew += 1
        else reused += 1
      }
    }
  }

  console.log(`   Conductores vinculados a publicador existente: ${reused}`)
  console.log(`   Publicadores nuevos creados como conductores:  ${createdNew}`)
  console.log(`   Ambiguos OMITIDOS (requieren decisión manual): ${skippedAmbiguous.length}`)
  for (const s of skippedAmbiguous.slice(0, 20)) {
    console.log(`      ⚠️  "${s.name}" (${s.candidates} candidatos, grupo ${String(s.groupId).slice(0, 12)}…)`)
  }
}

// ── Completar publisherId en tablas territoriales ───────────────────

async function completePublisherIds(client, dryRun) {
  console.log('\n── COMPLETAR publisherId ──')

  const targets = [
    {
      table: 'PersonalAssignment',
      oldColumn: '"memberId"',
      mappingTable: '_MigracionMemberAPublisher',
      mappingColumn: '"memberId"',
    },
    {
      table: 'Assignment',
      oldColumn: '"driverId"',
      mappingTable: '_MigracionDriverAPublisher',
      mappingColumn: '"driverId"',
    },
    {
      table: 'DailyRecord',
      oldColumn: '"driverId"',
      mappingTable: '_MigracionDriverAPublisher',
      mappingColumn: '"driverId"',
    },
  ]

  for (const target of targets) {
    if (dryRun) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS n
         FROM "${target.table}" t
         JOIN "${target.mappingTable}" x ON t.${target.oldColumn} = x.${target.mappingColumn}
         WHERE t."publisherId" IS NULL`
      )
      console.log(`   ${target.table}: ${result.rows[0]?.n ?? 0} filas completables`)
      continue
    }

    const result = await client.query(
      `WITH actualizadas AS (
         UPDATE "${target.table}" t
         SET "publisherId" = x."publisherId",
             "updatedAt"   = CURRENT_TIMESTAMP
         FROM "${target.mappingTable}" x
         WHERE t.${target.oldColumn} = x.${target.mappingColumn}
           AND t."publisherId" IS NULL
         RETURNING t.id
       )
       SELECT COUNT(*)::int AS n FROM actualizadas`
    )
    console.log(`   ${target.table}: ${result.rows[0]?.n ?? 0} filas completadas`)
  }
}

// ── Resumen final ───────────────────────────────────────────────────

async function summary(client) {
  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM "Member") AS miembros,
      (SELECT COUNT(*)::int FROM "_MigracionMemberAPublisher") AS miembros_migrados,
      (SELECT COUNT(*)::int FROM "Driver") AS conductores,
      (SELECT COUNT(*)::int FROM "_MigracionDriverAPublisher") AS conductores_migrados,
      (SELECT COUNT(*)::int FROM "Publisher") AS publicadores,
      (SELECT COUNT(*)::int FROM "Publisher" WHERE "isConductor") AS publicadores_conductores,
      (SELECT COUNT(*)::int FROM "PersonalAssignment" WHERE "publisherId" IS NULL) AS pa_sin_publisher,
      (SELECT COUNT(*)::int FROM "Assignment" WHERE "publisherId" IS NULL) AS asig_sin_publisher,
      (SELECT COUNT(*)::int FROM "DailyRecord" WHERE "publisherId" IS NULL) AS dr_sin_publisher
  `)
  const c = counts.rows[0]

  console.log('\n═══ RESUMEN ═══')
  console.log(`   Miembros:                    ${c.miembros} (migrados: ${c.miembros_migrados})`)
  console.log(`   Conductores:                 ${c.conductores} (migrados: ${c.conductores_migrados})`)
  console.log(`   Publicadores totales:        ${c.publicadores}`)
  console.log(`   Publicadores conductores:    ${c.publicadores_conductores}`)
  console.log(`   PersonalAssignment pend.:    ${c.pa_sin_publisher}`)
  console.log(`   Assignment pendientes:       ${c.asig_sin_publisher}`)
  console.log(`   DailyRecord pendientes:      ${c.dr_sin_publisher}`)

  const ok =
    c.miembros === c.miembros_migrados &&
    c.pa_sin_publisher === 0 &&
    c.asig_sin_publisher === 0 &&
    c.dr_sin_publisher === 0

  console.log(ok && skippedAmbiguous.length === 0
    ? '\n✅ Backfill completo y consistente.'
    : `\n⚠️  Quedan pendientes (ambiguos o filas huérfanas). Ver detalle arriba.`)
}

async function main() {
  console.log(EJECUTAR
    ? '🚀 MODO EJECUCIÓN — se escribirán datos.'
    : '🧪 MODO SIMULACIÓN — no se escribe nada (usar --ejecutar para aplicar).')
  if (tenantFilter) console.log(`   Filtrado por tenant: ${tenantFilter}`)

  const client = new Client({ connectionString })
  await client.connect()
  try {
    await requireSchema(client)
    await migrateMembers(client, !EJECUTAR)
    await migrateDrivers(client, !EJECUTAR)
    await completePublisherIds(client, !EJECUTAR)
    await summary(client)

    if (!EJECUTAR) {
      console.log('\n💡 Esto fue una simulación. Para aplicar: node scripts/backfill-publishers.mjs --ejecutar')
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error.message)
  process.exit(1)
})
