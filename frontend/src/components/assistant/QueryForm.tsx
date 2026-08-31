'use client';

import React, { useMemo } from 'react';
import { Shield, Wrench, SlidersHorizontal, ChevronDown, ChevronUp, MapPin, FileText, Sparkles, X, ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { useAssistant, CATEGORIZED_SCENARIOS, PRESET_SCENARIOS } from './AssistantContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function QueryForm() {
  const {
    query, setQuery,
    selectedTradeCategory, setSelectedTradeCategory,
    trade, setTrade,
    jurisdiction, setJurisdiction,
    docType, setDocType,
    showFilters, setShowFilters,
    loading, handleSubmit, handleApplyPreset
  } = useAssistant();

  const filteredPresets = useMemo(() => {
    if (selectedTradeCategory === 'All') return PRESET_SCENARIOS;
    return PRESET_SCENARIOS.filter((s) => s.category === selectedTradeCategory);
  }, [selectedTradeCategory]);

  return (
    <div className="space-y-6">
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
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>IBC 2024 • NEC 2023 • UPC 2024 Grounded</span>
        </div>
      </div>

      <Card className="p-5 sm:p-6 relative overflow-hidden">
        <div className="relative space-y-4 z-10">
          {/* Header & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                <span>Ask Any Building Code or Jobsite Question</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Describe a field condition, material spec, or installation requirement for instant verification.
              </p>
            </div>

            <Button
              variant={showFilters || trade !== 'All' || jurisdiction !== 'All' || docType !== 'All' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="self-start sm:self-auto gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Jobsite & Trade Filters</span>
              {(trade !== 'All' || jurisdiction !== 'All' || docType !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-orange-400" />
              )}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>

          {showFilters && (
            <div className="p-4 rounded-xl bg-muted/50 border grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-primary" />
                  <span>Trade Discipline</span>
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="All">All Trades (Cross-Discipline)</option>
                  <option value="Electrical">Electrical (NEC / NFPA 70)</option>
                  <option value="Fire Safety">Fire & Life Safety (IBC 714)</option>
                  <option value="Structural">Structural & Concrete (IBC Ch 16)</option>
                  <option value="Plumbing">Plumbing & Piping (UPC)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>Building Code Jurisdiction</span>
                </label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="All">All Jurisdictions (Standard Model)</option>
                  <option value="National">National Model Codes (IBC, NEC, UPC)</option>
                  <option value="California">California (CBC Title 24)</option>
                  <option value="NYC">New York City (NYC Amendments)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Document Reference Type</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="All">All Reference Types</option>
                  <option value="Code">Official Building Codes Only</option>
                  <option value="Project Spec">Project Specifications</option>
                  <option value="Inspection Log">Field Inspection Records</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-between items-center pt-2 border-t text-xs">
                <span className="text-muted-foreground">
                  Active filters tailor retrieval to specific trade standards and municipal amendments.
                </span>
                <button
                  type="button"
                  onClick={() => { setTrade('All'); setJurisdiction('All'); setDocType('All'); }}
                  className="text-primary hover:underline font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question, e.g., 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?' or describe what you observed on site..."
                rows={3}
                className="w-full bg-background border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none shadow-sm"
                disabled={loading}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-foreground p-1 rounded-lg bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Common Jobsite Situations ({selectedTradeCategory}):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-xl p-3 text-left border bg-card hover:bg-muted/50 flex items-start justify-between gap-2 group transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-xs group-hover:text-primary transition-colors">
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{preset.query}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                        preset.hintColor === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : preset.hintColor === 'fail'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {preset.statusHint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Grounded in Official Building Codes (Zero-Guesswork Guarantee)</span>
              </div>

              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full sm:w-auto font-bold shadow-md"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    <span>Check Compliance</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
