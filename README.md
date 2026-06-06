# AI Chat — Privacy-First BYOK Platform

> **Product Vision**: Build a fully open, self-hostable, bring-your-own-key (BYOK) AI chat platform using Next.js + Tailwind + Gemini (and other providers). No login required. No accounts. No subscriptions. Just bring your API key and start chatting.

> **Design Philosophy**: Privacy-first, local-first, and completely free to use. All data is stored on the user's own device. The application works offline-capable and requires zero backend authentication. Users are in full control of their data and API keys at all times.

---

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install` or `pnpm install`
3. Copy `.env.local.example` to `.env.local` (optional — add a fallback Gemini key)
4. Run: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser
6. Paste your own API key in Settings → AI Provider & API Key

> No database setup. No account creation. No environment variables required to get started.

---

## Tech Stack

### Frontend

- **Next.js 16** — App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Custom styling** — inspired by Linear, Notion, Vercel, and ChatGPT

### Backend

- **Next.js API Routes** — thin proxy layer only
- No user database required (100% localStorage + IndexedDB)

### Storage

- **Browser `localStorage`** — all chat history, settings, projects, memory, prompts, and API keys stored locally on the user's device
- **IndexedDB** — used for large local codebase file caching (via File System Access API)
- No cloud database dependency

### AI Providers (BYOK)

| Provider          | Status       | Key Source              |
| ----------------- | ------------ | ----------------------- |
| Google Gemini     | ✅ Working   | aistudio.google.com     |
| OpenAI            | ✅ Working   | platform.openai.com     |
| Anthropic Claude  | ✅ Working   | console.anthropic.com   |
| OpenRouter        | ✅ Working   | openrouter.ai           |
| Groq              | ✅ Working   | console.groq.com        |
| Ollama (local)    | 🔜 Planned   | localhost:11434         |

### Deployment

- **Vercel** (optional — can be fully self-hosted)
- **Docker** support planned

---

## UI Design System

> Built with a high-fidelity SaaS-quality style inspired by Linear, Notion, ChatGPT, Claude, and Vercel. Custom CSS design tokens manage layout components, transitions, and multiple color themes.

### Theme System

- **Light Mode** — clean, high-contrast, professional
- **Dark Mode** — deep dark, easy on the eyes, AMOLED-friendly (default)
- **System Mode** — automatically follows OS preference
- Theme resolves instantly before hydration to avoid light flashes
- **5 Custom Color Themes**: Default Slate, Warm Sandstone Charcoal, Midnight Cosmic Purple, Cyberpunk Neon, and Forest Emerald Green.

### Typography

- Modern typography scales using system sans-serif (`Inter`) and monospace (`Geist Mono` for code blocks).
- Syntax highlighting powered by `Prism` renderer.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Create a new chat session |
| `Ctrl + ,` | Open the Settings Modal |
| `Ctrl + /` | Toggle Sidebar panel |
| `Ctrl + K` | Toggle Sidebar panel |
| `Ctrl + Shift + F` | Open global full-text search |
| `Escape` | Close any open modal / Cancel voice mode |
| `Enter` | Send message |
| `Shift + Enter` | Create a newline in chat input |

---

## Core Features (Implemented ✅)

### 💬 Chat & AI
- 🔑 **Multi-Provider BYOK API Keys** — Grid picker for Gemini, OpenAI, Claude, OpenRouter, and Groq with live connection validate pings.
- 💬 **Chat Persistence** — Chronologically grouped conversations saved locally in `localStorage`.
- 🧠 **AI Memory System** — Auto keyword-fact commit + manual memory entries + inline Memory Bank dashboard editor.
- 🌐 **Web Search Grounding** — AI can search the web in real time using Google Search grounding.
- 💡 **Writing Styles** — Concise, Formal, Explanatory, and Learning style guides injected into system prompt.
- 🛠️ **AI Skills** — Code Debugger, UI/UX Inspector, and Language Tutor specialist modes.
- 🔄 **Regenerate / Edit Messages** — Re-send or edit any message inline without losing context.
- ⛔ **Stop Generation** — Cancel streaming response mid-generation.
- 🧪 **Extended Thinking** — Toggle deep reasoning mode (Gemini 2.5 / Claude).

### 🤖 Custom GPTs & Prompt Library
- 🤖 **Custom Assistants / GPTs** — Create custom agents with avatar, emoji, custom temperature, starter prompts, and system instructions.
- 📚 **Prompt Library** — Curated templates across categories (SEO, Business, Code, Creative), with favorites, inline editing, and one-click inject.
- 🧭 **Explore GPTs** — Browse and launch any configured custom agent from sidebar.

### 📁 Projects & Local Codebase
- 📁 **Projects** — Group chat threads with custom workspace system instructions per project.
- 🗂️ **Local Codebase Reader** — Connect any local project folder via the File System Access API (browser-native, no upload). The AI reads all source files and builds intelligent codebase context automatically.
  - Full recursive directory traversal with nested subfolder support
  - Automatic IndexedDB caching with freshness detection (lastModified + size)
  - Framework auto-detection (Next.js, React, Vue, Laravel, etc.)
  - Smart keyword-based file grounding on each message
  - Real-time indexing progress bar
  - Codebase Explorer side panel with file tree, file search, and attach-to-message toggle
  - "Chat with Codebase" mode for full file-grounded responses
  - Reads `.php`, `.ts`, `.tsx`, `.js`, `.py`, `.css`, `.json`, `.md`, and more

### 🐙 GitHub Public Repo Reader
- 🐙 **GitHub Repo Reader** — Paste any public GitHub repo URL (e.g. `https://github.com/owner/repo`) and the AI reads the entire codebase directly from GitHub's REST API.
  - Auto-detects default branch
  - Fetches full recursive file tree
  - Excludes binary files, build artifacts, and `node_modules` automatically
  - Batched file content fetching (respects GitHub rate limits)
  - Framework detection from `package.json`
  - Builds compact codebase summary injected into every AI message
  - Smart keyword-matched file injection per query
  - Side panel with folder expand/collapse tree and file search
  - Optional Personal Access Token (PAT) for higher rate limits
  - Green dot badge on toolbar button when repo is connected

### 🎙️ Voice & Media
- 🎙️ **Voice Mode Overlay** — Full-screen waveform voice chat with sentence queue, autostart, and TTS playback.
- 🗣️ **Speech-to-Text Input** — Click the mic button in the chat input to dictate messages (Web Speech API).
- 📸 **Screenshot Capture** — Capture your screen and attach as image to a message.
- 🖼️ **Image Lightbox Carousel** — Full-screen viewer for image attachments with keyboard navigation, touch swipes, pinch-to-zoom (up to 4×), and drag-pan.

### 💻 Code & Artifacts
- 📦 **Interactive Artifacts & Code Sandbox** — Claude-style collapsible Artifact Cards, multi-file project support, side split drawer with Code/Preview tabs, file downloads, and in-chat Sandpack execution (HTML/JS/React/CSS).
- ⬇️ **Code Download** — Download any code block or artifact file to disk.
- 📋 **Copy / Speak** — Copy any message to clipboard or listen with TTS narration (auto Hindi voice detection).

### 📤 Export & Backup
- 📤 **Export Chat** — Export any conversation as Markdown (`.md`) or plain text (`.txt`).
- 🖨️ **Print / PDF** — Print chat thread or save as PDF via the browser print dialog.
- 🔄 **Full Workspace Backup / Restore** — JSON export/import of all sessions, messages, memories, projects, custom GPTs, and settings.

### 🔍 Search & Navigation
- 🔍 **Global Conversation Search** — Full-text search across all session titles and message content with instant results.
- 📌 **Pin Conversations** — Pin important sessions to the top of the sidebar.
- 🗑️ **Session Management** — Rename, delete, pin, and move conversations between projects.

### ⚙️ Settings & Usage
- ⚙️ **Settings Control Center** — Tabbed modal for General settings, AI Memory Bank, and Usage Limits & Stats.
- 📊 **Usage Tracking** — Daily request and token usage tracking with configurable daily limits and reset controls.
- 🌗 **Appearance Modes** — Dark, Light, and System modes with instant switching.
- 🎨 **5 Color Themes** — Switch between curated color themes without page reload.
- 💾 **AI Personas** — General, Creative Writer, Code Architect, and fully Custom system prompts.

---

## Architecture

```
src/
├── app/
│   ├── components/
│   │   ├── ChatArea.tsx           # Main chat UI, input, toolbar, and message renderer
│   │   ├── Sidebar.tsx            # Session list, project tree, search, nav buttons
│   │   ├── SettingsModal.tsx      # Settings tabs: General, Memory, Usage
│   │   ├── CodebaseExplorer.tsx   # Local project file tree side panel
│   │   ├── GitHubRepoPanel.tsx    # GitHub public repo reader side panel
│   │   ├── ExploreGptsModal.tsx   # Custom GPT browser modal
│   │   ├── PromptLibraryModal.tsx # Prompt template library modal
│   │   ├── SearchModal.tsx        # Global search modal
│   │   ├── VoiceModeOverlay.tsx   # Full-screen voice chat overlay
│   │   ├── ImageLightbox.tsx      # Full-screen image carousel viewer
│   │   └── ProjectModal.tsx       # Project create/edit modal
│   ├── store/
│   │   ├── useChatStore.ts        # Chat sessions, messages, streaming, AI context injection
│   │   ├── useSettingsStore.ts    # API keys, model, persona, theme, GitHub username
│   │   ├── useProjectStore.ts     # Projects, AI memory bank
│   │   ├── useLocalProjectStore.ts # Local codebase (File System Access API + IndexedDB)
│   │   ├── useGitHubRepoStore.ts  # GitHub public repo reader (REST API + in-memory cache)
│   │   ├── useUsageStore.ts       # Daily request/token usage tracking
│   │   └── useModelMonitorStore.ts # Model health check pings
│   ├── lib/
│   │   └── githubFetcher.ts       # GitHub profile data fetcher utility
│   ├── api/
│   │   ├── chat/route.ts          # AI streaming proxy (Gemini/OpenAI/Claude/Groq/Router)
│   │   ├── providers/route.ts     # Server-side provider availability check
│   │   ├── health-check/route.ts  # Model health ping endpoint
│   │   └── validate-key/route.ts  # API key validation endpoint
│   ├── page.tsx                   # Root page
│   └── layout.tsx                 # Root layout with theme injection
```

---

## AI Context Injection Pipeline

Every AI message goes through a multi-layer context injection pipeline in `useChatStore.ts`:

1. **Base System Prompt** — from session or global settings persona
2. **Project Instructions** — workspace-specific instructions if in a project
3. **Local Codebase Context** — indexed files via IndexedDB (if local folder connected)
4. **GitHub Repo Context** — summary + relevant files from connected public GitHub repo
5. **GitHub Profile Context** — developer profile data (if username set in settings)
6. **AI Memory Bank** — user facts and preferences committed to memory
7. **Writing Style Guide** — Concise / Formal / Explanatory / Learning
8. **AI Skill Mode** — Code Debugger / UI Inspector / Language Tutor
9. **Sandbox Format Instructions** — multi-file artifact output format

---

## Privacy Commitment

> This application stores **zero user data on any server**. All conversations, settings, API keys, memory, projects, and preferences live exclusively in your browser's `localStorage` and `IndexedDB` on your own device. The only network requests made are:
> - Directly to your chosen AI provider using your own API key
> - To the GitHub REST API when using the GitHub Repo Reader (using your optional PAT)
> - To the GitHub API for developer profile context (if username is configured)

---

## Contributing

Pull requests welcome. Please open an issue first to discuss any major changes.

## License

MIT
