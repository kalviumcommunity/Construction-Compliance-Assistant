'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ArrowRight,
  ShieldAlert,
  Building,
  UserCheck,
  Calendar,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useInspections } from '@/lib/api';

export default function InspectionsPage() {
  const { inspections, isLoading, error, mutate } = useInspections();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const s = (item.status || '').toLowerCase();
      const matchesSearch =
        (item.finding || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.inspector || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.clauseNumber && item.clauseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'critical' && (s.includes('critical') || s.includes('non-compliant') || s.includes('ncr'))) ||
        (statusFilter === 'warning' && (s.includes('warn') || s.includes('advisory'))) ||
        (statusFilter === 'passed' && (s.includes('pass') || s.includes('approved') || s.includes('conforming')));

      return matchesSearch && matchesStatus;
    });
  }, [inspections, searchQuery, statusFilter]);

  const criticalCount = inspections.filter((i) => {
    const s = (i.status || '').toLowerCase();
    return s.includes('critical') || s.includes('non-compliant') || s.includes('ncr');
  }).length;

  const warningCount = inspections.filter((i) => {
    const s = (i.status || '').toLowerCase();
    return s.includes('warn') || s.includes('advisory');
  }).length;

  const passedCount = inspections.filter((i) => {
    const s = (i.status || '').toLowerCase();
    return s.includes('pass') || s.includes('approved') || s.includes('conforming');
  }).length;

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <PageHeader
          title="QA/QC Inspection Ledger"
          description="Jobsite compliance punch list, code non-conformance tracking, and statutory violation resolution."
          icon={ClipboardCheck}
        />
        <Button asChild className="gap-2 font-semibold shadow-sm">
          <Link href="/assistant">
            <ShieldAlert className="w-4 h-4" />
            <span>Verify Defect in Assistant</span>
          </Link>
        </Button>
      </div>

      {/* ─── Metric Summary Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Critical Violations
            </div>
            <div className="text-2xl font-bold font-mono text-rose-500 mt-1">
              {isLoading ? '...' : criticalCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mandatory stop-work / immediate remediation</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Advisories & Warnings
            </div>
            <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
              {isLoading ? '...' : warningCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Correction required prior to closeout</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Conforming Items
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
              {isLoading ? '...' : passedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verified compliant with statutory specs</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filters ──────────────────────────────────── */}
      <div className="bento-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search inspections by location, defect observation, inspector, or code clause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-lg border text-xs flex-wrap">
          <span className="text-muted-foreground px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { label: 'All', value: 'all' },
            { label: 'Critical', value: 'critical' },
            { label: 'Warning', value: 'warning' },
            { label: 'Passed', value: 'passed' },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setStatusFilter(pill.value)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === pill.value
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Inspection Ledger Cards ──────────────────────────────────── */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 shimmer-mask border border-border/40" />
          ))
        ) : filteredInspections.length === 0 ? (
          <div className="bento-card p-12 text-center space-y-2">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Inspections Match Your Filter</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your query or status filter to see other jobsite inspection findings.
            </p>
          </div>
        ) : (
          filteredInspections.map((item) => {
            const s = (item.status || '').toLowerCase();
            const isCritical = s.includes('critical') || s.includes('non-compliant') || s.includes('ncr');
            const isWarning = s.includes('warn') || s.includes('advisory');

            return (
              <div
                key={item.id}
                className="bento-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        isCritical
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      }`}
                    >
                      {isCritical ? (
                        <XCircle className="w-3 h-3" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {item.status}
                    </span>

                    {item.clauseNumber && (
                      <span className="clause-badge">{item.clauseNumber}</span>
                    )}

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {item.location}
                    </span>

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      {item.inspector}
                    </span>

                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {item.finding}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="gap-1.5 text-xs hover:border-primary/50"
                  >
                    <Link
                      href={`/assistant?q=${encodeURIComponent(
                        `Verify code compliance and remediation steps for: ${item.finding} (${item.clauseNumber || 'building code'})`
                      )}`}
                    >
                      <span>Analyze in Assistant</span>
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
