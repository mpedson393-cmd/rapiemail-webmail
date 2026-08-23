import { PrismaClient } from '@prisma/client';

const SUPABASE_BASE_URL = "postgresql://postgres:Comojete%402005@db.bwhgmmtbrchugjmmydke.supabase.co:5432/postgres";

// Forçar parâmetros de resiliência e pooler para o Render (connect_timeout=30, sslmode=require)
let activeUrl = process.env.DATABASE_URL || SUPABASE_BASE_URL;

if (!activeUrl.startsWith("postgres")) {
  activeUrl = SUPABASE_BASE_URL;
}

// Garantir que todos os parâmetros de estabilidade da nuvem estejam presentes
if (!activeUrl.includes("sslmode=")) {
  activeUrl += activeUrl.includes("?") ? "&sslmode=require" : "?sslmode=require";
}
if (!activeUrl.includes("connect_timeout=")) {
  activeUrl += "&connect_timeout=30";
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
