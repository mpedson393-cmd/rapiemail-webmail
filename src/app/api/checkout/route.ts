import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build");

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
          price: "price_1UH9zYHlRQps6wUvL8YB9Er7", // RapiEmail Pro (10,00 €/mês)
          quantity: 1,
        },
      ];
    } else if (itemType === "HOSTING_ADDON") {
      mode = "subscription";
      lineItems = [
        {
          price: "price_1UH9zYHlRQps6wUvNJdjOjQ5", // Empresa Total + Site no Ar (30,00 €/mês)
          quantity: 1,
        },
      ];
    } else if (itemType === "SITE_BUILDER_ANNUAL") {
      mode = "subscription";
      lineItems = [
        {
          price: "price_1UH9zZHlRQps6wUvdZFzgKI9", // RapiSiteBuilder Anual (88,00 €/ano)
          quantity: 1,
        },
      ];
    } else if (itemType === "DOMAIN_PURCHASE") {
      mode = "payment";
      lineItems = [
        {
          price: "price_1UH9zaHlRQps6wUvbZNcBsgx", // Registo de Domínio Corporativo (20,00 €)
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
