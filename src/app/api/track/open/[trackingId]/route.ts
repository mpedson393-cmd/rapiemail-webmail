import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

      // Atualiza o email na base de dados
      await prisma.email.updateMany({
        where: { trackingId },
        data: {
          isOpened: true,
          openedAt: new Date(),
          openCount: { increment: 1 },
          userAgent: userAgent.substring(0, 250),
        },
      });
    }
  } catch (error) {
    console.error("Erro no rastreamento de abertura:", error);
  }

  // Devolve o pixel 1x1 sem cache para garantir que cada abertura é registada
  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": TRANSPARENT_GIF_BUFFER.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
