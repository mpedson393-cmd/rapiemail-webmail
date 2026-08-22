import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const email = session.user.email;

    // Procurar os últimos 50 e-mails do utilizador (enviados e recebidos)
    const dbEmails = await prisma.email.findMany({
      where: {
        OR: [
          { to: email },
          { from: email }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const formatted = dbEmails.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      subject: e.subject,
      body: e.body,
      folder: e.folder,
      read: e.read,
      createdAt: e.createdAt.toISOString(),
      trackingId: e.trackingId || undefined,
      isOpened: e.isOpened,
      openedAt: e.openedAt ? e.openedAt.toISOString() : undefined,
      openCount: e.openCount || 0,
      userAgent: e.userAgent || undefined
    }));

    return NextResponse.json({ success: true, emails: formatted });

  } catch (error: any) {
    console.error("Check emails error:", error);
    return NextResponse.json({ error: "Erro ao verificar e-mails" }, { status: 500 });
  }
}
