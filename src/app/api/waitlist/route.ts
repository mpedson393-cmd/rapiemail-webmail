import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // 1. Guardar na Base de Dados
    const newEntry = await prisma.waitlist.create({
      data: { email },
    });

    console.log('[Waitlist] Novo email guardado:', email);

    // 2. Enviar email de confirmação via Resend
    // Se a chave da API existir, tentamos enviar o email
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "COLA_AQUI_A_TUA_CHAVE_DA_RESEND") {
      console.log('[Waitlist] A enviar email de confirmação para', email);
      
      const { data, error } = await resend.emails.send({
        from: 'Equipa B2B Webmail <onboarding@resend.dev>',
        to: email,
        subject: 'Bem-vindo à revolução do email B2B 🚀',
        html: `
          <h2>Obrigado por se juntar à nossa Waitlist!</h2>
          <p>O seu provedor de email pode estar em baixo, mas o seu lugar no <b>Assassino do Private Email</b> está garantido.</p>
          <p>Avisaremos assim que tivermos as portas abertas para a migração do seu domínio.</p>
          <br/>
          <p>Cumprimentos,<br/>Equipa Fundadora</p>
        `,
      });

      if (error) {
        console.error('[Waitlist] Erro da Resend:', error);
        // Mesmo com erro no envio, a inscrição na BD foi bem sucedida.
      } else {
        console.log('[Waitlist] Email enviado! ID:', data?.id);
      }
    } else {
      console.log('[Waitlist] Chave Resend não configurada. A saltar envio de email.');
    }

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    console.error('[Waitlist] Erro:', error);
    // Verificar erro de duplicação do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Este email já está na waitlist!' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
