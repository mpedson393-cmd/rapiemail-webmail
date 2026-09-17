// Unified Multi-Provider AI Engine for RapiEmail
// Priorities: 1. NVIDIA NIM GPU API -> 2. Groq Ultra-Fast LPU API (OpenAI 120B & Qwen 3.8) -> 3. Google Gemini API

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  image?: string; // base64 or url
}

export interface AiCompletionOptions {
  prompt?: string;
  messages?: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  images?: string[]; // base64 or urls
}

// Circuit breaker para NVIDIA caso chave esteja sem créditos / 403
let nvidiaDisabledUntil = 0;

export async function generateAiCompletion(options: AiCompletionOptions): Promise<string | null> {
  const { prompt, messages: inputMessages, systemInstruction, temperature = 0.7, maxTokens = 1500, images = [] } = options;

  // 1. PRIORIDADE #1: NVIDIA NIM GPU API (Se chave estiver ativa e com créditos)
  const rawNvidiaKey = process.env.NVIDIA_API_KEY || "";
  const nvidiaKey = rawNvidiaKey.replace(/['"]/g, '').trim();

  if (nvidiaKey && Date.now() > nvidiaDisabledUntil) {
    const nvidiaModels = [
      "meta/llama-3.2-90b-vision-instruct",
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "mistralai/mistral-large-2-instruct",
      "meta/llama-3.2-11b-vision-instruct"
    ];

    const messages: Array<{ role: string; content: any }> = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    if (inputMessages && inputMessages.length > 0) {
      inputMessages.forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    } else if (prompt) {
      messages.push({ role: "user", content: prompt });
    }

    for (const model of nvidiaModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          let content = data?.choices?.[0]?.message?.content;
          if (content) {
            content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            console.log(`[RapiAI] 🟢 Resposta gerada com SUCESSO NATIVO via NVIDIA NIM API (${model})`);
            return content;
          }
        } else if (res.status === 401 || res.status === 403) {
          console.warn(`[RapiAI] Chave NVIDIA sem créditos ou não autorizada (${res.status}). Ativando fallback para Groq LPU.`);
          nvidiaDisabledUntil = Date.now() + 5 * 60 * 1000; // Desativar probe por 5 minutos
          break;
        }
      } catch (err: any) {
        console.warn(`[RapiAI] Tentativa NVIDIA (${model}):`, err.message);
      }
    }
  }

  // 2. PRIORIDADE #2: Groq Ultra-Fast LPU API com Modelo de Fronteira OpenAI 120B & Qwen 3.8
  const rawGroqKey = process.env.GROQ_API_KEY || "";
  const groqKey = rawGroqKey.replace(/['"]/g, '').trim();

  if (groqKey) {
    const groqModels = [
      "openai/gpt-oss-120b", // Modelo de Fronteira 120B de Altíssima Inteligência (Nível GPT-4o / Claude 3.5)
      "qwen/qwen3.8-27b",
      "groq/compound",
      "openai/gpt-oss-20b"
    ];

    const groqMessages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      groqMessages.push({ role: "system", content: systemInstruction });
    }
    if (inputMessages && inputMessages.length > 0) {
      inputMessages.forEach(m => {
        groqMessages.push({ role: m.role, content: m.content });
      });
    } else if (prompt) {
      groqMessages.push({ role: "user", content: prompt });
    }

    for (const model of groqModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: groqMessages,
            temperature,
            max_tokens: maxTokens
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          let content = data?.choices?.[0]?.message?.content || "";
          content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          if (content) {
            console.log(`[RapiAI] 🟢 Resposta gerada com SUCESSO ULTRA-RÁPIDO via Groq (${model})`);
            return content;
          }
        }
      } catch (err: any) {
        console.warn(`[RapiAI] Groq fallback (${model}):`, err.message);
      }
    }
  }

  // 3. PRIORIDADE #3: Google Gemini API (Modelos Gemini Flash com Visão Multimodal Real)
  const rawGeminiKey = process.env.GEMINI_API_KEY || "";
  const geminiKey = rawGeminiKey.replace(/['"]/g, '').trim();
  
  if (geminiKey) {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    // Montar contents para Gemini
    const contents: Array<{ role: string; parts: Array<any> }> = [];

    if (inputMessages && inputMessages.length > 0) {
      inputMessages.forEach(m => {
        const parts: Array<any> = [{ text: m.content }];
        if (m.image && m.image.startsWith("data:")) {
          const match = m.image.match(/^data:(.*?);base64,(.*)$/);
          if (match) {
            parts.push({
              inline_data: {
                mime_type: match[1],
                data: match[2]
              }
            });
          }
        }
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts
        });
      });
    } else {
      const userParts: Array<any> = [{ text: prompt || "" }];
      images.forEach(img => {
        if (img.startsWith("data:")) {
          const match = img.match(/^data:(.*?);base64,(.*)$/);
          if (match) {
            userParts.push({
              inline_data: {
                mime_type: match[1],
                data: match[2]
              }
            });
          }
        }
      });
      contents.push({ role: "user", parts: userParts });
    }

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const bodyPayload: any = {
          contents,
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        };
        if (systemInstruction) {
          bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            console.log(`[RapiAI] 🟢 Resposta gerada com sucesso via Gemini (${model}).`);
            return content;
          }
        } else if (res.status === 403 || res.status === 400) {
          break;
        }
      } catch (e: any) {
        console.warn(`[RapiAI] Falha no Gemini (${model}):`, e.message);
      }
    }
  }

  return null;
}
