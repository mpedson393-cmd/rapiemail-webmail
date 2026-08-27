import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    await prisma.email.updateMany({
      where: {
        id,
        OR: [
          { to: session.user.email },
          { from: session.user.email }
        ]
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mark email read error:", error);
    return NextResponse.json({ error: "Erro ao marcar como lido" }, { status: 500 });
  }
}
