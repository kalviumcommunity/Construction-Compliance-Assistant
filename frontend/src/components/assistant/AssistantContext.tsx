'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Sparkles, Zap, HardHat, Flame, Droplets } from 'lucide-react';
import { api, API_BASE } from '@/lib/api';

export const PROJECTS = [
  { id: 'skyline', name: 'Skyline Commercial Tower', phase: 'Phase 3 (Core & Shell)', location: 'Seattle, WA', code: 'IBC 2024 / NEC 2023' },
  { id: 'harbor', name: 'Harbor Point Medical Pavilion', phase: 'Phase 2 (MEP Rough-in)', location: 'San Francisco, CA', code: 'CBC Title 24 / OSHPD' },
  { id: 'midtown', name: 'Midtown Mixed-Use Residences', phase: 'Phase 1 (Podium & Framing)', location: 'New York, NY', code: 'NYC Construction Codes' },
];

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
  { id: 5, title: 'Egress Stairway Clear Width Between Handrails', trade: 'Structural', category: 'Structural', query: 'Egress stairway serving 120 building occupants has clear finished width of 40 inches between handrails. Is this compliant?', jurisdiction: 'National', docType: 'Code', statusHint: 'Non-Compliant', hintColor: 'fail' },
  { id: 6, title: 'Acoustic Panel Fabric Specification Clarification', trade: 'All', category: 'All', query: 'What is the required thickness of acoustic fabric wrap for executive conference room acoustic wood panels?', jurisdiction: 'All', docType: 'All', statusHint: 'Needs Details', hintColor: 'warn' },
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
  
  const [currentProject, setCurrentProject] = useState(PROJECTS[0]);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('summary');
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});
  const [queryHistory, setQueryHistory] = useState<any[]>([]);
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showCodebookModal, setShowCodebookModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [indexedDocs, setIndexedDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(data => setBackendHealth(data))
      .catch(() => setBackendHealth({ status: 'offline' }));
  }, []);

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

      setResult(data);
      setActiveTab('summary');

      setQueryHistory((prev) => [
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
        currentProject, setCurrentProject,
        loading, loadingStep, result, error,
        activeTab, setActiveTab,
        completedActions, setCompletedActions,
        queryHistory, setQueryHistory,
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
