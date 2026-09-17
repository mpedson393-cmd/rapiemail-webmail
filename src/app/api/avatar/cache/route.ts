import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// In-memory LRU-like buffer cache for high-speed serving
const memoryCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const MAX_MEMORY_ENTRIES = 500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

// Diretório local de persistência permanente
const CACHE_DIR = path.join(process.cwd(), "public", "avatars", "cache");

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[Avatar Cache] Não foi possível criar diretório de cache:", err);
  }
}

function getSafeHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");
    const domain = searchParams.get("domain");

    let sourceUrl = targetUrl;
    if (!sourceUrl && domain) {
      sourceUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(domain)}&size=128`;
    }

    if (!sourceUrl) {
      return new NextResponse("URL ou domínio ausente", { status: 400 });
    }

    const hash = getSafeHash(sourceUrl);

    // 1. Verificar Cache em Memória
    const inMem = memoryCache.get(hash);
    if (inMem && Date.now() - inMem.timestamp < CACHE_TTL_MS) {
      return new NextResponse(new Uint8Array(inMem.buffer), {
        headers: {
          "Content-Type": inMem.contentType,
          "Cache-Control": "public, max-age=2592000, immutable",
          "X-Avatar-Cache": "HIT-MEMORY",
        },
      });
    }

    // 2. Verificar Persistência em Disco
    ensureCacheDir();
    if (fs.existsSync(CACHE_DIR)) {
      const diskMatches = fs.readdirSync(CACHE_DIR).filter((f) => f.startsWith(hash));
      if (diskMatches.length > 0) {
        const diskFile = path.join(CACHE_DIR, diskMatches[0]);
        try {
          const fileBuffer = fs.readFileSync(diskFile);
          const ext = path.extname(diskMatches[0]).replace(".", "");
          const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;

          // Atualizar memória
          if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
          }
          memoryCache.set(hash, { buffer: fileBuffer, contentType: mimeType, timestamp: Date.now() });

          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=2592000, immutable",
              "X-Avatar-Cache": "HIT-DISK",
            },
          });
        } catch (e) {
          // Fallthrough to fetch
        }
      }
    }

    // 3. Buscar Imagem Externa de Forma Segura com Timeout e User-Agent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return new NextResponse("Falha ao obter imagem remota", { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return new NextResponse("Conteúdo remoto não é uma imagem válida", { status: 415 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar no disco para persistência permanente
    const ext = getExtensionFromContentType(contentType);
    const savePath = path.join(CACHE_DIR, `${hash}.${ext}`);
    try {
      fs.writeFileSync(savePath, buffer);
    } catch (err) {
      console.warn("[Avatar Cache] Erro ao salvar imagem no disco:", err);
    }

    // Atualizar memória
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(hash, { buffer, contentType, timestamp: Date.now() });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000, immutable",
        "X-Avatar-Cache": "MISS",
      },
    });
  } catch (error: any) {
    return new NextResponse("Erro no serviço de cache de avatar", { status: 500 });
  }
}
