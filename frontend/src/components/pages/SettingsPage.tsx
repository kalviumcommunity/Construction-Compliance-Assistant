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
  FileCheck,
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
          title="System Status & Service Overview"
          description="Real-time health status, active regulatory libraries, security policies, and service diagnostics."
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
          <span>{isPinging ? 'Testing Connection...' : 'Test System Connection'}</span>
          {pingLatency !== null && (
            <span
              className={`font-mono text-[11px] font-bold ${
                pingLatency > 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {pingLatency > 0 ? `${pingLatency}ms (Good)` : 'Disconnected'}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Card 1: AI Compliance Assistant ──────────────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">AI Compliance Assistant</h3>
                <p className="text-xs text-muted-foreground">Automated regulatory analysis and verification engine</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
              Active &amp; Ready
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Assistant Provider</span>
              <span className="font-semibold text-foreground">
                {health?.llm_provider ? `${health.llm_provider.toUpperCase()} AI Engine` : 'Rule-Based Engine'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Active Model</span>
              <span className="font-semibold text-foreground">
                {health?.model || 'Gemini 2.5 Flash'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Verification Standard</span>
              <span className="font-semibold text-foreground">
                Strict Context Grounding (Verbatim Quotes)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Missing Data Protocol</span>
              <span className="font-semibold text-emerald-500">
                Safe Clarification (Flags Ambiguity)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Service Reliability</span>
              <span className="font-semibold text-foreground">
                Automatic Retry with Fallback Guardrails
              </span>
            </div>
          </div>
        </div>

        {/* ─── Card 2: Regulatory Knowledge Base ───────────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Regulatory Knowledge Base</h3>
                <p className="text-xs text-muted-foreground">Indexed building codes, specifications, and reports</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sky-500 border-sky-500/30 text-[10px]">
              Database Connected
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Indexed Sections</span>
              <span className="font-mono font-semibold text-foreground">
                {isLoading ? '...' : health?.indexed_documents || 0} Clauses
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Active Jurisdictions</span>
              <span className="font-semibold text-foreground">
                National Model, California, NYC
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Supported Trades</span>
              <span className="font-semibold text-foreground">
                Structural, Fire Safety, Electrical, Plumbing
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Search Precision</span>
              <span className="font-semibold text-emerald-500">
                Smart Semantic &amp; Clause Lookup
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Table &amp; Chart Preservation</span>
              <span className="font-semibold text-foreground">
                Active (Tables Kept Intact)
              </span>
            </div>
          </div>
        </div>

        {/* ─── Card 3: Security & Privacy Standards ─────────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Privacy &amp; Security Standards</h3>
                <p className="text-xs text-muted-foreground">Enterprise compliance, data protection, and safeguards</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
              Protected
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Data Privacy</span>
              <span className="font-semibold text-emerald-500">Confidential (No Public Model Training)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Access Protection</span>
              <span className="font-semibold text-foreground">Authorized API Key Authentication</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Abuse Prevention</span>
              <span className="font-semibold text-foreground">Rate Limiting Active</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Supported Upload Formats</span>
              <span className="font-semibold text-foreground">PDF, Markdown, HTML, Text</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Max Upload File Size</span>
              <span className="font-semibold text-foreground">10 MB Per Specification File</span>
            </div>
          </div>
        </div>

        {/* ─── Card 4: Service Components ───────────────────────────────── */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Application Services</h3>
                <p className="text-xs text-muted-foreground">Integrated compliance workflow services</p>
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">SiteSafe Suite</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: 'Compliance Verification', desc: 'Real-time building code checking and verdict engine' },
              { name: 'Document Knowledge Base', desc: 'Specification indexing, search, and storage' },
              { name: 'Jobsite Punch List', desc: 'Field inspection tracking and non-conformance logs' },
              { name: 'Project Portfolios', desc: 'Multi-jobsite tracking and jurisdictional mapping' },
              { name: 'Audit & Query History', desc: 'Official compliance log with CSV export capability' },
              { name: 'Document Ingestion', desc: 'Automated document ingestion and table parsing' },
            ].map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/40"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-foreground">{service.name}</span>
                </div>
                <span className="text-muted-foreground text-[11px]">{service.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
