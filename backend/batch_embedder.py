import os
import json
import time
import math
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, Field
import openai

# Price per million tokens for OpenAI models (USD)
EMBEDDING_PRICING_PER_1M_TOKENS = {
    "text-embedding-3-small": 0.02,
    "text-embedding-3-large": 0.13,
    "text-embedding-ada-002": 0.10,
}

class RecordMetadata(BaseModel):
    source_doc: str
    doc_type: str
    section: str
    page: int
    trade: str
    jurisdiction: str

class EmbeddedRecord(BaseModel):
    id: str
    vector: List[float]
    text: str
    metadata: RecordMetadata

def estimate_tokens(text: str) -> int:
    """Simple token estimation rule of thumb (~4 chars/token)."""
    return max(1, math.ceil(len(text) / 4))

def generate_mock_embedding(text: str, dimension: int = 1536) -> List[float]:
    """Generates a normalized deterministic mock vector for offline testing."""
    vec = []
    hash_val = hash(text)
    for i in range(dimension):
        val = math.sin(hash_val + i) * math.cos(i)
        vec.append(val)
    norm = math.sqrt(sum(v*v for v in vec))
    if norm > 0:
        vec = [round(v / norm, 6) for v in vec]
    return vec

def load_existing_records(file_path: str) -> Dict[str, EmbeddedRecord]:
    """Task 4: Load already-embedded records to skip duplicate work."""
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            records = {}
            for item in data:
                rec = EmbeddedRecord(**item)
                records[rec.id] = rec
            return records
    except Exception as e:
        print(f"[WARNING] Could not parse existing corpus file '{file_path}': {e}")
        return {}

def embed_batch_with_retry(
    texts: List[str],
    model_name: str,
    client: Any,
    dimension: int,
    max_retries: int = 3,
    initial_backoff: float = 1.0
) -> Tuple[List[List[float]], bool, str]:
    """Task 2: Handle rate limits / transient errors with exponential backoff."""
    if client is None:
        # Offline simulation fallback
        vectors = [generate_mock_embedding(t, dimension) for t in texts]
        return vectors, True, "Offline mock generation successful"

    backoff = initial_backoff
    last_error = ""

    for attempt in range(1, max_retries + 1):
        try:
            response = client.embeddings.create(input=texts, model=model_name)
            embeddings_data = sorted(response.data, key=lambda x: x.index)
            vectors = [item.embedding for item in embeddings_data]
            
            if len(vectors) != len(texts):
                raise ValueError(f"Returned vector count mismatch: got {len(vectors)}, expected {len(texts)}")
            
            return vectors, True, f"Success on attempt {attempt}"

        except Exception as e:
            last_error = str(e)
            print(f"  [RETRY WARNING] Attempt {attempt}/{max_retries} failed for batch: {last_error}")
            if attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2.0  # Exponential backoff

    return [], False, f"Failed after {max_retries} retries: {last_error}"

def run_batch_embedding_pipeline(
    chunks: List[Dict[str, Any]],
    output_file: str = "embedded_corpus.json",
    batch_size: int = 4,
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Scalable Batch Embedding Pipeline (Tasks 1-4).
    """
    api_key = os.getenv("EMBEDDING_API_KEY") or os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
    base_url = os.getenv("EMBEDDING_API_BASE_URL", None)
    dimension = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

    client = None
    if api_key:
        client = openai.OpenAI(api_key=api_key, base_url=base_url if base_url else None)
    else:
        print("[INFO] EMBEDDING_API_KEY missing. Pipeline running in offline simulation mode.")

    # Task 4: Skip already-embedded chunks
    existing_records = load_existing_records(output_file)
    
    total_chunks = len(chunks)
    to_embed = []
    skipped_chunks = 0

    for chunk in chunks:
        chunk_id = chunk["id"]
        if chunk_id in existing_records:
            skipped_chunks += 1
        else:
            to_embed.append(chunk)

    embeddings_generated = 0
    failed_chunks = 0
    total_tokens_processed = 0
    failed_batches = 0
    successful_batches = 0

    # Task 1: Process chunks in batches
    num_batches = math.ceil(len(to_embed) / batch_size)
    print("=" * 80)
    print("SITESAFE SCALABLE BATCH EMBEDDING PIPELINE")
    print("=" * 80)
    print(f"Total Corpus Chunks:   {total_chunks}")
    print(f"Already Embedded:      {skipped_chunks} (SKIPPED)")
    print(f"Chunks To Embed:       {len(to_embed)}")
    print(f"Batch Size:            {batch_size}")
    print(f"Total Batches:         {num_batches}")
    print(f"Model Name:            {model_name}")
    print("-" * 80)

    for i in range(0, len(to_embed), batch_size):
        batch = to_embed[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        batch_texts = [c["text"] for c in batch]
        
        batch_tokens = sum(estimate_tokens(t) for t in batch_texts)

        print(f"Processing Batch {batch_num}/{num_batches} ({len(batch)} chunks, ~{batch_tokens} tokens)...")
        
        vectors, success, msg = embed_batch_with_retry(
            texts=batch_texts,
            model_name=model_name,
            client=client,
            dimension=dimension,
            max_retries=max_retries
        )

        if success:
            successful_batches += 1
            embeddings_generated += len(batch)
            total_tokens_processed += batch_tokens
            
            for chunk, vec in zip(batch, vectors):
                rec = EmbeddedRecord(
                    id=chunk["id"],
                    vector=vec,
                    text=chunk["text"],
                    metadata=RecordMetadata(**chunk["metadata"])
                )
                existing_records[rec.id] = rec
        else:
            failed_batches += 1
            failed_chunks += len(batch)
            print(f"  [BATCH ERROR] Batch {batch_num} failed completely: {msg}")

    # Save updated corpus
    final_records_list = list(existing_records.values())
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump([r.model_dump() for r in final_records_list], f, indent=2, ensure_ascii=False)

    # Task 3: Calculate approximate cost
    price_per_1m = EMBEDDING_PRICING_PER_1M_TOKENS.get(model_name, 0.02)
    estimated_cost_usd = (total_tokens_processed / 1_000_000) * price_per_1m

    summary = {
        "total_chunks": total_chunks,
        "skipped_chunks": skipped_chunks,
        "newly_embedded_chunks": embeddings_generated,
        "failed_chunks": failed_chunks,
        "total_corpus_records": len(final_records_list),
        "total_tokens_processed": total_tokens_processed,
        "estimated_cost_usd": round(estimated_cost_usd, 6),
        "successful_batches": successful_batches,
        "failed_batches": failed_batches,
        "output_file": output_file
    }

    print("\n" + "=" * 80)
    print("RUN SUMMARY REPORT")
    print("=" * 80)
    print(f"Total Chunks Processed:      {summary['total_chunks']}")
    print(f"Skipped Chunks (Existing):   {summary['skipped_chunks']}")
    print(f"Newly Embedded Chunks:      {summary['newly_embedded_chunks']}")
    print(f"Failed Chunks:               {summary['failed_chunks']}")
    print(f"Total Corpus Records:        {summary['total_corpus_records']}")
    print(f"Tokens Processed:            {summary['total_tokens_processed']}")
    print(f"Estimated Cost (USD):        ${summary['estimated_cost_usd']:.6f}")
    print(f"Successful Batches:          {summary['successful_batches']}")
    print(f"Failed Batches:              {summary['failed_batches']}")
    print(f"Output File:                 {output_file}")
    print("=" * 80)

    return summary

def main():
    sample_chunks = [
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
            "text": "OSHA 1926.404(b)(1)(ii): All 120-volt, single-phase 15- and 20-ampere receptacle outlets on construction sites that are not a part of the permanent wiring shall have approved ground-fault circuit-interrupter (GFCI) for personnel protection.",
            "metadata": {
                "source_doc": "OSHA_Construction_Electrical.pdf",
                "doc_type": "building_code",
                "section": "1926.404(b)(1)(ii)",
                "page": 315,
                "trade": "Electrical",
                "jurisdiction": "National"
            }
        },
        {
            "id": "doc_chunk_004",
            "text": "IPC Section 604.4: Maximum flow rates and consumption for plumbing fixtures shall not exceed 1.6 gallons per flushing cycle for water closets and 0.5 gpm for public lavatory faucets.",
            "metadata": {
                "source_doc": "IPC_2021_Plumbing.pdf",
                "doc_type": "building_code",
                "section": "Section 604.4",
                "page": 76,
                "trade": "Plumbing",
                "jurisdiction": "National"
            }
        },
        {
            "id": "doc_chunk_005",
            "text": "CBC Title 24 Chapter 11B: Accessible routes of travel within site boundaries shall maintain a minimum clear width of 48 inches for exterior walkways and continuous slopes not exceeding 1:20.",
            "metadata": {
                "source_doc": "CBC_2022_Title24.pdf",
                "doc_type": "building_code",
                "section": "Chapter 11B",
                "page": 210,
                "trade": "Fire Safety",
                "jurisdiction": "California"
            }
        }
    ]

    print("--- RUN 1: Initial Batch Embedding Execution ---")
    run_batch_embedding_pipeline(sample_chunks, batch_size=2)

    print("\n--- RUN 2: Re-running Pipeline to Verify Duplicate Chunk Skipping ---")
    run_batch_embedding_pipeline(sample_chunks, batch_size=2)

if __name__ == "__main__":
    main()
