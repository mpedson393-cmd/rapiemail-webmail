import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const memoryCache = new Map<string, { data: any; expiry: number }>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const linkedinId = searchParams.get('linkedin_id');
    const companyId = searchParams.get('company_id');
    const apiKey = process.env.ENRICHMENT_API_KEY || "6a920937308231d9ba370650";

    const cacheKey = `${linkedinId || ''}:${companyId || ''}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json(cached.data);
    }

    if (linkedinId) {
      const url = `https://api.enrichmentapi.io/person?linkedin_id=${encodeURIComponent(linkedinId)}&api_key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        memoryCache.set(cacheKey, { data, expiry: Date.now() + 24 * 60 * 60 * 1000 }); // Cache por 24h
        return NextResponse.json(data);
      }
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }

    if (companyId) {
      const url = `https://api.enrichmentapi.io/company?linkedin_id=${encodeURIComponent(companyId)}&api_key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const companyData = Array.isArray(data) ? data[0] : data;
        memoryCache.set(cacheKey, { data: companyData, expiry: Date.now() + 24 * 60 * 60 * 1000 });
        return NextResponse.json(companyData);
      }
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ error: "Parâmetro 'linkedin_id' ou 'company_id' obrigatório." }, { status: 400 });

  } catch (error: any) {
    console.error("[EnrichmentAPI Route Error]:", error);
    return NextResponse.json({ error: "Erro ao consultar EnrichmentAPI." }, { status: 500 });
  }
}
