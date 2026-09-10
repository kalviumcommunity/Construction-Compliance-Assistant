'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Building2,
  Menu,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useSystemHealth } from '@/lib/api';

export function Topbar() {
  const { health } = useSystemHealth();

  return (
    <header className="h-16 border-b border-border/70 glass flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shrink-0 shadow-xs">
      {/* ─── Left Section: Mobile Trigger & Active Project ───────────── */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-border">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Brand Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm text-foreground" style={{ fontFamily: "'Space Grotesk Variable', sans-serif" }}>
            SiteSafe <span className="text-primary font-mono text-xs">RAG</span>
          </span>
        </div>

        {/* Desktop Active Project Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Project:</span>
          </div>
          <span className="font-semibold text-foreground">Skyline Commercial Tower (Seattle)</span>
          <span className="text-muted-foreground font-mono text-[10.5px]">•</span>
          <span className="text-emerald-500 font-medium text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            IBC 2024 Active
          </span>
        </div>
      </div>

      {/* ─── Right Section: Search, Telemetry & Profile ──────────────── */}
      <div className="flex items-center gap-3">
        {/* Global Search Shortcut Trigger */}
        <Link
          href="/search"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/60 text-xs text-muted-foreground transition-colors group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span>Search regulations, specs & clauses...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-card rounded border border-border/80">
            ⌘K
          </kbd>
        </Link>

        {/* Live System Uptime Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>RAG Gateway Active</span>
        </div>

        {/* Quick Assistant CTA */}
        <Button size="sm" asChild className="hidden sm:flex gap-1.5 text-xs font-semibold glow-primary h-8 px-3">
          <Link href="/assistant">
            <Zap className="w-3.5 h-3.5" />
            <span>Verify Code</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
