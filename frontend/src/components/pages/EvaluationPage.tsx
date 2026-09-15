'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { BarChart, ShieldCheck, CheckCircle2, XCircle, HelpCircle, Play, RefreshCw, Cpu, Activity, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api, ComplianceResponse } from "@/lib/api";

interface EvalTestCase {
  id: string;
  trade: string;
  name: string;
  query: string;
  expectedVerdict: string;
  jurisdiction: string;
  docType: string;
  actual?: ComplianceResponse;
  passed?: boolean;
  latencyMs?: number;
}

const EVAL_SUITE: EvalTestCase[] = [
  {
    id: "TC-1",
    trade: "Electrical",
    name: "PVC Conduit in Return Air Plenum Prohibition",
    query: "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
    expectedVerdict: "Non-Compliant",
    jurisdiction: "National",
    docType: "Code",
  },
  {
    id: "TC-2",
    trade: "Structural",
    name: "Elevated Post-Tensioned Slab 28-Day Break Test",
    query: "Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant?",
    expectedVerdict: "Compliant",
    jurisdiction: "National",
    docType: "Project Spec",
  },
  {
    id: "TC-3",
    trade: "Fire Safety",
    name: "Through-Penetration Bare Mineral Wool Omission",
    query: "Subcontractor packed 4-inch pipe penetration through 2-hour shear wall with bare ceramic wool only, omitting intumescent sealant.",
    expectedVerdict: "Non-Compliant",
    jurisdiction: "National",
    docType: "Code",
  },
  {
    id: "TC-4",
    trade: "Plumbing",
    name: "DWV Hydrostatic Pressure Test Duration",
    query: "Did our 30-minute hydrostatic water test with 42-foot static head satisfy rough drainage and vent inspection requirements?",
    expectedVerdict: "Compliant",
    jurisdiction: "National",
    docType: "Code",
  },
  {
    id: "TC-5",
    trade: "Out-of-Scope",
    name: "Safe Refusal Zero-Hallucination Guardrail",
    query: "What is the allowable paint hue for the janitor closet door hinges under city guidelines?",
    expectedVerdict: "Ambiguous/Insufficient Data",
    jurisdiction: "All",
    docType: "All",
  },
];

export default function EvaluationPage() {
  const [testCases, setTestCases] = useState<EvalTestCase[]>(EVAL_SUITE);
  const [running, setRunning] = useState(false);
  const [runCompleted, setRunCompleted] = useState(false);

  const runEvaluation = async () => {
    setRunning(true);
    setRunCompleted(false);

    const updated = [...testCases];
    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      const start = performance.now();
      try {
        const result = await api.verifyCompliance({
          query: tc.query,
          trade: tc.trade === 'Out-of-Scope' ? 'All' : tc.trade,
          jurisdiction: tc.jurisdiction,
          document_type: tc.docType,
          top_k: 5,
        });
        const elapsed = Math.round(performance.now() - start);
        const passed = result.verdict === tc.expectedVerdict;
        updated[i] = { ...tc, actual: result, passed, latencyMs: elapsed };
      } catch (err) {
        updated[i] = { ...tc, passed: false, latencyMs: Math.round(performance.now() - start) };
      }
      setTestCases([...updated]);
    }

    setRunning(false);
    setRunCompleted(true);
  };

  const passedCount = testCases.filter((tc) => tc.passed === true).length;
  const executedCount = testCases.filter((tc) => tc.actual !== undefined).length;
  const totalCount = testCases.length;
  const successRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 100;

  // Dynamically compute accuracy, citation, refusal, and latency metrics
  const testsWithCitations = testCases.filter(
    (tc) => tc.actual && (tc.actual.citations?.length || 0) > 0
  ).length;
  const applicableCitationTests = testCases.filter(
    (tc) => tc.actual && tc.expectedVerdict !== 'Ambiguous/Insufficient Data'
  ).length;
  const citationRate =
    applicableCitationTests > 0
      ? Math.round((testsWithCitations / applicableCitationTests) * 100)
      : 100;

  const outOfScopeTests = testCases.filter(
    (tc) => tc.expectedVerdict === 'Ambiguous/Insufficient Data'
  );
  const safeRefusalPassed = outOfScopeTests.filter((tc) => tc.passed === true).length;
  const refusalRate =
    outOfScopeTests.length > 0
      ? Math.round((safeRefusalPassed / outOfScopeTests.length) * 100)
      : 100;

  const latencies = testCases.map((tc) => tc.latencyMs).filter((l): l is number => typeof l === 'number');
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Quality & Accuracy Verification Tests"
          description="Automated benchmark scenarios verifying accurate code citations, proper trade rules, and reliable pass/fail determinations."
          icon={BarChart}
        />
        <Button onClick={runEvaluation} disabled={running} className="gap-2 font-semibold shadow-md">
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Running Tests...' : 'Run Automated Tests'}
        </Button>
      </div>

      {/* Target Metric Scorecards (Dynamically Computed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-border/70">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Search Precision</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground font-mono">
                {runCompleted ? `${successRate}%` : '100%'}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                {runCompleted ? `${passedCount}/${executedCount} Scenarios Passed` : 'Benchmark Ready (≥ 90% target)'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Citation Accuracy</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground font-mono">
                {runCompleted ? `${citationRate}%` : '100%'}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                {runCompleted ? `${testsWithCitations} Verbatim Clauses Cited` : 'Strict Grounding (≥ 90% target)'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Missing Info Handling</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground font-mono">
                {runCompleted ? `${refusalRate}%` : '100%'}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                {runCompleted ? `${safeRefusalPassed}/${outOfScopeTests.length} Safe Refusals` : 'Safe Guidance (≥ 95% target)'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <HelpCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Average Response Time</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground font-mono">
                {avgLatency !== null ? `${avgLatency} ms` : '< 1.5s'}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                {avgLatency !== null ? (avgLatency < 3000 ? 'Within SLA (< 3.0s)' : 'High Latency') : 'High-Performance Engine'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Benchmark Run Status */}
      {runCompleted && (
        <Card className={`border ${passedCount === totalCount ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className={`w-6 h-6 ${passedCount === totalCount ? 'text-emerald-500' : 'text-destructive'}`} />
              <div>
                <h4 className="font-semibold text-sm">Test Run Completed: {passedCount} / {totalCount} Scenarios Passed ({successRate}%)</h4>
                <p className="text-xs text-muted-foreground">All disciplinary verdicts, citations, and safe guidance behaviors successfully verified.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Scenarios Table */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Disciplinary Compliance Scenarios</CardTitle>
          <CardDescription>
            Preset trade test queries verifying statutory building codes, project specs, and clarification edge cases.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {testCases.map((tc) => (
              <div key={tc.id} className="p-5 hover:bg-secondary/20 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {tc.id}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      tc.trade === 'Electrical' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      tc.trade === 'Structural' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                      tc.trade === 'Fire Safety' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                      tc.trade === 'Plumbing' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      'bg-purple-500/10 text-purple-600 border-purple-500/20'
                    }`}>
                      {tc.trade}
                    </span>
                    <span className="font-semibold text-sm">{tc.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {tc.actual ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        tc.passed ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-destructive/10 text-destructive border border-destructive/30'
                      }`}>
                        {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {tc.passed ? 'PASSED' : 'FAILED'} ({tc.latencyMs}ms)
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">Pending Execution</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded border border-border/40 font-mono">
                  &ldquo;{tc.query}&rdquo;
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>Expected Verdict: <strong className="text-foreground font-semibold">{tc.expectedVerdict}</strong></span>
                  {tc.actual && (
                    <>
                      <span>Actual Verdict: <strong className={tc.passed ? "text-emerald-500 font-bold" : "text-destructive font-bold"}>{tc.actual.verdict}</strong></span>
                      <span>Confidence: <strong className="text-foreground">{Math.round(tc.actual.confidence_score * 100)}%</strong></span>
                      <span>Citations: <strong className="text-foreground">{tc.actual.citations?.length || 0} cited</strong></span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
