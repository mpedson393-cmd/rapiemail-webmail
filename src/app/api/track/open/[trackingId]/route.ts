import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// 1x1 Transparent GIF Byte Buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function getPixelResponse() {
  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": TRANSPARENT_GIF_BUFFER.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    if (!trackingId) {
      return getPixelResponse();
    }

    const userAgent = req.headers.get("user-agent") || "Desconhecido";
    const uaLower = userAgent.toLowerCase();

    // 1. FILTRO ANTI-BOTS: Ignorar scanners automáticos de antivírus e gateways SMTP
    const isAutomatedScanner = 
      uaLower.includes("chrome/42.0.2311.135") || 
      uaLower.includes("edge/12.246") || 
      uaLower.includes("bot") || 
      uaLower.includes("crawl") || 
      uaLower.includes("spider") || 
      uaLower.includes("scanner") || 
      uaLower.includes("headless") || 
      uaLower.includes("preview");

    if (isAutomatedScanner) {
      console.log(`[Anti-Bot Filter] Requisição automática ignorada: ${userAgent}`);
      return getPixelResponse();
    }

    // 2. FILTRO DE COOLDOWN TEMPORAL:
    // Buscar o email correspondente na base de dados
    const email = await prisma.email.findUnique({
      where: { trackingId }
    });

    if (!email) {
      return getPixelResponse();
    }

    // Se o pedido chegou nos primeiros 8 segundos do envio, é o scanner de saída do provedor
    const elapsedSeconds = (Date.now() - new Date(email.createdAt).getTime()) / 1000;
    if (elapsedSeconds < 8) {
      console.log(`[Anti-Bot Cooldown] Ignorada abertura imediata nos primeiros ${elapsedSeconds.toFixed(1)}s`);
      return getPixelResponse();
    }

    // 3. IDENTIFICAR DISPOSITIVO HUMANO LEGÍVEL
    let readableDevice = "Dispositivo do Destinatário";
    if (uaLower.includes("iphone") || uaLower.includes("ipad")) {
      readableDevice = "iPhone / iPad (Apple Mail)";
    } else if (uaLower.includes("android")) {
      readableDevice = "Android (Gmail / Mail App)";
    } else if (uaLower.includes("macintosh") || uaLower.includes("mac os")) {
      readableDevice = "Mac OS (Apple Mail / Safari)";
    } else if (uaLower.includes("windows")) {
      readableDevice = "Windows PC (Gmail / Outlook)";
    } else if (uaLower.includes("linux")) {
      readableDevice = "Linux (Navegador)";
    }

    // 4. REGISTAR ABERTURA REAL PELO DESTINATÁRIO
    await prisma.email.update({
      where: { id: email.id },
      data: {
        isOpened: true,
        openedAt: new Date(),
        openCount: { increment: 1 },
        userAgent: readableDevice,
      },
    });

    console.log(`[RapiEmail Real Open] Email "${email.subject}" LIDO com sucesso por humano! Dispositivo: ${readableDevice}`);

  } catch (error) {
    console.error("Erro no rastreamento de abertura:", error);
  }

  return getPixelResponse();
}
