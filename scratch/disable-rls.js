const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;');
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" DISABLE ROW LEVEL SECURITY;');
  await prisma.$executeRawUnsafe('ALTER TABLE "Email" DISABLE ROW LEVEL SECURITY;');
  await prisma.$executeRawUnsafe('ALTER TABLE "Waitlist" DISABLE ROW LEVEL SECURITY;');

  console.log('✅ RLS Desativado com Sucesso em todas as Tabelas no Supabase!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
