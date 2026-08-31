import { Project, Document, QueryHistory, Inspection } from "@/types";

// Mock Data
export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Alpha Tower Development", location: "Downtown Metro", status: "active", documentCount: 24, lastUpdated: "2026-08-30" },
  { id: "p2", name: "Westside Retail Park", location: "Westside Heights", status: "active", documentCount: 12, lastUpdated: "2026-08-25" },
  { id: "p3", name: "Horizon Residential", location: "North Hills", status: "completed", documentCount: 45, lastUpdated: "2026-07-10" },
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: "d1", title: "IBC 2024 Chapter 10", type: "Building Code", version: "2024", status: "Indexed", uploadedAt: "2026-08-01" },
  { id: "d2", title: "Project Specs - Structural", type: "Project Specification", version: "v2.1", projectId: "p1", status: "Indexed", uploadedAt: "2026-08-15" },
  { id: "d3", title: "Electrical Safety Standards", type: "Building Code", version: "2023", status: "Processing", uploadedAt: "2026-08-31" },
  { id: "d4", title: "Site Inspection Aug 28", type: "Inspection Report", version: "1.0", projectId: "p1", status: "Needs Review", uploadedAt: "2026-08-28" },
];

export const MOCK_HISTORY: QueryHistory[] = [
  { id: "h1", query: "What is the required fire rating for the main lobby stairwell?", projectId: "p1", date: "2026-08-31T10:00:00Z", verdict: "Compliant", confidence: 95, sourcesCount: 3 },
  { id: "h2", query: "Does the proposed HVAC duct layout comply with clearance rules?", projectId: "p1", date: "2026-08-30T14:30:00Z", verdict: "Non-Compliant", confidence: 98, sourcesCount: 2 },
  { id: "h3", query: "What are the accessibility requirements for the side entrance?", projectId: "p2", date: "2026-08-29T09:15:00Z", verdict: "Unknown", confidence: 40, sourcesCount: 0 },
];

export const MOCK_INSPECTIONS: Inspection[] = [
  { id: "i1", projectId: "p1", date: "2026-08-28", inspector: "Sarah Jenkins", status: "Action Required", findingsCount: 3 },
  { id: "i2", projectId: "p2", date: "2026-08-15", inspector: "Mike Ross", status: "Passed", findingsCount: 0 },
];

// API Methods
export const api = {
  getProjects: async (): Promise<Project[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));
    return MOCK_PROJECTS;
  },
  
  getDocuments: async (): Promise<Document[]> => {
    await new Promise(r => setTimeout(r, 600));
    return MOCK_DOCUMENTS;
  },

  getHistory: async (): Promise<QueryHistory[]> => {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_HISTORY;
  },

  getInspections: async (): Promise<Inspection[]> => {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_INSPECTIONS;
  }
};
