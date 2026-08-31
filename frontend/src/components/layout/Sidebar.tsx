"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Files,
  Briefcase,
  ClipboardCheck,
  Search,
  History,
  BarChart,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard",   href: "/",            icon: LayoutDashboard },
  { name: "Assistant",   href: "/assistant",   icon: MessageSquare },
  { name: "Documents",   href: "/documents",   icon: Files },
  { name: "Projects",    href: "/projects",    icon: Briefcase },
  { name: "Inspections", href: "/inspections", icon: ClipboardCheck },
];

const SECONDARY_NAV_ITEMS = [
  { name: "Search Explorer", href: "/search",     icon: Search },
  { name: "Query History",   href: "/history",    icon: History },
  { name: "Evaluation",      href: "/evaluation", icon: BarChart },
  { name: "Settings",        href: "/settings",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-card h-screen shrink-0 sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0 gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
          <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-base text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Space Grotesk Variable', sans-serif" }}>
            SiteCode <span className="text-primary">AI</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
            Compliance Suite
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-none">
        {/* Primary nav */}
        <div className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-semibold group relative",
                  active
                    ? "nav-active text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <item.icon
                  className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{item.name}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary nav */}
        <div className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            System
          </p>
          {SECONDARY_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-semibold group relative",
                  active
                    ? "nav-active text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <item.icon
                  className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{item.name}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer status pill */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary/80 border border-border">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">Code Library Online</div>
            <div className="text-[10px] text-muted-foreground">IBC 2024 • NEC 2023 • UPC 2024</div>
          </div>
          <Zap className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />
        </div>
      </div>
    </aside>
  );
}
