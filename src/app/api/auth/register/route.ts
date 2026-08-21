import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { accountType, password, domainName, domainStatus } = data;

    if (!domainName || !password || !accountType) {
      return NextResponse.json({ error: "Dados incompletos. Domínio e Password são obrigatórios." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Processamento Inteligente do Email de Login
    // Se o cliente introduziu algo com '@' (ex: info@empresa.com), usamos esse email e extraímos o domínio.
    // Se introduziu apenas o domínio (ex: empresa.com), geramos o email prefixando com admin@ ou nome@.
    let loginEmail = "";
    let finalDomain = domainName.toLowerCase().trim();
    
    if (finalDomain.includes("@")) {
      loginEmail = finalDomain;
      finalDomain = finalDomain.split("@")[1];
    } else {
      // Gerar prefixo baseado no nome se possível, senão 'admin'
      let prefix = "admin";
      if (data.firstName) {
        prefix = data.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      }
      loginEmail = `${prefix}@${finalDomain}`;
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Este endereço de email já está em uso na plataforma." }, { status: 400 });
    }

    if (accountType === "PERSONAL") {
      const user = await prisma.user.create({
        data: {
          accountType,
          email: loginEmail,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          domainName: finalDomain,
          domainStatus: domainStatus
        },
      });
      return NextResponse.json({ success: true, user: { id: user.id }, loginEmail });
    } 
    else if (accountType === "BUSINESS") {
      const company = await prisma.company.create({
        data: {
          name: data.companyName,
          employeeCount: data.employeeCount || "N/A",
          region: data.region,
          address: data.address,
          domainStatus: domainStatus,
          domainName: finalDomain,
          users: {
            create: {
              accountType,
              email: loginEmail,
              password: hashedPassword,
              // Na empresa usamos o email de contacto atual (data.email) para recuperar conta se for preciso no futuro.
              firstName: "Admin",
              lastName: data.companyName,
            }
          }
        }
      });
      return NextResponse.json({ success: true, companyId: company.id, loginEmail });
    }
    
    return NextResponse.json({ error: "Tipo de conta inválido." }, { status: 400 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
