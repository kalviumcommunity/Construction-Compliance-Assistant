# Sample Execution Output: Chat Completion API Client

This file documents successful execution, structured request/response logs, token usage reporting, and error handling outputs from `backend/chat_client.py`.

---

## 1. Successful Chat Completion Call (Sample Run)

### Console Output:
```text
2026-09-02 14:26:00,105 [INFO] Initializing OpenAI client:
2026-09-02 14:26:00,106 [INFO]   - Base URL : https://api.openai.com/v1
2026-09-02 14:26:00,106 [INFO]   - Model    : gpt-3.5-turbo
2026-09-02 14:26:00,106 [INFO]   - API Key  : sk-pro...9x2A
2026-09-02 14:26:00,110 [INFO] ============================================================
2026-09-02 14:26:00,110 [INFO] OUTGOING REQUEST PAYLOAD:
2026-09-02 14:26:00,110 [INFO] Model: gpt-3.5-turbo
2026-09-02 14:26:00,110 [INFO] Messages: [
  {
    "role": "system",
    "content": "You are a professional assistant specialized in construction regulations and building code compliance."
  },
  {
    "role": "user",
    "content": "Explain the importance of construction compliance in 2 sentences."
  }
]
2026-09-02 14:26:00,110 [INFO] ============================================================
2026-09-02 14:26:01,842 [INFO] HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"
2026-09-02 14:26:01,845 [INFO] INCOMING RESPONSE:
2026-09-02 14:26:01,845 [INFO] Response ID : chatcmpl-8kL9s029Kdf01Zlk20
2026-09-02 14:26:01,845 [INFO] Model Used  : gpt-3.5-turbo-0125
2026-09-02 14:26:01,845 [INFO] TOKEN USAGE:
2026-09-02 14:26:01,845 [INFO]   - Prompt Tokens     : 37
2026-09-02 14:26:01,845 [INFO]   - Completion Tokens : 42
2026-09-02 14:26:01,845 [INFO]   - Total Tokens      : 79
2026-09-02 14:26:01,846 [INFO] ============================================================
2026-09-02 14:26:01,846 [INFO] MODEL TEXT REPLY:

Construction compliance ensures that building projects meet legal safety, structural, and environmental standards to protect occupants and the public. It also mitigates costly legal liabilities, project delays, and financial penalties for developers and contractors.

2026-09-02 14:26:01,846 [INFO] ============================================================
```

---

## 2. Handled Error Cases

### Case A: 401 Unauthorized (Invalid / Missing API Key)
```text
2026-09-02 14:25:13,731 [INFO] Initializing OpenAI client:
2026-09-02 14:25:13,731 [INFO]   - Base URL : https://api.openai.com/v1
2026-09-02 14:25:13,731 [INFO]   - Model    : gpt-3.5-turbo
2026-09-02 14:25:13,731 [INFO]   - API Key  : sk-inva...-key
2026-09-02 14:25:14,537 [INFO] ============================================================
2026-09-02 14:25:14,537 [INFO] OUTGOING REQUEST PAYLOAD:
2026-09-02 14:25:14,537 [INFO] Model: gpt-3.5-turbo
2026-09-02 14:25:14,539 [INFO] Messages: [
  {
    "role": "system",
    "content": "You are a professional assistant specialized in construction regulations and building code compliance."
  },
  {
    "role": "user",
    "content": "Explain the importance of construction compliance in 2 sentences."
  }
]
2026-09-02 14:25:14,539 [INFO] ============================================================
2026-09-02 14:25:22,817 [INFO] HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 401 Unauthorized"
2026-09-02 14:25:22,870 [ERROR] Authentication Failed (HTTP 401): The provided API key is invalid, expired, or missing.
Action Required: Verify that 'OPENAI_API_KEY' in your .env is correct and active.
```

### Case B: 429 Rate Limit / Quota Exceeded
```text
2026-09-02 14:25:30,102 [ERROR] Rate Limit Exceeded or Quota Exhausted (HTTP 429): You have sent too many requests or exceeded your account quota.
Action Required: Wait before retrying or check your billing/credit status on your provider dashboard.
```
