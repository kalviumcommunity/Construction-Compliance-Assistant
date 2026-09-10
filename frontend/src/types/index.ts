export interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  document_count?: number;
  documentCount?: number;
  specCount?: number;
  last_updated?: string;
  lastUpdated?: string;
  lastAudit?: string;
  compliance_score?: number;
  complianceScore?: number;
  complianceRate?: number;
  active_codes?: string[];
  activeCodes?: string[];
}

export interface Document {
  id: string;
  title: string;
  clause_number?: string;
  clauseNumber?: string;
  trade?: string;
  jurisdiction?: string;
  document_type?: string;
  documentType?: string;
  page_or_section?: string;
  pageOrSection?: string;
  summary_snippet?: string;
  summarySnippet?: string;
  type?: string;
  version?: string;
  projectId?: string;
  status?: string;
  uploadedAt?: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  trade?: string;
  verdict: string;
  confidence: number;
  date: string;
  sources_count?: number;
  sourcesCount?: number;
  project_id?: string;
  projectId?: string;
}

export interface Inspection {
  id: string;
  project_id?: string;
  projectId?: string;
  date: string;
  inspector: string;
  status: string;
  findings_count?: number;
  findingsCount?: number;
  trade?: string;
  description?: string;
  finding?: string;
  clause_reference?: string;
  clauseReference?: string;
  clauseNumber?: string;
  location?: string;
}
