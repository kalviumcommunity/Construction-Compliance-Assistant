'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  SlidersHorizontal,
  FileText,
  Building,
  Building2,
  MapPin,
  Wrench,
  Copy,
  Check,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  ClipboardList,
  History,
  BookOpen,
  X,
  Share2,
  Send,
  Zap,
  Flame,
  Droplets,
  HardHat,
  Eye,
  Info,
  CheckSquare,
  Square,
  MessageSquareText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Available active projects
const PROJECTS = [
  { id: 'skyline', name: 'Skyline Commercial Tower', phase: 'Phase 3 (Core & Shell)', location: 'Seattle, WA', code: 'IBC 2024 / NEC 2023' },
  { id: 'harbor', name: 'Harbor Point Medical Pavilion', phase: 'Phase 2 (MEP Rough-in)', location: 'San Francisco, CA', code: 'CBC Title 24 / OSHPD' },
  { id: 'midtown', name: 'Midtown Mixed-Use Residences', phase: 'Phase 1 (Podium & Framing)', location: 'New York, NY', code: 'NYC Construction Codes' },
];

// Pre-built common jobsite situations grouped by Trade
const CATEGORIZED_SCENARIOS = [
  {
    category: 'All',
    label: 'All Scenarios',
    icon: Sparkles,
  },
  {
    category: 'Electrical',
    label: 'Electrical',
    icon: Zap,
  },
  {
    category: 'Structural',
    label: 'Structural',
    icon: HardHat,
  },
  {
    category: 'Fire Safety',
    label: 'Fire & Life Safety',
    icon: Flame,
  },
  {
    category: 'Plumbing',
    label: 'Plumbing & Mechanical',
    icon: Droplets,
  },
];

const PRESET_SCENARIOS = [
  {
    id: 1,
    title: 'PVC Conduit in Return Air Plenum',
    trade: 'Electrical',
    category: 'Electrical',
    query: 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?',
    jurisdiction: 'National',
    docType: 'Code',
    statusHint: 'Prohibited',
    hintColor: 'fail',
  },
  {
    id: 2,
    title: 'Post-Tensioned Concrete PSI Break Test',
    trade: 'Structural',
    category: 'Structural',
    query: 'Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant with project specs?',
    jurisdiction: 'National',
    docType: 'Project Spec',
    statusHint: 'Approved',
    hintColor: 'pass',
  },
  {
    id: 3,
    title: 'Firestop Sealant in 2-Hour Rated Wall',
    trade: 'Fire Safety',
    category: 'Fire Safety',
    query: 'Subcontractor packed 4-inch pipe penetration through 2-hour shear wall with bare ceramic wool only, omitting intumescent sealant.',
    jurisdiction: 'National',
    docType: 'Code',
    statusHint: 'Violation',
    hintColor: 'fail',
  },
  {
    id: 4,
    title: 'Drainage DWV Hydrostatic Pressure Test',
    trade: 'Plumbing',
    category: 'Plumbing',
    query: 'Did our 30-minute hydrostatic water test with 42-foot static head satisfy the rough drainage and vent inspection requirements?',
    jurisdiction: 'National',
    docType: 'Code',
    statusHint: 'Approved',
    hintColor: 'pass',
  },
  {
    id: 5,
    title: 'Egress Stairway Clear Width Between Handrails',
    trade: 'Structural',
    category: 'Structural',
    query: 'Egress stairway serving 120 building occupants has clear finished width of 40 inches between handrails. Is this compliant?',
    jurisdiction: 'National',
    docType: 'Code',
    statusHint: 'Non-Compliant',
    hintColor: 'fail',
  },
  {
    id: 6,
    title: 'Acoustic Panel Fabric Specification Clarification',
    trade: 'All',
    category: 'All',
    query: 'What is the required thickness of acoustic fabric wrap for executive conference room acoustic wood panels?',
    jurisdiction: 'All',
    docType: 'All',
    statusHint: 'Needs Details',
    hintColor: 'warn',
  },
];

// Bespoke Custom Logo Component
function SiteShieldLogo({ className = 'w-8 h-8' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Outer Shield Shield with architectural grid */}
        <defs>
          <linearGradient id="shieldGrad" x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" />
            <stop offset="0.5" stopColor="#EA580C" />
            <stop offset="1" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="beamGrad" x1="12" y1="10" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FED7AA" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="innerPlate" x1="8" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E293B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* Shield Frame */}
        <path
          d="M22 3L6 9.5V21C6 30.5 12.8 39.2 22 41.5C31.2 39.2 38 30.5 38 21V9.5L22 3Z"
          fill="url(#shieldGrad)"
        />

        {/* Inner Dark Plate */}
        <path
          d="M22 6L9 11.3V20.5C9 28.3 14.6 35.5 22 37.8C29.4 35.5 35 28.3 35 20.5V11.3L22 6Z"
          fill="url(#innerPlate)"
        />

        {/* Architectural Structural Grid Overlay */}
        <path
          d="M14 16H30M12 22H32M14 28H30M22 10V34"
          stroke="#F97316"
          strokeWidth="1.2"
          strokeOpacity="0.25"
          strokeDasharray="2 2"
        />

        {/* Stylized Architectural Apex & Checkmark */}
        <path
          d="M15 22.5L19.5 27L29 16.5"
          stroke="url(#beamGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Precision Coordinate Dot */}
        <circle cx="22" cy="9.5" r="1.8" fill="#FDBA74" />
      </svg>
    </div>
  );
}

export default function SiteShieldApp() {
  // Query & Filter State
  const [query, setQuery] = useState('');
  const [selectedTradeCategory, setSelectedTradeCategory] = useState('All');
  const [trade, setTrade] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [docType, setDocType] = useState('All');
  const [searchThoroughness, setSearchThoroughness] = useState(5);
  const [showFilters, setShowFilters] = useState(false);

  // Active Project State
  const [currentProject, setCurrentProject] = useState(PROJECTS[0]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  // Execution & Response State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Interactive UI State
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'citations' | 'sources'
  const [completedActions, setCompletedActions] = useState({});
  const [queryHistory, setQueryHistory] = useState([]);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copiedQuoteIdx, setCopiedQuoteIdx] = useState(null);

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showCodebookModal, setShowCodebookModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Backend Health & Documents
  const [backendHealth, setBackendHealth] = useState(null);
  const [indexedDocs, setIndexedDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Initial health check
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
      console.error('Failed to load codebooks:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setQuery(preset.query);
    setTrade(preset.trade);
    setJurisdiction(preset.jurisdiction);
    setDocType(preset.docType);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCompletedActions({});
    setLoadingStep(1);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 700);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 1400);

    try {
      const payload = {
        query: query.trim(),
        trade: trade,
        jurisdiction: jurisdiction,
        document_type: docType,
        top_k: parseInt(searchThoroughness, 10),
      };

      const response = await fetch(`${API_BASE}/api/verify-compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Compliance engine error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('summary');

      // Add to Session History
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        query: query.trim(),
        trade,
        jurisdiction,
        verdict: data.verdict,
        confidence: data.confidence_score,
        projectName: currentProject.name,
      };
      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 14)]);
    } catch (err) {
      setError(err.message || 'Unable to connect to the building code library. Please check connection.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const toggleAction = (idx) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const copyToClipboard = (text, type = 'report', idx = null) => {
    navigator.clipboard.writeText(text);
    if (type === 'quote' && idx !== null) {
      setCopiedQuoteIdx(idx);
      setTimeout(() => setCopiedQuoteIdx(null), 2000);
    } else if (type === 'notice') {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    } else {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  // Human-Friendly Verdict Presentation Helper
  const getVerdictDetails = (verdict) => {
    switch (verdict) {
      case 'Compliant':
        return {
          status: 'pass',
          badgeText: 'APPROVED • CODE COMPLIANT',
          title: 'Installation Meets All Building Code Requirements',
          description:
            'The described materials, methods, and dimensions are fully compliant with applicable building codes and project specifications.',
          bgColor: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
          glow: 'glow-pass',
        };
      case 'Non-Compliant':
        return {
          status: 'fail',
          badgeText: 'PROHIBITED • CODE VIOLATION',
          title: 'Non-Compliant Condition — Remediation Required',
          description:
            'The described installation violates official statutory building codes or project specs. Correction is mandatory before sign-off.',
          bgColor: 'bg-rose-950/40 border-rose-500/40 text-rose-300',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          icon: <XCircle className="w-8 h-8 text-rose-400" />,
          glow: 'glow-fail',
        };
      case 'Ambiguous/Insufficient Data':
      default:
        return {
          status: 'warn',
          badgeText: 'ADDITIONAL INFORMATION / PERMIT REQUIRED',
          title: 'Clarification or Engineering Variance Needed',
          description:
            'Specific dimensions, material ratings, or local jurisdiction approval are needed to make a final determination.',
          bgColor: 'bg-amber-950/40 border-amber-500/40 text-amber-300',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          icon: <HelpCircle className="w-8 h-8 text-amber-400" />,
          glow: 'glow-warn',
        };
    }
  };

  // Generate Professional Inspection Markdown Report
  const formatReportMarkdown = () => {
    if (!result) return '';
    const verdictInfo = getVerdictDetails(result.verdict);
    return `# JOBSITE COMPLIANCE & SAFETY INSPECTION REPORT
Generated by SiteShield Building Code Advisor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: ${currentProject.name} (${currentProject.phase})
Location: ${currentProject.location}
Date & Time: ${new Date().toLocaleString()}
Inspection Scope: Trade: ${trade} | Jurisdiction: ${jurisdiction} | Document Scope: ${docType}

INSPECTION QUESTION / OBSERVATION:
"${query}"

COMPLIANCE DETERMINATION:
Status: ${verdictInfo.badgeText}
Confidence Match: ${(result.confidence_score * 100).toFixed(0)}%

EXECUTIVE SUMMARY:
${result.summary}

OFFICIAL CODE REFERENCES & CITATIONS:
${result.citations
  ?.map(
    (c, i) => `${i + 1}. [${c.clause_number}] ${c.document_title} (${c.page_or_section})
   Quote: "${c.direct_quote}"
   Application: ${c.relevance_explanation}`
  )
  .join('\n\n')}

REQUIRED JOBSITE ACTIONS & CHECKLIST:
${result.recommended_actions?.map((a, i) => `[ ${completedActions[i] ? 'X' : ' '} ] ${a}`).join('\n')}

TECHNICAL GUIDANCE:
${result.technical_analysis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report Verified via Official Building Code Library
`;
  };

  // Subcontractor Field Notice Generator
  const generateSubcontractorNotice = () => {
    if (!result) return '';
    const verdictInfo = getVerdictDetails(result.verdict);
    const primaryCite = result.citations?.[0];
    return `ATTN: ${trade === 'All' ? 'Trade' : trade} Subcontractor Foreman
PROJECT: ${currentProject.name}
DATE: ${new Date().toLocaleDateString()}
STATUS: ${verdictInfo.badgeText}

OBSERVATION / ITEM:
"${query}"

COMPLIANCE SUMMARY:
${result.summary}

${primaryCite ? `GOVERNING CODE SECTION:
${primaryCite.clause_number} (${primaryCite.document_title})
"${primaryCite.direct_quote}"` : ''}

REQUIRED REMEDIATION / ACTION ITEMS:
${result.recommended_actions?.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Please review and confirm remediation before calling for scheduled field inspection.`;
  };

  // Filtered preset scenarios by trade category
  const filteredPresets = useMemo(() => {
    if (selectedTradeCategory === 'All') return PRESET_SCENARIOS;
    return PRESET_SCENARIOS.filter((s) => s.category === selectedTradeCategory);
  }, [selectedTradeCategory]);

  // Filtered documents in codebook modal
  const filteredDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return indexedDocs;
    const q = docSearchQuery.toLowerCase();
    return indexedDocs.filter(
      (d) =>
        d.clause_number?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        d.trade?.toLowerCase().includes(q) ||
        d.summary_snippet?.toLowerCase().includes(q)
    );
  }, [indexedDocs, docSearchQuery]);

  // Action checklist completion count
  const completedCount = useMemo(() => {
    if (!result?.recommended_actions) return 0;
    return Object.values(completedActions).filter(Boolean).length;
  }, [completedActions, result]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-[#0c1322]/95 backdrop-blur-md border-b border-[#1e2d4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3.5">
            <SiteShieldLogo className="w-9 h-9" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold tracking-tight text-xl text-white">
                  Site<span className="text-orange-500">Shield</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Building Code Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Instant jobsite compliance verification & code guidance
              </p>
            </div>
          </div>

          {/* Project Selector & Actions */}
          <div className="flex items-center gap-3">
            {/* Active Jobsite Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141e33] hover:bg-[#1a2844] border border-[#233557] text-xs text-slate-200 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-slate-100 max-w-[180px] truncate">
                    {currentProject.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{currentProject.phase}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProjectMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[#121c30] border border-[#233557] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">
                    Select Active Construction Jobsite
                  </div>
                  <div className="space-y-1 mt-1.5">
                    {PROJECTS.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setCurrentProject(proj);
                          setShowProjectMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start justify-between ${
                          currentProject.id === proj.id
                            ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                            : 'text-slate-300 hover:bg-[#1a2844]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-100">{proj.name}</div>
                          <div className="text-[11px] text-slate-400">{proj.phase}</div>
                          <div className="text-[10px] text-orange-400/80 mt-0.5">{proj.code}</div>
                        </div>
                        {currentProject.id === proj.id && <Check className="w-4 h-4 text-orange-400 mt-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions: Codebook & History */}
            <button
              type="button"
              onClick={() => {
                setShowCodebookModal(true);
                if (indexedDocs.length === 0) fetchIndexedDocuments();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e33] hover:bg-[#1a2844] border border-[#233557] text-xs text-slate-200"
              title="Browse Codebooks"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Code Library</span>
            </button>

            {queryHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141e33] hover:bg-[#1a2844] border border-[#233557] text-xs text-slate-200"
                title="Recent Checks"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Recent</span>
                <span className="px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                  {queryHistory.length}
                </span>
              </button>
            )}

            {/* Library Status Indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#101827] border border-[#1e2d4a] text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth?.status === 'healthy' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300 text-[11px] font-medium hidden lg:inline">
                {backendHealth?.status === 'healthy' ? 'Code Library Online' : 'Connecting to Library...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Trade Category Navigation Filter */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2">
            {CATEGORIZED_SCENARIOS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedTradeCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedTradeCategory(cat.category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/50 font-bold'
                      : 'bg-[#111b2e] text-slate-300 hover:text-white hover:bg-[#17243d] border border-[#1e2d4a]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>IBC 2024 • NEC 2023 • UPC 2024 Grounded</span>
          </div>
        </div>

        {/* Hero Inquiry Hub Card */}
        <div className="app-card rounded-2xl p-5 sm:p-6 border border-[#1e2d4a] relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-4">
            {/* Header & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2942] pb-3">
              <div>
                <h1 className="text-lg font-bold font-display text-white tracking-tight flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-400" />
                  <span>Ask Any Building Code or Jobsite Question</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Describe a field condition, material spec, or installation requirement for instant verification.
                </p>
              </div>

              {/* Toggle Filters Button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors self-start sm:self-auto ${
                  showFilters || trade !== 'All' || jurisdiction !== 'All' || docType !== 'All'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-[#141f36] text-slate-300 border-[#233557] hover:bg-[#1a2847]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>Jobsite & Trade Filters</span>
                {(trade !== 'All' || jurisdiction !== 'All' || docType !== 'All') && (
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                )}
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
              <div className="p-4 rounded-xl bg-[#0e1626] border border-[#1e2d4a] grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
                {/* Trade Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-orange-400" />
                    <span>Trade Discipline</span>
                  </label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full bg-[#141f36] border border-[#233557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="All">All Trades (Cross-Discipline)</option>
                    <option value="Electrical">Electrical (NEC / NFPA 70)</option>
                    <option value="Fire Safety">Fire & Life Safety (IBC 714)</option>
                    <option value="Structural">Structural & Concrete (IBC Ch 16)</option>
                    <option value="Plumbing">Plumbing & Piping (UPC)</option>
                  </select>
                </div>

                {/* Jurisdiction Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>Building Code Jurisdiction</span>
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-[#141f36] border border-[#233557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="All">All Jurisdictions (Standard Model)</option>
                    <option value="National">National Model Codes (IBC, NEC, UPC)</option>
                    <option value="California">California (CBC Title 24)</option>
                    <option value="NYC">New York City (NYC Amendments)</option>
                  </select>
                </div>

                {/* Document Scope */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Document Reference Type</span>
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-[#141f36] border border-[#233557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="All">All Reference Types</option>
                    <option value="Code">Official Building Codes Only</option>
                    <option value="Project Spec">Project Specifications</option>
                    <option value="Inspection Log">Field Inspection Records</option>
                  </select>
                </div>

                {/* Reset Action */}
                <div className="sm:col-span-3 flex justify-between items-center pt-2 border-t border-[#1c2942] text-xs">
                  <span className="text-slate-400">
                    Active filters tailor retrieval to specific trade standards and municipal amendments.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTrade('All');
                      setJurisdiction('All');
                      setDocType('All');
                    }}
                    className="text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    Reset Filters to Default
                  </button>
                </div>
              </div>
            )}

            {/* Main Question Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question, e.g., 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?' or describe what you observed on site..."
                  rows={3}
                  className="w-full bg-[#0c1322] border border-[#233557] rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none shadow-inner"
                  disabled={loading}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg bg-[#18233c] hover:bg-[#202f4f] transition-colors"
                    title="Clear text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Common Jobsite Situations Chips */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Common Jobsite Situations ({selectedTradeCategory}):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="app-card-interactive rounded-xl p-3 text-left border border-[#1e2d4a] flex items-start justify-between gap-2 group"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-slate-200 group-hover:text-orange-300 transition-colors">
                          {preset.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{preset.query}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                          preset.hintColor === 'pass'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : preset.hintColor === 'fail'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {preset.statusHint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1c2942]">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Grounded in Official Building Codes (Zero-Guesswork Guarantee)</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                    loading || !query.trim()
                      ? 'bg-[#162238] text-slate-500 border border-[#233557] cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/25 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verifying Building Codes...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-slate-950" />
                      <span>Check Compliance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Step-by-Step Friendly Loading State */}
        {loading && (
          <div className="app-card rounded-2xl p-8 border border-[#253759] text-center space-y-6 animate-pulse-subtle">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 mx-auto flex items-center justify-center text-orange-400 shadow-xl">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white tracking-wide">
                Analyzing Jobsite Condition Against Building Codes...
              </h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    loadingStep >= 1
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-semibold'
                      : 'bg-[#0e1626] border-[#1e2d4a] text-slate-500'
                  }`}
                >
                  <span>1. Searching official building code database...</span>
                  {loadingStep >= 1 ? <Check className="w-4 h-4 text-orange-400" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                </div>

                <div
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    loadingStep >= 2
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-semibold'
                      : 'bg-[#0e1626] border-[#1e2d4a] text-slate-500'
                  }`}
                >
                  <span>2. Cross-referencing trade requirements & local amendments...</span>
                  {loadingStep >= 2 ? <Check className="w-4 h-4 text-orange-400" /> : <span className="text-[10px]">Waiting</span>}
                </div>

                <div
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    loadingStep >= 3
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-semibold'
                      : 'bg-[#0e1626] border-[#1e2d4a] text-slate-500'
                  }`}
                >
                  <span>3. Formulating jobsite guidance & action checklist...</span>
                  {loadingStep >= 3 ? <Check className="w-4 h-4 text-orange-400" /> : <span className="text-[10px]">Waiting</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">Verification Engine Notice</h4>
              <p className="text-xs text-rose-200 mt-1">{error}</p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-3 text-xs px-3.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg border border-rose-700 font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Verification Results View */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Top Results Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1e2d4a] pb-3">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'summary'
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'bg-[#121c30] text-slate-300 hover:text-white border border-[#1e2d4a]'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Compliance Verdict & Guidance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('citations')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'citations'
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'bg-[#121c30] text-slate-300 hover:text-white border border-[#1e2d4a]'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Official Code References ({result.citations?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('sources')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeTab === 'sources'
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'bg-[#121c30] text-slate-300 hover:text-white border border-[#1e2d4a]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Source Text Chunks ({result.retrieved_chunks?.length || 0})</span>
                </button>
              </div>

              {/* Action Buttons: Subcontractor Notice & Printable Report */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141f36] hover:bg-[#1a2847] text-orange-300 border border-orange-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-orange-400" />
                  <span>Notice for Subcontractor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141f36] hover:bg-[#1a2847] text-slate-200 border border-[#233557] flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print / Export Report</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Main Verdict & Action Guidance */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Master Verdict Banner */}
                {(() => {
                  const v = getVerdictDetails(result.verdict);
                  return (
                    <div
                      className={`rounded-2xl p-6 border ${v.bgColor} ${v.glow} transition-all duration-300 shadow-xl space-y-4`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-2xl bg-[#0a1120]/80 border border-[#1e2d4a] shadow-inner">
                            {v.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span
                                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${v.badgeClass}`}
                              >
                                {v.badgeText}
                              </span>
                              <span className="text-xs text-slate-400">
                                Verified in {result.search_metadata?.elapsed_time_ms || 320}ms
                              </span>
                            </div>
                            <h2 className="text-xl font-bold font-display text-white mt-1.5 tracking-tight">
                              {v.title}
                            </h2>
                            <p className="text-xs text-slate-300 mt-1">{v.description}</p>
                          </div>
                        </div>

                        {/* Match Confidence Score */}
                        <div className="bg-[#0c1322]/90 px-4 py-3 rounded-xl border border-[#1e2d4a] w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Code Match Confidence
                            </div>
                            <div className="text-xl font-bold text-white font-display">
                              {(result.confidence_score * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="w-20 bg-[#1e293b] h-2.5 rounded-full overflow-hidden">
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

                      {/* Plain-English Executive Takeaway */}
                      <div className="mt-4 pt-4 border-t border-[#1e2d4a] bg-[#0c1322]/70 p-4 rounded-xl border">
                        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-orange-400" />
                          <span>Jobsite Takeaway (Plain-English Summary)</span>
                        </div>
                        <p className="text-sm text-slate-100 leading-relaxed font-sans">
                          {result.summary}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Action Checklist for Field Team */}
                {result.recommended_actions && result.recommended_actions.length > 0 && (
                  <div className="app-card rounded-2xl p-5 sm:p-6 border border-[#1e2d4a] shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1c2942] pb-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-orange-400" />
                        <div>
                          <h3 className="font-bold font-display text-sm text-white">
                            Required Field Actions & Inspection Checklist
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Check off items as completed on the jobsite
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/30">
                        {completedCount} of {result.recommended_actions.length} Completed
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {result.recommended_actions.map((action, idx) => {
                        const isDone = !!completedActions[idx];
                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-950/25 border-emerald-700/50 text-emerald-200'
                                : 'bg-[#0f1728] border-[#1e2d4a] text-slate-200 hover:border-[#2a3c61] hover:bg-[#141f36]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleAction(idx)}
                              className="mt-0.5 w-4 h-4 rounded bg-[#1e293b] border-slate-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                            />
                            <div className="space-y-0.5">
                              <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-400' : 'text-slate-100 font-medium'}`}>
                                {action}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed Code Guidance */}
                <div className="app-card rounded-2xl p-5 sm:p-6 border border-[#1e2d4a] shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#1c2942] pb-3">
                    <FileText className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="font-bold font-display text-sm text-white">
                        Detailed Code Analysis & Remediation Guidance
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Engineering explanation and statutory interpretation
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line space-y-2 pt-1 font-sans">
                    {result.technical_analysis}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Official Code References & Citations */}
            {activeTab === 'citations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Official statutory clauses and specification sections cited for this determination:
                  </span>
                  <span className="font-semibold text-orange-400">
                    {result.citations?.length || 0} Governing Clauses
                  </span>
                </div>

                {result.citations && result.citations.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {result.citations.map((cite, idx) => (
                      <div
                        key={idx}
                        className="app-card rounded-2xl p-5 border border-[#1e2d4a] hover:border-[#2a3c61] transition-all space-y-3.5 shadow-lg"
                      >
                        {/* Header with Clause & Document */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2942] pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-bold font-mono">
                              {cite.clause_number}
                            </span>
                            <span className="text-xs font-bold text-white font-display">
                              {cite.document_title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162238] text-slate-300 font-semibold">
                              {cite.trade}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162238] text-slate-300 font-semibold">
                              {cite.jurisdiction}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162238] text-slate-300 font-semibold">
                              {cite.document_type}
                            </span>
                          </div>
                        </div>

                        {/* Location / Section */}
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" />
                          <span>Section / Page: <strong className="text-slate-200">{cite.page_or_section}</strong></span>
                        </div>

                        {/* Direct Verbatim Quote Block */}
                        <div className="bg-[#0b1220] border-l-4 border-orange-500 rounded-r-xl p-3.5 relative group">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Official Statutory Text (Verbatim Extract):</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(cite.direct_quote, 'quote', idx)}
                              className="text-slate-400 hover:text-orange-400 p-1 rounded transition-colors flex items-center gap-1 text-[10px]"
                              title="Copy quote"
                            >
                              {copiedQuoteIdx === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <blockquote className="text-xs text-orange-100/90 italic leading-relaxed">
                            &ldquo;{cite.direct_quote}&rdquo;
                          </blockquote>
                        </div>

                        {/* Practical Jobsite Relevance */}
                        <div className="text-xs text-slate-300 flex items-start gap-2 bg-[#121c30] p-3 rounded-xl border border-[#1e2d4a]">
                          <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-white">Field Application:</strong>{' '}
                            {cite.relevance_explanation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 app-card rounded-2xl border border-[#1e2d4a]">
                    No specific statutory clauses extracted for this query.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Raw Retrieved Code Chunks */}
            {activeTab === 'sources' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <p>
                    Showing {result.retrieved_chunks?.length || 0} retrieved code excerpts from the building code database:
                  </p>
                </div>

                <div className="space-y-3">
                  {result.retrieved_chunks?.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="app-card rounded-xl p-4 border border-[#1e2d4a] space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2942] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 flex items-center justify-center text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {chunk.clause_number}
                          </span>
                          <span className="text-xs text-slate-300">({chunk.doc_title})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-[#162238] text-slate-400 text-[10px]">
                            {chunk.trade}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#162238] text-slate-400 text-[10px]">
                            {chunk.jurisdiction}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed bg-[#0b1220] p-3 rounded-lg border border-[#1e2d4a]">
                        {chunk.text}
                      </p>

                      <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                        <span>Type: {chunk.document_type}</span>
                        <span>Location: {chunk.page_or_section}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session Inquiries History Panel */}
        {queryHistory.length > 0 && (
          <div className="app-card rounded-2xl p-5 border border-[#1e2d4a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <History className="w-4 h-4 text-orange-400" />
                <span>Recent Jobsite Inquiries ({queryHistory.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setQueryHistory([])}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {queryHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setTrade(item.trade);
                    setJurisdiction(item.jurisdiction);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className="app-card-interactive rounded-xl p-3 text-left border border-[#1e2d4a] flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{item.query}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.timestamp} • {item.trade}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                      item.verdict === 'Compliant'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.verdict === 'Non-Compliant'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.verdict === 'Compliant' ? 'Approved' : item.verdict === 'Non-Compliant' ? 'Violation' : 'Review'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modern Friendly Footer */}
      <footer className="border-t border-[#1e2d4a] bg-[#080d17] py-6 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SiteShieldLogo className="w-6 h-6" />
            <span className="font-semibold text-slate-300">
              SiteShield <span className="text-orange-500">•</span> Building Code & Jobsite Safety Advisor
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>IBC (2024)</span>
            <span>•</span>
            <span>NEC (2023)</span>
            <span>•</span>
            <span>UPC (2024)</span>
            <span>•</span>
            <span>Zero-Guesswork Grounded</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Subcontractor Field Notice */}
      {showNoticeModal && result && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c30] border border-[#233557] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold font-display text-base text-white">
                  Field Notice for Trade Subcontractor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#18233c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Copy and send this pre-formatted notice directly via Email, SMS, or Procore to your subcontractor foreman:
            </p>

            <textarea
              readOnly
              rows={12}
              value={generateSubcontractorNotice()}
              className="w-full bg-[#0c1322] border border-[#233557] rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed select-all focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Ready to paste into communication apps
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(generateSubcontractorNotice(), 'notice')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-500/20"
              >
                {copiedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Notice Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Official Report */}
      {showPrintModal && result && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c30] border border-[#233557] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold font-display text-base text-white">
                  Official Jobsite Inspection Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#18233c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e2d4a] text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-200 select-all">
              {formatReportMarkdown()}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(formatReportMarkdown(), 'report')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#18233c] hover:bg-[#202f4f] text-slate-200 border border-[#233557] flex items-center gap-1.5 transition-colors"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Codebook Library Explorer */}
      {showCodebookModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c30] border border-[#233557] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold font-display text-base text-white">
                    Building Codebook & Specification Library
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Search official indexed statutory building codes & standard divisions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCodebookModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#18233c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter in modal */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Search by code section (e.g., 'NEC 300.22', 'IBC 714', 'Plumbing')..."
                className="w-full bg-[#0c1322] border border-[#233557] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Code list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingDocs ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Loading official code database...</span>
                </div>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="app-card rounded-xl p-3.5 border border-[#1e2d4a] space-y-1.5 hover:border-[#2a3c61] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 font-mono">
                        {doc.clause_number}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#18233c] text-slate-300 font-semibold">
                        {doc.trade} • {doc.jurisdiction}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 bg-[#0c1322] p-2 rounded-lg border border-[#1e2d4a]">
                      {doc.summary_snippet}
                    </p>
                    <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                      <span>{doc.document_type}</span>
                      <span>Section: {doc.page_or_section}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching code clauses found in the database.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1e2d4a]">
              <button
                type="button"
                onClick={() => setShowCodebookModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#18233c] hover:bg-[#202f4f] text-slate-200"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Recent Session Checks */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="bg-[#121c30] border-l border-[#233557] w-full max-w-md h-full p-6 shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold font-display text-base text-white">
                  Inspection Session History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#18233c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {queryHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setTrade(item.trade);
                    setJurisdiction(item.jurisdiction);
                    setShowHistoryDrawer(false);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className="w-full text-left app-card rounded-xl p-3.5 border border-[#1e2d4a] hover:border-orange-500/50 space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        item.verdict === 'Compliant'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.verdict === 'Non-Compliant'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.verdict}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium line-clamp-2">{item.query}</p>
                  <div className="text-[10px] text-orange-400">Trade: {item.trade}</div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#1e2d4a] flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setQueryHistory([]);
                  setShowHistoryDrawer(false);
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear History
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#18233c] hover:bg-[#202f4f] text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
