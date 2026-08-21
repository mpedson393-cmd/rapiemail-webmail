import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { itemType, domainName, returnUrl } = await req.json();

    const customerEmail = session?.user?.email || undefined;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "payment";

    if (itemType === "EMAIL_SUBSCRIPTION") {
      mode = "subscription";
      lineItems = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "RapiEmail Pro - Caixa Postal Profissional",
              description: `Acesso à caixa de correio com domínio personalizado (${domainName || 'domínio próprio'}), rastreador de leitura ✓✓, calendário e 10 GB de armazenamento.`,
            },
            unit_amount: 1000, // 10,00 €
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ];
    } else if (itemType === "HOSTING_ADDON") {
      mode = "subscription";
      lineItems = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Alojamento Web & Website Oficial",
              description: `Hospedagem em nuvem de alta velocidade e página web profissional no domínio ${domainName || 'da empresa'}.`,
            },
            unit_amount: 2000, // 20,00 €
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ];
    } else if (itemType === "DOMAIN_PURCHASE") {
      mode = "payment";
      lineItems = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Registo Oficial do Domínio: ${domainName}`,
              description: `Registo anual de domínio corporativo com DNS automático e proteção de privacidade WHOIS.`,
            },
            unit_amount: 2000, // 20,00 €
          },
          quantity: 1,
        },
      ];
    } else {
      return NextResponse.json({ error: "Tipo de produto inválido" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: mode,
      customer_email: customerEmail,
      success_url: `${baseUrl}/inbox?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/inbox?payment=cancelled`,
      metadata: {
        domainName: domainName || "",
        userEmail: customerEmail || "",
        itemType: itemType || "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar sessão de pagamento" }, { status: 500 });
  }
}
