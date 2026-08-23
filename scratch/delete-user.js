const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Comojete%402005@db.bwhgmmtbrchugjmmydke.supabase.co:5432/postgres?sslmode=require&connect_timeout=15"
    }
  }
});

async function deleteUser() {
  try {
    const targetEmail = "edson@rapiemail.online";
    
    // First delete emails sent/received by targetEmail
    await prisma.email.deleteMany({
      where: {
        OR: [{ from: targetEmail }, { to: targetEmail }]
      }
    });

    // Delete user
    const deletedUser = await prisma.user.deleteMany({
      where: { email: { equals: targetEmail, mode: 'insensitive' } }
    });

    console.log(`✅ Conta ${targetEmail} ELIMINADA do Supabase com sucesso! (Registos eliminados: ${deletedUser.count})`);

  } catch (err) {
    console.error("❌ Erro ao eliminar utilizador:", err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
