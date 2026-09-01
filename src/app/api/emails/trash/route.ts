import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, action = 'MOVE_TO_TRASH', folder = 'TRASH' } = await req.json();

    const userEmail = session.user.email;

    if (action === 'EMPTY_TRASH') {
      await prisma.email.deleteMany({
        where: {
          folder: 'TRASH',
          OR: [
            { to: userEmail },
            { from: userEmail }
          ]
        }
      });
      return NextResponse.json({ success: true, message: "Lixo esvaziado com sucesso" });
    }

    if (!id) {
      return NextResponse.json({ error: "ID de email obrigatório" }, { status: 400 });
    }

    if (action === 'PERMANENT_DELETE') {
      await prisma.email.deleteMany({
        where: {
          id,
          OR: [
            { to: userEmail },
            { from: userEmail }
          ]
        }
      });
      return NextResponse.json({ success: true, action: 'PERMANENT_DELETE' });
    }

    if (action === 'RESTORE') {
      await prisma.email.updateMany({
        where: {
          id,
          OR: [
            { to: userEmail },
            { from: userEmail }
          ]
        },
        data: {
          folder: 'INBOX'
        }
      });
      return NextResponse.json({ success: true, action: 'RESTORE', folder: 'INBOX' });
    }

    // Padrão: mover para a pasta especificada (ex: TRASH, SPAM, ARCHIVE, INBOX)
    const targetFolder = folder || 'TRASH';
    await prisma.email.updateMany({
      where: {
        id,
        OR: [
          { to: userEmail },
          { from: userEmail }
        ]
      },
      data: {
        folder: targetFolder
      }
    });

    return NextResponse.json({ success: true, action: 'MOVED', folder: targetFolder });

  } catch (error: any) {
    console.error("Trash email error:", error);
    return NextResponse.json({ error: "Erro ao mover email para o lixo" }, { status: 500 });
  }
}
