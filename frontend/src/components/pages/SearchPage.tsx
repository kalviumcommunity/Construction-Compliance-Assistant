'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, Filter, Layers, CheckCircle2, ArrowRight, Sparkles, Hash, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api, RetrievedChunkInfo } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [docType, setDocType] = useState('All');
  const [topK, setTopK] = useState(5);

  const [loading, setLoading] = useState(false);
  const [chunks, setChunks] = useState<RetrievedChunkInfo[]>([]);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.verifyCompliance({
        query: query.trim(),
        trade,
        jurisdiction,
        document_type: docType,
        top_k: topK,
      });
      setChunks(response.retrieved_chunks || []);
      setSearchMeta(response.search_metadata);
    } catch (err: any) {
      setError(err.message || 'Failed to query hybrid vector index.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    { label: "IBC 705.8 Setbacks", text: "IBC 705.8 exterior wall opening protection and lot line setbacks", trade: "Fire Safety" },
    { label: "Plenum PVC Prohibition", text: "Is rigid nonmetallic PVC conduit prohibited in ceiling air plenums?", trade: "Electrical" },
    { label: "Post-Tensioned Concrete PSI", text: "Minimum 28-day compressive strength for elevated post-tensioned slabs", trade: "Structural" },
    { label: "Plumbing Hydrostatic Test", text: "UPC 312.2 drainage and vent hydrostatic water test 10-ft head", trade: "Plumbing" },
  ];

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <PageHeader
        title="RAG Search Explorer"
        description="Inspect dense semantic matching, BM25 sparse keyword retrieval, and Reciprocal Rank Fusion (RRF) across Qdrant."
        icon={Search}
      />

      {/* Query Bar */}
      <Card className="border-border/80">
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search regulations by clause number (e.g. 'IBC 705.8', 'NEC 300.22') or field concept..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-md bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="gap-2 px-5 font-semibold">
              <Search className="w-4 h-4" />
              {loading ? 'Retrieving...' : 'Hybrid Search'}
            </Button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Quick Clause Lookups:
            </span>
            {sampleQueries.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(s.text);
                  setTrade(s.trade);
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary/40 hover:bg-primary/10 hover:border-primary/50 text-foreground transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">Trade Scope:</span>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="rounded bg-secondary/50 border border-border px-2 py-1 focus:outline-none"
              >
                {['All', 'Electrical', 'Structural', 'Fire Safety', 'Plumbing'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Jurisdiction:</span>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="rounded bg-secondary/50 border border-border px-2 py-1 focus:outline-none"
              >
                {['All', 'National', 'California', 'NYC'].map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Doc Type:</span>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="rounded bg-secondary/50 border border-border px-2 py-1 focus:outline-none"
              >
                {['All', 'Code', 'Project Spec', 'Inspection Log'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-muted-foreground font-medium">Top Chunks:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="rounded bg-secondary/50 border border-border px-2 py-1 focus:outline-none"
              >
                {[3, 5, 8, 10].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          Error: {error}
        </Card>
      )}

      {searchMeta && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Retrieved <strong className="text-foreground">{chunks.length}</strong> candidate chunks in{" "}
            <strong className="text-foreground">{searchMeta.elapsed_time_ms} ms</strong> via {searchMeta.retrieval_mode}
          </span>
        </div>
      )}

      {chunks.length > 0 && (
        <div className="space-y-4">
          {chunks.map((chunk, idx) => (
            <Card key={chunk.chunk_id || idx} className="border-border/70 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {chunk.trade}
                      </span>
                      <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                        {chunk.jurisdiction}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Score: {chunk.score}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      {chunk.doc_title}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-primary font-medium mt-0.5">
                      {chunk.clause_number} ({chunk.page_or_section})
                    </CardDescription>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/60">
                    Rank #{idx + 1}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-foreground/90 font-mono bg-secondary/20 p-3.5 rounded-md mx-6 mb-4 border border-border/40 whitespace-pre-wrap leading-relaxed">
                {chunk.text}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
