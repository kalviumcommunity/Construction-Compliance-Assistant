import os
import json
import uuid
from typing import List, Dict, Any

import qdrant_client
from qdrant_client.http import models as rest_models
from pydantic import BaseModel, Field

# Reuse configuration parameters
QDRANT_HOST = os.getenv("QDRANT_HOST", ":memory:")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "sitesafe_corpus_chunks")
CORPUS_FILE = os.getenv("EMBEDDED_CORPUS_FILE", "embedded_corpus.json")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

def load_embedded_corpus(file_path: str) -> List[Dict[str, Any]]:
    """Loads embedded corpus records from disk JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Corpus file '{file_path}' not found! Run batch_embedder.py first.")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_corpus_indexing_pipeline():
    print("=" * 80)
    print("SITESAFE FULL CORPUS VECTOR INDEXING PIPELINE (QDRANT)")
    print("=" * 80)

    # 1. Load embedded corpus from file
    print(f"Loading embedded corpus from '{CORPUS_FILE}'...")
    raw_chunks = load_embedded_corpus(CORPUS_FILE)
    total_source_chunks = len(raw_chunks)
    print(f"Successfully loaded {total_source_chunks} embedded records from disk.")

    # 2. Connect to Qdrant Vector DB
    print(f"\nConnecting to Vector DB at target: '{QDRANT_HOST}'...")
    if QDRANT_HOST == ":memory:":
        client = qdrant_client.QdrantClient(location=":memory:")
    else:
        client = qdrant_client.QdrantClient(url=QDRANT_HOST)

    # 3. Create clean collection
    print(f"Initializing collection '{COLLECTION_NAME}' (Dim: {EMBEDDING_DIMENSION}, Cosine Distance)...")
    collections = client.get_collections().collections
    if COLLECTION_NAME in [c.name for c in collections]:
        client.delete_collection(collection_name=COLLECTION_NAME)

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=rest_models.VectorParams(
            size=EMBEDDING_DIMENSION,
            distance=rest_models.Distance.COSINE
        )
    )

    # Task 1 & 2: Insert all corpus embeddings with text & metadata
    points = []
    point_id_map = {} # Maps original chunk_id to Qdrant UUID string

    for chunk in raw_chunks:
        c_id = chunk["id"]
        vector = chunk["vector"]
        text = chunk["text"]
        meta = chunk["metadata"]

        # Ensure chunk_index is present in metadata for complete traceability
        if "chunk_index" not in meta:
            meta["chunk_index"] = 1

        uuid_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, c_id))
        point_id_map[c_id] = uuid_id

        payload = {
            "record_id": c_id,
            "text": text,
            "metadata": meta
        }

        points.append(
            rest_models.PointStruct(
                id=uuid_id,
                vector=vector,
                payload=payload
            )
        )

    print(f"Batch upserting {len(points)} records into Qdrant collection '{COLLECTION_NAME}'...")
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    print("Upsert operation complete.")

    # Task 3: Confirm indexed count
    print("\n" + "=" * 80)
    print("COUNT RECONCILIATION & VALIDATION")
    print("=" * 80)
    collection_info = client.get_collection(collection_name=COLLECTION_NAME)
    indexed_count = collection_info.points_count
    
    print(f"Source Corpus Chunks:   {total_source_chunks}")
    print(f"Qdrant Indexed Points:  {indexed_count}")

    count_matches = (total_source_chunks == indexed_count)
    if count_matches:
        print("[MATCH SUCCESS] Indexed record count EXACTLY matches source corpus count!")
    else:
        print(f"[COUNT MISMATCH ERROR] Source count ({total_source_chunks}) != Indexed count ({indexed_count})")

    # Task 4: Spot-check stored integrity
    print("\n" + "=" * 80)
    print("SPOT-CHECK STORED INTEGRITY (SAMPLE RECORD)")
    print("=" * 80)
    
    sample_chunk = raw_chunks[0]
    sample_c_id = sample_chunk["id"]
    sample_uuid = point_id_map[sample_c_id]

    retrieve_results = client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[sample_uuid],
        with_payload=True,
        with_vectors=True
    )

    spot_record = retrieve_results[0]
    retrieved_payload = spot_record.payload
    retrieved_vec = spot_record.vector

    print(f"Target Chunk ID:      {sample_c_id}")
    print(f"Indexed Qdrant UUID:  {spot_record.id}")
    print(f"Vector Dimension:     {len(retrieved_vec)}")
    print(f"Vector Preview:       {[round(x, 4) for x in retrieved_vec[:4]]} ... {[round(x, 4) for x in retrieved_vec[-4:]]}")
    print(f"Retrieved Text:       \"{retrieved_payload['text']}\"")
    print("Retrieved Metadata:")
    print(json.dumps(retrieved_payload["metadata"], indent=4))

    # Integrity Assertions
    assert spot_record.id == sample_uuid, "UUID Mismatch!"
    assert retrieved_payload["record_id"] == sample_c_id, "Record ID Mismatch!"
    assert retrieved_payload["text"] == sample_chunk["text"], "Text Content Mismatch!"
    assert len(retrieved_vec) == EMBEDDING_DIMENSION, f"Vector Dimension Mismatch: {len(retrieved_vec)}"
    assert count_matches, "Indexed record count mismatch!"

    print("-" * 80)
    print("[SUCCESS] All integrity checks passed. Corpus vector indexing complete.")

    summary_report = {
        "source_file": CORPUS_FILE,
        "total_source_chunks": total_source_chunks,
        "qdrant_indexed_points": indexed_count,
        "count_match_status": "MATCH" if count_matches else "MISMATCH",
        "failures_count": 0,
        "sample_spot_check": {
            "record_id": sample_c_id,
            "uuid": spot_record.id,
            "vector_dimension": len(retrieved_vec),
            "text": retrieved_payload["text"],
            "metadata": retrieved_payload["metadata"]
        }
    }

    with open("indexing_summary_output.json", "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2)

    return summary_report

if __name__ == "__main__":
    run_corpus_indexing_pipeline()
