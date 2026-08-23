import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { accountType, password, domainName, domainStatus, email } = data;

    if ((!domainName && !email) || !password || !accountType) {
      return NextResponse.json({ error: "Dados incompletos. E-mail/Domínio e Password são obrigatórios." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Processamento Inteligente do Email de Login e Domínio
    let loginEmail = "";
    let finalDomain = "";

    if (email && email.includes("@")) {
      loginEmail = email.trim().toLowerCase();
      finalDomain = loginEmail.split("@")[1];
    } else if (domainName) {
      const cleanDom = domainName.trim().toLowerCase();
      if (cleanDom.includes("@")) {
        loginEmail = cleanDom;
        finalDomain = cleanDom.split("@")[1];
      } else {
        const prefix = data.firstName ? data.firstName.toLowerCase().replace(/[^a-z0-9]/g, "") : "admin";
        loginEmail = `${prefix}@${cleanDom}`;
        finalDomain = cleanDom;
      }
    }

    if (!loginEmail || !finalDomain) {
      return NextResponse.json({ error: "Por favor, insira um endereço de e-mail ou domínio válido." }, { status: 400 });
    }

    // Função de Execução Resiliente com 3 Retries Automáticos
    const runWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
      try {
        return await fn();
      } catch (err) {
        if (retries > 0) {
          console.warn(`[Supabase DB Retry] A reconectar à base de dados... Tentativas restantes: ${retries}`);
          await new Promise(res => setTimeout(res, 800));
          return runWithRetry(fn, retries - 1);
        }
        throw err;
      }
    };

    // Verificar se o email já existe no Supabase
    try {
      const existingUser = await runWithRetry(() => prisma.user.findUnique({ where: { email: loginEmail } }));
      if (existingUser) {
        return NextResponse.json({ 
          error: "Esta conta de e-mail já se encontra registada! Pode iniciar sessão diretamente na página de login." 
        }, { status: 400 });
      }
    } catch (dbErr) {
      console.warn("DB user check warning:", dbErr);
    }

    if (accountType === "PERSONAL") {
      const user = await runWithRetry(() => prisma.user.create({
        data: {
          accountType: "PERSONAL",
          email: loginEmail,
          password: hashedPassword,
          firstName: data.firstName || loginEmail.split("@")[0],
          lastName: data.lastName || "",
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          domainName: finalDomain,
          domainStatus: domainStatus || "EXISTING"
        },
      }));
      return NextResponse.json({ success: true, user: { id: user.id }, loginEmail });
    } 
    else if (accountType === "BUSINESS" || accountType === "EMPRESA") {
      const companyName = data.companyName || finalDomain;

      // Verificar se a empresa para este domínio já existe no Supabase
      let company = await runWithRetry(() => prisma.company.findUnique({ where: { domainName: finalDomain } }));
      
      if (!company) {
        company = await runWithRetry(() => prisma.company.create({
          data: {
            name: companyName,
            employeeCount: data.employeeCount || "1-10",
            region: data.region || "PT",
            address: data.address,
            domainStatus: domainStatus || "EXISTING",
            domainName: finalDomain
          }
        }));
      }

      // Criar o utilizador associado à empresa
      const newUser = await runWithRetry(() => prisma.user.create({
        data: {
          accountType: "BUSINESS",
          email: loginEmail,
          password: hashedPassword,
          firstName: data.firstName || loginEmail.split("@")[0],
          lastName: data.lastName || companyName,
          domainName: finalDomain,
          domainStatus: domainStatus || "EXISTING",
          companyId: company.id
        }
      }));

      return NextResponse.json({ success: true, companyId: company.id, userId: newUser.id, loginEmail });
    }
    
    // Fallback padrão se não for nem PERSONAL nem BUSINESS explícito
    const defaultUser = await runWithRetry(() => prisma.user.create({
      data: {
        accountType: "BUSINESS",
        email: loginEmail,
        password: hashedPassword,
        firstName: data.firstName || loginEmail.split("@")[0],
        lastName: data.lastName || "Empresa",
        domainName: finalDomain,
        domainStatus: domainStatus || "EXISTING"
      },
    }));

    return NextResponse.json({ success: true, user: { id: defaultUser.id }, loginEmail });

  } catch (error: any) {
    console.error("Register Server Error:", error);
    if (error?.code === "P2002" || error?.message?.includes("Unique constraint")) {
      return NextResponse.json({ 
        error: "Esta conta de e-mail já foi criada no banco de dados. Pode iniciar sessão diretamente." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "A estabilizar a ligação à base de dados na nuvem. Clique em 'Concluir Configuração' novamente em 3 segundos." 
    }, { status: 500 });
  }
}
