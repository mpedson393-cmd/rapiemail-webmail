// Unified Multi-Provider AI Engine for RapiEmail
// Providers: Groq API (Ultra-Fast), NVIDIA NIM API, Google Gemini API

export interface AiCompletionOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAiCompletion(options: AiCompletionOptions): Promise<string | null> {
  const { prompt, systemInstruction, temperature = 0.7, maxTokens = 1000 } = options;

  // 1. Tentar Groq API (Inferência ultra-rápida em milissegundos)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const messages = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3.6-27b",
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content || "";
        // Remover blocos <think> do modelo Qwen se existirem
        content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (content) {
          console.log("[RapiAI] Resposta gerada com sucesso via Groq Ultra-Fast API.");
          return content;
        }
      } else {
        console.warn("[RapiAI] Groq API respondeu com status:", res.status);
      }
    } catch (err: any) {
      console.warn("[RapiAI] Aviso no Groq API:", err.message);
    }
  }

  // 2. Tentar Google Gemini API (Modelos Gemini Flash)
  const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyCpVLmwi5oDz94e2nvSAuhlQZul0XoHdSc";
  if (geminiKey) {
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            console.log(`[RapiAI] Resposta gerada com sucesso via Gemini (${model}).`);
            return content;
          }
        }
      } catch (e: any) {
        console.warn(`[RapiAI] Falha no Gemini (${model}):`, e.message);
      }
    }
  }

  // 3. Tentar NVIDIA NIM API (Aceleração GPU)
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const messages = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-ai/deepseek-v4-flash-0731",
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          console.log("[RapiAI] Resposta gerada com sucesso via NVIDIA NIM GPU API.");
          return content;
        }
      }
    } catch (err: any) {
      console.warn("[RapiAI] Aviso na NVIDIA NIM API:", err.message);
    }
  }

  return null;
}
