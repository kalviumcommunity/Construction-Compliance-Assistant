import os
import json
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

import qdrant_client
from qdrant_client.http import models as rest_models

# --- CONFIGURATION (Task 1) ---
QDRANT_HOST = os.getenv("QDRANT_HOST", ":memory:")  # In-memory storage for zero-dependency test execution
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "sitesafe_corpus_chunks")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

# --- SCHEMA DEFINITION (Task 3) ---
class ChunkMetadata(BaseModel):
    source_doc: str = Field(..., description="Filename of source document")
    chunk_index: int = Field(..., description="Position of chunk within source document")
    doc_type: str = Field(..., description="building_code | project_spec | inspection_log")
    section: str = Field(..., description="Specific legal clause or section")
    page: int = Field(..., description="Page number in original document")
    trade: str = Field(..., description="Fire Safety | Structural | Electrical | Plumbing")
    jurisdiction: str = Field(..., description="California | NYC | National")

class VectorRecord(BaseModel):
    id: str = Field(..., description="Unique record identifier")
    vector: List[float] = Field(..., description="Dense embedding vector")
    text: str = Field(..., description="Raw text of chunk for RAG context injection")
    metadata: ChunkMetadata = Field(..., description="Structured retrieval payload metadata")

def initialize_vector_db() -> qdrant_client.QdrantClient:
    """Task 1: Connect to Vector Database (Qdrant in-memory or remote server)."""
    print(f"Connecting to Vector DB at target: '{QDRANT_HOST}'...")
    if QDRANT_HOST == ":memory:":
        client = qdrant_client.QdrantClient(location=":memory:")
    else:
        client = qdrant_client.QdrantClient(url=QDRANT_HOST)
    print("Vector DB connection successfully established.")
    return client

def create_collection(client: qdrant_client.QdrantClient, name: str, vector_dim: int) -> None:
    """Task 2: Create collection/index with exact vector dimension and Cosine metric."""
    collections = client.get_collections().collections
    existing_names = [c.name for c in collections]

    if name in existing_names:
        print(f"Collection '{name}' already exists. Re-creating clean collection...")
        client.delete_collection(collection_name=name)

    print(f"Creating Qdrant collection '{name}' with Vector Dimension = {vector_dim} (Cosine Distance)...")
    client.create_collection(
        collection_name=name,
        vectors_config=rest_models.VectorParams(
            size=vector_dim,
            distance=rest_models.Distance.COSINE
        )
    )
    print(f"Collection '{name}' successfully initialized.")

def insert_record(client: qdrant_client.QdrantClient, collection_name: str, record: VectorRecord) -> str:
    """Task 4: Insert a record into the vector database collection."""
    # Convert string ID to UUID for Qdrant compatibility if required
    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, record.id))

    payload = {
        "record_id": record.id,
        "text": record.text,
        "metadata": record.metadata.model_dump()
    }

    point = rest_models.PointStruct(
        id=point_id,
        vector=record.vector,
        payload=payload
    )

    print(f"Inserting record '{record.id}' (UUID: {point_id}) into '{collection_name}'...")
    client.upsert(
        collection_name=collection_name,
        points=[point]
    )
    print("Record successfully inserted.")
    return point_id

def readback_record(client: qdrant_client.QdrantClient, collection_name: str, point_id: str) -> Dict[str, Any]:
    """Task 4: Read back inserted record and verify vector length, text, and metadata."""
    print(f"Reading back record '{point_id}' from '{collection_name}'...")
    results = client.retrieve(
        collection_name=collection_name,
        ids=[point_id],
        with_payload=True,
        with_vectors=True
    )

    if not results:
        raise ValueError(f"Record with ID '{point_id}' not found in collection '{collection_name}'.")

    point = results[0]
    output = {
        "point_id": point.id,
        "record_id": point.payload.get("record_id"),
        "vector_length": len(point.vector),
        "vector_preview": [round(x, 4) for x in point.vector[:4]] + ["..."] + [round(x, 4) for x in point.vector[-4:]],
        "text": point.payload.get("text"),
        "metadata": point.payload.get("metadata")
    }
    return output

def run_vector_db_setup_suite():
    print("=" * 80)
    print("SITESAFE VECTOR DATABASE SETUP & READBACK SUITE (QDRANT)")
    print("=" * 80)

    # 1. Setup client
    client = initialize_vector_db()

    # 2. Create collection
    create_collection(client, COLLECTION_NAME, EMBEDDING_DIMENSION)

    # 3. Design test record payload
    # Generate 1536-D mock vector
    dummy_vec = [round(0.01 * (i % 10) - 0.05, 4) for i in range(EMBEDDING_DIMENSION)]

    test_record = VectorRecord(
        id="chunk_test_001",
        vector=dummy_vec,
        text="IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet from the lot line shall have a minimum fire-resistance rating of 1 hour and must have 0% unprotected openings.",
        metadata=ChunkMetadata(
            source_doc="IBC_2021_Fire_Safety.pdf",
            chunk_index=1,
            doc_type="building_code",
            section="Section 705.8",
            page=142,
            trade="Fire Safety",
            jurisdiction="National"
        )
    )

    # 4. Insert & Read back
    point_id = insert_record(client, COLLECTION_NAME, test_record)
    readback_data = readback_record(client, COLLECTION_NAME, point_id)

    # 5. Output inspection
    print("\n" + "=" * 80)
    print("READBACK VERIFICATION OUTPUT")
    print("=" * 80)
    print(f"Record ID:        {readback_data['record_id']} (Point UUID: {readback_data['point_id']})")
    print(f"Vector Dimension: {readback_data['vector_length']}")
    print(f"Vector Preview:   {readback_data['vector_preview']}")
    print(f"Text Payload:     \"{readback_data['text']}\"")
    print("Metadata Payload:")
    print(json.dumps(readback_data["metadata"], indent=4))
    print("=" * 80)

    # Assertions
    assert readback_data["vector_length"] == EMBEDDING_DIMENSION, f"Vector dimension mismatch: got {readback_data['vector_length']}, expected {EMBEDDING_DIMENSION}"
    assert readback_data["record_id"] == "chunk_test_001", "Record ID mismatch!"
    assert readback_data["metadata"]["trade"] == "Fire Safety", "Metadata field mismatch!"
    
    print("\n[SUCCESS] Vector DB collection setup, record insertion, and readback verification completed cleanly.")

    # Save output log JSON
    with open("vector_db_readback_output.json", "w", encoding="utf-8") as f:
        json.dump(readback_data, f, indent=2)

if __name__ == "__main__":
    run_vector_db_setup_suite()
