'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Database,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useSystemHealth, API_BASE } from '@/lib/api';

export default function SettingsPage() {
  const { health, isLoading, mutate } = useSystemHealth();
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handleTestConnection = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      mutate();
    } catch {
      setPingLatency(-1);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <PageHeader
          title="System Engine & Security Diagnostics"
          description="Google GenAI GA SDK configuration, Qdrant vector store telemetry, and production DevSecOps controls."
          icon={Settings}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          disabled={isPinging}
          className="gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? 'Pinging Gateway...' : 'Ping Backend API'}</span>
          {pingLatency !== null && (
            <span
              className={`font-mono text-[11px] font-bold ${
                pingLatency > 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {pingLatency > 0 ? `${pingLatency}ms` : 'Failed'}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Card 1: Google GenAI GA SDK Telemetry ────────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Inference & LLM Architecture</h3>
                <p className="text-xs text-muted-foreground">Official GA SDK integration parameters</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
              GA SDK Active
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">SDK Package</span>
              <span className="font-mono font-semibold text-foreground">google-genai &gt;= 2.0.0</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Primary Model</span>
              <span className="font-mono font-semibold text-foreground">
                {health?.model || 'gemini-2.5-flash'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Structured Schema</span>
              <span className="font-mono font-semibold text-foreground">
                LLMComplianceOutput (Pydantic v2)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Context Window Budget</span>
              <span className="font-mono font-semibold text-foreground">16,000 chars (~4,000 tokens)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Retry & Resilience</span>
              <span className="font-mono font-semibold text-foreground">3 Retries (Exp Backoff + Jitter)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Out-of-Scope Fallback</span>
              <span className="font-mono font-semibold text-emerald-500">Deterministic Safe Refusal</span>
            </div>
          </div>
        </div>

        {/* ─── Card 2: Vector Store & Retrieval Engine ─────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Vector Store & Retrieval Engine</h3>
                <p className="text-xs text-muted-foreground">Qdrant dense + keyword index configuration</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sky-500 border-sky-500/30 text-[10px]">
              Qdrant Connected
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Collection Name</span>
              <span className="font-mono font-semibold text-foreground">
                {health?.collection_name || 'building_code_chunks'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Vector Dimensions</span>
              <span className="font-mono font-semibold text-foreground">768-dim (text-embedding-004)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Total Indexed Chunks</span>
              <span className="font-mono font-semibold text-foreground">
                {isLoading ? '...' : health?.indexed_documents || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Retrieval Strategy</span>
              <span className="font-mono font-semibold text-foreground">Hybrid RRF (Dense + BM25)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Concurrency Lock Handling</span>
              <span className="font-mono font-semibold text-foreground">Graceful In-Memory Fallback</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Distance Metric</span>
              <span className="font-mono font-semibold text-foreground">Cosine Similarity</span>
            </div>
          </div>
        </div>

        {/* ─── Card 3: DevSecOps & Rate Limiting Controls ───────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">DevSecOps & Rate Limiting</h3>
                <p className="text-xs text-muted-foreground">Production abuse prevention & network controls</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
              Enforced
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">CORS Policy</span>
              <span className="font-mono font-semibold text-emerald-500">Explicit Whitelist (No Wildcard)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Verify Rate Limit</span>
              <span className="font-mono font-semibold text-foreground">60 Requests / Minute</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Limiter Algorithm</span>
              <span className="font-mono font-semibold text-foreground">Sliding Window Memory Limiter</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Ingest Authentication</span>
              <span className="font-mono font-semibold text-foreground">X-API-Key Required</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">File Upload Limit</span>
              <span className="font-mono font-semibold text-foreground">50MB Max / PDF, TXT, MD</span>
            </div>
          </div>
        </div>

        {/* ─── Card 4: Gateway Endpoint Status ──────────────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">API Gateway Route Registry</h3>
                <p className="text-xs text-muted-foreground">Registered FastAPI HTTP endpoints</p>
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{API_BASE}</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { path: '/api/verify-compliance', method: 'POST', auth: 'Rate-Limited', desc: 'RAG Compliance Evaluation' },
              { path: '/api/health', method: 'GET', auth: 'Public', desc: 'System Telemetry & Status' },
              { path: '/api/documents', method: 'GET', auth: 'Public', desc: 'Indexed Building Specifications' },
              { path: '/api/stats', method: 'GET', auth: 'Public', desc: 'Corpus Aggregate Metrics' },
              { path: '/api/history', method: 'GET', auth: 'Public', desc: 'Audit Trail & Recent Queries' },
              { path: '/api/projects', method: 'GET', auth: 'Public', desc: 'Project Portfolios & Scores' },
              { path: '/api/inspections', method: 'GET', auth: 'Public', desc: 'QA/QC Punch List Ledger' },
              { path: '/api/ingest/upload', method: 'POST', auth: 'API Key', desc: 'File Ingestion Pipeline' },
              { path: '/api/reindex', method: 'POST', auth: 'API Key', desc: 'Corpus Vector Re-indexing' },
            ].map((route) => (
              <div
                key={route.path}
                className="flex items-center justify-between p-2 rounded-md bg-secondary/20 border border-border/40 font-mono text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      route.method === 'POST' ? 'bg-primary/20 text-primary' : 'bg-sky-500/20 text-sky-500'
                    }`}
                  >
                    {route.method}
                  </span>
                  <span className="text-foreground">{route.path}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[10px] hidden sm:inline">{route.desc}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {route.auth}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
