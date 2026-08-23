import { PrismaClient } from '@prisma/client';

const SUPABASE_DB_URL = "postgresql://postgres:Comojete%402005@db.bwhgmmtbrchugjmmydke.supabase.co:5432/postgres";

// Ensure process.env.DATABASE_URL is always valid PostgreSQL URL
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres")) {
  process.env.DATABASE_URL = SUPABASE_DB_URL;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || SUPABASE_DB_URL,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
