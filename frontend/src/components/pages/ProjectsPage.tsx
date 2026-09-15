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
  Trash2,
  X,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProjects } from '@/lib/api';

const DEFAULT_CODE_PRESETS = [
  'IBC 2024',
  'NFPA 70 / NEC 2023',
  'UPC 2024',
  'OSHA 1926 Safety',
  'CBC Title 24',
  'ADA Standards 2010',
];

export default function ProjectsPage() {
  const { projects, isLoading, error, createProject, deleteProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectStatus, setProjectStatus] = useState('active');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([
    'IBC 2024',
    'NFPA 70 / NEC 2023',
  ]);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProjects = projects.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleCodePreset = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleAddCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCodeInput.trim();
    if (trimmed && !selectedCodes.includes(trimmed)) {
      setSelectedCodes([...selectedCodes, trimmed]);
      setCustomCodeInput('');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setFormError('Please enter a project name.');
      return;
    }
    if (!projectLocation.trim()) {
      setFormError('Please enter a municipal location.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await createProject({
        name: projectName.trim(),
        location: projectLocation.trim(),
        status: projectStatus,
        active_codes: selectedCodes.length > 0 ? selectedCodes : ['IBC 2024'],
      });

      // Reset & close
      setProjectName('');
      setProjectLocation('');
      setSelectedCodes(['IBC 2024', 'NFPA 70 / NEC 2023']);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteProject(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-up">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <PageHeader
          title="Project Portfolios & Jurisdictions"
          description="Monitored construction sites, contract specifications, and active building code coverage."
          icon={Briefcase}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 font-semibold shadow-sm glow-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* ─── Search Bar ──────────────────────────────────────────────── */}
      {projects.length > 0 && (
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
      )}

      {/* ─── Projects Grid or Clean Empty State ───────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/40 shimmer-mask border border-border/40" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Fresh Empty Slate Presentation */
        <div className="bento-card p-12 text-center space-y-5 border-dashed border-border/80 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-lg shadow-primary/10">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              No Projects in Workspace
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your application is clean and ready. Create your first construction project to track municipal jurisdictions, active building codes, and jobsite compliance.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="gap-2 font-semibold shadow-md glow-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </Button>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bento-card p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Projects Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No projects matched &quot;{searchQuery}&quot;.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const score = project.complianceRate ?? project.complianceScore ?? 100;
            const docCount = project.documentCount ?? project.specCount ?? project.document_count ?? 0;
            const activeCodes = project.activeCodes || project.active_codes || ['Building Codes Synced'];
            const isActive = project.status === 'active';

            return (
              <div
                key={project.id}
                className="bento-card p-6 flex flex-col justify-between space-y-5 hover:border-primary/50 transition-all group relative"
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

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {project.lastAudit ? `Audit: ${project.lastAudit}` : 'Continuous Audit'}
                      </span>
                      <button
                        onClick={() => setDeleteConfirmId(project.id)}
                        title="Delete project"
                        className="p-1 rounded-md text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

                  {/* Active Code Badges */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{docCount} Specifications</span>
                      </span>
                      <span className="text-[10.5px] font-mono text-primary font-medium">
                        {activeCodes.length} Codes Synced
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {activeCodes.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary/80 border border-border/60 text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                      {activeCodes.length > 3 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-secondary/40 text-muted-foreground">
                          +{activeCodes.length - 3} more
                        </span>
                      )}
                    </div>
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
          })}
        </div>
      )}

      {/* ─── Create Project Modal ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bento-card w-full max-w-lg p-6 space-y-5 shadow-2xl border-border bg-card relative">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Create New Project</h3>
                  <p className="text-xs text-muted-foreground">
                    Register a new construction jobsite for statutory code compliance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Project Title / Facility Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Pacific Coast Medical Tower"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Location / City, State <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Seattle, WA"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="active">Active (Under Construction)</option>
                    <option value="planning">Pre-Construction / Planning</option>
                    <option value="completed">Completed / Close-out</option>
                  </select>
                </div>
              </div>

              {/* Code Coverage Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Applicable Building Codes &amp; Standards</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {selectedCodes.length} selected
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_CODE_PRESETS.map((code) => {
                    const isSelected = selectedCodes.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleCodePreset(code)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                            : 'bg-secondary/40 text-muted-foreground border-border/70 hover:text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{code}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Code */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Add other standard (e.g. NFPA 101, NYC Code)..."
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value)}
                    className="text-xs h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCode(e);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomCode}
                    className="h-8 text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="glow-primary font-semibold min-w-[110px]"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bento-card w-full max-w-sm p-6 space-y-4 shadow-2xl border-rose-500/30 bg-card">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Delete Project?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove this project from your workspace? This will remove its active jurisdictional profile.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
