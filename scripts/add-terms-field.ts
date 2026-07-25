import { prisma } from '../lib/prisma'

async function addTermsField() {
  try {
    console.log('Adding termsAcceptedAt field to User table...')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
    `)
    
    console.log('✅ Field added successfully!')
    
  } catch (error) {
    console.error('Error adding field:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTermsField()
