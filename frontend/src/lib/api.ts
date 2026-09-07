import { Project, Document, QueryHistory, Inspection } from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

// ---------------------------------------------------------------------------
// Mock Data for Secondary Pages (Projects, Inspections)
// ---------------------------------------------------------------------------

export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Skyline Commercial Tower", location: "Seattle, WA", status: "active", documentCount: 24, lastUpdated: "2026-08-30" },
  { id: "p2", name: "Harbor Point Medical Pavilion", location: "San Francisco, CA", status: "active", documentCount: 18, lastUpdated: "2026-08-25" },
  { id: "p3", name: "Midtown Mixed-Use Residences", location: "New York, NY", status: "completed", documentCount: 36, lastUpdated: "2026-07-10" },
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: "d1", title: "NFPA 70: National Electrical Code 2023", type: "Building Code", version: "2023", status: "Indexed", uploadedAt: "2026-08-01" },
  { id: "d2", title: "International Building Code 2021", type: "Building Code", version: "2021", status: "Indexed", uploadedAt: "2026-08-15" },
  { id: "d3", title: "Project Spec 03 30 00 Structural Concrete", type: "Project Specification", version: "v2.1", projectId: "p1", status: "Indexed", uploadedAt: "2026-08-20" },
  { id: "d4", title: "Site Inspection NCR #IR-2024-089 (PVC in Plenum)", type: "Inspection Report", version: "1.0", projectId: "p1", status: "Needs Review", uploadedAt: "2026-08-28" },
];

export const MOCK_HISTORY: QueryHistory[] = [
  { id: "h1", query: "Can we install 1-inch Schedule 40 PVC conduit for low-voltage lighting in the ceiling return air plenum?", projectId: "p1", date: "2026-08-31T10:00:00Z", verdict: "Non-Compliant", confidence: 98, sourcesCount: 2 },
  { id: "h2", query: "Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant?", projectId: "p1", date: "2026-08-30T14:30:00Z", verdict: "Compliant", confidence: 97, sourcesCount: 1 },
  { id: "h3", query: "Did our 30-minute hydrostatic water test with 42-foot static head satisfy rough drainage requirements?", projectId: "p1", date: "2026-08-29T09:15:00Z", verdict: "Compliant", confidence: 98, sourcesCount: 1 },
  { id: "h4", query: "What is the allowable paint hue for the janitor closet door hinges under city guidelines?", projectId: "p2", date: "2026-08-28T11:00:00Z", verdict: "Unknown", confidence: 40, sourcesCount: 0 },
];

export const MOCK_INSPECTIONS: Inspection[] = [
  { id: "i1", projectId: "p1", date: "2026-08-28", inspector: "Sarah Jenkins (QA/QC)", status: "Action Required", findingsCount: 1 },
  { id: "i2", projectId: "p2", date: "2026-08-15", inspector: "Mike Ross (Senior Inspector)", status: "Passed", findingsCount: 0 },
];

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
        throw new Error(errData.detail || `Compliance engine error (HTTP ${res.status})`);
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

  uploadDocument: async (file: File, apiKey = "sitesafe-admin-key-2026"): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/ingest/upload`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Document ingestion failed (${res.status})`);
    }

    return await res.json();
  },

  reindexCorpus: async (apiKey = "sitesafe-admin-key-2026"): Promise<IngestResponse> => {
    const res = await fetch(`${API_BASE}/api/reindex`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Reindexing failed (${res.status})`);
    }

    return await res.json();
  },

  getProjects: async (): Promise<Project[]> => {
    return MOCK_PROJECTS;
  },

  getDocuments: async (): Promise<Document[]> => {
    return MOCK_DOCUMENTS;
  },

  getHistory: async (): Promise<QueryHistory[]> => {
    return MOCK_HISTORY;
  },

  getInspections: async (): Promise<Inspection[]> => {
    return MOCK_INSPECTIONS;
  },
};
