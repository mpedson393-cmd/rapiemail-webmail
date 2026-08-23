import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// 1x1 Transparent GIF Byte Buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    if (trackingId) {
      const userAgent = req.headers.get("user-agent") || "Desconhecido";

      // Atualiza o status de leitura do email na base de dados Supabase
      await prisma.email.updateMany({
        where: { trackingId },
        data: {
          isOpened: true,
          openedAt: new Date(),
          openCount: { increment: 1 },
          userAgent: userAgent.substring(0, 250),
        },
      });

      console.log(`[RapiEmail Pixel Tracking] Email com trackingId "${trackingId}" foi ABERTO com sucesso!`);
    }
  } catch (error) {
    console.error("Erro no rastreamento de abertura:", error);
  }

  // Devolve o pixel 1x1 transparente sem cache para garantir que cada abertura é registada em tempo real
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
