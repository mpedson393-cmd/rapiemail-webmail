const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.bwhgmmtbrchugjmmydke:Comojete%402005@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function migratePrivateEmail() {
  console.log("=== INICIANDO MIGRAÇÃO AUTOMÁTICA DO NAMECHEAP PRIVATEEMAIL ===");

  const targetEmail = "edson@rapimoneyit.online";
  const imapPassword = "Comojete@2005";
  const imapHost = "mail.privateemail.com";
  const imapPort = 993;

  // 1. Obter utilizador no Supabase
  const user = await prisma.user.findFirst({
    where: { email: { equals: targetEmail, mode: 'insensitive' } }
  });

  if (!user) {
    console.error(`❌ Utilizador ${targetEmail} não encontrado no Supabase.`);
    return;
  }

  console.log(`🟢 Utilizador Supabase encontrado: ID ${user.id} (${user.email})`);

  // 2. Ligar ao servidor IMAP da Namecheap
  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: targetEmail,
      pass: imapPassword
    },
    logger: false
  });

  try {
    console.log(`📡 A ligar ao servidor IMAP Namecheap (${imapHost}:${imapPort})...`);
    await client.connect();
    console.log("✅ Ligação IMAP estabelecida com sucesso!");

    // 3. Listar e percorrer todas as pastas (INBOX, Sent, etc.)
    const mailboxes = await client.list();
    console.log(`📁 Pastas encontradas: ${mailboxes.map(m => m.path).join(', ')}`);

    let totalMigrated = 0;

    for (const mailbox of mailboxes) {
      console.log(`\n📂 A processar pasta: "${mailbox.path}"...`);
      
      let folderType = "INBOX";
      const pLower = mailbox.path.toLowerCase();
      if (pLower.includes("sent") || pLower.includes("enviad")) folderType = "SENT";
      else if (pLower.includes("draft") || pLower.includes("rascunh")) folderType = "DRAFTS";
      else if (pLower.includes("trash") || pLower.includes("lixo") || pLower.includes("bin")) folderType = "TRASH";
      else if (pLower.includes("spam") || pLower.includes("junk")) folderType = "SPAM";
      else if (pLower.includes("archive") || pLower.includes("arquiv")) folderType = "ARCHIVE";

      const lock = await client.getMailboxLock(mailbox.path);
      try {
        const status = client.mailbox;
        console.log(`Total de mensagens na pasta "${mailbox.path}": ${status.exists}`);

        if (status.exists > 0) {
          // Percorrer todas as mensagens
          for await (const message of client.fetch('1:*', { source: true, flags: true, envelope: true })) {
            try {
              const parsed = await simpleParser(message.source);
              
              const from = parsed.from?.text || parsed.from?.value?.[0]?.address || "desconhecido@email.com";
              const to = parsed.to?.text || parsed.to?.value?.[0]?.address || targetEmail;
              const subject = parsed.subject || "(Sem assunto)";
              const body = parsed.text || parsed.html?.replace(/<[^>]*>?/gm, '') || "(Mensagem vazia)";
              const date = parsed.date || new Date();
              const isRead = message.flags ? message.flags.has('\\Seen') : true;

              // Gravar no Supabase
              await prisma.email.create({
                data: {
                  from: from,
                  to: to,
                  subject: subject,
                  body: body,
                  folder: folderType,
                  read: isRead,
                  userId: user.id,
                  createdAt: date
                }
              });

              totalMigrated++;
              console.log(`  ✉️ [${folderType}] Importado: "${subject}" de ${from} (${date.toISOString().split('T')[0]})`);
            } catch (msgErr) {
              console.warn("  ⚠️ Erro ao processar mensagem individual:", msgErr.message);
            }
          }
        }
      } finally {
        lock.release();
      }
    }

    console.log(`\n🎉 MIGRAÇÃO CONCLUÍDA! Total de ${totalMigrated} e-mails importados com sucesso para o RapiEmail!`);

    await client.logout();

  } catch (imapErr) {
    console.error("❌ Erro na ligação IMAP ao Namecheap:", imapErr.message);
  } finally {
    await prisma.$disconnect();
  }
}

migratePrivateEmail();
