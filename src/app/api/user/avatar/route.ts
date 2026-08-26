import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: 'insensitive' } },
      select: { avatarUrl: true }
    });

    return NextResponse.json({ avatarUrl: user?.avatarUrl || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { avatarUrl } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { avatarUrl: avatarUrl || null }
    });

    return NextResponse.json({ success: true, avatarUrl: updatedUser.avatarUrl });
  } catch (error: any) {
    console.error("Avatar Update Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar foto de perfil." }, { status: 500 });
  }
}
