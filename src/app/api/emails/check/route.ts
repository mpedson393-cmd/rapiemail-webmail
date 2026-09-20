import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado", success: false, emails: [] },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        }
      );
    }

    const email = session.user.email;

    // Procurar todos os e-mails do utilizador com execução rápida em paralelo e sem cache
    const dbEmails = await prisma.email.findMany({
      where: {
        OR: [
          { to: email },
          { from: email },
          { user: { email: email } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatted = dbEmails.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      subject: e.subject,
      body: e.body,
      html: e.html || undefined,
      folder: e.folder,
      read: e.read,
      createdAt: e.createdAt.toISOString(),
      trackingId: e.trackingId || undefined,
      isOpened: e.isOpened,
      openedAt: e.openedAt ? e.openedAt.toISOString() : undefined,
      openCount: e.openCount || 0,
      userAgent: e.userAgent || undefined,
      attachments: (e as any).attachments || undefined
    }));

    return NextResponse.json(
      { 
        success: true, 
        emails: formatted, 
        count: formatted.length, 
        timestamp: Date.now() 
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );

  } catch (error: any) {
    console.error("Check emails error:", error);
    return NextResponse.json(
      { success: false, emails: [], error: error?.message || "Erro ao consultar mensagens" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  }
}
