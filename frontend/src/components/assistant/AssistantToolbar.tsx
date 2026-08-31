'use client';

import React, { useState } from 'react';
import { Building2, ChevronDown, Check, BookOpen, History } from 'lucide-react';
import { useAssistant, PROJECTS } from './AssistantContext';
import { Button } from '@/components/ui/button';

export function AssistantToolbar() {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const { 
    currentProject, setCurrentProject, 
    setShowCodebookModal, indexedDocs, fetchIndexedDocuments,
    queryHistory, setShowHistoryDrawer,
    backendHealth
  } = useAssistant();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border rounded-xl p-3 mb-6 shadow-sm">
      <div className="flex items-center gap-3 w-full sm:w-auto relative">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto flex items-center justify-between gap-2 border-border"
          onClick={() => setShowProjectMenu(!showProjectMenu)}
        >
          <Building2 className="w-4 h-4 text-primary" />
          <div className="text-left hidden md:block">
            <div className="font-semibold text-foreground max-w-[180px] truncate">
              {currentProject.name}
            </div>
            <div className="text-[10px] text-muted-foreground">{currentProject.phase}</div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>

        {showProjectMenu && (
          <div className="absolute top-12 left-0 w-72 bg-popover border rounded-xl shadow-lg p-2 z-50">
            <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b">
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
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="font-bold">{proj.name}</div>
                    <div className="text-[11px] text-muted-foreground">{proj.phase}</div>
                    <div className="text-[10px] text-primary/80 mt-0.5">{proj.code}</div>
                  </div>
                  {currentProject.id === proj.id && <Check className="w-4 h-4 text-primary mt-1" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowCodebookModal(true);
            if (indexedDocs.length === 0) fetchIndexedDocuments();
          }}
          className="hidden sm:flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4 text-sky-500" />
          <span>Code Library</span>
        </Button>

        {queryHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryDrawer(true)}
            className="flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Recent Checks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
              {queryHistory.length}
            </span>
          </Button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealth?.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-destructive'
            }`}
          />
          <span className="text-muted-foreground text-[11px] font-medium hidden lg:inline">
            {backendHealth?.status === 'healthy' ? 'Code Library Online' : 'Connecting to Library...'}
          </span>
        </div>
      </div>
    </div>
  );
}
