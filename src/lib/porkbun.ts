// Porkbun API v3 Client for Domain Management
const PORKBUN_API_BASE = 'https://api.porkbun.com/api/json/v3';

function getCredentials() {
  const apikey = process.env.PORKBUN_API_KEY || '';
  const secretapikey = process.env.PORKBUN_SECRET_KEY || '';
  return { apikey, secretapikey };
}

async function porkbunPost(endpoint: string, payload: Record<string, any> = {}) {
  const creds = getCredentials();
  if (!creds.apikey || !creds.secretapikey) {
    console.warn('Porkbun API keys missing in environment variables');
  }

  const res = await fetch(`${PORKBUN_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'RapiEmail/1.0',
    },
    body: JSON.stringify({
      ...creds,
      ...payload,
    }),
  });

  const data = await res.json().catch(() => ({ status: 'ERROR', message: 'Invalid JSON response' }));
  return { status: res.status, ok: res.ok, data };
}

// 1. Verificar Disponibilidade de Domínio
export async function checkDomainAvailability(domain: string) {
  return porkbunPost(`/domain/check/${encodeURIComponent(domain)}`);
}

// 2. Registar Novo Domínio
export async function registerDomain(domain: string, contactInfo?: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}) {
  return porkbunPost(`/domain/create/${encodeURIComponent(domain)}`, {
    ...contactInfo,
  });
}

// 3. Atualizar Nameservers para DigitalOcean (ns1.digitalocean.com, etc.)
export async function updateDomainNameServers(domain: string, nameservers: string[] = [
  'ns1.digitalocean.com',
  'ns2.digitalocean.com',
  'ns3.digitalocean.com'
]) {
  return porkbunPost(`/domain/updateNs/${encodeURIComponent(domain)}`, {
    ns: nameservers,
  });
}

// 4. Obter Informações de DNS e URL de Redirecionamento
export async function getDomainDetails(domain: string) {
  return porkbunPost(`/domain/get/${encodeURIComponent(domain)}`);
}
