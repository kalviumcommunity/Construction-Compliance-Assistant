'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-6 rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-xl shadow-xl text-center space-y-4 animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20 shadow-inner">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              {this.props.fallbackTitle || 'Service Temporarily Unavailable'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {this.props.fallbackMessage || 'The compliance interface encountered an unexpected rendering condition. The system has prevented an application crash.'}
            </p>
          </div>
          {this.state.error && (
            <div className="text-xs font-mono bg-background/90 p-3 rounded-xl border border-border/80 text-muted-foreground max-w-lg mx-auto truncate shadow-xs">
              {this.state.error.message}
            </div>
          )}
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2 font-semibold shadow-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset &amp; Retry View</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

