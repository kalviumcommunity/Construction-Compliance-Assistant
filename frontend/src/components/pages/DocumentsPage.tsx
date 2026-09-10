'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Files, Search, Filter, Upload, ShieldCheck, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api, DocumentSummary } from "@/lib/api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIndexedDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend vector store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await api.uploadDocument(uploadFile);
      setUploadMsg({ type: 'success', text: `${res.message} (${res.chunks_indexed} chunks indexed)` });
      setUploadFile(null);
      await fetchDocs();
      setTimeout(() => setShowUploadModal(false), 1800);
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = (documents || []).filter((doc) => {
    const title = doc.title || '';
    const clause = doc.clause_number || '';
    const snippet = doc.summary_snippet || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      title.toLowerCase().includes(query) ||
      clause.toLowerCase().includes(query) ||
      snippet.toLowerCase().includes(query);
    const matchesTrade = selectedTrade === 'All' || doc.trade === selectedTrade;
    const matchesType = selectedType === 'All' || doc.document_type === selectedType;
    return matchesSearch && matchesTrade && matchesType;
  });

  const trades = ['All', 'Electrical', 'Structural', 'Fire Safety', 'Plumbing'];
  const types = ['All', 'Code', 'Project Spec', 'Inspection Log'];

  return (
    <div className="w-full space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Document Knowledge Base"
          description="Authoritative statutory building codes, project specifications, and inspection reports indexed in Qdrant."
          icon={Files}
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowUploadModal(true)} className="gap-2 font-semibold">
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-card border-border/70">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, clause (e.g. 'NEC 300.22', 'IBC 705.8'), or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" />
              Trade:
            </div>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="text-xs rounded-md bg-secondary/50 border border-border px-2.5 py-1.5 focus:outline-none"
            >
              {trades.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
              Type:
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs rounded-md bg-secondary/50 border border-border px-2.5 py-1.5 focus:outline-none"
            >
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="animate-pulse bg-secondary/20 h-48 border-border/50" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="font-semibold text-lg text-foreground">Backend Connection Offline</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchDocs}>Retry Connection</Button>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold text-base">No Matching Regulatory Documents</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query or trade filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="border-border/70 hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    doc.trade === 'Electrical' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    doc.trade === 'Fire Safety' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                    doc.trade === 'Structural' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}>
                    {doc.trade}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {doc.jurisdiction}
                  </span>
                </div>
                <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
                  {doc.title}
                </CardTitle>
                <CardDescription className="text-xs font-mono text-primary font-medium">
                  {doc.clause_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground flex-1 flex flex-col justify-between">
                <p className="line-clamp-3 mb-3 bg-secondary/30 p-2 rounded border border-border/40 italic">
                  &ldquo;{doc.summary_snippet}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 border-t pt-2 mt-auto">
                  <span>Section: {doc.page_or_section}</span>
                  <span className="font-semibold text-foreground/70">{doc.document_type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Regulatory Document
              </CardTitle>
              <CardDescription>
                Supported formats: PDF, Markdown, HTML, and Text. Automatically cleaned, chunked, and indexed in Qdrant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="docUpload"
                    accept=".pdf,.html,.htm,.md,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="docUpload" className="cursor-pointer space-y-2 block">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                    {uploadFile ? (
                      <p className="text-sm font-semibold text-primary">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Click to browse file</p>
                        <p className="text-xs text-muted-foreground">PDF, Markdown, HTML, or TXT</p>
                      </>
                    )}
                  </label>
                </div>

                {uploadMsg && (
                  <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                    uploadMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {uploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{uploadMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!uploadFile || uploading}>
                    {uploading ? 'Ingesting...' : 'Index Document'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
