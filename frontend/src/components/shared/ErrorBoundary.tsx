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
        <Card className="border-destructive/30 bg-destructive/5 p-6 text-center space-y-4 my-4 shadow-md">
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground">
              {this.props.fallbackTitle || 'Component Rendering Error'}
            </CardTitle>
            <CardDescription className="text-xs">
              {this.props.fallbackMessage || 'A client-side error occurred in this view.'}
            </CardDescription>
          </div>
          {this.state.error && (
            <div className="text-xs font-mono bg-background/80 p-2.5 rounded border text-muted-foreground max-w-md mx-auto truncate">
              {this.state.error.message}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Component</span>
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
