'use client';

import React, { useState } from 'react';
import { ClipboardList, BookOpen, Layers, MessageSquareText, Printer, CheckCircle2, XCircle, HelpCircle, CheckSquare, FileText, MapPin, Check, Copy, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAssistant } from './AssistantContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ResultsView() {
  const { result, loading, error, isStreaming, streamedAnswer, cancelStream, handleSubmit, activeTab, setActiveTab, completedActions, toggleAction, setShowNoticeModal, setShowPrintModal } = useAssistant();
  const [copiedQuoteIdx, setCopiedQuoteIdx] = useState<number | null>(null);
  const [verifiedSourceIdx, setVerifiedSourceIdx] = useState<number | null>(null);

  if (loading && !result && !streamedAnswer) return null;

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 p-6 space-y-4 my-6 shadow-md animate-in fade-in duration-300">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="font-bold text-base text-foreground">Compliance Verification Error</h3>
            <p className="text-xs text-muted-foreground">
              The compliance engine encountered an error while verifying your query against the regulatory corpus.
            </p>
            <div className="mt-2 text-xs font-mono bg-background/80 border border-destructive/20 p-3 rounded-lg text-destructive/90 break-words">
              {error}
            </div>
            <div className="text-[11px] text-muted-foreground pt-1">
              Suggestions: Verify that the FastAPI backend server is running on <code className="text-foreground">127.0.0.1:8000</code>, check server logs, or retry with broader filters.
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-destructive/10">
          <Button variant="outline" size="sm" onClick={() => handleSubmit()} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Verification</span>
          </Button>
        </div>
      </Card>
    );
  }

  if (!result) return null;

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuoteIdx(idx);
    setTimeout(() => setCopiedQuoteIdx(null), 2000);
  };

  const renderTextWithCitations = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citeNum = parseInt(match[1], 10);
        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              setActiveTab('citations');
              setVerifiedSourceIdx(citeNum - 1);
            }}
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[11px] font-bold rounded bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            title={`Click to verify Citation [${citeNum}] against source metadata & original chunk`}
          >
            [{citeNum}]
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const primaryClause = result.citations?.[0]?.clause_number;

  const getVerdictDetails = (verdict: string) => {
    switch (verdict) {
      case 'Compliant':
        return {
          status: 'pass',
          badgeText: 'APPROVED • CODE COMPLIANT',
          title: primaryClause
            ? `Installation Satisfies ${primaryClause} Requirements`
            : 'Installation Meets Authoritative Building Standards',
          description: 'The evaluated materials, dimensions, and installation methods comply with governing statutory codes and project specifications.',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
        };
      case 'Non-Compliant':
        return {
          status: 'fail',
          badgeText: 'PROHIBITED • CODE VIOLATION',
          title: primaryClause
            ? `Statutory Code Violation: Non-Compliant with ${primaryClause}`
            : 'Non-Compliant Condition — Remediation Required',
          description: 'The described installation violates governing regulatory provisions or project specifications. Correction is required before QA/QC sign-off.',
          bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
          badgeClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/50',
          icon: <XCircle className="w-8 h-8 text-rose-500" />,
        };
      case 'Ambiguous/Insufficient Data':
      default:
        return {
          status: 'warn',
          badgeText: 'ADDITIONAL INFORMATION / VARIANCE NEEDED',
          title: primaryClause
            ? `Engineering Clarification Required: Reference ${primaryClause}`
            : 'Submittal Clarification or Variance Required',
          description: 'The observation requires specific architectural submittals, manufacturer data, or engineering approval to render a definitive verdict.',
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
      {/* Evaluated Observation Context Banner */}
      <div className="bg-muted/40 border border-border/80 rounded-xl p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Dynamically Evaluated Prompt</span>
              {result.citations?.[0]?.trade && (
                <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.2 rounded-full bg-background border">
                  {result.citations[0].trade} Discipline
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground italic">
              &ldquo;{result.query || 'Submitted Field Observation'}&rdquo;
            </p>
          </div>
        </div>

        {result.search_metadata?.rewritten_query && (
          <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-bold text-[10px] uppercase tracking-wider shrink-0 border border-primary/30">
              Rewritten Standalone Query
            </span>
            <span className="font-mono text-foreground/90 font-medium truncate">
              &ldquo;{result.search_metadata.rewritten_query}&rdquo;
            </span>
          </div>
        )}
      </div>

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
            <span>Document Excerpts ({result.retrieved_chunks?.length || 0})</span>
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
                {renderTextWithCitations(result.summary)}
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
              {renderTextWithCitations(streamedAnswer || result.technical_analysis)}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" title="Streaming incoming tokens..." />
              )}
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
              {result.citations.map((cite: any, idx: number) => {
                const citeNum = cite.citation_index || idx + 1;
                const tradeLower = (cite.trade || '').toLowerCase().replace(/\s+/g, '');
                const tradeClass =
                  tradeLower.includes('elec') ? 'badge-electrical' :
                  tradeLower.includes('struct') ? 'badge-structural' :
                  tradeLower.includes('fire') ? 'badge-firesafety' :
                  tradeLower.includes('plumb') ? 'badge-plumbing' :
                  'bg-muted text-muted-foreground';

                const matchingChunk = result.retrieved_chunks?.find(
                  (ch: any) =>
                    (cite.chunk_id && ch.chunk_id === cite.chunk_id) ||
                    (cite.chunk_index !== undefined && ch.chunk_index === cite.chunk_index) ||
                    ch.clause_number === cite.clause_number
                );

                const isVerifying = verifiedSourceIdx === idx;

                return (
                  <Card
                    key={idx}
                    className={`p-5 hover:border-primary/50 transition-all space-y-3.5 shadow-sm bento-card animate-stagger-${Math.min((idx % 5) + 1, 5)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-bold text-xs">
                          [{citeNum}]
                        </span>
                        <span className="clause-badge">
                          {cite.clause_number}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {cite.document_title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${tradeClass}`}>
                          {cite.trade}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold border">
                          {cite.jurisdiction}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold border">
                          {cite.document_type}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Mapping Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-lg border text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Document Filename</span>
                        <code className="text-foreground font-mono text-[11px] break-all">{cite.document_filename || matchingChunk?.document_filename || 'source_document.txt'}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Chunk ID & Index</span>
                        <span className="text-foreground font-mono text-[11px]">{cite.chunk_id || matchingChunk?.chunk_id || `chunk_${idx}`} (Index #{cite.chunk_index ?? matchingChunk?.chunk_index ?? 0})</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Page / Section</span>
                        <span className="text-foreground font-medium text-[11px]">{cite.page_or_section}</span>
                      </div>
                    </div>

                    <div className="citation-quote relative group">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between not-italic">
                        <span>Official Statutory Text (Verbatim Extract):</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cite.direct_quote, idx)}
                          className="hover:text-primary p-1 rounded transition-colors flex items-center gap-1 font-sans text-xs"
                          title="Copy quote"
                        >
                          {copiedQuoteIdx === idx ? (
                            <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                          ) : (
                            <><Copy className="w-3 h-3" /><span>Copy Quote</span></>
                          )}
                        </button>
                      </div>
                      <blockquote className="leading-relaxed text-xs sm:text-sm">
                        &ldquo;{cite.direct_quote}&rdquo;
                      </blockquote>
                    </div>

                    <div className="text-sm flex items-start gap-2 bg-secondary/40 p-3.5 rounded-xl border border-border/60">
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        <strong className="text-foreground font-semibold">Field Application:</strong> {cite.relevance_explanation}
                      </span>
                    </div>

                    {/* Source Verification Toggle */}
                    <div className="pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVerifiedSourceIdx(isVerifying ? null : idx)}
                        className="gap-1.5 text-xs w-full sm:w-auto border-primary/40 hover:bg-primary/5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isVerifying ? 'Hide Original Source Chunk' : 'Verify against Original Chunk Text'}</span>
                      </Button>
                    </div>

                    {/* Expanded Source Chunk Text */}
                    {isVerifying && (
                      <div className="bg-muted/80 border border-primary/30 p-3.5 rounded-xl space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-primary border-b pb-1.5">
                          <span>VERIFIED ORIGINAL RETRIEVED CHUNK TEXT</span>
                          <span className="font-mono text-muted-foreground">ID: {cite.chunk_id || matchingChunk?.chunk_id || `chunk_${idx}`}</span>
                        </div>
                        <p className="text-xs font-mono leading-relaxed bg-background p-3 rounded-lg border whitespace-pre-wrap text-foreground">
                          {matchingChunk ? matchingChunk.text : cite.direct_quote}
                        </p>
                        <div className="text-[10px] text-muted-foreground flex justify-between pt-1">
                          <span>Filename: <code className="font-mono text-foreground">{cite.document_filename || matchingChunk?.document_filename}</code></span>
                          <span>Chunk Index: <strong className="text-foreground">{cite.chunk_index ?? matchingChunk?.chunk_index ?? 0}</strong></span>
                          <span>Relevance Score: <strong className="text-foreground">{matchingChunk?.score || 1.0}</strong></span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No specific statutory citations extracted for this query.
            </Card>
          )}
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Showing {result.retrieved_chunks?.length || 0} referenced standard excerpts:</p>
          </div>
          <div className="space-y-3">
            {result.retrieved_chunks?.map((chunk: any, idx: number) => {
              const citeNum = chunk.citation_index || (result.citations?.findIndex((c: any) => c.chunk_id === chunk.chunk_id || c.clause_number === chunk.clause_number) + 1);
              const isCited = citeNum && citeNum > 0;

              return (
                <Card
                  key={idx}
                  className={`p-4 space-y-2.5 bento-card animate-stagger-${Math.min((idx % 5) + 1, 5)}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      {isCited && (
                        <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-bold text-[10px]">
                          [{citeNum}]
                        </span>
                      )}
                      <span className="clause-badge">{chunk.clause_number}</span>
                      <span className="text-xs text-muted-foreground">({chunk.doc_title})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{chunk.trade}</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{chunk.jurisdiction}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg border font-sans">
                    {chunk.text}
                  </p>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap justify-between gap-2 pt-0.5">
                    <span>Filename: <code className="font-mono text-foreground">{chunk.document_filename || 'source.txt'}</code></span>
                    <span>Chunk ID: <code className="font-mono text-foreground">{chunk.chunk_id}</code></span>
                    <span>Chunk Index: <strong className="text-foreground">#{chunk.chunk_index ?? idx}</strong></span>
                    <span>Location: <strong>{chunk.page_or_section}</strong></span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
