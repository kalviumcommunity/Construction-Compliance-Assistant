'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Download,
  Filter,
  RefreshCw,
  FileCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useQueryHistory } from '@/lib/api';

export default function HistoryPage() {
  const { history, isLoading, error, mutate } = useQueryHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('all');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');

  // Extract unique trades from history
  const uniqueTrades = useMemo(() => {
    const trades = new Set(history.map((h) => h.trade).filter(Boolean));
    return Array.from(trades);
  }, [history]);

  // Filtered list
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.trade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.verdict.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVerdict =
        selectedVerdict === 'all' || item.verdict === selectedVerdict;

      const matchesTrade =
        selectedTrade === 'all' || item.trade === selectedTrade;

      return matchesSearch && matchesVerdict && matchesTrade;
    });
  }, [history, searchQuery, selectedVerdict, selectedTrade]);

  // Export audit log to CSV
  const handleExportCSV = () => {
    if (!history.length) return;
    const headers = ['ID', 'Date', 'Query', 'Trade', 'Verdict', 'Confidence', 'Sources Count'];
    const rows = history.map((h) => [
      h.id,
      new Date(h.date).toISOString(),
      `"${h.query.replace(/"/g, '""')}"`,
      h.trade,
      h.verdict,
      (h.confidence * 100).toFixed(1) + '%',
      h.sourcesCount || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sitesafe-compliance-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <PageHeader
          title="Compliance Verification Audit Log"
          description="Official historical record of regulatory verifications, building code determinations, and citation provenance."
          icon={History}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!history.length}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
          <Button size="sm" asChild className="gap-1.5 text-xs font-semibold">
            <Link href="/assistant">
              <FileCheck className="w-3.5 h-3.5" />
              <span>New Verification</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Search & Filters Panel ───────────────────────────────────── */}
      <div className="bento-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search past verification queries, building trades, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-lg border text-xs">
              <span className="text-muted-foreground px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Verdict:
              </span>
              {[
                { label: 'All', value: 'all' },
                { label: 'Compliant', value: 'Compliant' },
                { label: 'Non-Compliant', value: 'Non-Compliant' },
                { label: 'Ambiguous', value: 'Ambiguous/Insufficient Data' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSelectedVerdict(pill.value)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedVerdict === pill.value
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {uniqueTrades.length > 0 && (
              <select
                aria-label="Filter by trade"
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="bg-background border border-input rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Trades</option>
                {uniqueTrades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => mutate()}
              className="h-8 w-8 text-muted-foreground"
              title="Refresh History"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Ledger Results List ──────────────────────────────────────── */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 shimmer-mask border border-border/40" />
          ))
        ) : error ? (
          <div className="p-8 text-center border border-destructive/30 rounded-xl bg-destructive/5 space-y-2">
            <p className="text-sm font-semibold text-destructive">Failed to load verification history</p>
            <p className="text-xs text-muted-foreground">Make sure the backend is reachable on port 8000.</p>
            <Button size="sm" variant="outline" onClick={() => mutate()}>
              Retry
            </Button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bento-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Verification Records Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {searchQuery || selectedVerdict !== 'all' || selectedTrade !== 'all'
                ? 'No past determinations matched your active search filters. Try clearing or expanding your criteria.'
                : 'No compliance inquiries have been executed yet. Run a verification query in the assistant to initiate the audit trail.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedVerdict('all');
                  setSelectedTrade('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isCompliant = item.verdict === 'Compliant';
            const isNonCompliant = item.verdict === 'Non-Compliant';

            return (
              <div
                key={item.id}
                className="bento-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/50 transition-all"
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isCompliant
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : isNonCompliant
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isCompliant ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isNonCompliant ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5" />
                      )}
                      {item.verdict}
                    </span>

                    <Badge variant="outline" className="text-xs font-mono">
                      {item.trade}
                    </Badge>

                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(item.confidence * 100)}% Confidence
                    </span>

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {item.query}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="gap-1.5 text-xs border-border hover:border-primary/50 group-hover:text-primary"
                  >
                    <Link href={`/assistant?q=${encodeURIComponent(item.query)}`}>
                      <span>Re-verify in Assistant</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
