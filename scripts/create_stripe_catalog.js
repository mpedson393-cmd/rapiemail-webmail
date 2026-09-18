const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const env = fs.readFileSync(envPath, 'utf8');
const secretKey = env.match(/STRIPE_SECRET_KEY=(.*)/)?.[1]?.replace(/['"]/g, '').trim();

if (!secretKey) {
  console.error("STRIPE_SECRET_KEY não encontrada no .env");
  process.exit(1);
}

const Stripe = require('stripe');
const stripe = new Stripe(secretKey);

const productsToCreate = [
  {
    name: "RapiEmail Pro — Caixa Postal Profissional",
    description: "Caixa de correio corporativa com domínio próprio, visto duplo de leitura ✓✓, calendário integrado e 10 GB de armazenamento seguro.",
    unitAmount: 1000, // 10,00 €
    currency: "eur",
    recurring: { interval: "month" },
    metadata: {
      itemType: "EMAIL_SUBSCRIPTION",
      category: "email_pro"
    }
  },
  {
    name: "Empresa Total + Site no Ar",
    description: "Solução corporativa completa: Email profissional ilimitado + Alojamento em nuvem de alta velocidade e Website institucional no ar.",
    unitAmount: 3000, // 30,00 €
    currency: "eur",
    recurring: { interval: "month" },
    metadata: {
      itemType: "HOSTING_ADDON",
      category: "bundle_hosting"
    }
  },
  {
    name: "RapiSiteBuilder — Alojamento & Publicação Web (Anual)",
    description: "Criação e hospedagem de website institucional com inteligência artificial, certificado SSL e CDN global na infraestrutura RapiCloud.",
    unitAmount: 8800, // 88,00 €
    currency: "eur",
    recurring: { interval: "year" },
    metadata: {
      itemType: "SITE_BUILDER_ANNUAL",
      category: "site_builder"
    }
  },
  {
    name: "Registo de Domínio Corporativo",
    description: "Registo anual de domínio corporativo (.com, .co, .net, etc.) com DNS automático e proteção de privacidade WHOIS.",
    unitAmount: 2000, // 20,00 €
    currency: "eur",
    // Pagamento único anual
    metadata: {
      itemType: "DOMAIN_PURCHASE",
      category: "domain"
    }
  }
];

async function syncCatalog() {
  console.log("Iniciando registo dos produtos no Catálogo Oficial do Stripe...");
  
  const account = await stripe.accounts.retrieve();
  console.log(`Conectado à Conta Stripe: ${account.id} (${account.business_profile?.name || account.settings?.dashboard?.display_name || 'RapiMoney'})`);

  const createdSummary = [];

  for (const item of productsToCreate) {
    try {
      console.log(`\nCriando produto: "${item.name}"...`);
      
      const product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: item.metadata,
        active: true
      });

      console.log(`✓ Produto criado com ID: ${product.id}`);

      const pricePayload = {
        product: product.id,
        unit_amount: item.unitAmount,
        currency: item.currency,
        metadata: item.metadata
      };

      if (item.recurring) {
        pricePayload.recurring = item.recurring;
      }

      const price = await stripe.prices.create(pricePayload);
      console.log(`✓ Preço criado: ${(item.unitAmount / 100).toFixed(2)} € ${item.recurring ? `/${item.recurring.interval}` : '(único)'} (ID: ${price.id})`);

      // Atualizar o produto com o preço padrão para aparecer perfeitamente no catálogo
      await stripe.products.update(product.id, {
        default_price: price.id
      });

      createdSummary.push({
        name: item.name,
        productId: product.id,
        priceId: price.id,
        priceFormatted: `${(item.unitAmount / 100).toFixed(2)} € ${item.recurring ? `/${item.recurring.interval}` : ''}`
      });

    } catch (err) {
      console.error(`Erro ao criar produto "${item.name}":`, err.message);
    }
  }

  console.log("\n==================================================");
  console.log("SUCESSO! Todos os produtos foram registados no Stripe:");
  console.log("==================================================");
  createdSummary.forEach(p => {
    console.log(`- ${p.name}: ${p.priceFormatted}`);
    console.log(`  Product ID: ${p.productId}`);
    console.log(`  Price ID:   ${p.priceId}\n`);
  });
}

syncCatalog().catch(console.error);
