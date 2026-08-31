'use client';

import React, { useState } from 'react';
import { ClipboardList, BookOpen, Layers, MessageSquareText, Printer, CheckCircle2, XCircle, HelpCircle, CheckSquare, FileText, MapPin, Check, Copy, ArrowRight } from 'lucide-react';
import { useAssistant } from './AssistantContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ResultsView() {
  const { result, loading, activeTab, setActiveTab, completedActions, toggleAction, setShowNoticeModal, setShowPrintModal } = useAssistant();
  const [copiedQuoteIdx, setCopiedQuoteIdx] = useState<number | null>(null);

  if (loading || !result) return null;

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuoteIdx(idx);
    setTimeout(() => setCopiedQuoteIdx(null), 2000);
  };

  const getVerdictDetails = (verdict: string) => {
    switch (verdict) {
      case 'Compliant':
        return {
          status: 'pass',
          badgeText: 'APPROVED • CODE COMPLIANT',
          title: 'Installation Meets All Building Code Requirements',
          description: 'The described materials, methods, and dimensions are fully compliant with applicable building codes and project specifications.',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
        };
      case 'Non-Compliant':
        return {
          status: 'fail',
          badgeText: 'PROHIBITED • CODE VIOLATION',
          title: 'Non-Compliant Condition — Remediation Required',
          description: 'The described installation violates official statutory building codes or project specs. Correction is mandatory before sign-off.',
          bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
          badgeClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/50',
          icon: <XCircle className="w-8 h-8 text-rose-500" />,
        };
      case 'Ambiguous/Insufficient Data':
      default:
        return {
          status: 'warn',
          badgeText: 'ADDITIONAL INFORMATION / PERMIT REQUIRED',
          title: 'Clarification or Engineering Variance Needed',
          description: 'Specific dimensions, material ratings, or local jurisdiction approval are needed to make a final determination.',
          bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
          badgeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50',
          icon: <HelpCircle className="w-8 h-8 text-amber-500" />,
        };
    }
  };

  const completedCount = Object.values(completedActions).filter(Boolean).length;
  const v = getVerdictDetails(result.verdict);

  return (
    <div className="space-y-6 mt-6">
      {/* Top Results Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('summary')}
            className="gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Compliance Verdict & Guidance</span>
          </Button>

          <Button
            variant={activeTab === 'citations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('citations')}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Code References ({result.citations?.length || 0})</span>
          </Button>

          <Button
            variant={activeTab === 'sources' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('sources')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Source Text Chunks ({result.retrieved_chunks?.length || 0})</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNoticeModal(true)}
            className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Notice for Subcontractor</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrintModal(true)}
            className="gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Print / Export Report</span>
          </Button>
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 border ${v.bgColor} transition-all duration-300 shadow-sm space-y-4`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-background border shadow-inner">
                  {v.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${v.badgeClass}`}>
                      {v.badgeText}
                    </span>
                    <span className="text-xs opacity-70">
                      Verified in {result.search_metadata?.elapsed_time_ms || 320}ms
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mt-1.5 tracking-tight">
                    {v.title}
                  </h2>
                  <p className="text-xs opacity-90 mt-1">{v.description}</p>
                </div>
              </div>

              <div className="bg-background/80 px-4 py-3 rounded-xl border w-full md:w-auto flex items-center justify-between md:justify-start gap-4 shadow-sm">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Code Match Confidence
                  </div>
                  <div className="text-xl font-bold">
                    {(result.confidence_score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="w-20 bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      result.confidence_score >= 0.85
                        ? 'bg-emerald-500'
                        : result.confidence_score >= 0.6
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${result.confidence_score * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 bg-background/50 p-4 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span>Jobsite Takeaway (Plain-English Summary)</span>
              </div>
              <p className="text-sm leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {result.recommended_actions && result.recommended_actions.length > 0 && (
            <Card className="p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-sm">Required Field Actions & Inspection Checklist</h3>
                    <p className="text-[11px] text-muted-foreground">Check off items as completed on the jobsite</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  {completedCount} of {result.recommended_actions.length} Completed
                </span>
              </div>

              <div className="space-y-2.5">
                {result.recommended_actions.map((action: string, idx: number) => {
                  const isDone = !!completedActions[idx];
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-muted/30 hover:bg-muted text-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleAction(idx)}
                        className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <span className={`text-sm leading-relaxed ${isDone ? 'line-through opacity-70' : 'font-medium'}`}>
                          {action}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <FileText className="w-5 h-5 text-sky-500" />
              <div>
                <h3 className="font-bold text-sm">Detailed Code Analysis & Remediation Guidance</h3>
                <p className="text-[11px] text-muted-foreground">Engineering explanation and statutory interpretation</p>
              </div>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line space-y-2 pt-1">
              {result.technical_analysis}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'citations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Official statutory clauses and specification sections cited for this determination:</span>
            <span className="font-semibold text-primary">{result.citations?.length || 0} Governing Clauses</span>
          </div>

          {result.citations && result.citations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {result.citations.map((cite: any, idx: number) => (
                <Card key={idx} className="p-5 hover:border-primary/50 transition-all space-y-3.5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold font-mono">
                        {cite.clause_number}
                      </span>
                      <span className="text-sm font-bold">
                        {cite.document_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{cite.trade}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{cite.jurisdiction}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{cite.document_type}</span>
                    </div>
                  </div>

                  <div className="text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-muted-foreground">Section / Page: <strong className="text-foreground">{cite.page_or_section}</strong></span>
                  </div>

                  <div className="bg-muted/50 border-l-4 border-primary rounded-r-xl p-3.5 relative group">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Official Statutory Text (Verbatim Extract):</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(cite.direct_quote, idx)}
                        className="hover:text-primary p-1 rounded transition-colors flex items-center gap-1"
                        title="Copy quote"
                      >
                        {copiedQuoteIdx === idx ? (
                          <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                        ) : (
                          <><Copy className="w-3 h-3" /><span>Copy</span></>
                        )}
                      </button>
                    </div>
                    <blockquote className="text-sm text-foreground/90 italic leading-relaxed">
                      &ldquo;{cite.direct_quote}&rdquo;
                    </blockquote>
                  </div>

                  <div className="text-sm flex items-start gap-2 bg-muted p-3 rounded-xl border">
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Field Application:</strong> {cite.relevance_explanation}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No specific statutory clauses extracted for this query.
            </Card>
          )}
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Showing {result.retrieved_chunks?.length || 0} retrieved code excerpts from the database:</p>
          </div>
          <div className="space-y-3">
            {result.retrieved_chunks?.map((chunk: any, idx: number) => (
              <Card key={idx} className="p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold font-mono">{chunk.clause_number}</span>
                    <span className="text-xs text-muted-foreground">({chunk.doc_title})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{chunk.trade}</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{chunk.jurisdiction}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg border">
                  {chunk.text}
                </p>
                <div className="text-[10px] text-muted-foreground flex justify-between pt-0.5">
                  <span>Type: {chunk.document_type}</span>
                  <span>Location: {chunk.page_or_section}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
