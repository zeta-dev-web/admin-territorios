// ═══════════════════════════════════════════════════════════
// MIGRACIÓN ONE-SHOT: API keys en texto plano → hash SHA-256
// ═══════════════════════════════════════════════════════════
//
// Desde el commit de hashing, las keys nuevas se guardan hasheadas y las
// keys legacy se migran solas al usarse (/api/agent). Este script migra de
// una vez las keys legacy que queden sin usar.
//
// Uso:
//   node scripts/hash-api-keys.mjs              → SIMULACIÓN (no escribe)
//   node scripts/hash-api-keys.mjs --ejecutar   → aplica cambios
//
// Propiedades:
//   - IDEMPOTENTE: solo toca keys que no parecen hash SHA-256 hex (64 chars).
//     Repetir nunca duplica ni rompe nada.
//   - Las keys migradas SIGUEN FUNCIONANDO: el validador hashea lo que
//     recibe y compara contra el hash guardado.
// ═══════════════════════════════════════════════════════════
import pg from 'pg'
import { config } from 'dotenv'
import crypto from 'node:crypto'

config()

const { Client } = pg
const EJECUTAR = process.argv.includes('--ejecutar')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL no encontrada.')
  process.exit(1)
}

const isHashed = (v) => /^[0-9a-f]{64}$/.test(v ?? '')
const sha256hex = (v) => crypto.createHash('sha256').update(v, 'utf8').digest('hex')

const client = new Client({ connectionString })

try {
  await client.connect()
  const { rows } = await client.query('SELECT id, key, "isActive" FROM "ApiKey"')

  const legacy = rows.filter((r) => !isHashed(r.key))
  console.log(`🔑 API keys totales: ${rows.length}, legacy (texto plano): ${legacy.length}`)

  if (legacy.length === 0) {
    console.log('✅ Nada para migrar.')
    process.exit(0)
  }

  if (!EJECUTAR) {
    console.log('🔍 SIMULACIÓN. Reejecutá con --ejecutar para aplicar.')
    process.exit(0)
  }

  let migrated = 0
  for (const row of legacy) {
    await client.query('UPDATE "ApiKey" SET key = $1 WHERE id = $2', [sha256hex(row.key), row.id])
    migrated++
  }
  console.log(`✅ Migradas ${migrated} keys a SHA-256. Siguen funcionando igual.`)
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}
