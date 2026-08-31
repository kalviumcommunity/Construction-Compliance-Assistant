'use client';

import React from 'react';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { useAssistant } from './AssistantContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AssistantLoading() {
  const { loading, loadingStep, error, handleSubmit } = useAssistant();

  if (error) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20 text-destructive flex items-start gap-3 shadow-sm mt-6">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-sm">Verification Engine Notice</h4>
          <p className="text-xs mt-1 opacity-90">{error}</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleSubmit()}
            className="mt-3 text-xs"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!loading) return null;

  return (
    <Card className="p-8 text-center space-y-6 animate-pulse mt-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        <h3 className="text-base font-bold tracking-wide">
          Analyzing Jobsite Condition Against Building Codes...
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              loadingStep >= 1
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            <span>1. Searching official building code database...</span>
            {loadingStep >= 1 ? <Check className="w-4 h-4 text-primary" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          </div>

          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              loadingStep >= 2
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            <span>2. Cross-referencing trade requirements & local amendments...</span>
            {loadingStep >= 2 ? <Check className="w-4 h-4 text-primary" /> : <span className="text-[10px]">Waiting</span>}
          </div>

          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              loadingStep >= 3
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            <span>3. Formulating jobsite guidance & action checklist...</span>
            {loadingStep >= 3 ? <Check className="w-4 h-4 text-primary" /> : <span className="text-[10px]">Waiting</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
