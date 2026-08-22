"use client";

import React, { useState } from 'react';
import { Search, CheckCircle2, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean;
  costPrice: number;
  price: number;
  popular: boolean;
}

interface Props {
  onSelectDomain: (domain: string) => void;
  selectedDomain?: string;
}

export function DomainSearchPicker({ onSelectDomain, selectedDomain }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch("/api/domains/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquise o nome da sua empresa (ex: rapiemail, padariasilva)..."
            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Verificar</span>
        </button>
      </form>

      {/* Results List */}
      {loading && (
        <div className="text-center py-6 text-xs text-zinc-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>A verificar disponibilidade do domínio em tempo real...</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Domínios Oficiais Disponíveis:</p>
          {results.map((r) => {
            const isChosen = selectedDomain === r.domain;
            return (
              <div
                key={r.domain}
                onClick={() => onSelectDomain(r.domain)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isChosen
                    ? 'bg-indigo-50 border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                    : 'bg-white border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    r.popular ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    .{r.tld}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900">{r.domain}</span>
                      {r.popular && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Disponível para registo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-900">{r.price.toFixed(2)}€</span>
                    <span className="text-[10px] text-zinc-500 block">/ ano</span>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isChosen
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {isChosen ? 'Selecionado' : 'Escolher'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
