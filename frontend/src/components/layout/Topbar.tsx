"use client";

import { Bell, Search, UserCircle, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="h-16 border-b border-border glass flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shrink-0">
      {/* Left: Mobile trigger + breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm text-foreground" style={{ fontFamily: "'Space Grotesk Variable', sans-serif" }}>
            SiteCode <span className="text-primary">AI</span>
          </span>
        </div>

        {/* Active project pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/60 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          <span className="text-muted-foreground">Active Project:</span>
          <span className="text-foreground">Alpha Tower Development</span>
        </div>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects, docs..."
            className="w-full bg-secondary/40 pl-9 h-9 border-border/50 focus-visible:ring-1 focus-visible:ring-primary text-sm placeholder:text-muted-foreground/60"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full ring-1 ring-background shadow-[0_0_6px_hsl(25,95%,55%)]" />
        </Button>

        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            <UserCircle className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
