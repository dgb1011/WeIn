import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with better error handling and logging
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// Only connect during runtime, not during build
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  db.$connect()
    .then(() => {
      console.log('✅ Database connected successfully')
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error)
    })
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db 