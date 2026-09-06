import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { registerDomain, updateDomainNameServers } from "@/lib/porkbun";
import { createDomain, setupEmailDnsRecords } from "@/lib/digitalocean";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback para quando o webhook secret não está configurado em dev
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Stripe Webhook Signature Error:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Processar Evento de Pagamento Bem Sucedido
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const customerEmail = session.customer_email || metadata.userEmail;
    const domainName = metadata.domainName;
    const itemType = metadata.itemType;

    console.log(`[Stripe Webhook] Pagamento concluído com sucesso para: ${customerEmail}, item: ${itemType}, domínio: ${domainName}`);

    try {
      // 1. Se envolve compra ou configuração de Domínio
      if (domainName) {
        console.log(`[Stripe Webhook] Iniciando provisionamento automático de domínio: ${domainName}`);
        
        // a) Registar domínio na Porkbun (se for compra nova)
        if (itemType === "DOMAIN_PURCHASE") {
          try {
            await registerDomain(domainName, { email: customerEmail || 'admin@rapiemail.com' });
            console.log(`[Porkbun] Domínio ${domainName} registado com sucesso.`);
          } catch (err) {
            console.warn(`[Porkbun] Aviso ao registar domínio:`, err);
          }
        }

        // b) Apontar Nameservers da Porkbun para a DigitalOcean
        try {
          await updateDomainNameServers(domainName);
          console.log(`[Porkbun] Nameservers atualizados para a DigitalOcean.`);
        } catch (err) {
          console.warn(`[Porkbun] Aviso ao atualizar nameservers:`, err);
        }

        // c) Criar Zona DNS na DigitalOcean
        try {
          await createDomain(domainName);
          await setupEmailDnsRecords(domainName);
          console.log(`[DigitalOcean] Zona DNS e registos MX/SPF/DKIM criados com sucesso para ${domainName}.`);
        } catch (err) {
          console.warn(`[DigitalOcean] Aviso ao criar zona DNS:`, err);
        }
      }

      // 2. Atualizar Estado do Utilizador e Empresa na Base de Dados
      if (customerEmail) {
        const user = await prisma.user.findUnique({
          where: { email: customerEmail }
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              domainName: domainName || user.domainName,
              domainStatus: 'ACTIVE',
              accountType: 'PREMIUM'
            }
          });

          if (user.companyId) {
            await prisma.company.update({
              where: { id: user.companyId },
              data: {
                domainName: domainName || undefined,
                domainStatus: 'ACTIVE'
              }
            }).catch(() => null);
          }

          // Inserir E-mail de Boas-Vindas e Confirmação de Ativação
          await prisma.email.create({
            data: {
              from: "RapiEmail Suporte <suporte@rapiemail.com>",
              to: customerEmail,
              subject: `🎉 Sua Assinatura e Domínio ${domainName || ''} estão Ativos!`,
              body: `Olá,\n\nConfirmamos com sucesso o seu pagamento para o plano ${itemType || 'RapiEmail Pro'}.\n\nO seu domínio ${domainName || 'profissional'} e a sua infraestrutura na nuvem já se encontram provisionados e ativos.\n\nPode começar a enviar e receber e-mails profissionais com rastreador e inteligência artificial.\n\nObrigado pela sua confiança!\nEquipa RapiEmail`,
              folder: "INBOX",
              read: false,
              userId: user.id
            }
          }).catch(() => null);
        }
      }
    } catch (provisionError) {
      console.error("[Stripe Webhook] Erro durante o provisionamento:", provisionError);
    }
  }

  return NextResponse.json({ received: true });
}
