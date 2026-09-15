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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemHealth } from '@/lib/api';
import { useSidebar } from './SidebarContext';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const WORKSPACE_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Compliance Assistant', href: '/assistant', icon: MessageSquareCode, badge: 'AI' },
  { name: 'Regulatory Specs', href: '/documents', icon: FolderArchive },
  { name: 'Project Portfolios', href: '/projects', icon: Briefcase },
  { name: 'Jobsite Inspections', href: '/inspections', icon: ClipboardList },
];

const INTELLIGENCE_NAV: NavItem[] = [
  { name: 'Search Regulations', href: '/search', icon: SearchCode },
  { name: 'Audit Log & History', href: '/history', icon: History },
  { name: 'Quality Tests', href: '/evaluation', icon: Gauge },
  { name: 'System Status', href: '/settings', icon: Sliders },
];

interface SidebarProps {
  forceExpanded?: boolean;
}

export function Sidebar({ forceExpanded = false }: SidebarProps) {
  const pathname = usePathname();
  const { health } = useSystemHealth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const collapsed = forceExpanded ? false : isCollapsed;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col border-r border-border/70 bg-card/95 backdrop-blur-xl h-screen shrink-0 sticky top-0 overflow-visible z-20 shadow-xl select-none transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* ─── Top Brand Header ────────────────────────────────────────── */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-border/60 shrink-0 transition-all duration-300',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-amber-600 shadow-md shadow-primary/25 ring-1 ring-white/20 shrink-0 group">
            <ShieldCheck className="w-5 h-5 text-primary-foreground drop-shadow-sm" strokeWidth={2.5} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-semibold shadow-2xl border border-border/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                SiteSafe PRO • Building Code Compliance
              </div>
            )}
          </Link>

          {!collapsed && (
            <div className="min-w-0 flex-1 transition-opacity duration-200">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-bold text-base text-foreground tracking-tight"
                  style={{ fontFamily: "'Space Grotesk Variable', sans-serif" }}
                >
                  SiteSafe
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/30 tracking-wide font-mono uppercase">
                  PRO
                </span>
              </div>
              <div className="text-[10.5px] text-muted-foreground font-medium truncate">
                Building Code Compliance
              </div>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button (Expanded State) */}
        {!forceExpanded && !collapsed && (
          <button
            onClick={toggleSidebar}
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent hover:border-border/60 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Expand Quick Action Button (Collapsed State) ────────────── */}
      {!forceExpanded && collapsed && (
        <div className="px-2 pt-2.5 pb-1 flex justify-center">
          <button
            onClick={toggleSidebar}
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent hover:border-border/60 transition-colors group relative"
          >
            <PanelLeftOpen className="w-4 h-4 text-primary" />
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-popover text-popover-foreground text-[11px] font-medium shadow-xl border border-border/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
              Expand sidebar (Ctrl+B)
            </div>
          </button>
        </div>
      )}

      {/* ─── Navigation Groups ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5 scrollbar-none">
        {/* Tier 1: Workspace Core */}
        <div className="space-y-1">
          {!collapsed ? (
            <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 font-mono">
              Core Operations
            </p>
          ) : (
            <div className="w-7 h-[1px] bg-border/60 mx-auto my-2" />
          )}

          {WORKSPACE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg font-medium transition-all duration-200 group relative',
                  collapsed
                    ? 'justify-center p-2.5 h-10 w-full'
                    : 'justify-between px-3 py-2 text-[13.5px]',
                  active
                    ? 'nav-active text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:translate-x-0.5'
                )}
              >
                <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                    {item.badge}
                  </span>
                )}

                {/* Floating Tooltip in Collapsed Mode */}
                {collapsed && (
                  <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-semibold shadow-2xl border border-border/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex items-center gap-2 drop-shadow-md">
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Tier 2: Intelligence & Audit */}
        <div className="space-y-1">
          {!collapsed ? (
            <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 font-mono">
              Quality & Oversight
            </p>
          ) : (
            <div className="w-7 h-[1px] bg-border/60 mx-auto my-2" />
          )}

          {INTELLIGENCE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg font-medium transition-all duration-200 group relative',
                  collapsed
                    ? 'justify-center p-2.5 h-10 w-full'
                    : 'justify-between px-3 py-2 text-[13.5px]',
                  active
                    ? 'nav-active text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:translate-x-0.5'
                )}
              >
                <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>

                {/* Floating Tooltip in Collapsed Mode */}
                {collapsed && (
                  <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-semibold shadow-2xl border border-border/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex items-center gap-2 drop-shadow-md">
                    <span>{item.name}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Footer Telemetry Card ───────────────────────────────────── */}
      <div className="p-3 border-t border-border/60 bg-secondary/30">
        {!collapsed ? (
          <div className="p-2.5 rounded-xl border border-border/60 bg-card/60 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-foreground">
                  Service Status
                </span>
              </div>
              <span className="text-[9.5px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                ONLINE
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-0.5 font-mono">
              <span>{health?.llm_provider ? `${health.llm_provider.toUpperCase()} AI` : 'AI Assistant'}</span>
              <span>{health?.indexed_documents ?? 0} Documents</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center group relative cursor-pointer py-1">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border/70 hover:border-primary/50 transition-colors">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-semibold shadow-2xl border border-border/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 leading-tight">
              <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SiteSafe Online
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {health?.llm_provider ? `${health.llm_provider.toUpperCase()} AI` : 'AI Assistant'} • {health?.indexed_documents ?? 0} Docs
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
