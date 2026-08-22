const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('✅ Utilizadores Registados no Supabase:', users.map(u => ({ id: u.id, email: u.email, name: `${u.firstName} ${u.lastName}` })));
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
