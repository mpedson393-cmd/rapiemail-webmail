import { PrismaClient } from '@prisma/client';

// Ensure process.env.DATABASE_URL is always valid PostgreSQL URL with sslmode=require & connect_timeout=15
let activeUrl = process.env.DATABASE_URL;
if (!activeUrl || !activeUrl.startsWith("postgres")) {
  activeUrl = "postgresql://postgres:Comojete%402005@db.bwhgmmtbrchugjmmydke.supabase.co:5432/postgres?sslmode=require&connect_timeout=15";
} else if (!activeUrl.includes("sslmode=")) {
  activeUrl += activeUrl.includes("?") ? "&sslmode=require&connect_timeout=15" : "?sslmode=require&connect_timeout=15";
}

process.env.DATABASE_URL = activeUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
