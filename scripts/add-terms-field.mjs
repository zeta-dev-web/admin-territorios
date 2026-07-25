import pg from 'pg'

const { Client } = pg

async function addTermsField() {
  const client = new Client({
    connectionString: 'postgresql://postgres:admin@localhost:5432/territorios_db?schema=public'
  })

  try {
    await client.connect()
    console.log('📦 Connected to database...')
    
    console.log('➕ Adding termsAcceptedAt field to User table...')
    
    await client.query(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
    `)
    
    console.log('✅ Field added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding field:', error)
    throw error
  } finally {
    await client.end()
    console.log('👋 Disconnected from database')
  }
}

addTermsField()
