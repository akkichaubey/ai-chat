# Roadmap

> **Product Vision**: Build a fully open, self-hostable, bring-your-own-key (BYOK) AI chat platform using Next.js + Tailwind + Gemini (and other providers). No login required. No accounts. No subscriptions. Just bring your API key and start chatting.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Fully implemented and working |
| 🔄 In Progress | Currently being developed |
| 🔜 Planned | Scheduled for a future phase |

---

## Phase Summary

| Phase | Title | Status |
|-------|-------|--------|
| 0 | Foundation | ✅ Complete |
| 1 | API Key Management | ✅ Complete |
| 2 | Chat Persistence | ✅ Complete |
| 3 | Projects | ✅ Complete |
| 4 | AI Memory System | ✅ Complete |
| 5 | Custom Assistants / GPTs | ✅ Complete |
| 6 | Conversation Search | ✅ Complete |
| 7 | Prompt Library | ✅ Complete |
| 8 | Export & Data Portability | ✅ Complete |
| 9 | Workspace Organization | 🔜 Planned |
| 10 | Multi-Provider AI Support | ✅ Complete |
| 11 | Settings & Personalization | ✅ Complete |
| 12 | Multimodal Features | 🔄 In Progress |
| 13 | Advanced AI Features | 🔜 Planned |
| 14 | Self-Hosting & Privacy | 🔜 Planned |
| 15 | Advanced Voice Mode & Gemini Live | 🔜 Planned |
| 16 | Nano Banana Image Generation | 🔜 Planned |
| 17 | Google Workspace AI Side Panel | 🔜 Planned |
| 18 | Local Codebase Reader | ✅ Complete |
| 19 | GitHub Public Repo Reader | ✅ Complete |

---

## Phase 0 — Foundation (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Project scaffolding with Next.js 16 + TypeScript
- [x] localStorage data layer
- [x] Design system (dark/light/system mode, themes, typography)
- [x] API route proxy for Gemini (thin layer, no auth)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Build the project and verify it compiles without TypeScript errors.
  * **Expected Output**: Next.js production build succeeds with clean type checking.
  * **Status**: `[x] Passed`
* **Test Case 2**: Toggle Light, Dark, and System modes in the browser.
  * **Expected Output**: UI colors shift immediately with zero flash/flicker and no hydration mismatch.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *No issues found. App shell scaffolding and theme switcher are extremely stable and performant.*

---

## Phase 1 — API Key Management (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] API key input in Settings Modal (Gemini, single key — working)
- [x] Multi-provider key management panel (Gemini, OpenAI, Claude, OpenRouter, Groq)
- [x] Key switching and active indicator
- [x] Key validation ping (`/api/validate-key` endpoint)
- [ ] Ollama local endpoint support (Planned)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Input a valid Gemini API key in Settings and save it.
  * **Expected Output**: Key is saved under `gemma_chat_settings` in localStorage, and input field is obfuscated.
  * **Status**: `[x] Passed`
* **Test Case 2**: Trigger key validation ping before saving.
  * **Expected Output**: Displays connection success badge or a clear error banner for invalid keys.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Keys are saved under unified browser localStorage settings. Key validation endpoint accurately probes provider models and updates border status dynamically.*

---

## Phase 2 — Chat Persistence (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Persistent chat history via localStorage
- [x] Chat sidebar with chronological grouping
- [x] Create, rename, delete, and pin chats
- [x] Auto-title generation

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Reload the page after starting several chats.
  * **Expected Output**: Conversations persist and are correctly sorted in chronological groups (Today, Yesterday, Last 7 Days, etc.).
  * **Status**: `[x] Passed`
* **Test Case 2**: Create a new conversation and send an initial message.
  * **Expected Output**: AI generates a clean, relevant 3–4 word title and updates the sidebar entry automatically.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Pinning, renaming, and chronological grouping work reliably. The title generation latency is minimal (<1.5s).*

---

## Phase 3 — Projects (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Project creation and management in localStorage
- [x] Chat assignment to projects
- [x] Direct chat creation pre-assigned to a project workspace
- [x] Sidebar collapsible project rendering with dynamic rounded corner system
- [x] Resolved 3-dot option dropdown overflow clipping inside project item wrappers
- [x] Automatic context injection into AI prompts

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Assign a conversation to a project that has custom context instructions.
  * **Expected Output**: The project's system prompt instructions are appended to subsequent AI payloads automatically.
  * **Status**: `[x] Passed`
* **Test Case 2**: Create a chat directly inside a project and trigger options menu.
  * **Expected Output**: A new chat session is initialized with the project's ID pre-assigned, and clicking the 3-dot dropdown shows the actions list cleanly without any visual clipping.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Visual clipping issue on nested chat option dropdown menus was resolved by removing `overflow-hidden` on parent wrappers and handling rounded boundaries dynamically.*
- *Defensive click handler wrappers added to eliminate optional callback function execution console errors.*

---

## Phase 4 — AI Memory System (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Manual memory entry
- [x] Automatic memory detection via AI
- [x] Memory injected into all system prompts
- [x] Memory Dashboard in Settings (including inline edit and clear all memories)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: State a fact in a chat (e.g., "I prefer coding in TypeScript") with auto-memory toggled on.
  * **Expected Output**: Trigger a memory commit on keyword match and add a key-value entry to `gemma_memories`.
  * **Status**: `[x] Passed`
* **Test Case 2**: View, edit, and delete a memory inside the Memory Dashboard in Settings.
  * **Expected Output**: Entry is edited inline or removed immediately and no longer appears in future prompts.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Auto-detection has a minor delay depending on network prompt speed, but successfully saves parameters without bloating localStorage. Dashboards now feature robust inline CRUD.*

---

## Phase 5 — Custom Assistants / GPTs (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Unlimited custom assistant creation (no paywall)
- [x] Built-in featured assistants (Gemma Dev Pro, etc.)
- [x] Explore GPTs modal
- [x] Starter prompts & custom temperature per assistant

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Open the "Explore GPTs" modal and click on a featured assistant.
  * **Expected Output**: Initializes a new chat with correct assistant instructions, emoji avatar, and loads starter prompts in empty state.
  * **Status**: `[x] Passed`
* **Test Case 2**: Create a custom assistant with a specific temperature and starter prompts.
  * **Expected Output**: Assistant is saved to `gemma_chat_custom_gpts` and acts according to the instructions and temperature limits.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Tested custom temperatures successfully. Avatar background rendering is fluent and error-free.*

---

## Phase 6 — Conversation Search (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Full-text search across chat titles and message contents
- [x] Multi-filter search modal
- [x] Click result to jump directly to that session

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Search for a keyword that appears in chat message contents.
  * **Expected Output**: Matches are displayed with text snippets highlighting the keyword.
  * **Status**: `[x] Passed`
* **Test Case 2**: Filter search by a specific project and date range.
  * **Expected Output**: Search results refine instantly to match criteria.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Jump-to-session functionality is extremely robust and scrolls to the matched message automatically. Shortcuts open it instantly (`Ctrl+Shift+F`).*

---

## Phase 7 — Prompt Library (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Personal prompt library (localStorage)
- [x] Pre-built template collection (including SEO & Business templates)
- [x] Favorites, search, and category tabs
- [x] Inject to chat functionality
- [x] Inline edit custom prompt templates

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Click the "Inject" button on a template card.
  * **Expected Output**: Injects the template contents directly into the active chat textarea input.
  * **Status**: `[x] Passed`
* **Test Case 2**: Toggle a prompt as favorite.
  * **Expected Output**: Instantly appears under the "Favorites" category tab.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *SEO & Business prebuilt cards provide useful starting points. Inline CRUD handles custom prompts elegantly.*

---

## Phase 8 — Export & Data Portability (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Markdown export
- [x] Plain text export
- [x] Print to PDF with Markdown rendering via marked.js
- [x] Full workspace JSON backup/restore

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Click "Export as Markdown".
  * **Expected Output**: File downloads immediately with formatted headings, code blocks, and lists completely intact.
  * **Status**: `[x] Passed`
* **Test Case 2**: Export entire workspace and restore it on another device/browser using the JSON file.
  * **Expected Output**: Re-populates chat sessions, settings, memories, custom GPTs, and projects successfully and reloads page.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Backup exports compile all local keys into one JSON object. Restore parses it atomic-style and triggers instant browser refresh.*

---

## Phase 9 — Workspace Organization (Pending)

**Status Summary**: `[ ]` Pending

#### 1. Implementation Tasks
- [ ] Folder sidebar section
- [ ] Drag-and-drop chat organization
- [ ] Folder archiving

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Create a folder in the sidebar and drag a chat into it.
  * **Expected Output**: Folder updates its list and the chat changes parent association in localStorage.
  * **Status**: `[ ] Pending`

#### 3. Testing Notes & Issues Found
- *Not yet implemented. Scheduled for Phase 9.*

---

## Phase 10 — Multi-Provider AI Support (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Gemini model switching (working)
- [x] OpenAI provider integration
- [x] Anthropic Claude integration
- [x] OpenRouter unified API
- [x] Groq fast inference integration
- [ ] Ollama local model support (Planned)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Select a specific model within the active provider (e.g., Gemini 2.5 Pro vs Gemini 2.5 Flash).
  * **Expected Output**: Chat headers and prompt payloads adapt instantly for subsequent messages.
  * **Status**: `[x] Passed`
* **Test Case 2**: Toggle to another provider (e.g., Claude).
  * **Expected Output**: Interface updates model selectors and routes requests to the Claude route with correct keys.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Multi-provider stream routing utilizes high-efficiency SSE readers to translate delta blocks to raw client-safe chunks.*

---

## Phase 11 — Settings & Personalization (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] Theme selection (light/dark/system toggle with prefers-color-scheme)
- [x] Temperature control slider
- [x] AI persona selection
- [x] Custom system prompt
- [x] API key management (multi-provider key grid + validation ping)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Change temperature slider and verify response variance.
  * **Expected Output**: Low temperature yields high determinism, high yields high creativity.
  * **Status**: `[x] Passed`
* **Test Case 2**: Set custom system prompt and start chat.
  * **Expected Output**: AI respects prompt guidelines.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Themes support Claude, Midnight Purple, Cyberpunk Neon, and Forest Green styles.*

---

## Phase 12 — Multimodal Features (Partially Completed & Tested)

**Status Summary**: `[/]` In Progress

#### 1. Implementation Tasks
- [x] Image upload and analysis (via Gemini Vision)
- [x] File context injection (text files, code)
- [x] Voice Mode overlay (Web Speech API)
- [ ] PDF deep intelligence (Planned)
- [ ] DOCX / XLSX / CSV document analysis (Planned)
- [ ] Image generation (Planned)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Upload a `.png` image or paste from clipboard into chat and ask "What is this image?".
  * **Expected Output**: Gemini Vision successfully parses and describes the image.
  * **Status**: `[x] Passed`
* **Test Case 2**: Speak into the Voice Mode microphone and click triggers.
  * **Expected Output**: Transcribes spoken speech accurately into the text input bar.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Image upload and transcription are completely operational. PDF and Office document parsing are planned.*

---

## Phase 13 — Advanced AI Features (Pending)

**Status Summary**: `[ ]` Pending

#### 1. Implementation Tasks
- [ ] Web research + citation
- [x] Code execution sandbox (Sandpack integration - working)
- [ ] File creation and download from code output (Planned)
- [ ] Multi-step agentic tasks (Planned)

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Trigger code generation inside the chat box.
  * **Expected Output**: Code blocks render inside the Sandpack iframe and execute dynamically on screen.
  * **Status**: `[x] Passed`
* **Test Case 2**: Trigger a multi-step web research query.
  * **Expected Output**: System fetches search API and presents dynamic cited summaries.
  * **Status**: `[ ] Pending`

#### 3. Testing Notes & Issues Found
- *In-chat Sandpack multi-file execution sandbox works flawlessly. Web research grounding is planned.*

---

---

## Phase 18 — Local Codebase Reader (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] File System Access API folder picker
- [x] Recursive subfolder traversal (including deeply nested files)
- [x] IndexedDB file content caching with freshness detection
- [x] Framework detection and project summary generation
- [x] Smart keyword file grounding per message
- [x] Chat with Codebase toggle
- [x] Codebase Explorer side panel with file tree, search, and attach toggle
- [x] Re-authorization flow for page reloads

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Select a local Next.js project folder and wait for indexing.
  * **Expected Output**: Progress bar runs, all files (including nested) are cached, framework detected as 'Next.js'.
  * **Status**: `[x] Passed`
* **Test Case 2**: Ask the AI about a file in a deeply nested subfolder.
  * **Expected Output**: AI correctly references the nested file content.
  * **Status**: `[x] Passed`
* **Test Case 3**: Reload the page and verify re-authorization prompt appears.
  * **Expected Output**: Banner shown; clicking re-grants access without re-scanning.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *Critical bug fixed: recursive scan silently skipped subdirectory contents. Fixed by calling `dirHandle.getDirectoryHandle(entry.name)` explicitly.*

---

## Phase 19 — GitHub Public Repo Reader (Completed & Tested)

**Status Summary**: `[x]` Completed & Tested

#### 1. Implementation Tasks
- [x] GitHub REST API integration (no OAuth required)
- [x] URL parsing for `owner/repo` extraction
- [x] Default branch auto-detection
- [x] Recursive tree fetch and filtering
- [x] Batched file content fetching (5 concurrent)
- [x] Binary and build artifact exclusion
- [x] Framework detection from `package.json`
- [x] Repo summary injection into system prompt
- [x] Keyword-matched file injection per message
- [x] Side panel with folder tree, file search, and expand/collapse
- [x] Optional Personal Access Token (PAT) support
- [x] Connection status badge in toolbar
- [x] Disconnect functionality

#### 2. Test Cases & Verification Plan
* **Test Case 1**: Paste `https://github.com/akkichaubey/ai-chat` and click Read Repository.
  * **Expected Output**: Repo indexed, framework detected as 'Next.js', expandable file tree in panel.
  * **Status**: `[x] Passed`
* **Test Case 2**: Ask the AI about a specific file in the repo.
  * **Expected Output**: AI explains the file using cached content.
  * **Status**: `[x] Passed`
* **Test Case 3**: Disconnect and confirm AI no longer has repo context.
  * **Expected Output**: All cached files cleared, repo summary removed from prompt.
  * **Status**: `[x] Passed`

#### 3. Testing Notes & Issues Found
- *No issues found. `atob()` decoding handles base64 GitHub API responses correctly. Batched requests respect rate limits.*

---

## Launch MVP Checklist

### Core (No-Login, Local-First)

- [x] API Key management (Multi-provider key grid + validate key pings)
- [x] Chat creation, rename, delete, pin
- [x] Persistent chat history (localStorage)
- [x] Projects with context injection
- [x] AI Memory system (manual + automatic + Dashboard CRUD)
- [x] Custom Assistants / GPTs (with starter prompts + temperature)
- [x] Global conversation search
- [x] Prompt Library with templates (including SEO & Business categories)
- [x] Export (Markdown, TXT, Print/PDF)
- [x] Voice Mode (Web Speech API)
- [x] Code Sandbox (Sandpack)
- [x] File and image attachments
- [x] Dark/Light/System theme toggles
- [x] Mobile responsive design
- [x] Thinking Mode (deep reasoning)
- [x] Web Search grounding
- [x] Special Skills (Debugger, UX Inspector, Language Tutor)
- [x] Model switching (Gemini, OpenAI, Claude family)
- [x] Workspace JSON backup/restore
- [x] Keyboard shortcuts (Ctrl+N, Ctrl+,, Ctrl+K, Ctrl+Shift+F, Escape)
- [x] Local Codebase Reader (File System Access API + IndexedDB + Codebase Explorer panel)
- [x] GitHub Public Repo Reader (GitHub REST API + 🐙 side panel)
- [x] 9-layer AI context injection pipeline
- [x] Explore GPTs & Prompt Library sidebar quick-access buttons

### In Progress

- [ ] Folder workspace organization
- [ ] Ollama local model support

### Planned

- [ ] Docker self-hosting
- [ ] Image generation (Nano Banana + Gemini Imagen 3)
- [ ] Deep research mode
- [ ] PDF / DOCX / CSV document intelligence
- [ ] Advanced Voice Mode (barge-in, real-time)
- [ ] Gemini Live real-time voice API
- [ ] Google Workspace AI side panel (Chrome extension)
- [ ] File creation and download from code interpreter
