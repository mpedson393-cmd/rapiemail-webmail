import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { emailId, isStarred } = await req.json();

    if (!emailId) {
      return NextResponse.json({ error: 'ID do e-mail obrigatório' }, { status: 400 });
    }

    const updated = await prisma.email.update({
      where: { id: emailId },
      data: { isStarred: Boolean(isStarred) }
    });

    return NextResponse.json({ success: true, emailId: updated.id, isStarred: updated.isStarred });
  } catch (error: any) {
    console.error('Erro ao atualizar estrela no e-mail:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
