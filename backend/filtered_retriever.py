import os
import json
import uuid
from typing import List, Dict, Any, Optional

import qdrant_client
from qdrant_client.http import models as rest_models

from corpus_embedder import get_env_config, generate_embeddings
from index_corpus import load_embedded_corpus, CORPUS_FILE, COLLECTION_NAME, EMBEDDING_DIMENSION

# --- TASK 1: Metadata Filtered Search ---

def retrieve_filtered_top_k(
    client: qdrant_client.QdrantClient,
    query_text: str,
    filter_metadata: Optional[Dict[str, Any]] = None,
    top_k: int = 3,
    collection_name: str = COLLECTION_NAME
) -> List[Dict[str, Any]]:
    """
    Retrieves top-k records with optional metadata filtering.
    """
    config = get_env_config()
    query_vector = generate_embeddings([query_text], config)[0]

    # Build Qdrant FieldCondition filter if requested
    qdrant_filter = None
    if filter_metadata:
        must_conditions = []
        for key, val in filter_metadata.items():
            must_conditions.append(
                rest_models.FieldCondition(
                    key=f"metadata.{key}",
                    match=rest_models.MatchValue(value=val)
                )
            )
        qdrant_filter = rest_models.Filter(must=must_conditions)

    search_response = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        query_filter=qdrant_filter,
        limit=top_k,
        with_payload=True,
        with_vectors=False
    )

    results = []
    for rank, hit in enumerate(search_response.points, start=1):
        payload = hit.payload
        results.append({
            "rank": rank,
            "score": round(hit.score, 4),
            "point_id": hit.id,
            "record_id": payload.get("record_id"),
            "text": payload.get("text"),
            "metadata": payload.get("metadata")
        })

    return results

# --- TASK 3: Hybrid Score Search (Vector Similarity + Exact Keyword Match) ---

def retrieve_hybrid(
    client: qdrant_client.QdrantClient,
    query_text: str,
    exact_keywords: List[str],
    keyword_boost: float = 0.25,
    top_k: int = 3,
    collection_name: str = COLLECTION_NAME
) -> List[Dict[str, Any]]:
    """
    Combines dense vector search with exact keyword term presence boosting.
    Hybrid Score = Dense Cosine Score + (keyword_boost * keyword_matches_count)
    """
    # Fetch broader candidate pool for re-ranking
    candidates = retrieve_filtered_top_k(client, query_text, filter_metadata=None, top_k=top_k * 2)

    hybrid_results = []
    keywords_lower = [kw.lower() for kw in exact_keywords]

    for cand in candidates:
        text_lower = cand["text"].lower()
        match_count = sum(1 for kw in keywords_lower if kw in text_lower)
        boost = match_count * keyword_boost
        raw_score = cand["score"]
        final_score = round(raw_score + boost, 4)

        cand_copy = dict(cand)
        cand_copy["dense_score"] = raw_score
        cand_copy["keyword_matches"] = match_count
        cand_copy["hybrid_score"] = final_score
        cand_copy["score"] = final_score
        hybrid_results.append(cand_copy)

    # Re-sort candidates by hybrid score
    hybrid_results.sort(key=lambda x: x["hybrid_score"], reverse=True)

    # Re-rank top-k
    final_ranked = []
    for rank, item in enumerate(hybrid_results[:top_k], start=1):
        item["rank"] = rank
        final_ranked.append(item)

    return final_ranked

def print_results_table(title: str, results: List[Dict[str, Any]]) -> None:
    print("\n" + "=" * 85)
    print(title)
    print("=" * 85)
    header = f"{'RANK':<5} | {'SCORE':<8} | {'RECORD ID':<15} | {'DOCUMENT':<25} | {'TRADE':<12} | {'JURISDICTION':<10}"
    print(header)
    print("-" * 85)
    for r in results:
        meta = r["metadata"]
        print(f"{r['rank']:<5} | {r['score']:<8.4f} | {r['record_id']:<15} | {meta['source_doc']:<25} | {meta['trade']:<12} | {meta.get('jurisdiction', 'N/A'):<10}")
    print("-" * 85)

def run_filtered_retrieval_demonstration_suite():
    print("=" * 85)
    print("SITESAFE FILTERED & HYBRID RETRIEVAL DEMONSTRATION SUITE")
    print("=" * 85)

    # 1. Setup in-memory Qdrant instance with 5 corpus chunks
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
    print(f"Indexed {len(points)} records into Qdrant collection '{COLLECTION_NAME}'.")

    # --- TASK 2 & 4: Compare Filtered vs Unfiltered Results ---
    query = "What are the fire safety requirements for construction site building codes?"
    print(f"\nQUERY: \"{query}\"")

    # 1. Unfiltered retrieval (Top 3)
    unfiltered_results = retrieve_filtered_top_k(client, query, filter_metadata=None, top_k=3)
    print_results_table("DEMO 1: UNFILTERED RETRIEVAL (Top 3)", unfiltered_results)

    # 2. Metadata Filtered retrieval (trade = 'Fire Safety')
    fire_filter = {"trade": "Fire Safety"}
    filtered_fire_results = retrieve_filtered_top_k(client, query, filter_metadata=fire_filter, top_k=3)
    print_results_table("DEMO 2: METADATA FILTERED RETRIEVAL (trade == 'Fire Safety')", filtered_fire_results)

    # 3. Metadata Filtered retrieval (jurisdiction = 'California')
    ca_filter = {"jurisdiction": "California"}
    filtered_ca_results = retrieve_filtered_top_k(client, query, filter_metadata=ca_filter, top_k=3)
    print_results_table("DEMO 3: JURISDICTION FILTERED RETRIEVAL (jurisdiction == 'California')", filtered_ca_results)

    # --- TASK 3: Hybrid Search with Exact Term Boosting ---
    hybrid_keywords = ["705.8", "unprotected"]
    hybrid_results = retrieve_hybrid(client, query, exact_keywords=hybrid_keywords, keyword_boost=0.30, top_k=3)
    print_results_table("DEMO 4: HYBRID SEARCH (Dense Vector + Exact Keywords ['705.8', 'unprotected'])", hybrid_results)

    # --- TASK 4: Precision & Verification Assertions ---
    # Assertion 1: Filtered trade results must ONLY contain trade == 'Fire Safety'
    for r in filtered_fire_results:
        assert r["metadata"]["trade"] == "Fire Safety", f"Filtered result trade mismatch: got {r['metadata']['trade']}"
    print("  [PASS] Trade metadata filter strictly scoped results to Fire Safety.")

    # Assertion 2: Filtered jurisdiction results must ONLY contain jurisdiction == 'California'
    for r in filtered_ca_results:
        assert r["metadata"]["jurisdiction"] == "California", f"Jurisdiction mismatch: got {r['metadata']['jurisdiction']}"
    print("  [PASS] Jurisdiction metadata filter strictly scoped results to California.")

    # Assertion 3: Hybrid search boosted exact keyword match chunk
    assert hybrid_results[0]["record_id"] == "doc_chunk_001", "Hybrid search failed to prioritize exact clause 705.8!"
    print("  [PASS] Hybrid search successfully prioritized exact clause '705.8' to Rank #1.")

    print("\n[SUCCESS] Filtered and hybrid retrieval suite completed cleanly.")

    output_data = {
        "query": query,
        "unfiltered_results": unfiltered_results,
        "filtered_fire_safety": filtered_fire_results,
        "filtered_california": filtered_ca_results,
        "hybrid_results": hybrid_results
    }

    with open("filtered_retrieval_results.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

if __name__ == "__main__":
    run_filtered_retrieval_demonstration_suite()
