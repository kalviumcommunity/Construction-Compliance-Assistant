'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareCode,
  FolderArchive,
  Briefcase,
  ClipboardList,
  SearchCode,
  History,
  Gauge,
  Sliders,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemHealth } from '@/lib/api';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const WORKSPACE_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Compliance Assistant', href: '/assistant', icon: MessageSquareCode, badge: 'AI RAG' },
  { name: 'Regulatory Specs', href: '/documents', icon: FolderArchive },
  { name: 'Project Portfolios', href: '/projects', icon: Briefcase },
  { name: 'QA/QC Inspections', href: '/inspections', icon: ClipboardList },
];

const INTELLIGENCE_NAV: NavItem[] = [
  { name: 'Search Explorer', href: '/search', icon: SearchCode },
  { name: 'Audit Log & History', href: '/history', icon: History },
  { name: 'Benchmark Evaluation', href: '/evaluation', icon: Gauge },
  { name: 'System Diagnostics', href: '/settings', icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();
  const { health } = useSystemHealth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border/70 bg-card/95 backdrop-blur-xl h-screen shrink-0 sticky top-0 overflow-hidden z-20 shadow-xl select-none">
      {/* ─── Top Brand Header ────────────────────────────────────────── */}
      <div className="h-16 flex items-center px-4 border-b border-border/60 shrink-0 gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-amber-600 shadow-md shadow-primary/25 ring-1 ring-white/20">
          <ShieldCheck className="w-5 h-5 text-primary-foreground drop-shadow-sm" strokeWidth={2.5} />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk Variable', sans-serif" }}>
              SiteSafe
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/30 tracking-wide font-mono uppercase">
              RAG
            </span>
          </div>
          <div className="text-[10.5px] text-muted-foreground font-medium truncate flex items-center gap-1.5">
            <span>Regulatory Compliance</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Groups ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-none">
        {/* Tier 1: Workspace Core */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 font-mono">
            Core Operations
          </p>
          {WORKSPACE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-200 group relative',
                  active
                    ? 'nav-active text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:translate-x-0.5'
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Tier 2: Intelligence & Audit */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 font-mono">
            Intelligence & QA
          </p>
          {INTELLIGENCE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-200 group relative',
                  active
                    ? 'nav-active text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:translate-x-0.5'
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Footer Telemetry Card ───────────────────────────────────── */}
      <div className="p-3 border-t border-border/60 bg-secondary/30">
        <div className="p-2.5 rounded-xl border border-border/60 bg-card/60 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-foreground">
                Inference Gateway
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-0.5 font-mono">
            <span>{health?.llm_provider ? `${health.llm_provider} GA` : 'Gemini GA'}</span>
            <span>{health?.indexed_documents || 402} Chunks</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
