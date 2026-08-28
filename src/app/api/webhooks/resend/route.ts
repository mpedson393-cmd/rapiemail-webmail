import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/push";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, data } = payload;

    console.log(`[Resend Webhook Event] Tipo: ${type}`, JSON.stringify(data, null, 2));

    // 1. Evento de Email Aberto pelo Destinatário
    if (type === "email.opened") {
      const emailId = data?.email_id;
      if (emailId) {
        await prisma.email.updateMany({
          where: { trackingId: emailId },
          data: {
            isOpened: true,
            openedAt: new Date(),
            openCount: { increment: 1 }
          }
        });
      }
      return NextResponse.json({ received: true });
    }

    // 2. Evento de Email Recebido (Inbound)
    if (type === "email.received" || type === "email.delivery") {
      const toAddresses: string[] = Array.isArray(data?.to) ? data.to : [data?.to];
      const fromAddress = data?.from || "desconhecido@email.com";
      const subject = data?.subject || "(Sem assunto)";
      const bodyText = data?.text || data?.html?.replace(/<[^>]*>?/gm, '') || "(Mensagem vazia)";

      for (const to of toAddresses) {
        if (!to) continue;
        const cleanTo = to.toLowerCase().trim();

        // Encontrar o utilizador correspondente no Supabase
        const user = await prisma.user.findFirst({
          where: { email: { equals: cleanTo, mode: 'insensitive' } }
        });

        if (user) {
          const createdEmail = await prisma.email.create({
            data: {
              from: fromAddress,
              to: cleanTo,
              subject: subject,
              body: bodyText,
              folder: "INBOX",
              read: false,
              userId: user.id
            }
          });
          console.log(`[RapiEmail Inbound] Nova mensagem guardada com sucesso para ${cleanTo}`);

          // Disparar Web Push Notification mesmo com o app/navegador fechado!
          try {
            const senderName = fromAddress.split('<')[0].replace(/["']/g, '').trim() || fromAddress;
            const snippet = bodyText.replace(/\s+/g, ' ').slice(0, 70);
            await sendPushNotificationToUser(user.id, {
              title: `Novo E-mail de ${senderName}`,
              body: subject ? `${subject} — ${snippet}` : "(Sem assunto)",
              emailId: createdEmail.id,
              url: `/inbox?id=${createdEmail.id}`
            });
          } catch(pushErr) {
            console.warn("[Resend Push Error]:", pushErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Resend Webhook Error]:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
