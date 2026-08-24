from typing import List, Literal, Optional
from pydantic import BaseModel, Field


VerdictType = Literal["Compliant", "Non-Compliant", "Ambiguous/Insufficient Data"]
TradeType = Literal["All", "Structural", "Fire Safety", "Electrical", "Plumbing"]
JurisdictionType = Literal["All", "California", "NYC", "National"]
DocType = Literal["All", "Code", "Project Spec", "Inspection Log"]


class Citation(BaseModel):
    clause_number: str = Field(
        ...,
        description="Exact clause, article, or section reference (e.g., 'NEC 300.22(C)', 'IBC 714.4.1.2', 'Spec Div 26 05 33 §2.1')",
    )
    document_title: str = Field(
        ...,
        description="Full title of the statutory code, specification, or report",
    )
    document_type: str = Field(
        ...,
        description="Document category: 'Code', 'Project Spec', or 'Inspection Log'",
    )
    jurisdiction: str = Field(
        ...,
        description="Governing jurisdiction, e.g. 'National', 'California', 'NYC'",
    )
    trade: str = Field(
        ...,
        description="Construction trade discipline, e.g. 'Electrical', 'Fire Safety', 'Structural', 'Plumbing'",
    )
    page_or_section: str = Field(
        ...,
        description="Page number, section, or paragraph identifier",
    )
    direct_quote: str = Field(
        ...,
        description="Verbatim exact quote from the authoritative text establishing the compliance rule",
    )
    relevance_explanation: str = Field(
        ...,
        description="Engineering explanation of how this citation directly governs or applies to the observed condition",
    )


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


class ComplianceQueryRequest(BaseModel):
    query: str = Field(
        ...,
        description="Field observation, construction query, or site condition note to evaluate",
        min_length=3,
    )
    trade: Optional[str] = Field(
        default="All",
        description="Filter trade scope: 'All', 'Structural', 'Fire Safety', 'Electrical', 'Plumbing'",
    )
    jurisdiction: Optional[str] = Field(
        default="All",
        description="Filter jurisdiction: 'All', 'California', 'NYC', 'National'",
    )
    document_type: Optional[str] = Field(
        default="All",
        description="Filter document type: 'All', 'Code', 'Project Spec', 'Inspection Log'",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=15,
        description="Number of chunks to retrieve via hybrid search",
    )


class LLMComplianceOutput(BaseModel):
    verdict: VerdictType = Field(
        ...,
        description="Ground-truth compliance verdict based STRICTLY on retrieved text: 'Compliant', 'Non-Compliant', or 'Ambiguous/Insufficient Data'",
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0 to 1.0) indicating certainty of the verdict against retrieved evidence",
    )
    summary: str = Field(
        ...,
        description="Clear, concise executive summary of the compliance determination for field superintendents",
    )
    technical_analysis: str = Field(
        ...,
        description="Comprehensive engineering breakdown linking observed field conditions with governing statutory code sections",
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="List of exact citations from the retrieved context backing the determination",
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Actionable step-by-step guidance for site teams (e.g. corrective work, RFI submission, required testing)",
    )


class ComplianceResponse(LLMComplianceOutput):
    retrieved_chunks: List[RetrievedChunkInfo] = Field(
        default_factory=list,
        description="Raw retrieved context chunks from hybrid search for auditing and transparency",
    )
    search_metadata: dict = Field(
        default_factory=dict,
        description="Execution statistics (retrieval time, model used, filters applied)",
    )


class DocumentSummary(BaseModel):
    id: str
    title: str
    clause_number: str
    trade: str
    jurisdiction: str
    document_type: str
    page_or_section: str
    summary_snippet: str
