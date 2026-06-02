# Features

> **Status Note**: Core features including **Voice Mode**, **Multi-File Sandpack Sandbox**, **Custom Themes**, **Screenshotting**, **Context-Aware Quick Actions**, **Projects**, **Memory**, **Custom Assistants**, **Search**, **Prompt Library**, and **Export** are already fully implemented on the client-side using localStorage.

---

## Phase 1 — API Key Management ✅ (Complete)

Allow users to securely add, manage, and switch between API keys from multiple AI providers. No account required — keys live entirely on the user's device.

### Add API Key

- User pastes their own key from a provider (e.g. Google AI Studio, OpenAI platform)
- Key is stored in `localStorage` under `gemma_chat_settings`
- Full obfuscation for saved key values

### Supported Providers

```text
Google Gemini    — aistudio.google.com
OpenAI           — platform.openai.com
Anthropic Claude — console.anthropic.com
OpenRouter       — openrouter.ai
Groq             — console.groq.com
Ollama           — local endpoint (http://localhost:11434) [Planned]
```

### Switch Active Key

- User can switch between saved keys instantly via AI Provider buttons
- Active key is highlighted in the Settings panel
- Switching provider and key takes effect immediately for the next message

### Edit / Delete Key

- Replace the key value at any time
- Clear or remove saved keys instantly

### Key Validation

- Test key validity by sending a lightweight validation request to `/api/validate-key`
- Show connection success or error message badge

### Fallback Key

- If no key is configured, the app uses a global server-side default key (if set via `.env.local`)
- App clearly communicates whether it is using a personal key or a shared fallback

### UI

```text
Settings → AI Provider & API Key
─────────────────────────────────────────
  Provider Pickers:
  [ Gemini (Active) ] [ OpenAI ] [ Claude ] [ Router ] [ Groq ]

  Key: AIzaSy••••••••••••••••wX3Q
  [Verify API Key]  -> Success / Error Banner
─────────────────────────────────────────
```

### Privacy Note

> All API keys are stored only in your browser's `localStorage`. They are never sent to any server other than the AI provider directly. You own your keys — we never see them.

### Deliverables

- [x] API key input in Settings Modal (Gemini, single key — working)
- [x] Multi-provider key management panel
- [x] Key switching and active indicator
- [x] Key validation ping (`POST /api/validate-key`)
- [ ] Ollama local endpoint support

---

## Phase 2 — Chat Persistence ✅ (Complete)

Save all conversations locally on the user's device with no cloud dependency.

### Features

- **Create Chat** — New conversation session
- **Rename Chat** — Editable title (inline edit or context menu)
- **Delete Chat** — Remove conversation from localStorage
- **Pin Chat** — Pin important conversations to the top of the sidebar
- **Auto Title Generation** — AI generates a 3–4 word title from the first message

### Sidebar Groups

```text
📌 Pinned
Today
Yesterday
Previous 7 Days
Previous 30 Days
Older
```

### Deliverables

- [x] Persistent chat history (localStorage)
- [x] Chat sidebar with chronological grouping
- [x] Create, rename, delete, pin chats
- [x] Auto title generation

---

## Phase 3 — Projects ✅ (Complete)

Organize related chats into project workspaces with shared AI instructions.

### Features

- **Create Project** — Define name, description, and system instructions
- **Rename / Edit Project** — Update project metadata at any time
- **Delete Project** — Deletes project; chats are moved back to general list
- **Move Chat To Project** — Assign a chat via context menu "Move to..." dropdown
- **Direct Chat Creation in Project** — Instantiate new chats directly pre-assigned to a specific project from the workspace list
- **Nested Collapsible Project Chat Lists** — Chats belonging to projects are rendered inside collapsible folder components in the sidebar
- **Overflow Dropdown Fix** — Dynamic rounded border system on collapsible project panels resolves 3-dot dropdown menu clipping issues
- **Project Instructions (Context Injection)** — Instructions automatically appended to all chats inside the project

### Example

```text
🗂 Startup Project [Plus Icon to add chat]
 ├─ Marketing Chat
 ├─ Pricing Strategy Chat
 └─ Investor Pitch Chat
```

### Deliverables

- [x] Project creation and management (localStorage)
- [x] Chat assignment to projects
- [x] Direct chat creation within project folders
- [x] Collapsible sidebar nested project chat rendering
- [x] Rounded border layout adjustments to avoid overflow clipping
- [x] Automatic context injection into AI prompts

---

## Phase 4 — AI Memory System ✅ (Complete)

Allow the AI to remember user preferences and facts across all conversations.

### Manual Memory

User explicitly saves a memory fact:

```text
My preferred coding language is TypeScript.
My startup is called NovaAI.
```

### Automatic Memory

AI detects preference signals in user messages and auto-stores them:

```text
User prefers TypeScript → stored as "Programming Language: TypeScript"
```

### Memory Categories

| Category  | Examples                                      |
|-----------|-----------------------------------------------|
| Personal  | Name, Location, Language                      |
| Technical | Framework, Programming Language, Database     |
| Business  | Startup Name, Industry, Target Audience       |

### Memory Dashboard

Users can:

- View all stored memory facts
- Edit any memory entry (inline key/value edit form)
- Delete individual entries
- Clear all memories in bulk

### Deliverables

- [x] Manual memory entry
- [x] Automatic memory detection via AI
- [x] Memory injected into all system prompts
- [x] Memory Dashboard in Settings (View, Edit, Delete, Clear All)

---

## Phase 5 — Custom Assistants / GPTs ✅ (Complete)

Let users create custom AI personas with system prompts, avatars, and starter prompts — similar to Custom GPTs.

### Assistant Configuration

| Field           | Description                              |
| --------------- | ---------------------------------------- |
| Name            | Display name of the assistant            |
| Icon / Emoji    | Avatar emoji                             |
| Theme Color     | Gradient background for avatar           |
| Description     | Short summary shown on explore card      |
| System Prompt   | Full instructions for AI behavior        |
| Temperature     | Creativity level (0.0 – 2.0)             |
| Starter Prompts | Up to 3 quick-start conversation prompts |

### Featured Built-In Assistants

```text
💻 Gemma Dev Pro       — Senior software architect
✍️ Creative Copywriter — Marketer and creative writer
💡 Product Strategist  — UX/UI advisor and startup strategist
🎓 Academic Coach      — Science and math educator
```

### Deliverables

- [x] Unlimited custom assistant creation (no paywall)
- [x] Built-in featured assistants
- [x] Explore GPTs modal
- [x] Starter prompts & custom temperature per assistant

---

## Phase 6 — Conversation Search ✅ (Complete)

Search across all saved conversations to quickly find past discussions.

### Search Types

- **Global Search** — search by keywords across all chat titles and message content
- **Filter by Project**
- **Filter by Date Range** — Today, Last 7 Days, Last 30 Days, All Time
- **Filter by Assistant / Persona type**

### Deliverables

- [x] Full-text search across chat titles and message contents
- [x] Multi-filter search modal
- [x] Click result to jump directly to that session
- [x] Keyboard shortcut to open (`Ctrl+Shift+F`)

---

## Phase 7 — Prompt Library ✅ (Complete)

Store, organize, and reuse frequently used AI prompts.

### Categories

- Development
- Writing & Copy
- Marketing
- SEO
- Business
- Custom (user-created)
- Favorites

### Features

- **Save Prompt** — Add a custom template with title, category, and content
- **Favorite Prompt** — Star prompts for quick access under "Favorites" tab
- **Copy Prompt** — Copy prompt text to clipboard with one click
- **Inject Prompt** — Inject directly into the active chat input
- **Edit Prompt** — Edit custom template content inline
- **Delete Prompt** — Remove custom prompts permanently

### Pre-Built Templates

```text
Code Reviewer          — Security + optimization review
CSS Grid Wizard        — Responsive layout with modern CSS
SEO Article Writer     — Keyword-optimized blog post
Copywriter Refinement  — Conversion-focused rewrite
SaaS Launch Strategy   — Product Hunt launch checklist
Customer Interview Script — UX research questions
SEO Meta Tags Generator — Optimized SEO meta values
Keyword Cluster Builder — Search intent keyword grouping
Business Plan Outline   — Comprehensive outline outline
SWOT Analysis Generator — SWOT analysis table
```

### Deliverables

- [x] Personal prompt library (localStorage)
- [x] Pre-built template collection (including SEO & Business)
- [x] Favorites, search, category tabs
- [x] Inject to chat functionality
- [x] Edit existing custom prompts

---

## Phase 8 — Export & Data Portability ✅ (Complete)

Allow users to export their conversations in multiple formats without any account.

### Export Formats

| Format         | Description                                |
|----------------|--------------------------------------------|
| Markdown (.md) | Full conversation with headers and formatting |
| Plain Text (.txt) | Simple text export for archiving        |
| Print / PDF    | Renders markdown via marked.js before opening print dialog |

### Export Scope

- **Single Chat** — Export the currently active conversation
- **Full Workspace Export** — Export all localStorage data as a JSON backup file
- **Workspace Import** — Import a JSON backup to restore all chats, custom GPTs, settings, memories, and projects on any device

### Deliverables

- [x] Markdown export
- [x] Plain text export
- [x] Print to PDF with Markdown rendering
- [x] Full workspace JSON backup/restore

---

## Phase 9 — Workspace Organization (Planned)

Add nested folder organization to the sidebar for users with many projects and chats.

### Folder Structure Example

```text
📁 Work
  📂 AI Startup Project
  📂 Client Projects
📁 Personal
  📂 Learning Notes
  📂 Side Projects
📁 Research
  📂 Market Analysis
```

### Features

- **Create Folder** — Name and color-code folders
- **Move Chat / Project to Folder** — Drag-and-drop or context menu
- **Archive Folder** — Collapse and hide without deleting
- **Delete Folder** — Removes folder; contents moved to root

### Deliverables

- [ ] Folder sidebar section
- [ ] Drag-and-drop chat organization
- [ ] Folder archiving

---

## Phase 10 — Multi-Provider AI Support ✅ (Complete)

Allow users to connect and switch between multiple AI providers using their own API keys.

### Model Switching

Users can switch models mid-conversation:

```text
[Gemma 4 (31B) ▾]
 • Gemma 4 (31B)
 • Gemma 2 (27B)
 • Gemini 2.5 Flash
 • Gemini 2.5 Pro
 • GPT-4o (OpenAI)
 • Claude 3.5 Sonnet (Anthropic)
 • Llama 3 (Groq)
```

### Deliverables

- [x] Gemini model switching (working)
- [x] OpenAI provider integration
- [x] Anthropic Claude integration
- [x] OpenRouter unified API
- [x] Groq fast inference integration
- [ ] Ollama local model support

---

## Phase 11 — Settings & Personalization ✅ (Complete)

Full user control over the AI experience — no account needed.

### App Settings

| Setting            | Options / Range                                |
|--------------------|------------------------------------------------|
| Theme              | 5 Color Themes: Default, Claude, Midnight, Cyberpunk, Forest |
| Appearance Mode    | Light / Dark / System (auto-follow OS preference) |
| Temperature        | Slider 0.0 – 2.0                               |
| Default AI Persona | General, Writer, Code Architect, Custom        |
| Custom System Prompt | Freeform text                               |
| Thinking Mode      | Toggle on/off                                  |
| Web Search         | Toggle on/off                                  |

### Deliverables

- [x] Theme selection and light/dark/system mode toggling
- [x] Temperature control
- [x] AI persona selection
- [x] Custom system prompt
- [x] Full multi-provider key management & validation UI

---

## Phase 12 — Multimodal Features (Partially Completed)

Extend the platform to support rich media input and output.

### Image Input

- Upload images for visual analysis and description
- Paste screenshots directly into chat
- Use cases: UX Audit, Code From Image, OCR Extraction

### Document Intelligence

- PDF upload and analysis
- Code file context injection (inline file attachments)
- Office documents (DOCX, XLSX, PPTX) [Planned]
- CSV and spreadsheet data analysis [Planned]

### Image Generation [Planned]

- Gemini Imagen integration
- Stable Diffusion via API key

### Voice Mode ✅ (Complete)

- Hands-free voice conversation using Web Speech API
- Text-to-speech AI responses
- Language and voice selection
- Continuous dialogue mode

### Deliverables

- [x] Image upload and analysis (via Gemini Vision)
- [x] File context injection (text files, code)
- [x] Voice Mode overlay (Web Speech API)
- [ ] PDF deep intelligence
- [ ] DOCX / XLSX / CSV document analysis
- [ ] Image generation

---

## Phase 13 — Advanced AI Features (Planned)

### Deep Research Mode

- Multi-step web search with citations
- Long-form report generation
- Source verification

### Code Interpreter

- Python execution sandbox
- CSV/data analysis
- Chart and visualization generation
- File creation from code — AI generates and offers download of files (e.g., `.py`, `.csv`, `.json`, `.html`)

### Agentic Workflows

```text
"Research the top 10 AI startups and write a report."
→ AI searches web → summarizes → formats report → exports
```

### Deliverables

- [ ] Web research + citation
- [ ] Code execution sandbox
- [ ] File creation and download from code output
- [ ] Multi-step agentic tasks

---

## Phase 15 — Advanced Voice Mode & Gemini Live (Planned)

Level up voice interaction from basic Web Speech API to real-time, bidirectional, low-latency audio powered by Gemini Live API.

### Advanced Voice Mode

- Real-time streaming audio input and output
- Interrupt AI mid-sentence (barge-in support)
- Natural conversation flow without push-to-talk
- Emotion-aware voice responses
- Background noise suppression
- Language auto-detection

### Gemini Live Integration

- Direct integration with Google Gemini Live API
- Real-time bidirectional audio stream (WebSocket-based)
- Sub-500ms response latency
- Multimodal input during voice — share screen or image while talking
- Voice + Vision simultaneously

### Deliverables

- [ ] Advanced Voice Mode with barge-in support
- [ ] Gemini Live API WebSocket integration
- [ ] Real-time audio streaming UI (waveform visualization)
- [ ] Multimodal voice + vision session
- [ ] Voice language auto-detection
- [ ] Mute, pause, and session controls

---

## Phase 16 — Image Generation (Planned)

Integrate Nano Banana (Gemini's fast, lightweight image generation model) alongside Gemini Imagen.

### Supported Models

| Model                  | Speed         | Quality | Notes                           |
| ---------------------- | ------------- | ------- | ------------------------------- |
| Nano Banana            | ⚡ Ultra-fast | Good    | Free-tier friendly, lightweight |
| Gemini Imagen 3        | 🐢 Moderate   | High    | Premium quality, paid tier      |
| Stable Diffusion (API) | 🐢 Moderate   | High    | User provides own API key       |

### Features

- User types `/image <prompt>` or clicks Image Generation button
- AI generates image inline inside the chat bubble
- Multiple aspect ratio options (1:1, 16:9, 9:16, 4:3)
- Style presets: Photorealistic, Digital Art, Watercolor, Sketch, Pixel Art, Cinematic, Minimalist
- Download, regenerate, and edit prompt actions

### Deliverables

- [ ] Nano Banana image generation via Gemini API
- [ ] Gemini Imagen 3 integration (premium)
- [ ] In-chat image rendering
- [ ] Style preset selector
- [ ] Aspect ratio controls
- [ ] Download and regenerate actions
- [ ] `/image` slash command shortcut

---

## Phase 17 — Google Workspace AI Side Panel (Planned)

A lightweight browser extension / side panel that injects AI chat into Google Workspace apps.

### Supported Apps

| App           | AI Use Cases                                  |
| ------------- | --------------------------------------------- |
| Google Docs   | Rewrite, summarize, expand, translate content |
| Google Sheets | Formula help, data analysis, CSV insights     |
| Gmail         | Draft replies, summarize threads, tone adjust |
| Google Slides | Slide content suggestions, speaker notes      |
| Google Drive  | File summarization, search assistance         |

### Deliverables

- [ ] Chrome / Edge browser extension (Manifest V3)
- [ ] Google Docs side panel integration
- [ ] Google Sheets formula assistant
- [ ] Gmail reply drafter
- [ ] Google Slides content helper
- [ ] Context-aware quick action buttons
- [ ] Insert-into-document functionality

---

## Future Features (Post-MVP)

### Multimodal

- Image generation (Nano Banana, Gemini Imagen 3, Stable Diffusion)
- Advanced PDF / DOCX / CSV document intelligence
- Video understanding
- Real-time screen sharing during voice chat

### Advanced Voice

- Gemini Live real-time bidirectional audio
- Advanced Voice Mode with barge-in support
- Emotion-aware voice responses
- Multilingual voice auto-detection

### Extended Provider Support

- OpenAI o1, o3, GPT-4o
- Anthropic Claude 3.5+ Sonnet
- Groq ultra-fast inference
- Cohere, Mistral, DeepSeek

### Deep Research

- Multi-step web crawling
- Citation generation with source links
- Long-form structured reports

### Code Interpreter

- Python execution sandbox
- CSV and data analysis
- Interactive data visualization
- File creation and download (`.py`, `.csv`, `.json`, `.html`)

### Team Workspace (Optional, No Account Required)

- Shared project via export/import
- Local network sharing (LAN mode)
- No cloud sync — fully local collaboration
