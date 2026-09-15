'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Sparkles, Zap, HardHat, Flame, Droplets } from 'lucide-react';
import {
  api,
  API_BASE,
  useProjects,
  useQueryHistory,
  useIndexedDocuments,
  useSystemHealth,
  Project,
} from '@/lib/api';

export const CATEGORIZED_SCENARIOS = [
  { category: 'All', label: 'All Scenarios', icon: Sparkles },
  { category: 'Electrical', label: 'Electrical', icon: Zap },
  { category: 'Structural', label: 'Structural', icon: HardHat },
  { category: 'Fire Safety', label: 'Fire & Life Safety', icon: Flame },
  { category: 'Plumbing', label: 'Plumbing & Mechanical', icon: Droplets },
];

export const PRESET_SCENARIOS = [
  { id: 1, title: 'PVC Conduit in Return Air Plenum', trade: 'Electrical', category: 'Electrical', query: 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?', jurisdiction: 'National', docType: 'Code', statusHint: 'Prohibited', hintColor: 'fail' },
  { id: 2, title: 'Post-Tensioned Concrete PSI Break Test', trade: 'Structural', category: 'Structural', query: 'Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant with project specs?', jurisdiction: 'National', docType: 'Project Spec', statusHint: 'Approved', hintColor: 'pass' },
  { id: 3, title: 'Firestop Sealant in 2-Hour Rated Wall', trade: 'Fire Safety', category: 'Fire Safety', query: 'Subcontractor packed 4-inch pipe penetration through 2-hour shear wall with bare ceramic wool only, omitting intumescent sealant.', jurisdiction: 'National', docType: 'Code', statusHint: 'Violation', hintColor: 'fail' },
  { id: 4, title: 'Drainage DWV Hydrostatic Pressure Test', trade: 'Plumbing', category: 'Plumbing', query: 'Did our 30-minute hydrostatic water test with 42-foot static head satisfy the rough drainage and vent inspection requirements?', jurisdiction: 'National', docType: 'Code', statusHint: 'Approved', hintColor: 'pass' },
  { id: 5, title: 'OSHA Fall Protection Guardrail Height', trade: 'Structural', category: 'Structural', query: 'Perimeter top guardrail was erected at 42 inches above the walking deck and withstands 200 lbs force. Does this satisfy OSHA 1926.502 requirements?', jurisdiction: 'National', docType: 'Code', statusHint: 'Approved', hintColor: 'pass' },
  { id: 6, title: 'Ductwork Acoustic Liner Flame Spread', trade: 'Fire Safety', category: 'Fire Safety', query: 'Contractor installed 1-inch fiberglass acoustic duct liner inside the return air plenum with ASTM E84 flame-spread index of 20 and smoke-developed index of 45. Does this comply with Project Spec Division 23 07 13?', jurisdiction: 'National', docType: 'Project Spec', statusHint: 'Approved', hintColor: 'pass' },
  { id: 7, title: 'California Title 24 Lighting Shut-Off', trade: 'Electrical', category: 'Electrical', query: 'Are commercial offices required to have automatic shut-off occupancy sensors configured to turn lights off within 20 minutes under California Title 24 Section 130.1?', jurisdiction: 'California', docType: 'Code', statusHint: 'Mandatory', hintColor: 'pass' },
  { id: 8, title: 'Medical Gas Brazing Nitrogen Purge', trade: 'Plumbing', category: 'Plumbing', query: 'During brazing of copper medical gas piping, subcontractor utilized BCuP filler metal with a continuous oil-free dry nitrogen purge. Does this comply with Division 22 61 00?', jurisdiction: 'National', docType: 'Project Spec', statusHint: 'Compliant', hintColor: 'pass' },
  { id: 9, title: 'Egress Stairway Clear Width Between Handrails', trade: 'Structural', category: 'Structural', query: 'Egress stairway serving 120 building occupants has clear finished width of 40 inches between handrails. Is this compliant?', jurisdiction: 'National', docType: 'Code', statusHint: 'Non-Compliant', hintColor: 'fail' },
];

type AssistantContextType = {
  query: string;
  setQuery: (val: string) => void;
  selectedTradeCategory: string;
  setSelectedTradeCategory: (val: string) => void;
  trade: string;
  setTrade: (val: string) => void;
  jurisdiction: string;
  setJurisdiction: (val: string) => void;
  docType: string;
  setDocType: (val: string) => void;
  searchThoroughness: number;
  setSearchThoroughness: (val: number) => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  currentProject: any;
  setCurrentProject: (val: any) => void;
  projects: Project[];
  loading: boolean;
  loadingStep: number;
  result: any;
  error: any;
  activeTab: string;
  setActiveTab: (val: string) => void;
  completedActions: Record<number, boolean>;
  setCompletedActions: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  queryHistory: any[];
  setQueryHistory: React.Dispatch<React.SetStateAction<any[]>>;
  showPrintModal: boolean;
  setShowPrintModal: (val: boolean) => void;
  showNoticeModal: boolean;
  setShowNoticeModal: (val: boolean) => void;
  showCodebookModal: boolean;
  setShowCodebookModal: (val: boolean) => void;
  showHistoryDrawer: boolean;
  setShowHistoryDrawer: (val: boolean) => void;
  backendHealth: any;
  indexedDocs: any[];
  loadingDocs: boolean;
  docSearchQuery: string;
  setDocSearchQuery: (val: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleApplyPreset: (preset: any) => void;
  toggleAction: (idx: number) => void;
  fetchIndexedDocuments: () => void;
};

const AssistantContext = createContext<AssistantContextType | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [selectedTradeCategory, setSelectedTradeCategory] = useState('All');
  const [trade, setTrade] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [docType, setDocType] = useState('All');
  const [searchThoroughness, setSearchThoroughness] = useState(5);
  const [showFilters, setShowFilters] = useState(false);

  // Dynamic projects fetched from live backend
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const currentProject = useMemo(() => {
    if (selectedProject) return selectedProject;
    if (projects && projects.length > 0) {
      return (
        projects.find((p) => p.status === 'active') || projects[0]
      );
    }
    return {
      id: 'active-site',
      name: 'Active Project Portfolio',
      location: 'Primary Jobsite',
      phase: 'Construction QA/QC',
      active_codes: ['IBC 2024', 'NEC 2023', 'UPC 2024'],
    };
  }, [selectedProject, projects]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('summary');
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  // Dynamic query history, indexed documents, and system health from live backend
  const { history: liveHistory, mutate: mutateHistory } = useQueryHistory();
  const { documents: indexedDocs, isLoading: loadingDocs, mutate: mutateDocs } = useIndexedDocuments();
  const { health: backendHealth } = useSystemHealth();

  const [localHistory, setLocalHistory] = useState<any[]>([]);

  // Synchronize dynamic history with local additions
  const queryHistory = useMemo(() => {
    if (liveHistory && liveHistory.length > 0) {
      return liveHistory;
    }
    return localHistory;
  }, [liveHistory, localHistory]);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showCodebookModal, setShowCodebookModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const [docSearchQuery, setDocSearchQuery] = useState('');

  const fetchIndexedDocuments = () => {
    mutateDocs();
  };

  const handleApplyPreset = (preset: any) => {
    setQuery(preset.query);
    setTrade(preset.trade);
    setJurisdiction(preset.jurisdiction);
    setDocType(preset.docType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
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
      const data = await api.verifyCompliance({
        query: query.trim(),
        trade,
        jurisdiction,
        document_type: docType,
        top_k: searchThoroughness,
      });

      setResult({ ...data, query: data.query || query.trim() });
      setActiveTab('summary');

      setLocalHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          query: query.trim(),
          trade,
          jurisdiction,
          verdict: data.verdict,
          confidence: data.confidence_score,
          projectName: currentProject.name,
        },
        ...prev.slice(0, 14),
      ]);
      mutateHistory();
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the building code library.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <AssistantContext.Provider
      value={{
        query, setQuery,
        selectedTradeCategory, setSelectedTradeCategory,
        trade, setTrade,
        jurisdiction, setJurisdiction,
        docType, setDocType,
        searchThoroughness, setSearchThoroughness,
        showFilters, setShowFilters,
        currentProject, setCurrentProject: setSelectedProject,
        projects: projects || [],
        loading, loadingStep, result, error,
        activeTab, setActiveTab,
        completedActions, setCompletedActions,
        queryHistory, setQueryHistory: setLocalHistory,
        showPrintModal, setShowPrintModal,
        showNoticeModal, setShowNoticeModal,
        showCodebookModal, setShowCodebookModal,
        showHistoryDrawer, setShowHistoryDrawer,
        backendHealth, indexedDocs, loadingDocs, docSearchQuery, setDocSearchQuery,
        handleSubmit, handleApplyPreset, toggleAction, fetchIndexedDocuments,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
