const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addHtmlColumn() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "html" TEXT;`);
    console.log("✅ Coluna 'html' criada com sucesso na tabela Email do Supabase!");
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    await prisma.$disconnect();
  }
}

addHtmlColumn();
