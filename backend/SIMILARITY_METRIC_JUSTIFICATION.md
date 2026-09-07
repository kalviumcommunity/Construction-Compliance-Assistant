# Architectural Metric Selection & Technical Justification: Vector Similarity in SiteSafe RAG

## 1. Why Cosine Similarity is Preferred Over Euclidean (L2) Distance

In dense neural text embeddings (such as `BAAI/bge-small-en-v1.5`, OpenAI `text-embedding-3-small`, or Sentence-Transformers), semantic concepts are encoded as directions in high-dimensional vector space $\mathbb{R}^D$.

### 1.1 Direction vs. Magnitude
- **Semantic Direction**: Dense neural encoders map semantically related phrases to vectors pointing in almost identical angular directions, regardless of the literal length of the text.
- **Vector Magnitude (Length Norm)**: The length or magnitude $\|v\|_2 = \sqrt{\sum v_i^2}$ of an embedding vector often reflects word frequency, token count, or model-specific norm variations rather than core semantic intent.

### 1.2 Chunk Length Robustness & Euclidean Penalties
Euclidean (L2) distance is defined as:
$$d_{L2}(u, v) = \|u - v\|_2 = \sqrt{\sum_{i=1}^{D} (u_i - v_i)^2}$$

Because Euclidean distance measures straight-line physical distance between vector endpoints in $D$-dimensional space:
1. **Length Bias**: A long, detailed regulatory chunk (e.g. 500 tokens) and a concise summary query (e.g. 15 tokens) might share identical semantic direction, but their unnormalized embedding vectors will differ significantly in magnitude $\|u\|_2 \neq \|v\|_2$.
2. **False Penalization**: Euclidean distance penalizes this difference in magnitude, falsely marking the relevant long document chunk as "far away" from the short query.
3. **Cosine Length-Invariance**: Cosine similarity normalizes by vector length:
$$\text{cos\_sim}(u, v) = \frac{u \cdot v}{\|u\|_2 \|v\|_2}$$
By isolating the cosine of the angle $\theta$ between $u$ and $v$, cosine similarity focuses purely on semantic direction, remaining completely invariant to document length.

---

## 2. Mathematical Equivalence of Cosine Similarity and Dot Product for Normalized Vectors

### 2.1 Derivation
When embedding vectors are normalized to unit $L_2$ norm prior to storage or retrieval, such that:
$$\|u\|_2 = 1 \quad \text{and} \quad \|v\|_2 = 1$$

The denominator of the cosine similarity equation simplifies to 1:
$$\text{cos\_sim}(u, v) = \frac{u \cdot v}{1 \cdot 1} = u \cdot v = \sum_{i=1}^{D} u_i v_i$$

### 2.2 Systems Engineering & Hardware Acceleration
1. **Pre-normalization**: In high-throughput vector search engines (such as Qdrant, Chroma, FAISS, or Milvus), candidate document vectors are normalized to unit length at ingestion time.
2. **BLAS Acceleration**: Computing dot products for pre-normalized vectors reduces vector comparison to a single matrix-vector multiplication ($\text{Scores} = M \cdot q$).
3. **Performance Optimization**: This avoids computationally expensive square-root and division operations during query time, utilizing BLAS (Basic Linear Algebra Subprograms) matrix instructions (AVX-512, CUDA tensor cores) for multi-million vector retrieval in milliseconds.
