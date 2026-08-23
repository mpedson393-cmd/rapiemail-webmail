import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * Universal Inbound Email Webhook
 * Recebe emails reais vindos do Gmail, Outlook, Yahoo, Apple Mail e qualquer provedor mundial.
 * Suporta payloads estruturados de Resend Inbound, SendGrid Inbound Parse, Mailgun, Cloudflare Email Routing e Postmark.
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
      
      // Resend Inbound format
      if (json.data) {
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
    }

    if (!to) {
      return NextResponse.json({ error: "Destinatário 'to' não fornecido" }, { status: 400 });
    }

    // Extrair email limpo do destinatário (ex: "Denio <denio@rapiemail.online>" -> "denio@rapiemail.online")
    const match = to.match(/<([^>]+)>/);
    const cleanTo = (match ? match[1] : to).trim().toLowerCase();

    console.log(`[RapiEmail Universal Inbound] Email recebido para: "${cleanTo}" de "${from}" com assunto "${subject}"`);

    // Procurar utilizador correspondente no Supabase PostgreSQL
    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanTo, mode: 'insensitive' } }
    });

    // Se o utilizador específico não existir mas o domínio for o da empresa, associar ao admin da empresa
    if (!user && cleanTo.includes("@")) {
      const domain = cleanTo.split("@")[1];
      user = await prisma.user.findFirst({
        where: { domainName: { equals: domain, mode: 'insensitive' } }
      });
    }

    if (!user) {
      console.warn(`[RapiEmail Universal Inbound] Nenhum utilizador encontrado para ${cleanTo}`);
      return NextResponse.json({ error: "Utilizador não encontrado no sistema" }, { status: 404 });
    }

    // Gravar o email recebido na Caixa de Entrada (INBOX) do utilizador
    const created = await prisma.email.create({
      data: {
        from: from || "desconhecido@email.com",
        to: cleanTo,
        subject: subject || "(Sem assunto)",
        body: body || html.replace(/<[^>]*>?/gm, '') || "(Mensagem sem texto)",
        folder: "INBOX",
        read: false,
        userId: user.id
      }
    });

    console.log(`✅ [RapiEmail Universal Inbound] Email guardado na Caixa de Entrada (ID: ${created.id}) para ${user.email}!`);

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
