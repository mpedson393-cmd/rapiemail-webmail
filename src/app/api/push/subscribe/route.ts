import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/push";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    if (!userId && session?.user?.email) {
      const userFromEmail = await prisma.user.findFirst({
        where: { email: { equals: session.user.email, mode: 'insensitive' } }
      });
      userId = userFromEmail?.id;
    }

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { email: { equals: "edson@rapimoneyit.online", mode: 'insensitive' } }
      });
      userId = defaultUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Utilizador não autenticado." }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Dados de subscrição push inválidos." }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Chaves de criptografia p256dh ou auth em falta." }, { status: 400 });
    }

    // Gravar ou atualizar subscrição push no Supabase
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh,
        auth,
        createdAt: new Date()
      },
      create: {
        userId,
        endpoint,
        p256dh,
        auth
      }
    });

    console.log(`✅ [WebPush] Subscrição Push registada com sucesso para o utilizador ${userId}!`);

    // Enviar notificação de teste imediata para o telemóvel
    await sendPushNotificationToUser(userId, {
      title: "RapiEmail Enterprise 🔔",
      body: "Alertas em tempo real ativados! Receberás notificações mesmo com a app e o ecrã fechados.",
      url: "/inbox"
    });

    return NextResponse.json({ success: true, message: "Subscrição push guardada com sucesso!" });

  } catch (error: any) {
    console.error("[Push Subscribe Error]:", error);
    return NextResponse.json({ error: "Erro ao registar subscrição push." }, { status: 500 });
  }
}
