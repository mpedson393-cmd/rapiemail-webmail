import { NextResponse } from "next/server";
import { 
  getDigitalOceanAccount, 
  listDomains, 
  listDroplets, 
  createDomain, 
  createDomainRecord, 
  setupEmailDnsRecords,
  createDroplet 
} from "@/lib/digitalocean";

export const dynamic = 'force-dynamic';

// GET: Obter estado real da infraestrutura DigitalOcean
export async function GET() {
  try {
    const token = process.env.DIGITALOCEAN_TOKEN;
    if (!token) {
      return NextResponse.json({
        configured: false,
        error: "DIGITALOCEAN_TOKEN não configurado no ficheiro de ambiente (.env)"
      }, { status: 400 });
    }

    const [accountRes, domainsRes, dropletsRes] = await Promise.all([
      getDigitalOceanAccount().catch(e => ({ ok: false, error: e.message, data: null })),
      listDomains().catch(e => ({ ok: false, error: e.message, data: null })),
      listDroplets().catch(e => ({ ok: false, error: e.message, data: null })),
    ]);

    return NextResponse.json({
      configured: true,
      account: accountRes?.data?.account || null,
      domains: domainsRes?.data?.domains || [],
      droplets: dropletsRes?.data?.droplets || [],
      status: accountRes?.ok ? "ONLINE" : "ERROR"
    });
  } catch (error: any) {
    console.error("DigitalOcean API Route Error:", error);
    return NextResponse.json({ 
      error: error.message || "Erro ao comunicar com a API da DigitalOcean" 
    }, { status: 500 });
  }
}

// POST: Executar ações na DigitalOcean (DNS, Criar Servidor, Sincronizar Domínio)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, domainName, ipAddress, dropletName, region, size } = body;

    if (action === "create_domain" || action === "setup_dns") {
      if (!domainName) {
        return NextResponse.json({ error: "Nome de domínio obrigatório." }, { status: 400 });
      }

      const cleanDomain = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      
      // 1. Criar o domínio na DigitalOcean DNS
      const createRes = await createDomain(cleanDomain, ipAddress || "138.68.100.1");
      
      // 2. Configurar automaticamente registos de e-mail (MX, SPF, DMARC, CNAME)
      const dnsRecords = await setupEmailDnsRecords(cleanDomain);

      return NextResponse.json({
        success: true,
        message: `Domínio ${cleanDomain} e registos DNS de email configurados na DigitalOcean com sucesso!`,
        domain: createRes?.data,
        dnsRecords
      });
    }

    if (action === "create_droplet") {
      if (!dropletName) {
        return NextResponse.json({ error: "Nome do droplet/servidor obrigatório." }, { status: 400 });
      }

      const dropRes = await createDroplet({
        name: dropletName,
        region: region || "fra1", // Frankfurt
        size: size || "s-1vcpu-1gb",
        image: "ubuntu-24-04-x64",
      });

      return NextResponse.json({
        success: dropRes.ok,
        droplet: dropRes?.data?.droplet || dropRes?.data,
        message: dropRes.ok ? `Servidor Cloud ${dropletName} a ser provisionado na DigitalOcean!` : "Erro ao criar Droplet"
      });
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });

  } catch (error: any) {
    console.error("DigitalOcean Action Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar ação DigitalOcean" }, { status: 500 });
  }
}
