import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export const dynamic = 'force-dynamic';

function cleanEmailList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { 
      to, 
      subject, 
      body, 
      attachments, 
      cc, 
      bcc, 
      replyTo, 
      scheduledAt,
      tags,
      headers 
    } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Campos em falta (destinatário, assunto ou mensagem)" }, { status: 400 });
    }

    const toList = cleanEmailList(to);
    const ccList = cleanEmailList(cc);
    const bccList = cleanEmailList(bcc);

    if (toList.length === 0) {
      return NextResponse.json({ error: "Insira pelo menos um destinatário válido." }, { status: 400 });
    }

    const fromEmail = session.user.email;
    const fromName = session.user.name || "RapiEmail User";

    // Procurar utilizador remetente na base de dados de forma segura com fallback
    let userAvatarUrl: string | null = null;
    let senderUser: any = null;
    try {
      senderUser = await prisma.user.findFirst({
        where: { email: { equals: fromEmail, mode: 'insensitive' } },
        select: { id: true, avatarUrl: true, firstName: true, lastName: true }
      });
      userAvatarUrl = senderUser?.avatarUrl || null;
    } catch (dbErr) {
      console.warn("[Send Route DB User Warning]:", dbErr);
    }

    // Se o avatar for um base64 gigante (data:image/...), não injetar inline no HTML para não ultrapassar os limites de payload do Resend (100KB)
    const isCleanAvatarUrl = userAvatarUrl && (userAvatarUrl.startsWith('http://') || userAvatarUrl.startsWith('https://') || (userAvatarUrl.startsWith('data:image/') && userAvatarUrl.length < 50000));
    const safeAvatarUrl = isCleanAvatarUrl ? userAvatarUrl : null;

    // Gerar ID único de Rastreamento (Tracking ID)
    const trackingId = crypto.randomUUID();
    
    // Obter URL pública do domínio de produção
    const baseUrl = process.env.NEXTAUTH_URL || "https://rapiemail.online";
    const trackingPixelUrl = `${baseUrl}/api/track/open/${trackingId}`;

    // Montar Bloco de Assinatura Oficial com Foto Real do Remetente (compatível com Gmail, Outlook, Apple Mail e Web)
    const avatarImgHtml = safeAvatarUrl ? `
      <td style="vertical-align: top; padding-right: 14px; width: 56px;">
        <img src="${safeAvatarUrl}" alt="${fromName}" width="52" height="52" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid #10B981; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.12);" />
      </td>
    ` : `
      <td style="vertical-align: top; padding-right: 14px; width: 56px;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #10B981, #059669); color: #ffffff; font-weight: bold; font-size: 18px; line-height: 50px; text-align: center; display: inline-block;">
          ${(fromName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'RE').toUpperCase()}
        </div>
      </td>
    `;

    const executiveSignatureHtml = `
      <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e5e7eb; max-width: 540px;">
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <tr>
            ${avatarImgHtml}
            <td style="vertical-align: middle;">
              <div style="font-size: 15px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">${fromName}</div>
              <div style="font-size: 12px; color: #10B981; font-weight: 600; margin-top: 1px;">RapiEmail Certified Sovereign Mail</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                <a href="mailto:${fromEmail}" style="color: #4b5563; text-decoration: none;">${fromEmail}</a>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Montar HTML Final com Conteúdo, Assinatura Executiva com Foto e Pixel Invisível de Rastreamento
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937;">
        <div style="margin: 0; white-space: pre-wrap;">${body.replace(/\n/g, '<br/>')}</div>
        ${executiveSignatureHtml}
        <br/>
        <!-- RapiEmail Stealth Tracking Pixel -->
        <img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:block !important; width:1px; height:1px; border:0; outline:0; opacity:0.01;" />
      </div>
    `;

    // Determinar o remetente oficial com base nos domínios verificados (rapiemail.online / rapimoneyit.online)
    const isDomainVerified = fromEmail.endsWith("@rapiemail.online") || fromEmail.endsWith("@rapimoneyit.online");
    const sender = isDomainVerified 
      ? `${fromName} <${fromEmail}>` 
      : `${fromName} (${fromEmail}) <noreply@rapiemail.online>`;

    console.log(`[RapiEmail Real Send Engine] A enviar email de "${sender}" para ${toList.join(', ')} (cc: ${ccList.join(', ')}, bcc: ${bccList.join(', ')}) com pixel: "${trackingPixelUrl}"...`);

    // Formatar anexos para o Resend se existirem
    const resendAttachments = (attachments && Array.isArray(attachments)) ? attachments.map((att: any) => ({
      filename: att.name || att.filename || "anexo",
      content: att.content ? (att.content.includes(',') ? att.content.split(',')[1] : att.content) : undefined,
      path: att.url || undefined
    })).filter((att: any) => att.content || att.path) : undefined;

    // Configuração Completa do Payload Resend
    const sendPayload: any = {
      from: sender,
      to: toList,
      subject: subject,
      html: htmlBody,
      replyTo: replyTo || fromEmail,
    };

    // Opções Avançadas do Resend
    if (ccList.length > 0) {
      sendPayload.cc = ccList;
    }
    if (bccList.length > 0) {
      sendPayload.bcc = bccList;
    }
    if (scheduledAt) {
      sendPayload.scheduled_at = scheduledAt;
      console.log(`[Resend Engine] Envio agendado para: ${scheduledAt}`);
    }
    if (tags && Array.isArray(tags)) {
      sendPayload.tags = tags;
    }
    if (headers && typeof headers === 'object') {
      sendPayload.headers = headers;
    }
    if (resendAttachments && resendAttachments.length > 0) {
      sendPayload.attachments = resendAttachments;
    }

    const sendResult = await resend.emails.send(sendPayload);

    if (sendResult.error) {
      console.error("Resend Final Error:", sendResult.error);
      return NextResponse.json({ error: sendResult.error.message }, { status: 500 });
    }

    // Gravar na Base de Dados Supabase PostgreSQL do utilizador remetente (SENT)
    const user = await prisma.user.findFirst({
      where: { email: { equals: fromEmail, mode: 'insensitive' } }
    });
    
    let createdEmail = null;
    if (user) {
      createdEmail = await prisma.email.create({
        data: {
          from: fromEmail,
          to: toList.join(', '),
          subject: subject,
          body: body,
          html: htmlBody,
          folder: "SENT",
          read: true,
          userId: user.id,
          trackingId: trackingId,
          isOpened: false,
          openCount: 0,
          attachments: (attachments && attachments.length > 0) ? attachments : undefined
        }
      });
    }

    // Se qualquer destinatário for também um utilizador na nossa plataforma, guardar na Caixa de Entrada dele e disparar Push!
    for (const recipient of toList) {
      const recipientUser = await prisma.user.findFirst({
        where: { email: { equals: recipient.toLowerCase().trim(), mode: 'insensitive' } }
      });

      if (recipientUser) {
        const inboxEmail = await prisma.email.create({
          data: {
            from: sender,
            to: recipient,
            subject: subject,
            body: body,
            html: htmlBody,
            folder: "INBOX",
            read: false,
            userId: recipientUser.id,
            trackingId: trackingId,
            isOpened: false,
            openCount: 0,
            attachments: (attachments && attachments.length > 0) ? attachments : undefined
          }
        });

        try {
          const { sendPushNotificationToUser } = await import("@/lib/push");
          await sendPushNotificationToUser(recipientUser.id, {
            title: `Novo E-mail de ${fromName}`,
            body: subject ? `${subject} — ${body.slice(0, 60)}` : "(Sem assunto)",
            emailId: inboxEmail.id,
            url: `/inbox?id=${inboxEmail.id}`
          });
        } catch(pushErr) {
          console.warn("[Send Push Notification Error]:", pushErr);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: sendResult.data, 
      trackingId,
      emailId: createdEmail?.id 
    });

  } catch (error: any) {
    console.error("Internal Server Error in /api/emails/send:", error);
    const detail = error?.message || String(error);
    return NextResponse.json({ 
      error: `Erro ao enviar e-mail: ${detail}` 
    }, { status: 500 });
  }
}
