import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

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
    const fromName = session.user.name || "RapiEmail User";

    // Gerar ID único de Rastreamento (Tracking ID)
    const trackingId = crypto.randomUUID();
    
    // Obter URL base da aplicação
    const baseUrl = process.env.NEXTAUTH_URL || "https://rapiemail.online";
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

    // Determinar o remetente oficial com base nos domínios verificados (rapiemail.online)
    const isDomainVerified = fromEmail.endsWith("@rapiemail.online") || fromEmail.endsWith("@rapimoneyit.online");
    const sender = isDomainVerified 
      ? `${fromName} <${fromEmail}>` 
      : `${fromName} (${fromEmail}) <noreply@rapiemail.online>`;

    console.log(`[RapiEmail Real Send Engine] A enviar email de "${sender}" para "${to}"...`);

    const sendResult = await resend.emails.send({
      from: sender,
      to: [to],
      subject: subject,
      html: htmlBody,
      replyTo: fromEmail,
    });

    if (sendResult.error) {
      console.error("Resend Final Error:", sendResult.error);
      return NextResponse.json({ error: sendResult.error.message }, { status: 500 });
    }

    // Gravar na Base de Dados Supabase PostgreSQL do utilizador com o trackingId
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
    return NextResponse.json({ error: "Erro interno do servidor ao enviar e-mail real." }, { status: 500 });
  }
}
