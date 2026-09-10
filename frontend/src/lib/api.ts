import { Project, Document, QueryHistory, Inspection } from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export const DEFAULT_INGEST_KEY = process.env.NEXT_PUBLIC_INGEST_API_KEY || "sitesafe-admin-key-2026";

// ---------------------------------------------------------------------------
// Construction Compliance RAG Types
// ---------------------------------------------------------------------------

export type ComplianceVerdict = "Compliant" | "Non-Compliant" | "Ambiguous/Insufficient Data";

export interface Citation {
  clause_number: string;
  document_title: string;
  document_type: string;
  jurisdiction: string;
  trade: string;
  page_or_section: string;
  direct_quote: string;
  relevance_explanation: string;
}

export interface RetrievedChunkInfo {
  chunk_id: string;
  doc_title: string;
  clause_number: string;
  document_type: string;
  trade: string;
  jurisdiction: string;
  page_or_section: string;
  text: string;
  score: number;
}

export interface ComplianceResponse {
  verdict: ComplianceVerdict;
  confidence_score: number;
  summary: string;
  technical_analysis: string;
  citations: Citation[];
  recommended_actions: string[];
  retrieved_chunks: RetrievedChunkInfo[];
  search_metadata: {
    elapsed_time_ms: number;
    chunks_retrieved: number;
    filters_applied: {
      trade?: string;
      jurisdiction?: string;
      document_type?: string;
      top_k?: number;
    };
    retrieval_mode: string;
  };
}

export interface ComplianceQueryRequest {
  query: string;
  trade?: string;
  jurisdiction?: string;
  document_type?: string;
  top_k?: number;
}

export interface DocumentSummary {
  id: string;
  title: string;
  clause_number: string;
  trade: string;
  jurisdiction: string;
  document_type: string;
  page_or_section: string;
  summary_snippet: string;
}

export interface SystemHealthResponse {
  status: string;
  service: string;
  vector_store: string;
  collection_name: string;
  indexed_documents: number;
  openai_configured: boolean;
  gemini_configured?: boolean;
  llm_provider?: string;
  model: string;
  trades: string[];
  jurisdictions: string[];
  document_types: string[];
}

export interface IngestResponse {
  status: string;
  message: string;
  documents_ingested: number;
  chunks_indexed: number;
  errors: string[];
}

export interface CorpusStats {
  total_documents: number;
  total_chunks: number;
  trades: Record<string, number>;
  jurisdictions: Record<string, number>;
  document_types: Record<string, number>;
}

import useSWR from "swr";

// ---------------------------------------------------------------------------
// Real API Client with Generous Timeout & Error Boundaries
// ---------------------------------------------------------------------------

export const api = {
  /**
   * Evaluates compliance against live RAG backend with 45-second timeout.
   */
  verifyCompliance: async (payload: ComplianceQueryRequest, timeoutMs = 45000): Promise<ComplianceResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE}/api/verify-compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.detail || `Compliance engine error (HTTP ${res.status})`);
      }

      return await res.json();
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out after 45 seconds. Regulatory retrieval and synthesis took longer than expected. Please retry.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },

  getHealth: async (): Promise<SystemHealthResponse> => {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend health check failed (${res.status})`);
    return await res.json();
  },

  getIndexedDocuments: async (): Promise<DocumentSummary[]> => {
    const res = await fetch(`${API_BASE}/api/documents`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load indexed documents (${res.status})`);
    return await res.json();
  },

  getCorpusStats: async (): Promise<CorpusStats> => {
    const res = await fetch(`${API_BASE}/api/stats`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load corpus stats (${res.status})`);
    return await res.json();
  },

  uploadDocument: async (file: File, apiKey = DEFAULT_INGEST_KEY): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/ingest/upload`, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.detail || `Document ingestion failed (${res.status})`);
      }

      return await res.json();
    } catch (err: any) {
      if (err.message && err.message.includes("Failed to fetch")) {
        throw new Error(`Cannot reach backend server at ${API_BASE}. Please verify that the FastAPI backend is running.`);
      }
      throw err;
    }
  },

  reindexCorpus: async (apiKey = DEFAULT_INGEST_KEY): Promise<IngestResponse> => {
    try {
      const res = await fetch(`${API_BASE}/api/reindex`, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.detail || `Reindexing failed (${res.status})`);
      }

      return await res.json();
    } catch (err: any) {
      if (err.message && err.message.includes("Failed to fetch")) {
        throw new Error(`Cannot reach backend server at ${API_BASE}. Please verify that the FastAPI backend is running.`);
      }
      throw err;
    }
  },

  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/api/projects`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
    const raw = await res.json();
    return raw.map((p: any) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      status: p.status,
      documentCount: p.document_count ?? 12,
      specCount: p.document_count ?? 12,
      document_count: p.document_count ?? 12,
      complianceScore: p.compliance_score ?? 94,
      complianceRate: p.compliance_score ?? 94,
      compliance_score: p.compliance_score ?? 94,
      lastUpdated: p.last_updated,
      lastAudit: p.last_updated,
      activeCodes: p.active_codes || [],
      active_codes: p.active_codes || [],
    }));
  },

  getDocuments: async (): Promise<Document[]> => {
    const summaries = await api.getIndexedDocuments();
    return summaries.map((s) => ({
      id: s.id,
      title: s.title,
      clause_number: s.clause_number,
      trade: s.trade,
      jurisdiction: s.jurisdiction,
      document_type: s.document_type,
      page_or_section: s.page_or_section,
      summary_snippet: s.summary_snippet,
      type: s.document_type,
      version: "2024",
      status: "Indexed",
      uploadedAt: "Live Index",
    }));
  },

  getHistory: async (): Promise<QueryHistory[]> => {
    const res = await fetch(`${API_BASE}/api/history`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load query history (${res.status})`);
    const raw = await res.json();
    return raw.map((item: any) => ({
      id: item.id,
      query: item.query,
      trade: item.trade || "General",
      verdict: item.verdict,
      confidence: item.confidence > 1 ? item.confidence / 100 : (item.confidence || 0.95),
      date: item.date,
      sourcesCount: item.sources_count || 0,
      projectId: item.project_id || "p1",
    }));
  },

  getInspections: async (): Promise<Inspection[]> => {
    const res = await fetch(`${API_BASE}/api/inspections`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load inspections (${res.status})`);
    const raw = await res.json();
    return raw.map((i: any) => ({
      id: i.id,
      projectId: i.project_id,
      project_id: i.project_id,
      date: i.date,
      inspector: i.inspector,
      status: i.status,
      findingsCount: i.findings_count,
      findings_count: i.findings_count,
      trade: i.trade || "General",
      finding: i.description || i.finding || "Field inspection observation",
      description: i.description || i.finding || "Field inspection observation",
      clauseReference: i.clause_reference || "",
      clause_reference: i.clause_reference || "",
      clauseNumber: i.clause_reference || "",
      location: i.location || "Building Site",
    }));
  },
};

// ---------------------------------------------------------------------------
// SWR Reactive Hooks for Real-Time Caching & Shimmer State Management
// ---------------------------------------------------------------------------

const swrFetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return res.json();
});

export function useSystemHealth() {
  const { data, error, isLoading, mutate } = useSWR<SystemHealthResponse>(
    `${API_BASE}/api/health`,
    swrFetcher,
    { revalidateOnFocus: true, refreshInterval: 15000 }
  );
  return { health: data, error, isLoading, mutate };
}

export function useIndexedDocuments() {
  const { data, error, isLoading, mutate } = useSWR<DocumentSummary[]>(
    `${API_BASE}/api/documents`,
    swrFetcher,
    { revalidateOnFocus: true, dedupingInterval: 10000 }
  );
  return { documents: data || [], error, isLoading, mutate };
}

export function useCorpusStats() {
  const { data, error, isLoading, mutate } = useSWR<CorpusStats>(
    `${API_BASE}/api/stats`,
    swrFetcher,
    { revalidateOnFocus: true, dedupingInterval: 10000 }
  );
  return { stats: data, error, isLoading, mutate };
}

export function useQueryHistory() {
  const { data, error, isLoading, mutate } = useSWR<QueryHistory[]>(
    `${API_BASE}/api/history`,
    async () => api.getHistory(),
    { revalidateOnFocus: true, refreshInterval: 10000 }
  );
  return { history: data || [], error, isLoading, mutate };
}

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    `${API_BASE}/api/projects`,
    async () => api.getProjects(),
    { revalidateOnFocus: true }
  );
  return { projects: data || [], error, isLoading, mutate };
}

export function useInspections() {
  const { data, error, isLoading, mutate } = useSWR<Inspection[]>(
    `${API_BASE}/api/inspections`,
    async () => api.getInspections(),
    { revalidateOnFocus: true }
  );
  return { inspections: data || [], error, isLoading, mutate };
}

