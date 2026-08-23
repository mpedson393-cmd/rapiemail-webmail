import { PrismaClient } from '@prisma/client';

// Supabase IPv4 Pooler URL (eu-central-1) - Compatível 100% com Render, Vercel e Servidores Linux
const SUPABASE_IPV4_POOLER_URL = "postgresql://postgres.bwhgmmtbrchugjmmydke:Comojete%402005@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require";

// Se DATABASE_URL não estiver configurada ou for o endpoint antigo direto (IPv6), usar o IPv4 Pooler
let activeUrl = process.env.DATABASE_URL || SUPABASE_IPV4_POOLER_URL;

if (!activeUrl.startsWith("postgres") || activeUrl.includes("db.bwhgmmtbrchugjmmydke.supabase.co")) {
  activeUrl = SUPABASE_IPV4_POOLER_URL;
} else if (!activeUrl.includes("sslmode=")) {
  activeUrl += activeUrl.includes("?") ? "&sslmode=require" : "?sslmode=require";
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
