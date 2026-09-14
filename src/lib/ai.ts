// Unified Multi-Provider AI Engine for RapiEmail
// Priorities: 1. NVIDIA NIM GPU API -> 2. Groq Ultra-Fast API -> 3. Google Gemini API

export interface AiCompletionOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAiCompletion(options: AiCompletionOptions): Promise<string | null> {
  const { prompt, systemInstruction, temperature = 0.7, maxTokens = 1000 } = options;

  // 1. PRIORIDADE #1: NVIDIA NIM GPU API (Execução Nativa da API NVIDIA)
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    const nvidiaModels = [
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "meta/llama-3.1-405b-instruct",
      "deepseek-ai/deepseek-r1",
      "mistralai/mistral-large-2-instruct",
      "microsoft/phi-3-medium-128k-instruct",
      "google/gemma-2-27b-it"
    ];

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    for (const model of nvidiaModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

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
        }
      } catch (err: any) {
        console.warn(`[RapiAI] Tentativa NVIDIA (${model}):`, err.message);
      }
    }
  }

  // 2. PRIORIDADE #2: Groq Ultra-Fast LPU API (Latência Ultra-Baixa < 300ms)
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
        content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (content) {
          console.log("[RapiAI] 🟢 Resposta gerada com sucesso via Groq Ultra-Fast API.");
          return content;
        }
      }
    } catch (err: any) {
      console.warn("[RapiAI] Groq API fallback:", err.message);
    }
  }

  // 3. PRIORIDADE #3: Google Gemini API (Modelos Gemini Flash)
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
            console.log(`[RapiAI] 🟢 Resposta gerada com sucesso via Gemini (${model}).`);
            return content;
          }
        }
      } catch (e: any) {
        console.warn(`[RapiAI] Falha no Gemini (${model}):`, e.message);
      }
    }
  }

  return null;
}
