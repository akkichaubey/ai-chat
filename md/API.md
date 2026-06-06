# API Reference

> The backend is a thin, stateless proxy. All API routes forward requests to AI providers — they do not store, read, or log any user data. The client is always the source of truth.

---

## API Design Principles

- **No authentication** — no JWT, no session, no cookies required
- **No storage** — API routes are pure pass-through proxies
- **Streaming** — all chat responses use Server-Sent Events (SSE) for token streaming
- **BYOK** — the user's API key is passed with each request and forwarded directly to the provider

---

## Endpoints

### `POST /api/chat`

Send a message to an AI provider and stream the response.

**Request Body**

```json
{
  "messages": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ],
  "systemPrompt": "string",
  "provider": "gemini | openai | anthropic | openrouter | groq",
  "model": "string",
  "apiKey": "string",
  "temperature": 0.7,
  "webSearchEnabled": false,
  "thinkingEnabled": false
}
```

**Response**

- Content-Type: `text/plain; charset=utf-8` or `text/event-stream`
- Renders SSE delta text chunks in plain-text format sequentially.

**Error Response**

```json
{
  "error": "string"
}
```

---

### `POST /api/validate-key`

Test whether an API key is valid by sending a lightweight probe request to the chosen provider.

**Request Body**

```json
{
  "provider": "gemini | openai | anthropic | openrouter | groq",
  "apiKey": "string"
}
```

**Response**

```json
{
  "valid": true,
  "error": null
}
```

---

## AI Provider Integration

### Google Gemini

- **SDK**: `@google/genai`
- **Authentication**: API key passed in request
- **Streaming**: Native streaming supported
- **Models**: `gemini-2.5-pro`, `gemini-2.5-flash`, `gemma-4-31b-it`, `gemma-2-27b-it`

### OpenAI

- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Models**: `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-4o`, `gpt-4o-mini`, `o1`
- **Streaming**: Implemented via custom SSE buffer reader

### Anthropic Claude

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Models**: `claude-3-5-sonnet-20241022`
- **Streaming**: Implemented via custom event-content-block SSE reader

### OpenRouter

- Unified API for 100+ models
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible)

### Groq

- Ultra-fast inference API
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible)

---

## Environment Variables

```env
# Optional: server-side fallback key (users can override with their own in Settings)
GEMINI_API_KEY=AIzaSy...

# No database credentials needed
# No auth secrets needed
# No session secrets needed
```

> The application runs without any environment variables. Variables are only needed if you want to provide a shared fallback key for users who haven't added their own.
