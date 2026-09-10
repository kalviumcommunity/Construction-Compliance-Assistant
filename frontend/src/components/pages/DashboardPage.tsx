'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Search,
  ClipboardCheck,
  ArrowRight,
  Activity,
  Cpu,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useSystemHealth,
  useCorpusStats,
  useQueryHistory,
  useProjects,
  useInspections,
} from '@/lib/api';

export default function DashboardPage() {
  const { health, isLoading: healthLoading } = useSystemHealth();
  const { stats, isLoading: statsLoading } = useCorpusStats();
  const { history, isLoading: historyLoading } = useQueryHistory();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { inspections, isLoading: inspectionsLoading } = useInspections();

  const activeProjects = projects.filter((p) => p.status === 'active');
  const compliantQueries = history.filter((h) => h.verdict === 'Compliant').length;
  const complianceRate =
    history.length > 0 ? Math.round((compliantQueries / history.length) * 100) : 100;

  const totalChunks = stats?.total_chunks ?? 0;
  const totalDocs = stats?.total_documents ?? 0;

  return (
    <div className="w-full space-y-8 animate-fade-up">
      {/* ─── Top Telemetry Header ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              SiteSafe Regulatory Telemetry
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Continuous construction compliance verification, live vector corpus telemetry, and QA/QC findings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Engine Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-foreground">
              {health?.llm_provider || 'Gemini 2.5 Flash'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-mono text-[11px]">
              {health?.vector_store || 'Qdrant'} ({totalChunks} chunks)
            </span>
          </div>

          <Button asChild className="gap-2 font-semibold shadow-sm glow-primary">
            <Link href="/assistant">
              <Search className="w-4 h-4" />
              <span>Verify Compliance</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Bento Grid: 4 Top KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Active Projects */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Covered Projects
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {projectsLoading ? (
              <div className="h-8 w-16 rounded bg-muted shimmer-mask" />
            ) : (
              <div className="text-3xl font-bold font-mono tracking-tight">
                {activeProjects.length}
                <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">
                  / {projects.length} active
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">100% monitored</span>
              <span>with active code coverage</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Indexed Regulatory Corpus */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Indexed Clauses
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {statsLoading ? (
              <div className="h-8 w-20 rounded bg-muted shimmer-mask" />
            ) : (
              <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {totalChunks}
                <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">
                  chunks
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              Across <span className="font-semibold text-foreground">{totalDocs}</span> regulatory specifications
            </p>
          </div>
        </div>

        {/* Metric 3: Total Verifications */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Compliance Checks
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {historyLoading ? (
              <div className="h-8 w-16 rounded bg-muted shimmer-mask" />
            ) : (
              <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {history.length}
                <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">
                  logged
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">{complianceRate}%</span>
              <span>conformity pass rate</span>
            </p>
          </div>
        </div>

        {/* Metric 4: AI Engine Health */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Inference Engine
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {healthLoading ? (
              <div className="h-8 w-24 rounded bg-muted shimmer-mask" />
            ) : (
              <div className="text-xl font-bold text-foreground truncate">
                GA Google GenAI
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Structured Pydantic Enforcement</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Bento Grid: Middle Section ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Compliance Inferences (col-span-2) */}
        <div className="lg:col-span-2 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Recent Regulatory Verifications</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Live Telemetry
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time field queries validated against local codes and contract specifications.
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                <Link href="/history">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {historyLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted/40 shimmer-mask border border-border/40" />
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No Compliance Queries Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Submit your first field question or material specification to run an automated regulatory check.
                  </p>
                  <Button size="sm" asChild className="mt-2">
                    <Link href="/assistant">Open Compliance Assistant</Link>
                  </Button>
                </div>
              ) : (
                history.slice(0, 5).map((q) => {
                  const isCompliant = q.verdict === 'Compliant';
                  const isNonCompliant = q.verdict === 'Non-Compliant';

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isCompliant
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : isNonCompliant
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isCompliant ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isNonCompliant ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <HelpCircle className="w-3 h-3" />
                            )}
                            {q.verdict}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {Math.round(q.confidence * 100)}% Match
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {q.trade}
                          </Badge>
                        </div>
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate max-w-lg">
                          {q.query}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(q.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors"
                        >
                          <Link href={`/assistant?q=${encodeURIComponent(q.query)}`}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Deterministic RAG Retrieval with Reciprocal Rank Fusion</span>
            <Link href="/evaluation" className="text-primary hover:underline flex items-center gap-1 font-medium">
              View Precision Benchmarks <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Regulatory Coverage & Authorities (col-span-1) */}
        <div className="bento-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Regulatory Standards</span>
              </h2>
              <Badge variant="outline" className="text-[10px]">
                {totalDocs} Codes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Statutory building authorities actively indexed in high-dimensional vector space:
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                { code: 'IBC 2024', name: 'International Building Code', trade: 'Structural & Fire', count: '14 Sections' },
                { code: 'NEC 2023', name: 'National Electrical Code (NFPA 70)', trade: 'Electrical', count: '18 Articles' },
                { code: 'OSHA 1926', name: 'Safety & Health for Construction', trade: 'Worker Safety', count: '9 Subparts' },
                { code: 'ADA 2010', name: 'Accessible Design Standards', trade: 'Accessibility', count: '12 Chapters' },
                { code: 'IECC 2021', name: 'International Energy Conservation', trade: 'Mechanical & Envelope', count: '6 Chapters' },
              ].map((std) => (
                <div
                  key={std.code}
                  className="p-2.5 rounded-lg border border-border/50 bg-secondary/30 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="clause-badge">{std.code}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                      {std.name}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {std.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" className="w-full gap-2 text-xs" asChild>
              <Link href="/documents">
                <Layers className="w-3.5 h-3.5" />
                <span>Open Regulatory Repository</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Bento Grid: Bottom Section (Inspections + Active Projects) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending QA/QC Site Inspections */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span>Active QA/QC Field Inspections</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                On-site regulatory compliance observations and remediation punch lists.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link href="/inspections">
                <span>View Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="space-y-2.5">
            {inspectionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted/40 shimmer-mask border border-border/40" />
              ))
            ) : inspections.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No active inspections recorded.
              </p>
            ) : (
              inspections.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border/50 bg-secondary/20 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'critical'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : item.status === 'warning'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.clauseNumber && (
                        <span className="clause-badge">{item.clauseNumber}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.finding}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.location} • Inspector: {item.inspector}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {item.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Projects Overview */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Project Portfolio Conformity</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active jobsite specifications mapped against municipal building jurisdictions.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link href="/projects">
                <span>All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {projectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/40 shimmer-mask border border-border/40" />
              ))
            ) : (
              projects.slice(0, 3).map((p) => {
                const score = p.complianceRate || 94;
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-border/50 bg-secondary/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{p.name}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {p.location} • {p.specCount || 12} Specs Indexed
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-foreground">
                          {score}%
                        </span>
                        <div className="text-[10px] text-muted-foreground">Compliance Score</div>
                      </div>
                    </div>
                    {/* Compliance Progress Bar */}
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 90
                            ? 'bg-emerald-500'
                            : score >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
