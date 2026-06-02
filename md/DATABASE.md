# Database — localStorage Schemas

> This application uses **no traditional database**. All data is stored in the browser's `localStorage` on the user's device. No data is ever sent to a server. Everything is private by default.

---

## Storage Keys Reference

| Key               | Type     | Description                          |
|-------------------|----------|--------------------------------------|
| `gemma_chat_settings` | Object   | App, provider, and model settings   |
| `gemma_chat_sessions` | Array    | All conversation sessions            |
| `gemma_chat_messages_map` | Object   | All messages keyed by session ID   |
| `gemma_projects`  | Array    | Workspace project definitions        |
| `gemma_memories`  | Array    | AI memory bank entries               |
| `gemma_chat_custom_gpts` | Array    | User-created custom assistants       |
| `gemma_custom_prompts` | Array    | Prompt library entries               |
| `gemma_favorite_prompts` | Array    | Favorited prompt IDs                |

---

## Schemas

### `gemma_chat_settings` (localStorage)

```json
{
  "apiKey": "string",
  "model": "string",
  "temperature": 0.7,
  "persona": "general | writer | code | custom",
  "customSystemPrompt": "string",
  "theme": "default | claude | midnight | cyberpunk | forest",
  "appearanceMode": "dark | light | system",
  "provider": "gemini | openai | anthropic | openrouter | groq"
}
```

**Field notes:**
- `provider` — identifies the active AI provider for route proxying
- `appearanceMode` — light/dark appearance style toggling
- `theme` — custom gradient color theme preset styles

---

### `gemma_chat_sessions` (localStorage)

```json
[
  {
    "id": "timestamp-string",
    "title": "string",
    "pinned": false,
    "persona": "general | writer | code | custom",
    "customSystemPrompt": "string",
    "projectId": "string | undefined",
    "gptId": "string | undefined",
    "activeStyle": "normal | concise | learning | formal",
    "activeSkill": "default | debugger | inspector | tutor",
    "thinkingEnabled": false,
    "webSearchEnabled": false
  }
]
```

**Field notes:**
- `id` — timestamp-based unique ID
- `persona` — controls the AI's default behavior for this session
- `projectId` — links session to a project (optional)
- `gptId` — links session to a custom GPT assistant (optional)
- `activeStyle` — writing style modifier (e.g., Concise, Learning)
- `activeSkill` — special skill mode (e.g., Debugger, UX Inspector)
- `thinkingEnabled` — enables extended reasoning / thinking mode
- `webSearchEnabled` — enables Gemini web search grounding

---

### `gemma_chat_messages_map` (localStorage)

```json
{
  "sessionId": [
    {
      "id": "string",
      "role": "user | assistant",
      "content": "string",
      "attachments": []
    }
  ]
}
```

**Field notes:**
- Keyed by `sessionId` to allow O(1) lookup per session
- `attachments` — array of file/image attachments (base64 or metadata text block)
- Messages are appended in order; the full array is the conversation history

---

### `gemma_projects` (localStorage)

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "instructions": "string",
    "createdAt": "timestamp"
  }
]
```

**Field notes:**
- `instructions` — injected into system prompt for all chats inside this project
- Deleting a project does not delete its chats — they are moved back to the general list

---

### `gemma_memories` (localStorage)

```json
[
  {
    "id": "string",
    "key": "string",
    "value": "string"
  }
]
```

**Field notes:**
- `key` — category label (e.g., "Programming Language", "Startup Name")
- `value` — the remembered fact (e.g., "TypeScript", "NovaAI")
- All entries injected into the system prompt for every conversation

**Example entries:**

```json
[
  { "id": "1", "key": "Programming Language", "value": "TypeScript" },
  { "id": "2", "key": "Startup Name", "value": "NovaAI" },
  { "id": "3", "key": "Preferred Framework", "value": "Next.js" }
]
```

---

### `gemma_chat_custom_gpts` (localStorage)

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "systemInstruction": "string",
    "avatarEmoji": "string",
    "avatarBg": "string",
    "starterPrompts": ["string"],
    "temperature": 1.0
  }
]
```

**Field notes:**
- `systemInstruction` — full system prompt defining the assistant's behavior
- `avatarBg` — CSS gradient string for avatar background
- `starterPrompts` — up to 3 quick-start prompts shown on the assistant card
- `temperature` — creativity value specific to this assistant

---

### `gemma_custom_prompts` (localStorage)

```json
[
  {
    "id": "string",
    "title": "string",
    "category": "development | writing | marketing | seo | business | custom",
    "content": "string",
    "createdAt": "timestamp"
  }
]
```

---

### `gemma_favorite_prompts` (localStorage)

```json
["prompt-id-1", "prompt-id-2"]
```

Simple array of favorited prompt IDs.

---

## Storage Limits

Browser `localStorage` is limited to approximately **5–10 MB** per origin depending on the browser.

### Mitigation Strategies

- Chat history is stored as JSON strings; large conversations may approach limits
- Users can export and clear old conversations from the Export panel
- Complete workspace backup JSON files can be compiled and restored under Settings -> AI Memory Dashboard.
