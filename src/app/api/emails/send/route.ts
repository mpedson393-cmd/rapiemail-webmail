import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Campos em falta" }, { status: 400 });
    }

    const fromEmail = session.user.email;
    const fromName = session.user.name || "RapiEmail";

    // Gerar ID único de Rastreamento (Tracking ID)
    const trackingId = crypto.randomUUID();
    
    // Obter URL base da aplicação
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const trackingPixelUrl = `${baseUrl}/api/track/open/${trackingId}`;

    // Montar HTML com o Pixel Invisível de Rastreamento
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222;">
        <p style="margin: 0; white-space: pre-wrap;">${body.replace(/\n/g, '<br/>')}</p>
        <br/>
        <!-- RapiEmail Stealth Tracking Pixel -->
        <img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none !important; width:1px; height:1px; border:0; outline:0;" />
      </div>
    `;

    // 1. Tentar enviar com o remetente original
    let sender = `${fromName} <${fromEmail}>`;
    let sendResult = await resend.emails.send({
      from: sender,
      to: [to],
      subject: subject,
      html: htmlBody,
      replyTo: fromEmail,
    });

    // 2. Se o domínio não estiver verificado na Resend, usar automaticamente o domínio verificado rapiemail.online como gateway
    if (sendResult.error && sendResult.error.message.includes("not verified")) {
      const verifiedDomain = "rapiemail.online";
      const fallbackSender = `${fromName} (${fromEmail}) <noreply@${verifiedDomain}>`;
      
      console.log(`[RapiEmail Gateway] A reencaminhar email através do domínio verificado ${verifiedDomain}`);
      
      sendResult = await resend.emails.send({
        from: fallbackSender,
        to: [to],
        subject: subject,
        html: htmlBody,
        replyTo: fromEmail,
      });
    }

    if (sendResult.error) {
      console.error("Resend Final Error:", sendResult.error);
      return NextResponse.json({ error: sendResult.error.message }, { status: 500 });
    }

    // Gravar na Base de Dados do utilizador com o trackingId
    const user = await prisma.user.findUnique({ where: { email: fromEmail } });
    
    let createdEmail = null;
    if (user) {
      createdEmail = await prisma.email.create({
        data: {
          from: fromEmail,
          to: to,
          subject: subject,
          body: body,
          folder: "SENT",
          read: true,
          userId: user.id,
          trackingId: trackingId,
          isOpened: false,
          openCount: 0
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: sendResult.data, 
      trackingId,
      emailId: createdEmail?.id 
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
