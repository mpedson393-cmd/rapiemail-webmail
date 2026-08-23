import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { accountType, password, domainName, domainStatus } = data;

    if (!domainName || !password || !accountType) {
      return NextResponse.json({ error: "Dados incompletos. Domínio e Password são obrigatórios." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Processamento Inteligente do Email de Login
    let loginEmail = "";
    let finalDomain = domainName.toLowerCase().trim();
    
    if (finalDomain.includes("@")) {
      loginEmail = finalDomain;
      finalDomain = finalDomain.split("@")[1];
    } else {
      let prefix = "admin";
      if (data.firstName) {
        prefix = data.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      }
      loginEmail = `${prefix}@${finalDomain}`;
    }

    // Verificar se o email já existe
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
      if (existingUser) {
        return NextResponse.json({ error: "Este endereço de email já está em uso na plataforma." }, { status: 400 });
      }
    } catch (dbErr) {
      console.warn("DB table check warning:", dbErr);
    }

    if (accountType === "PERSONAL") {
      const user = await prisma.user.create({
        data: {
          accountType: "PERSONAL",
          email: loginEmail,
          password: hashedPassword,
          firstName: data.firstName || "Utilizador",
          lastName: data.lastName || "",
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          domainName: finalDomain,
          domainStatus: domainStatus || "EXISTING"
        },
      });
      return NextResponse.json({ success: true, user: { id: user.id }, loginEmail });
    } 
    else if (accountType === "BUSINESS" || accountType === "EMPRESA") {
      const companyName = data.companyName || "Empresa RapiEmail";
      const company = await prisma.company.create({
        data: {
          name: companyName,
          employeeCount: data.employeeCount || "1-10",
          region: data.region || "PT",
          address: data.address,
          domainStatus: domainStatus || "EXISTING",
          domainName: finalDomain,
          users: {
            create: {
              accountType: "BUSINESS",
              email: loginEmail,
              password: hashedPassword,
              firstName: data.firstName || "Admin",
              lastName: data.lastName || companyName,
              domainName: finalDomain,
              domainStatus: domainStatus || "EXISTING"
            }
          }
        }
      });
      return NextResponse.json({ success: true, companyId: company.id, loginEmail });
    }
    
    // Fallback padrão se não for nem PERSONAL nem BUSINESS explícito
    const defaultUser = await prisma.user.create({
      data: {
        accountType: "BUSINESS",
        email: loginEmail,
        password: hashedPassword,
        firstName: data.firstName || "Admin",
        lastName: data.lastName || "Empresa",
        domainName: finalDomain,
        domainStatus: domainStatus || "EXISTING"
      },
    });

    return NextResponse.json({ success: true, user: { id: defaultUser.id }, loginEmail });

  } catch (error: any) {
    console.error("Register Server Error:", error);
    return NextResponse.json({ error: error?.message || "Erro ao processar registo. Tente novamente." }, { status: 500 });
  }
}
