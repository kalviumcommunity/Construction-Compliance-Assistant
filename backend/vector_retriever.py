import os
import json
import uuid
from typing import List, Dict, Any, Optional

import qdrant_client
from qdrant_client.http import models as rest_models

from corpus_embedder import get_env_config, generate_embeddings
from index_corpus import load_embedded_corpus, CORPUS_FILE, COLLECTION_NAME, EMBEDDING_DIMENSION

def retrieve_top_k(
    client: qdrant_client.QdrantClient,
    query_text: str,
    top_k: int = 3,
    collection_name: str = COLLECTION_NAME
) -> List[Dict[str, Any]]:
    """
    Task 1, 2, & 3: Embed user query, run top-k vector similarity search,
    and return ranked results with scores, raw text, and metadata payload.
    """
    config = get_env_config()
    
    # Task 1: Embed user query using same embedding model configuration
    query_vectors = generate_embeddings([query_text], config)
    query_vec = query_vectors[0]

    # Task 2: Similarity search in Qdrant using query_points
    search_response = client.query_points(
        collection_name=collection_name,
        query=query_vec,
        limit=top_k,
        with_payload=True,
        with_vectors=False
    )
    search_results = search_response.points

    # Task 3: Include scores, source text, and metadata
    retrieved_records = []
    for rank, hit in enumerate(search_results, start=1):
        payload = hit.payload
        retrieved_records.append({
            "rank": rank,
            "score": round(hit.score, 4),
            "point_id": hit.id,
            "record_id": payload.get("record_id"),
            "text": payload.get("text"),
            "metadata": payload.get("metadata")
        })

    return retrieved_records

def print_retrieval_results(query_text: str, top_k: int, results: List[Dict[str, Any]]) -> None:
    print("\n" + "=" * 80)
    print(f"RETRIEVAL RESULTS FOR top_k = {top_k}")
    print("=" * 80)
    print(f"Query: \"{query_text}\"")
    print("-" * 80)
    header = f"{'RANK':<5} | {'SCORE':<8} | {'RECORD ID':<15} | {'SOURCE DOC':<25} | {'SECTION':<15} | {'TRADE':<12}"
    print(header)
    print("-" * 80)
    for r in results:
        meta = r["metadata"]
        print(f"{r['rank']:<5} | {r['score']:<8.4f} | {r['record_id']:<15} | {meta['source_doc']:<25} | {meta['section']:<15} | {meta['trade']:<12}")
    print("-" * 80)

def run_retrieval_demonstration_suite():
    print("=" * 80)
    print("SITESAFE VECTOR RETRIEVAL & TOP-K SEARCH SUITE")
    print("=" * 80)

    # 1. Setup in-memory Qdrant instance and populate full corpus
    print("Setting up Qdrant vector database and indexing corpus...")
    client = qdrant_client.QdrantClient(location=":memory:")
    
    raw_chunks = load_embedded_corpus(CORPUS_FILE)
    points = []
    for chunk in raw_chunks:
        c_id = chunk["id"]
        uuid_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, c_id))
        meta = chunk["metadata"]
        if "chunk_index" not in meta:
            meta["chunk_index"] = 1
            
        points.append(
            rest_models.PointStruct(
                id=uuid_id,
                vector=chunk["vector"],
                payload={"record_id": c_id, "text": chunk["text"], "metadata": meta}
            )
        )

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=rest_models.VectorParams(
            size=EMBEDDING_DIMENSION,
            distance=rest_models.Distance.COSINE
        )
    )
    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Successfully indexed {len(points)} records into Qdrant collection '{COLLECTION_NAME}'.")

    # Sample query matching doc_chunk_001
    sample_query = "IBC Section 705.8: Exterior wall openings fire separation distance."

    # Task 4: Demonstrate changing k (k=2 vs k=4)
    print("\n--- DEMONSTRATION 1: Top-k Similarity Search with k = 2 ---")
    results_k2 = retrieve_top_k(client, sample_query, top_k=2)
    print_retrieval_results(sample_query, 2, results_k2)

    print("\n--- DEMONSTRATION 2: Top-k Similarity Search with k = 4 ---")
    results_k4 = retrieve_top_k(client, sample_query, top_k=4)
    print_retrieval_results(sample_query, 4, results_k4)

    # Integrity Assertions
    assert len(results_k2) == 2, "Expected 2 results for k=2"
    assert len(results_k4) == 4, "Expected 4 results for k=4"
    assert results_k2[0]["record_id"] == results_k4[0]["record_id"], "Top #1 rank must be identical regardless of k value"

    print("\n[SUCCESS] Changing k demonstration and retrieval verification assertions passed.")

    output_data = {
        "query": sample_query,
        "k_2_results": results_k2,
        "k_4_results": results_k4
    }

    with open("vector_retrieval_results.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

if __name__ == "__main__":
    run_retrieval_demonstration_suite()
