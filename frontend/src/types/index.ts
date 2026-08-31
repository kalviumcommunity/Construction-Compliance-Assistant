export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'completed' | 'on-hold';
  documentCount: number;
  lastUpdated: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'Building Code' | 'Project Specification' | 'Inspection Report';
  version: string;
  projectId?: string;
  effectiveDate?: string;
  status: 'Indexed' | 'Processing' | 'Failed' | 'Needs Review';
  uploadedAt: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  projectId: string;
  date: string;
  verdict: 'Compliant' | 'Non-Compliant' | 'Warning' | 'Unknown';
  confidence: number;
  sourcesCount: number;
}

export interface Inspection {
  id: string;
  projectId: string;
  date: string;
  inspector: string;
  status: 'Passed' | 'Failed' | 'Action Required';
  findingsCount: number;
}
