# SiteSafe RAG Parameter Configuration & Generation Control Report

## MLOps Overview & Generation Control Governance

In safety-critical building code compliance (e.g. IBC, CBC, NFPA, ACI standards), LLM generation parameters govern both **regulatory safety** and **token budget predictability**. Uncalibrated parameters introduce creative hallucinations (such as speculating on ungrounded code exceptions or variance procedures) and unconstrained token spend.

This report documents empirical benchmark results from [`backend/parameter_experiments.py`](file:///f:/desk/RAG/backend/parameter_experiments.py) and defines the production parameter configuration for SiteSafe.

---

## 1. Empirical Experiment Results Summary

### Task 1: Temperature Tuning (Deterministic vs. Creative)

| Temperature | Qualitative Output Evaluation | Tokens | Risk & Compliance Assessment |
| :--- | :--- | :--- | :--- |
| **0.0 (Deterministic)** | `"NO. Under IBC 2021 Section 705.8, exterior walls of Type V construction located 4 feet from the lot line (less than 5 feet) must have 0% unprotected openings..."` | 51 | **PREFERRED**: Concise, 100% grounded, strictly factual, verbatim citation matching. |
| **0.7 (Moderate)** | `"No, you cannot install standard non-rated sliding glass doors. IBC 2021 Section 705.8 states... You would need fire-rated door assemblies approved under Section 716."` | 58 | **ACCEPTABLE BUT DRIFTING**: Adds unprompted commentary referencing Section 716 door assemblies not provided in context chunk. |
| **1.3 (High Creativity)** | `"Based on IBC 2021 Section 705.8, no standard non-rated glass sliders are permitted... However, if you apply for a variance or install automatic fire shutters or deluge sprinklers, local building officials might evaluate..."` | 68 | **HIGH RISK**: Speculates on variances, deluge sprinklers, and fire shutters **not present in context**. Introduces severe regulatory liability. |

---

### Task 2: Response Capping with `max_tokens` & `finish_reason`

| `max_tokens` Setting | Observed Completion Output | `finish_reason` | Operational Impact |
| :--- | :--- | :--- | :--- |
| **`max_tokens = 30`** | `"NO. Under IBC 2021 Section 705.8, exterior walls of Type V construction located 4 feet from the lot line (less than 5 feet) must have 0% unprotected"` | `length` | ❌ **TRUNCATED**: Response cuts off abruptly mid-sentence, invalidating downstream JSON parsing and audit records. |
| **`max_tokens = 150`** | `"NO. Under IBC 2021 Section 705.8, exterior walls of Type V construction located 4 feet from the lot line (less than 5 feet) must have a minimum fire-resistance rating of 1 hour and 0% unprotected openings..."` | `stop` | ✅ **OPTIMAL**: Complete, structured compliance verdict delivered safely within budget. |

---

### Task 3: Stop Sequences (`stop`) & Nucleus Sampling (`top_p`)

#### Stop Sequences (`stop=["Citations:", "\n\n"]`)
* **Observed Output**: `"NO. Standard non-rated sliding glass doors cannot be installed."`
* **Tokens Used**: 12 tokens (`finish_reason: stop`)
* **Benefit**: Cleanly terminates generation immediately after the core verdict is rendered, preventing conversational trailing prose and saving 75%+ output tokens.

#### Nucleus Sampling (`top_p`)
* **`top_p = 0.1`**: Restricts candidate token selection to the top 10% cumulative probability mass. Enforces strict statutory terminology and standard code citations.
* **`top_p = 1.0`**: Considers 100% of candidate tokens, increasing vocabulary variation.

---

## 2. Production Parameter Profile for SiteSafe

For production deployment of the SiteSafe Compliance RAG engine, the following baseline parameters are mandated:

```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.0,
  "top_p": 1.0,
  "max_tokens": 300,
  "stop": ["\n\n---", "Citations:"]
}
```

### Rationale for Production Parameters:
1. **`temperature: 0.0`**: Enforces greedy deterministic decoding. Ensures identical queries against identical RAG context produce 100% repeatable, legally auditable answers.
2. **`max_tokens: 300`**: Bounds maximum output token cost while providing ample headroom for multi-part compliance verdicts and structured JSON schema responses without triggering mid-sentence `length` truncation.
3. **`top_p: 1.0`**: At `temperature: 0.0`, greedy decoding selects the argmax token directly; `top_p: 1.0` maintains standard probability distribution evaluation.
4. **`stop` Sequences**: Prevents runaway token generation when answering single-bullet compliance queries.

---

## 3. Standardized Git Commit Message

```text
feat(mlops): implement parameter tuning experiments and generation control suite

- Add `backend/parameter_experiments.py` benchmarking temperature (0.0, 0.7, 1.3), max_tokens, stop sequences, and top_p
- Demonstrate high-risk speculation drift under elevated temperatures (1.3) vs deterministic grounding (0.0)
- Evaluate API finish_reason tracking (length vs stop) for response capping
- Define production parameter profile in `PARAMETER_CONFIGURATION.md`
```
