// DigitalOcean API v2 Client for RapiEmail
const DO_API_BASE = 'https://api.digitalocean.com/v2';

function getToken(): string {
  return process.env.DIGITALOCEAN_TOKEN || '';
}

async function doFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('DIGITALOCEAN_TOKEN não configurado no ambiente');
  }

  const res = await fetch(`${DO_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

// 1. Obter informações da Conta
export async function getDigitalOceanAccount() {
  return doFetch('/account');
}

// 2. Listar e Criar Droplets (Servidores Cloud)
export async function listDroplets() {
  return doFetch('/droplets?per_page=50');
}

export async function createDroplet(config: {
  name: string;
  region?: string;
  size?: string;
  image?: string;
  userData?: string;
}) {
  const payload = {
    name: config.name,
    region: config.region || 'fra1',
    size: config.size || 's-1vcpu-1gb',
    image: config.image || 'ubuntu-24-04-x64',
    user_data: config.userData,
    monitoring: true,
    ipv6: true,
    tags: ['rapiemail', 'webmail-server', 'custom-site']
  };

  return doFetch('/droplets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 3. Gestão de Domínios e Registos DNS
export async function listDomains() {
  return doFetch('/domains');
}

export async function createDomain(name: string, ipAddress?: string) {
  return doFetch('/domains', {
    method: 'POST',
    body: JSON.stringify({
      name,
      ip_address: ipAddress || '138.68.100.1' // default entry IP
    })
  });
}

export async function deleteDomain(name: string) {
  return doFetch(`/domains/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  });
}

export async function listDomainRecords(domainName: string) {
  return doFetch(`/domains/${encodeURIComponent(domainName)}/records?per_page=100`);
}

export async function createDomainRecord(domainName: string, record: {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  data: string;
  priority?: number;
  ttl?: number;
}) {
  return doFetch(`/domains/${encodeURIComponent(domainName)}/records`, {
    method: 'POST',
    body: JSON.stringify({
      type: record.type,
      name: record.name,
      data: record.data,
      priority: record.priority,
      ttl: record.ttl || 1800
    })
  });
}

export async function deleteDomainRecord(domainName: string, recordId: number | string) {
  return doFetch(`/domains/${encodeURIComponent(domainName)}/records/${recordId}`, {
    method: 'DELETE'
  });
}

// 4. Configuração Automática de Registos DNS de Email Corporativo (Resend / Mailgun / Webmail)
export async function setupEmailDnsRecords(domainName: string) {
  const records = [
    // MX Records para receber e-mails
    { type: 'MX' as const, name: '@', data: 'feedback-smtp.eu-west-1.amazonses.com.', priority: 10 },
    // SPF TXT Record
    { type: 'TXT' as const, name: '@', data: 'v=spf1 include:amazonses.com ~all' },
    // DMARC TXT Record
    { type: 'TXT' as const, name: '_dmarc', data: 'v=DMARC1; p=none;' },
    // Webmail CNAME
    { type: 'CNAME' as const, name: 'mail', data: '@' },
    { type: 'CNAME' as const, name: 'webmail', data: '@' },
  ];

  const results = [];
  for (const rec of records) {
    try {
      const res = await createDomainRecord(domainName, rec);
      results.push({ record: rec, res });
    } catch (err: any) {
      results.push({ record: rec, error: err.message });
    }
  }
  return results;
}
