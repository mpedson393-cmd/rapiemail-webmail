"use client";
import React, { useState } from 'react';
import { 
  X, Sparkles, Globe, Rocket, Check, Building2, Phone, MapPin, 
  Upload, Eye, CreditCard, RefreshCw, Layers, ShieldCheck 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userDomain: string;
}

export function RapiSiteBuilderModal({ isOpen, onClose, userDomain }: Props) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('form');
  const [paying, setPaying] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSite = async () => {
    if (!businessName || !description) {
      alert("Preencha o nome da loja/negócio e a descrição.");
      return;
    }
    setGenerating(true);

    const prompt = `Cria o código HTML5 completo e CSS moderno Tailwind (num único ficheiro limpo) para o website da empresa "${businessName}".
Tipo de Negócio: ${businessType || 'Empresa Corporativa'}
Descrição / Serviços: ${description}
Contacto: ${phone || 'Contacto via formulário'}
Morada: ${address || 'Lisboa, Portugal'}

Regras Obrigatórias:
1. Deves criar uma landing page moderna com cabeçalho, hero section com título chamativo e botão CTA, secção de serviços/produtos com cartões elegantes, sobre nós, contactos e rodapé.
2. Usa estilo dark mode executivo com degradês azul/púrpura (#4f46e5), texto branco e fonte sans-serif.
3. Responde APENAS com o código HTML puro sem explicações adicionais.`;

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode: "summary" })
      });
      const data = await res.json();
      
      let html = data.summary || "";
      if (html.includes("```html")) {
        html = html.replace(/```html/g, "").replace(/```/g, "").trim();
      }

      // If AI returns markdown, wrap it in a beautiful clean HTML template
      if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<html")) {
        html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#09090b] text-zinc-100 font-sans min-h-screen">
  <header class="border-b border-white/10 px-8 py-5 flex justify-between items-center bg-black/40 backdrop-blur-md sticky top-0 z-50">
    <h1 class="text-xl font-bold text-white tracking-tight">${businessName}</h1>
    <a href="#contacto" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-600/30">Contactar Agora</a>
  </header>
  
  <section class="max-w-5xl mx-auto px-6 py-20 text-center">
    <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">Website Oficial</span>
    <h2 class="text-4xl sm:text-5xl font-black text-white mt-4 mb-6 leading-tight">${businessName}</h2>
    <p class="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">${description}</p>
    <div class="flex justify-center gap-4">
      <a href="#servicos" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-full text-sm transition-all shadow-xl shadow-indigo-600/30">Ver Nossos Serviços</a>
    </div>
  </section>

  <section id="servicos" class="max-w-5xl mx-auto px-6 py-16 border-t border-white/5">
    <h3 class="text-2xl font-bold text-white text-center mb-12">O Que Oferecemos</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all">
        <h4 class="text-lg font-bold text-white mb-2">Qualidade Premium</h4>
        <p class="text-xs text-zinc-400 leading-relaxed">Produtos e serviços de alta categoria com garantia total de satisfação.</p>
      </div>
      <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all">
        <h4 class="text-lg font-bold text-white mb-2">Atendimento Personalizado</h4>
        <p class="text-xs text-zinc-400 leading-relaxed">Suporte dedicado para atender todas as necessidades dos nossos clientes.</p>
      </div>
      <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all">
        <h4 class="text-lg font-bold text-white mb-2">Entregas Rápidas</h4>
        <p class="text-xs text-zinc-400 leading-relaxed">Agilidade e profissionalismo em cada processo do nosso negócio.</p>
      </div>
    </div>
  </section>

  <section id="contacto" class="max-w-3xl mx-auto px-6 py-16 text-center border-t border-white/5">
    <h3 class="text-2xl font-bold text-white mb-4">Fale Connosco</h3>
    <p class="text-sm text-zinc-400 mb-6">📍 ${address || 'Lisboa, Portugal'} • 📞 ${phone || '+351 900 000 000'}</p>
    <a href="mailto:${userDomain}" class="inline-block bg-white text-black font-bold px-8 py-3.5 rounded-full text-xs hover:bg-zinc-200 transition-all">Enviar E-mail Oficial</a>
  </section>

  <footer class="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
    © 2026 ${businessName}. Alojado no domínio ${userDomain} via RapiEmail & DigitalOcean.
  </footer>
</body>
</html>`;
      }

      setGeneratedHtml(html);
      setPreviewTab('preview');
    } catch(err) {
      alert("Erro ao gerar website com RapiAI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStripePayment = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "HOSTING_ADDON", domainName: userDomain })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch(err) {
      alert("Erro ao conectar ao Stripe.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-[850px] h-[680px] max-h-[92vh] bg-[#121215] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1a1a20] px-6 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Criador de Website IA & Alojamento DigitalOcean</h3>
              <p className="text-[11px] text-zinc-400">Domínio oficial: <strong className="text-indigo-400">{userDomain}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5 text-xs">
              <button 
                onClick={() => setPreviewTab('form')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${previewTab === 'form' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                1. Dados da Loja
              </button>
              <button 
                disabled={!generatedHtml}
                onClick={() => setPreviewTab('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-all disabled:opacity-40 ${previewTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                2. Pré-visualização do Site
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-[#0d0d10] p-6">
          
          {previewTab === 'form' ? (
            <div className="max-w-2xl mx-auto space-y-5">
              
              <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-400 flex-shrink-0 animate-pulse" />
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Escreve os detalhes do teu negócio. A **RapiAI com Google Gemini 3.6 Flash** gera o site responsivo completo em 10 segundos e publica no servidor da **DigitalOcean** por apenas 88€/ano!
                </p>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">Nome do Negócio / Loja *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="Ex.: Barbearia Mendes, Moda & Estilo, Tech Solutions..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">Ramo de Atividade</label>
                  <input 
                    type="text" 
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    placeholder="Ex.: Loja de Roupa, Consultoria, Barbearia, Restaurante..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">Descrição dos Serviços ou Produtos *</label>
                  <textarea 
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descreve o que vendes ou fazes. Ex.: Vendemos vestuário masculino e feminino com entregas rápidas em todo o país..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1.5">Telefone de Contacto</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+351 900 000 000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1.5">Morada da Loja</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Lisboa, Portugal"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateSite}
                disabled={generating || !businessName || !description}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/30 active:scale-98"
              >
                {generating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>RapiAI a desenhar o website com Google Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>✨ Gerar Website Completo com RapiAI</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            /* Live Preview Frame */
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between bg-black/40 px-4 py-2 rounded-xl border border-white/5 text-xs">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  Pré-visualização em tempo real do site para <strong className="text-white">{userDomain}</strong>
                </span>
                <button 
                  onClick={handleGenerateSite} 
                  disabled={generating}
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                  Regerar
                </button>
              </div>

              {/* HTML Iframe */}
              <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <iframe 
                  srcDoc={generatedHtml}
                  title="Website Preview"
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Checkout Action */}
        <div className="bg-[#1a1a20] border-t border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Preço do Alojamento Web + Servidor DigitalOcean:</span>
            <span className="text-sm font-black text-white bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">
              88€ / ano
            </span>
          </div>

          <button
            onClick={handleStripePayment}
            disabled={paying}
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-full text-xs flex items-center gap-2 transition-all shadow-lg shadow-green-600/30 active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            <span>{paying ? "A abrir Stripe..." : "🚀 Colocar Site no Ar (Pagar 88€)"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
