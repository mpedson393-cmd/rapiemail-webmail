import { Resend } from "resend";
import { createDomain, createDomainRecord } from "./digitalocean";

export const resend = new Resend(process.env.RESEND_API_KEY || "");

// 1. Listar Domínios Registados no Resend
export async function listResendDomains() {
  try {
    const res = await resend.domains.list();
    return res.data || [];
  } catch (err: any) {
    console.error("[Resend Lib] Erro ao listar domínios:", err.message);
    return [];
  }
}

// 2. Registar Novo Domínio no Resend e Provisionar DNS na DigitalOcean
export async function setupResendDomainWithDigitalOcean(domainName: string) {
  try {
    console.log(`[Resend Setup] A registar domínio ${domainName} no Resend...`);

    // Criar o domínio no Resend
    const createResult = await resend.domains.create({
      name: domainName,
      region: 'eu-west-1'
    });

    if (createResult.error) {
      console.warn(`[Resend Setup] Aviso ao criar domínio no Resend:`, createResult.error.message);
    }

    const domainData = createResult.data;
    const records = domainData?.records || [];

    console.log(`[Resend Setup] Registos DNS recebidos do Resend: ${records.length} registos`);

    // Criar Zona DNS na DigitalOcean
    try {
      await createDomain(domainName);
    } catch (err) {}

    // Injetar os registos DKIM, SPF e MX do Resend diretamente na DigitalOcean
    for (const record of records) {
      try {
        const recAny = record as any;
        const recordType = (recAny.record || 'TXT').toUpperCase() as 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
        const recordName = record.name === domainName ? '@' : record.name.replace(`.${domainName}`, '');
        
        await createDomainRecord(domainName, {
          type: recordType,
          name: recordName,
          data: record.value,
          priority: recAny.priority ? Number(recAny.priority) : undefined,
          ttl: recAny.ttl ? Number(recAny.ttl) : 1800
        });
        console.log(`[DigitalOcean DNS] Registo ${recordType} (${recordName}) criado com sucesso para ${domainName}.`);
      } catch (recErr: any) {
        console.warn(`[DigitalOcean DNS] Registo ${record.record} já existe ou aviso:`, recErr.message);
      }
    }

    // Solicitar verificação imediata ao Resend
    if (domainData?.id) {
      setTimeout(async () => {
        try {
          await resend.domains.verify(domainData.id);
          console.log(`[Resend Setup] Verificação do domínio ${domainName} solicitada com sucesso.`);
        } catch (vErr) {}
      }, 3000);
    }

    return {
      success: true,
      domainId: domainData?.id,
      records
    };

  } catch (err: any) {
    console.error(`[Resend Setup Error] Falha ao configurar ${domainName}:`, err.message);
    return { success: false, error: err.message };
  }
}
