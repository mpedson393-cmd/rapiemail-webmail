const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'mario@mariomendes.online' },
    update: {},
    create: {
      email: 'mario@mariomendes.online',
      password: hashedPassword,
      firstName: 'Mário',
      lastName: 'Mendes',
      accountType: 'PERSONAL',
      domainName: 'mariomendes.online'
    }
  });

  console.log('✅ Utilizador Mário Mendes guardado no Supabase com sucesso:', user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
