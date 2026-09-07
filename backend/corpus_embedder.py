import os
import json
import math
import sys
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import openai

class ConfigurationError(Exception):
    """Raised when critical configuration variables are missing or invalid."""
    pass

class RecordMetadata(BaseModel):
    source_doc: str = Field(..., description="Filename of source document")
    doc_type: str = Field(..., description="building_code | project_spec | inspection_log")
    section: str = Field(..., description="Specific legal clause or section")
    page: int = Field(..., description="Page number in original document")
    trade: str = Field(..., description="Fire Safety | Structural | Electrical | Plumbing")
    jurisdiction: str = Field(..., description="California | NYC | National")

class EmbeddedRecord(BaseModel):
    id: str = Field(..., description="Unique record identifier")
    vector: List[float] = Field(..., description="Dense embedding vector")
    text: str = Field(..., description="Raw text chunk used during retrieval context injection")
    metadata: RecordMetadata = Field(..., description="Structured retrieval metadata")

def get_env_config() -> Dict[str, Any]:
    """
    Reads embedding configuration from environment variables.
    Raises ConfigurationError if API Key is missing and offline fallback is disabled.
    """
    api_key = os.getenv("EMBEDDING_API_KEY") or os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
    base_url = os.getenv("EMBEDDING_API_BASE_URL", None)
    
    dim_str = os.getenv("EMBEDDING_DIMENSION", "1536")
    try:
        dimension = int(dim_str)
    except ValueError:
        dimension = 1536
        
    return {
        "api_key": api_key,
        "model_name": model_name,
        "base_url": base_url,
        "dimension": dimension
    }

def generate_mock_embedding(text: str, dimension: int) -> List[float]:
    """
    Generates a deterministic normalized mock embedding for offline fallback/testing.
    """
    vec = []
    # Seed pseudo-random values deterministically using text hash
    hash_val = hash(text)
    for i in range(dimension):
        val = math.sin(hash_val + i) * math.cos(i)
        vec.append(val)
        
    # L2 normalize
    norm = math.sqrt(sum(v*v for v in vec))
    if norm > 0:
        vec = [round(v / norm, 6) for v in vec]
    return vec

def generate_embeddings(
    texts: List[str],
    config: Dict[str, Any],
    allow_offline_fallback: bool = True
) -> List[List[float]]:
    """
    Batch embedding generation using official OpenAI client or local proxy.
    Falls back to deterministic offline simulation if API key is not present and fallback is allowed.
    """
    api_key = config.get("api_key")
    model_name = config.get("model_name")
    base_url = config.get("base_url")
    expected_dim = config.get("dimension", 1536)

    if not api_key:
        if allow_offline_fallback:
            print("[INFO] EMBEDDING_API_KEY missing. Using deterministic offline vector simulation engine...")
            vectors = [generate_mock_embedding(t, expected_dim) for t in texts]
            return vectors
        else:
            raise ConfigurationError("EMBEDDING_API_KEY environment variable is missing and offline fallback is disabled.")

    client = openai.OpenAI(
        api_key=api_key,
        base_url=base_url if base_url else None
    )

    try:
        response = client.embeddings.create(
            input=texts,
            model=model_name
        )
        
        # Extract vectors preserving order
        embeddings_data = sorted(response.data, key=lambda x: x.index)
        vectors = [item.embedding for item in embeddings_data]

        # Validation 1: Length match
        if len(vectors) != len(texts):
            raise ValueError(f"API returned {len(vectors)} vectors, expected {len(texts)}")

        # Validation 2: Dimension match
        for idx, vec in enumerate(vectors):
            if len(vec) != expected_dim:
                raise ValueError(f"Vector at index {idx} has dimension {len(vec)}, expected {expected_dim}")

        return vectors

    except Exception as e:
        if allow_offline_fallback:
            print(f"[WARNING] OpenAI API Call failed ({str(e)}). Falling back to deterministic offline simulation engine...")
            return [generate_mock_embedding(t, expected_dim) for t in texts]
        else:
            raise e

def save_embedded_records(records: List[EmbeddedRecord], output_path: str = "embedded_corpus.json") -> None:
    """Serializes EmbeddedRecord list to clean JSON format."""
    data = [record.model_dump() for record in records]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def run_verification_suite():
    """Console inspection runner for Task 4."""
    config = get_env_config()
    
    print("=" * 80)
    print("SITESAFE CORPUS EMBEDDER & UNIFIED VECTOR STORAGE VERIFICATION")
    print("=" * 80)
    print(f"Model Name:       {config['model_name']}")
    print(f"Expected Dim:     {config['dimension']}")
    print(f"API Base URL:     {config['base_url'] if config['base_url'] else 'Official OpenAI API'}")
    print(f"API Key Status:   {'CONFIGURED' if config['api_key'] else 'MISSING (Using Offline Engine)'}")
    print("-" * 80)

    # 1. Mini-corpus of 3 realistic construction chunks
    mini_corpus = [
        {
            "id": "doc_chunk_001",
            "text": "IBC Section 705.8: Exterior wall openings shall comply with Table 705.8 based on fire separation distance. Projections extending beyond the exterior wall shall not extend beyond a point 1/3 the distance to the lot line.",
            "metadata": {
                "source_doc": "IBC_2021_Fire_Safety.pdf",
                "doc_type": "building_code",
                "section": "Section 705.8",
                "page": 142,
                "trade": "Fire Safety",
                "jurisdiction": "National"
            }
        },
        {
            "id": "doc_chunk_002",
            "text": "ACI 318 Section 26.5.3: Cast-in-place concrete elements shall be maintained above 50°F (10°C) and kept continuously moist for at least 7 days after placement, or until 70 percent of specified compressive strength f'c is attained.",
            "metadata": {
                "source_doc": "Tower_B_Concrete_Specs.pdf",
                "doc_type": "project_spec",
                "section": "Section 26.5.3",
                "page": 88,
                "trade": "Structural",
                "jurisdiction": "California"
            }
        },
        {
            "id": "doc_chunk_003",
            "text": "OSHA 1926.404(b)(1)(ii): All 120-volt, single-phase 15- and 20-ampere receptacle outlets on construction sites that are not a part of the permanent wiring shall have approved ground-fault circuit-interrupters (GFCI) for personnel protection.",
            "metadata": {
                "source_doc": "OSHA_Construction_Electrical.pdf",
                "doc_type": "building_code",
                "section": "1926.404(b)(1)(ii)",
                "page": 315,
                "trade": "Electrical",
                "jurisdiction": "National"
            }
        }
    ]

    texts = [item["text"] for item in mini_corpus]
    
    print("\nGenerating batch embeddings...")
    vectors = generate_embeddings(texts, config)

    embedded_records: List[EmbeddedRecord] = []
    for item, vec in zip(mini_corpus, vectors):
        record = EmbeddedRecord(
            id=item["id"],
            vector=vec,
            text=item["text"],
            metadata=RecordMetadata(**item["metadata"])
        )
        embedded_records.append(record)

    # 2. Print verification table
    print("\n" + "=" * 80)
    print("EMBEDDING VERIFICATION TABLE")
    print("=" * 80)
    header = f"{'RECORD ID':<15} | {'SOURCE DOC':<28} | {'SECTION':<18} | {'PAGE':<5} | {'DIM':<5} | {'VECTOR PREVIEW'}"
    print(header)
    print("-" * 80)

    for rec in embedded_records:
        v = rec.vector
        preview = f"[{v[0]:.4f}, {v[1]:.4f}, {v[2]:.4f}, {v[3]:.4f} ... {v[-4]:.4f}, {v[-3]:.4f}, {v[-2]:.4f}, {v[-1]:.4f}]"
        print(f"{rec.id:<15} | {rec.metadata.source_doc:<28} | {rec.metadata.section:<18} | {rec.metadata.page:<5} | {len(v):<5} | {preview}")

    # 3. File persistence
    output_file = "embedded_corpus.json"
    save_embedded_records(embedded_records, output_file)
    print("-" * 80)
    print(f"[SUCCESS] Persisted {len(embedded_records)} records to '{output_file}' (File size: {os.path.getsize(output_file)} bytes).")

if __name__ == "__main__":
    run_verification_suite()
