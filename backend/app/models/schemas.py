"""
Pydantic v2 schemas for Construction Compliance Verification API.
Defines strictly validated data models for requests, responses, citations, and metadata.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ComplianceVerdict(str, Enum):
    COMPLIANT = "Compliant"
    NON_COMPLIANT = "Non-Compliant"
    INSUFFICIENT_DATA = "Ambiguous/Insufficient Data"


class Citation(BaseModel):
    clause_number: str = Field(..., description="The specific section or article code (e.g. 'IBC 705.8', 'NEC 300.22(C)').")
    document_title: str = Field(..., description="Title of the authoritative document (e.g. 'International Building Code 2021').")
    document_type: str = Field(..., description="Document category (Code, Project Spec, Inspection Log).")
    jurisdiction: str = Field(default="National", description="Jurisdictional boundary (e.g. National, California, NYC).")
    trade: str = Field(default="General", description="Construction trade discipline (Structural, Electrical, Fire Safety, Plumbing).")
    page_or_section: str = Field(..., description="Exact page, table, or section identifier.")
    direct_quote: str = Field(..., description="Verbatim text quote from the authoritative context supporting the verdict.")
    relevance_explanation: str = Field(..., description="Concise explanation of how this excerpt applies to the observation.")


class RetrievedChunkInfo(BaseModel):
    chunk_id: str
    doc_title: str
    clause_number: str
    document_type: str
    trade: str
    jurisdiction: str
    page_or_section: str
    text: str
    score: float = 0.0


class LLMComplianceOutput(BaseModel):
    verdict: ComplianceVerdict = Field(
        ...,
        description="Must be 'Compliant', 'Non-Compliant', or 'Ambiguous/Insufficient Data'.",
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence level between 0.0 and 1.0 based strictly on context grounding.",
    )
    summary: str = Field(
        ...,
        description="Executive compliance determination (1-2 sentences for field engineers).",
    )
    technical_analysis: str = Field(
        ...,
        description="Detailed regulatory engineering analysis referencing specific code sections, dimensions, and materials.",
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="Authoritative regulatory citations with verbatim direct quotes. Empty only if Insufficient Data.",
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Field engineering action items (remedial work, RFI submittals, or special inspections).",
    )


class ComplianceQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Natural language compliance observation or question from jobsite.")
    trade: Optional[str] = Field("All", description="Target discipline: Structural, Electrical, Fire Safety, Plumbing, or All.")
    jurisdiction: Optional[str] = Field("All", description="Target statutory jurisdiction: National, California, NYC, or All.")
    document_type: Optional[str] = Field("All", description="Scope: Code, Project Spec, Inspection Log, or All.")
    top_k: int = Field(5, ge=1, le=20, description="Maximum number of candidate chunks to retrieve.")


class ComplianceResponse(BaseModel):
    verdict: ComplianceVerdict
    confidence_score: float
    summary: str
    technical_analysis: str
    citations: List[Citation]
    recommended_actions: List[str]
    retrieved_chunks: List[RetrievedChunkInfo] = []
    search_metadata: Dict[str, Any] = {}


class DocumentSummary(BaseModel):
    id: str
    title: str
    clause_number: str
    trade: str
    jurisdiction: str
    document_type: str
    page_or_section: str
    summary_snippet: str


class SystemHealthResponse(BaseModel):
    status: str
    service: str
    vector_store: str
    collection_name: str
    indexed_documents: int
    openai_configured: bool = False
    gemini_configured: bool = False
    llm_provider: str = "rules"
    model: str
    trades: List[str]
    jurisdictions: List[str]
    document_types: List[str]


class IngestResponse(BaseModel):
    status: str
    message: str
    documents_ingested: int
    chunks_indexed: int
    errors: List[str] = []


class CorpusStats(BaseModel):
    total_documents: int
    total_chunks: int
    trades: Dict[str, int]
    jurisdictions: Dict[str, int]
    document_types: Dict[str, int]


# Chunk & Ingestion Models
class ChunkMetadata(BaseModel):
    source_doc_id: str
    doc_title: str
    doc_type: str
    jurisdiction: str = "National"
    trade: str = "General"
    section_clause: str = "General"
    page_number: int = 1
    chunk_index: int = 0
    total_chunks: int = 1
    char_start: int = 0
    char_end: int = 0


class TaggedChunk(BaseModel):
    chunk_id: str
    content: str
    metadata: ChunkMetadata
