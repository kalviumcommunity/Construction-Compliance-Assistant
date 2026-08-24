'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Search,
  SlidersHorizontal,
  FileText,
  Building2,
  MapPin,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Database,
  Cpu,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  History,
  BookOpen,
  X,
  Gauge
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const PRESET_SCENARIOS = [
  {
    label: '⚡ PVC in Plenum Ceiling',
    query: 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?',
    trade: 'Electrical',
    jurisdiction: 'National',
    docType: 'Code',
    expected: 'Non-Compliant',
  },
  {
    label: '🏢 Post-Tensioned Concrete PSI',
    query: 'Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant with project specs?',
    trade: 'Structural',
    jurisdiction: 'National',
    docType: 'Project Spec',
    expected: 'Compliant',
  },
  {
    label: '🔥 Firestop Annular Sealant',
    query: 'Subcontractor packed 4-inch pipe penetration through 2-hour shear wall with bare ceramic wool only, omitting intumescent sealant.',
    trade: 'Fire Safety',
    jurisdiction: 'National',
    docType: 'Code',
    expected: 'Non-Compliant',
  },
  {
    label: '💧 DWV Hydrostatic Test',
    query: 'Did our 30-minute hydrostatic water test with 42-foot static head satisfy the rough drainage and vent inspection requirements?',
    trade: 'Plumbing',
    jurisdiction: 'National',
    docType: 'Code',
    expected: 'Compliant',
  },
  {
    label: '📐 Egress Stair Clear Width',
    query: 'Egress stairway serving 120 building occupants has clear finished width of 40 inches between handrails. Is this compliant?',
    trade: 'Structural',
    jurisdiction: 'National',
    docType: 'Code',
    expected: 'Non-Compliant',
  },
  {
    label: '❓ Ambiguous Field Query',
    query: 'What is the required thickness of acoustic fabric wrap for executive conference room acoustic wood panels?',
    trade: 'All',
    jurisdiction: 'All',
    docType: 'All',
    expected: 'Ambiguous',
  },
];

export default function ConstructionComplianceApp() {
  // Query and Filter state
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [docType, setDocType] = useState('All');
  const [topK, setTopK] = useState(5);

  // Execution & Response state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedQuoteIdx, setCopiedQuoteIdx] = useState(null);

  // Tab & UI state
  const [activeTab, setActiveTab] = useState('verdict'); // 'verdict' | 'chunks' | 'docs' | 'history'
  const [expandedCitations, setExpandedCitations] = useState({});
  const [completedActions, setCompletedActions] = useState({});
  const [queryHistory, setQueryHistory] = useState([]);

  // Server health state
  const [backendHealth, setBackendHealth] = useState(null);
  const [indexedDocs, setIndexedDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Fetch backend status on mount
  useEffect(() => {
    fetchBackendHealth();
  }, []);

  const fetchBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth(data);
      } else {
        setBackendHealth({ status: 'offline' });
      }
    } catch {
      setBackendHealth({ status: 'offline' });
    }
  };

  const fetchIndexedDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setIndexedDocs(data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setQuery(preset.query);
    setTrade(preset.trade);
    setJurisdiction(preset.jurisdiction);
    setDocType(preset.docType);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCompletedActions({});
    setLoadingStep(1);

    // Simulated progress steps for enhanced UX
    const stepTimer1 = setTimeout(() => setLoadingStep(2), 600);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 1300);

    try {
      const payload = {
        query: query.trim(),
        trade: trade,
        jurisdiction: jurisdiction,
        document_type: docType,
        top_k: parseInt(topK, 10),
      };

      const response = await fetch(`${API_BASE}/api/verify-compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('verdict');

      // Add to history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        query: query.trim(),
        trade,
        jurisdiction,
        docType,
        verdict: data.verdict,
        confidence: data.confidence_score,
      };
      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err.message || 'Failed to connect to verification backend.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const toggleCitation = (idx) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleAction = (idx) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const copyToClipboard = (text, idx = null) => {
    navigator.clipboard.writeText(text);
    if (idx !== null) {
      setCopiedQuoteIdx(idx);
      setTimeout(() => setCopiedQuoteIdx(null), 2000);
    } else {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const formatReportMarkdown = () => {
    if (!result) return '';
    return `# Construction Compliance Verification Report
**Date/Time:** ${new Date().toLocaleString()}
**Observation / Field Query:** ${query}
**Scoped Filters:** Trade: ${trade} | Jurisdiction: ${jurisdiction} | Document Type: ${docType}

---

## Verdict: ${result.verdict.toUpperCase()}
**Confidence Score:** ${(result.confidence_score * 100).toFixed(0)}%
**Executive Summary:**
${result.summary}

## Technical Engineering Analysis
${result.technical_analysis}

## Statutory & Specification Citations
${result.citations
  .map(
    (c, i) => `### ${i + 1}. ${c.clause_number} — ${c.document_title}
- **Type:** ${c.document_type} | **Trade:** ${c.trade} | **Jurisdiction:** ${c.jurisdiction}
- **Section / Page:** ${c.page_or_section}
- **Direct Quote:** "${c.direct_quote}"
- **Engineering Relevance:** ${c.relevance_explanation}
`
  )
  .join('\n')}

## Recommended Field Actions
${result.recommended_actions.map((a, i) => `- [ ] ${a}`).join('\n')}

---
*Generated via SiteShield Compliance AI Engine (Hybrid Dense + BM25 Sparse Vector Retrieval)*
`;
  };

  // Verdict Visual Helper
  const getVerdictVisuals = (verdict) => {
    switch (verdict) {
      case 'Compliant':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          glowClass: 'glow-compliant',
          icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
          title: 'COMPLIANT CONDITION',
          subtext: 'Observed parameters fully satisfy statutory code requirements and project specifications.',
        };
      case 'Non-Compliant':
        return {
          bg: 'bg-rose-950/40 border-rose-500/50 text-rose-300',
          badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          glowClass: 'glow-non-compliant',
          icon: <AlertOctagon className="w-7 h-7 text-rose-400" />,
          title: 'NON-COMPLIANT VIOLATION',
          subtext: 'Observed installation directly violates governing statutory building codes or specifications.',
        };
      case 'Ambiguous/Insufficient Data':
      default:
        return {
          bg: 'bg-amber-950/40 border-amber-500/50 text-amber-300',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          glowClass: 'glow-ambiguous',
          icon: <HelpCircle className="w-7 h-7 text-amber-400" />,
          title: 'AMBIGUOUS / INSUFFICIENT DATA',
          subtext: 'Retrieved regulatory context lacks specific criteria. Strict zero-hallucination policy triggered.',
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Engineering Header */}
      <header className="border-b border-titanium-800 bg-titanium-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-white font-mono">
                  SiteShield<span className="text-amber-400">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-titanium-800 text-titanium-300 border border-titanium-700">
                  Field QA / QC
                </span>
              </div>
              <p className="text-xs text-titanium-400 hidden sm:block">
                On-Site Statutory Code & Specification Verification Engine
              </p>
            </div>
          </div>

          {/* Jobsite Context & Backend Status */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-titanium-800/80 border border-titanium-700 text-xs text-titanium-300 font-mono">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Project: Skyline Tower (Phase 3)</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-titanium-900 border border-titanium-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-titanium-300 font-mono text-[11px] hidden sm:inline">
                {backendHealth?.status === 'healthy' ? (
                  <>
                    Hybrid Qdrant ({backendHealth.indexed_documents || 12} docs) •{' '}
                    <span className="text-amber-400">{backendHealth.model}</span>
                  </>
                ) : (
                  'Backend Offline'
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upper Grid: Query Console & Scoped Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Query Console (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="glass-panel rounded-xl p-5 border border-titanium-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-titanium-800/80 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-titanium-200">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Field Observation & Code Verification Console</span>
                </div>
                <span className="text-xs text-titanium-400 font-mono">Dense + BM25 Sparse Mode</span>
              </div>

              {/* Form Area */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter site condition, observed installation, or code question (e.g., 'Can we run 1-inch Schedule 40 PVC conduit for low-voltage wiring inside this ceiling return air plenum?')..."
                    rows={4}
                    className="w-full bg-titanium-900/90 border border-titanium-700 rounded-lg p-3.5 text-sm text-slate-100 placeholder-titanium-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-sans resize-none"
                    disabled={loading}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute top-3 right-3 text-titanium-400 hover:text-white p-1 rounded bg-titanium-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Preset Scenario Quick Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-xs text-titanium-400 font-mono uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Field Scenarios:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SCENARIOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-xs px-2.5 py-1 rounded-md bg-titanium-800/90 hover:bg-titanium-700 border border-titanium-700/80 text-titanium-200 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                      >
                        <span>{preset.label}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                            preset.expected === 'Compliant'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : preset.expected === 'Non-Compliant'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {preset.expected}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-titanium-800/60">
                  <div className="text-xs text-titanium-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span>Strict Grounding • Zero-Hallucination Policy</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg ${
                      loading || !query.trim()
                        ? 'bg-titanium-800 text-titanium-500 cursor-not-allowed border border-titanium-700'
                        : 'bg-amber-500 hover:bg-amber-400 text-titanium-950 font-bold shadow-amber-500/20 active:scale-95'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Compliance...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Verify Compliance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Scoped Filters (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="glass-panel rounded-xl p-5 border border-titanium-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-titanium-800/80 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-titanium-200">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Scoped Search Filters</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTrade('All');
                    setJurisdiction('All');
                    setDocType('All');
                    setTopK(5);
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Trade Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-titanium-300 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trade Discipline</span>
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full bg-titanium-900 border border-titanium-700 rounded-lg px-3 py-2 text-xs text-titanium-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="All">All Trades (Cross-Discipline)</option>
                  <option value="Electrical">Electrical (NEC / NFPA 70 / NYC EC)</option>
                  <option value="Fire Safety">Fire Safety (IBC 714 / NFPA 13)</option>
                  <option value="Structural">Structural (IBC / CBC Chapter 16A)</option>
                  <option value="Plumbing">Plumbing (UPC / NYC Plumbing)</option>
                </select>
              </div>

              {/* Jurisdiction Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-titanium-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Governing Jurisdiction</span>
                </label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full bg-titanium-900 border border-titanium-700 rounded-lg px-3 py-2 text-xs text-titanium-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="All">All Jurisdictions</option>
                  <option value="National">National (Model Codes: IBC, NEC, UPC)</option>
                  <option value="California">California (CBC Title 24)</option>
                  <option value="NYC">New York City (NYC Code Amendments)</option>
                </select>
              </div>

              {/* Document Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-titanium-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Document Scope</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-titanium-900 border border-titanium-700 rounded-lg px-3 py-2 text-xs text-titanium-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="All">All Document Types</option>
                  <option value="Code">Statutory Building Codes Only</option>
                  <option value="Project Spec">Project Specifications (Divisions)</option>
                  <option value="Inspection Log">Field Inspection Logs / NCRs</option>
                </select>
              </div>

              {/* Top-K Retrieval Depth */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-titanium-300">
                  <span>Hybrid Retrieval Depth (Top-K):</span>
                  <span className="font-mono text-amber-400 font-semibold">{topK} chunks</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-full h-1.5 bg-titanium-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="text-[11px] text-titanium-400 bg-titanium-950/60 p-2.5 rounded-lg border border-titanium-800 font-mono">
                <p>💡 Tip: Setting trade to &apos;Electrical&apos; & jurisdiction to &apos;National&apos; filters directly to NEC 300.22(C).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="glass-panel-glow rounded-xl p-8 border border-titanium-700 text-center space-y-6 animate-pulse-subtle">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white tracking-wide">
                Grounding Compliance Determination...
              </h3>
              <div className="space-y-2 text-xs font-mono text-titanium-300">
                <div className={`flex items-center justify-center gap-2 ${loadingStep >= 1 ? 'text-amber-400 font-semibold' : 'text-titanium-600'}`}>
                  <span>1. Executing Dense + BM25 Sparse Hybrid Search in Qdrant...</span>
                  {loadingStep >= 1 && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className={`flex items-center justify-center gap-2 ${loadingStep >= 2 ? 'text-amber-400 font-semibold' : 'text-titanium-600'}`}>
                  <span>2. Applying Reciprocal Rank Fusion & Payload Filtering...</span>
                  {loadingStep >= 2 && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className={`flex items-center justify-center gap-2 ${loadingStep >= 3 ? 'text-amber-400 font-semibold' : 'text-titanium-600'}`}>
                  <span>3. Evaluating Statutory Requirements via GPT-4o-mini...</span>
                  {loadingStep >= 3 && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-white">Verification Engine Error</h4>
              <p className="text-xs text-rose-200 mt-1">{error}</p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-2 text-xs px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded border border-rose-700"
              >
                Retry Query
              </button>
            </div>
          </div>
        )}

        {/* Result Dashboard */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Nav Tabs for Results */}
            <div className="flex items-center justify-between border-b border-titanium-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('verdict')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'verdict'
                      ? 'bg-amber-500 text-titanium-950 font-bold'
                      : 'bg-titanium-900 text-titanium-300 hover:text-white border border-titanium-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Compliance Verdict & Analysis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('chunks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'chunks'
                      ? 'bg-amber-500 text-titanium-950 font-bold'
                      : 'bg-titanium-900 text-titanium-300 hover:text-white border border-titanium-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Raw Retrieved Chunks ({result.retrieved_chunks?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('docs');
                    if (indexedDocs.length === 0) fetchIndexedDocuments();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'docs'
                      ? 'bg-amber-500 text-titanium-950 font-bold'
                      : 'bg-titanium-900 text-titanium-300 hover:text-white border border-titanium-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Knowledge Base Explorer</span>
                </button>
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => copyToClipboard(formatReportMarkdown())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-titanium-800 hover:bg-titanium-700 text-titanium-200 border border-titanium-700 flex items-center gap-1.5"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Report Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-titanium-400" />
                    <span>Copy Field Report</span>
                  </>
                )}
              </button>
            </div>

            {/* Tab 1: Verdict Dashboard */}
            {activeTab === 'verdict' && (
              <div className="space-y-6">
                {/* Hero Verdict Banner */}
                {(() => {
                  const v = getVerdictVisuals(result.verdict);
                  return (
                    <div
                      className={`rounded-xl p-6 border ${v.bg} ${v.glowClass} transition-all duration-300`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-titanium-900/80 border border-titanium-700">
                            {v.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${v.badgeBg}`}
                              >
                                {result.verdict}
                              </span>
                              <span className="text-xs text-titanium-400 font-mono">
                                Execution Time: {result.search_metadata?.elapsed_time_ms || 0}ms
                              </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mt-1.5 tracking-tight font-sans">
                              {v.title}
                            </h2>
                            <p className="text-xs text-titanium-300 mt-0.5">{v.subtext}</p>
                          </div>
                        </div>

                        {/* Confidence Meter */}
                        <div className="flex items-center gap-4 bg-titanium-900/90 px-4 py-3 rounded-xl border border-titanium-800 w-full md:w-auto justify-between md:justify-start">
                          <div>
                            <div className="text-[10px] text-titanium-400 uppercase font-mono tracking-wider">
                              Confidence Score
                            </div>
                            <div className="text-lg font-bold text-white font-mono flex items-center gap-1.5">
                              <span>{(result.confidence_score * 100).toFixed(0)}%</span>
                              <Gauge className="w-4 h-4 text-amber-400" />
                            </div>
                          </div>
                          <div className="w-24 bg-titanium-800 h-2.5 rounded-full overflow-hidden">
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

                      {/* Executive Summary */}
                      <div className="mt-5 pt-4 border-t border-titanium-800/80 bg-titanium-950/40 p-3.5 rounded-lg border">
                        <div className="text-xs font-semibold text-titanium-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                          <span>Executive Field Summary</span>
                        </div>
                        <p className="text-sm text-slate-100 leading-relaxed font-sans">
                          {result.summary}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Technical Engineering Breakdown */}
                <div className="glass-panel rounded-xl p-5 border border-titanium-800 shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-titanium-100 border-b border-titanium-800 pb-2.5">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Technical Engineering Analysis & Grounding Rationale</span>
                  </div>
                  <div className="text-sm text-titanium-200 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                    {result.technical_analysis}
                  </div>
                </div>

                {/* Statutory & Specification Citations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-titanium-100">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Authoritative Citations & Excerpt References ({result.citations?.length || 0})</span>
                    </div>
                    <span className="text-xs text-titanium-400">Verbatim statutory text</span>
                  </div>

                  {result.citations && result.citations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {result.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="glass-panel rounded-xl p-4 border border-titanium-800 hover:border-titanium-700 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-titanium-800/80 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                                {cite.clause_number}
                              </span>
                              <span className="text-xs text-white font-medium">
                                {cite.document_title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-titanium-800 text-titanium-300 font-mono">
                                {cite.trade}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-titanium-800 text-titanium-300 font-mono">
                                {cite.jurisdiction}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-titanium-800 text-titanium-300 font-mono">
                                {cite.document_type}
                              </span>
                            </div>
                          </div>

                          {/* Section details */}
                          <div className="text-xs text-titanium-400 font-mono">
                            📍 Location: <span className="text-titanium-200">{cite.page_or_section}</span>
                          </div>

                          {/* Verbatim Quote */}
                          <div className="bg-titanium-950/80 border-l-2 border-amber-500 rounded-r-lg p-3 relative group">
                            <div className="text-xs text-titanium-400 font-mono mb-1 flex items-center justify-between">
                              <span>VERBATIM STATUTORY EXTRACT:</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cite.direct_quote, idx)}
                                className="text-titanium-400 hover:text-amber-400 p-1 transition-colors"
                                title="Copy quote"
                              >
                                {copiedQuoteIdx === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <blockquote className="text-xs text-amber-100/90 italic font-mono leading-relaxed">
                              &ldquo;{cite.direct_quote}&rdquo;
                            </blockquote>
                          </div>

                          {/* Engineering Relevance */}
                          <div className="text-xs text-titanium-300 flex items-start gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-titanium-100">Engineering Application:</strong>{' '}
                              {cite.relevance_explanation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-titanium-900 text-xs text-titanium-400 text-center">
                      No direct statutory citations extracted for this evaluation.
                    </div>
                  )}
                </div>

                {/* Recommended Field Actions */}
                {result.recommended_actions && result.recommended_actions.length > 0 && (
                  <div className="glass-panel rounded-xl p-5 border border-titanium-800 shadow-lg space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-titanium-100 border-b border-titanium-800 pb-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>Recommended Field Actions & Quality Assurance Checklist</span>
                    </div>

                    <div className="space-y-2">
                      {result.recommended_actions.map((action, idx) => (
                        <label
                          key={idx}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                            completedActions[idx]
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 line-through'
                              : 'bg-titanium-900/60 border-titanium-800 text-titanium-200 hover:border-titanium-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!completedActions[idx]}
                            onChange={() => toggleAction(idx)}
                            className="mt-0.5 rounded bg-titanium-800 border-titanium-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-titanium-900"
                          />
                          <span className="text-xs font-sans leading-relaxed">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Raw Retrieved Chunks (Hybrid RRF Transparency) */}
            {activeTab === 'chunks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-titanium-400">
                  <p>
                    Showing {result.retrieved_chunks?.length || 0} chunks retrieved via Qdrant Hybrid
                    (Dense Vector + FastEmbed BM25 Sparse Vector) with Reciprocal Rank Fusion.
                  </p>
                  <span className="font-mono text-amber-400">RRF Top-{result.retrieved_chunks?.length}</span>
                </div>

                <div className="space-y-3">
                  {result.retrieved_chunks?.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="glass-panel rounded-xl p-4 border border-titanium-800 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-titanium-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-titanium-800 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white font-mono">
                            {chunk.clause_number}
                          </span>
                          <span className="text-xs text-titanium-300">({chunk.doc_title})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-titanium-800 text-titanium-400">
                            Score: {chunk.score}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-titanium-800 text-sky-400">
                            {chunk.trade}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-titanium-300 leading-relaxed font-mono bg-titanium-950/60 p-3 rounded border border-titanium-800">
                        {chunk.text}
                      </p>

                      <div className="text-[11px] text-titanium-500 font-mono flex gap-4">
                        <span>Jurisdiction: {chunk.jurisdiction}</span>
                        <span>Type: {chunk.document_type}</span>
                        <span>Section: {chunk.page_or_section}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Knowledge Base Explorer */}
            {activeTab === 'docs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-titanium-400">
                    Preloaded Multi-Tenant Construction Compliance Knowledge Base ({indexedDocs.length} items)
                  </div>
                  <button
                    type="button"
                    onClick={fetchIndexedDocuments}
                    className="text-xs px-2.5 py-1 bg-titanium-800 hover:bg-titanium-700 text-titanium-200 rounded border border-titanium-700 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDocs ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {indexedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="glass-panel rounded-xl p-4 border border-titanium-800 space-y-2 hover:border-titanium-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {doc.clause_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-titanium-800 text-titanium-300 font-mono">
                          {doc.trade}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white">{doc.title}</h4>
                      <p className="text-xs text-titanium-400 font-mono line-clamp-3 bg-titanium-950/40 p-2 rounded">
                        {doc.summary_snippet}
                      </p>
                      <div className="text-[10px] text-titanium-500 font-mono flex justify-between pt-1">
                        <span>{doc.jurisdiction} • {doc.document_type}</span>
                        <span>{doc.page_or_section}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History / Recent Queries Panel */}
        {queryHistory.length > 0 && (
          <div className="glass-panel rounded-xl p-4 border border-titanium-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-titanium-300 font-mono">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Site Session Queries ({queryHistory.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {queryHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setTrade(item.trade);
                    setJurisdiction(item.jurisdiction);
                    setDocType(item.docType);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-titanium-900 hover:bg-titanium-800 border border-titanium-800 text-left max-w-sm transition-all flex items-center justify-between gap-2"
                >
                  <span className="truncate text-titanium-200">{item.query}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold whitespace-nowrap ${
                      item.verdict === 'Compliant'
                        ? 'bg-emerald-950 text-emerald-400'
                        : item.verdict === 'Non-Compliant'
                        ? 'bg-rose-950 text-rose-400'
                        : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {item.verdict}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-titanium-800/80 bg-titanium-950 py-4 text-xs text-titanium-500 font-mono text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SiteShield AI Prototype • Statutory Code RAG Assistant</span>
          <span>FastAPI + Qdrant Hybrid (Dense / BM25 Sparse) + GPT-4o-mini</span>
        </div>
      </footer>
    </div>
  );
}
