import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { simpleParser } from "mailparser";

export const dynamic = 'force-dynamic';

/**
 * Universal Inbound Email Webhook
 * Recebe emails reais de todo o mundo em tempo real (Cloudflare Email Routing, Resend, SendGrid, Mailgun, Postmark).
 * Grava instantaneamente na Caixa de Entrada (INBOX) do utilizador no Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let to = "";
    let from = "";
    let subject = "";
    let body = "";
    let html = "";

    if (contentType.includes("application/json")) {
      const json = await req.json();

      // Caso o payload contenha o email bruto (Cloudflare Worker Raw Email)
      if (json.raw) {
        try {
          const parsed = await simpleParser(json.raw);
          to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0].text : parsed.to.text) : (json.to || "");
          from = parsed.from ? parsed.from.text : (json.from || "");
          subject = parsed.subject || json.subject || "(Sem assunto)";
          body = parsed.text || parsed.html ? parsed.text || "" : json.body || "";
          html = parsed.html || json.html || "";
        } catch (e) {
          // Fallback caso a análise do raw falhe
          to = json.to || "";
          from = json.from || "";
          subject = json.subject || "(Sem assunto)";
          body = json.text || json.body || "";
        }
      } else if (json.data) {
        // Resend Inbound format
        const d = json.data;
        to = Array.isArray(d.to) ? d.to[0] : (d.to || "");
        from = d.from || "";
        subject = d.subject || "(Sem assunto)";
        body = d.text || d.html?.replace(/<[^>]*>?/gm, '') || "";
        html = d.html || "";
      } else {
        // Generic JSON format
        to = Array.isArray(json.to) ? json.to[0] : (json.to || json.recipient || "");
        from = json.from || json.sender || "";
        subject = json.subject || "(Sem assunto)";
        body = json.text || json.body || json.html?.replace(/<[^>]*>?/gm, '') || "";
        html = json.html || "";
      }
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // SendGrid / Mailgun Form Data format
      const formData = await req.formData();
      to = (formData.get("to") as string) || (formData.get("recipient") as string) || "";
      from = (formData.get("from") as string) || (formData.get("sender") as string) || "";
      subject = (formData.get("subject") as string) || "(Sem assunto)";
      body = (formData.get("text") as string) || (formData.get("body-plain") as string) || "";
      html = (formData.get("html") as string) || (formData.get("body-html") as string) || "";
    } else {
      // Raw text/MIME stream
      const rawText = await req.text();
      if (rawText) {
        try {
          const parsed = await simpleParser(rawText);
          to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0].text : parsed.to.text) : "";
          from = parsed.from ? parsed.from.text : "";
          subject = parsed.subject || "(Sem assunto)";
          body = parsed.text || "";
          html = parsed.html || "";
        } catch(e) {
          body = rawText;
        }
      }
    }

    if (!to) {
      return NextResponse.json({ error: "Destinatário 'to' não fornecido" }, { status: 400 });
    }

    // Extrair email limpo do destinatário (ex: "Edson <edson@rapimoneyit.online>" -> "edson@rapimoneyit.online")
    const match = to.match(/<([^>]+)>/);
    const cleanTo = (match ? match[1] : to).trim().toLowerCase();

    console.log(`[RapiEmail Universal Inbound] Email recebido para: "${cleanTo}" de "${from}" com assunto "${subject}"`);

    // Procurar utilizador correspondente no Supabase PostgreSQL
    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanTo, mode: 'insensitive' } }
    });

    // Se o utilizador específico não existir mas o domínio for o da empresa, associar ao utilizador principal do domínio
    if (!user && cleanTo.includes("@")) {
      const domain = cleanTo.split("@")[1];
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { endsWith: `@${domain}`, mode: 'insensitive' } },
            { domainName: { equals: domain, mode: 'insensitive' } }
          ]
        }
      });
    }

    // Fallback de segurança para o administrador da conta (edson@rapimoneyit.online)
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: "edson@rapimoneyit.online", mode: 'insensitive' } }
      });
    }

    if (!user) {
      console.warn(`[RapiEmail Universal Inbound] Nenhum utilizador encontrado para ${cleanTo}`);
      return NextResponse.json({ error: "Utilizador não encontrado no sistema" }, { status: 404 });
    }

    // Limpar corpo do email
    const finalBody = body || html?.replace(/<[^>]*>?/gm, '').trim() || "(Mensagem sem texto)";

    // Gravar o email recebido na Caixa de Entrada (INBOX) do utilizador
    const created = await prisma.email.create({
      data: {
        from: from || "desconhecido@email.com",
        to: cleanTo,
        subject: subject || "(Sem assunto)",
        body: finalBody,
        html: html || undefined,
        folder: "INBOX",
        read: false,
        userId: user.id
      }
    });

    console.log(`✅ [RapiEmail Universal Inbound] Email guardado na Caixa de Entrada (ID: ${created.id}) para ${user.email}!`);

    // Disparar Notificação Push em Tempo Real para o Telemóvel / Computador (mesmo com o ecrã fechado!)
    try {
      const { sendPushNotificationToUser } = await import("@/lib/push");
      const senderName = from.split('<')[0].replace(/["']/g, '').trim() || from;
      await sendPushNotificationToUser(user.id, {
        title: `Novo E-mail de ${senderName}`,
        body: subject || "(Sem assunto)",
        url: "/inbox"
      });
    } catch(pushErr) {
      console.warn("[Inbound Push Notification Error]:", pushErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email recebido e processado na Caixa de Entrada com sucesso!",
      emailId: created.id 
    });

  } catch (error: any) {
    console.error("[RapiEmail Universal Inbound Error]:", error);
    return NextResponse.json({ error: "Erro ao processar email de entrada." }, { status: 500 });
  }
}
