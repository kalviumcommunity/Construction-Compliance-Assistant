'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors securely on client
    console.error('Next.js Client Runtime Error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-destructive/30 bg-destructive/5 shadow-xl">
        <CardHeader className="text-center pb-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold">Something Went Wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while rendering this interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          <p className="text-xs font-mono bg-background/80 border p-3 rounded-lg text-muted-foreground break-all">
            {error.message || 'Unknown application error'}
          </p>
          <p className="text-xs text-muted-foreground">
            If the backend server is offline or experiencing connectivity issues, ensure the FastAPI server is active on port 8000.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => reset()} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
          <Button size="sm" asChild className="gap-2">
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
