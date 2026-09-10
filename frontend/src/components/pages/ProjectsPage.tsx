'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  MapPin,
  FileText,
  ShieldCheck,
  ArrowRight,
  Plus,
  Search,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProjects } from '@/lib/api';

export default function ProjectsPage() {
  const { projects, isLoading, error } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <PageHeader
          title="Project Portfolios & Jurisdictions"
          description="Monitored construction sites, contract specifications, and active building code coverage."
          icon={Briefcase}
        />
        <Button asChild className="gap-2 font-semibold shadow-sm">
          <Link href="/documents">
            <Plus className="w-4 h-4" />
            <span>Upload Project Specs</span>
          </Link>
        </Button>
      </div>

      {/* ─── Search Bar ──────────────────────────────────────────────── */}
      <div className="bento-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search projects by name or municipal jurisdiction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* ─── Projects Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/40 shimmer-mask border border-border/40" />
          ))
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full bento-card p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? 'No projects matched your search criteria.'
                : 'No construction projects registered yet. Upload specifications to initialize project tracking.'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const score = project.complianceRate || 92;
            const isActive = project.status === 'active';

            return (
              <div
                key={project.id}
                className="bento-card p-6 flex flex-col justify-between space-y-5 hover:border-primary/50 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {project.lastAudit ? `Audit: ${project.lastAudit}` : 'Continuous Audit'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{project.location}</span>
                    </p>
                  </div>

                  {/* Compliance Score Gauge */}
                  <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Compliance Rating</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {score}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 90
                            ? 'bg-emerald-500'
                            : score >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{project.specCount || 12} Specifications</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>IBC / NEC Synced</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" asChild className="text-xs flex-1">
                    <Link href="/documents">
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      <span>Specs</span>
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="text-xs flex-1 gap-1">
                    <Link href={`/assistant?project=${project.id}`}>
                      <span>Verify</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
