import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Nome de domínio inválido" }, { status: 400 });
    }

    const cleanQuery = query.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    if (!cleanQuery) {
      return NextResponse.json({ error: "Insira um nome válido" }, { status: 400 });
    }

    const extensions = [
      { tld: "com", price: 11.28, retail: 20.00, popular: true },
      { tld: "online", price: 0.98, retail: 15.00, popular: true },
      { tld: "pt", price: 8.48, retail: 18.00, popular: false },
      { tld: "uk", price: 6.98, retail: 18.00, popular: false },
      { tld: "org", price: 8.48, retail: 20.00, popular: false },
      { tld: "io", price: 34.98, retail: 50.00, popular: false },
      { tld: "ai", price: 69.98, retail: 90.00, popular: true },
    ];

    // Consulta disponibilidade para as extensões
    const results = await Promise.all(
      extensions.map(async (ext) => {
        const domain = `${cleanQuery}.${ext.tld}`;
        try {
          const res = await fetch(`https://api.porkbun.com/api/json/v3/domain/check/${domain}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "RapiEmail/1.0"
            },
            body: JSON.stringify({
              apikey: process.env.PORKBUN_API_KEY,
              secretapikey: process.env.PORKBUN_SECRET_KEY,
            })
          });

          const data = await res.json();
          const isAvailable = data.status === "SUCCESS" ? (data.available ?? true) : true;

          return {
            domain,
            tld: ext.tld,
            available: isAvailable,
            costPrice: ext.price,
            price: ext.retail,
            popular: ext.popular
          };
        } catch (err) {
          return {
            domain,
            tld: ext.tld,
            available: true,
            costPrice: ext.price,
            price: ext.retail,
            popular: ext.popular
          };
        }
      })
    );

    return NextResponse.json({
      status: "SUCCESS",
      query: cleanQuery,
      results
    });

  } catch (error: any) {
    console.error("Domain Search Error:", error);
    return NextResponse.json({ error: "Erro ao consultar domínios" }, { status: 500 });
  }
}
