# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned

- Folder workspace organization (Phase 9)
- Ollama local model support (Phase 10 & 14)
- Docker self-hosting (Phase 14)
- Image generation — Nano Banana + Gemini Imagen 3 (Phase 16)
- Deep research mode (Phase 13)
- PDF / DOCX / CSV document intelligence (Phase 12)
- Advanced Voice Mode with barge-in (Phase 15)
- Gemini Live real-time voice API (Phase 15)
- Google Workspace AI side panel — Chrome extension (Phase 17)
- File creation and download from code interpreter (Phase 13)

---

## [V1.0] — 2026-06-06

### Added — Local AI Project Features (Phases 18–19)

#### Local Codebase Reader ✅
- File System Access API folder picker — select any local project folder from the browser
- Full recursive subfolder traversal including all nested directories
- IndexedDB file content caching with freshness detection (lastModified + size comparison)
- Framework auto-detection: Next.js, React, Vue, Laravel, Django, Express, NestJS, etc.
- Smart keyword-based file grounding — matches relevant files to each user query
- "Chat with Codebase" toggle mode — always include full file context in every message
- Codebase Explorer side panel with file tree, folder expand/collapse, file search, and attach toggle
- Real-time indexing progress bar with file count
- File attachment chips — manually pin specific files into AI context
- Re-authorization banner prompts user to re-grant folder access after page reload
- Supports `.ts .tsx .js .jsx .php .py .go .rs .html .css .json .md .sql .yaml .toml .graphql` and all major source file types

#### GitHub Public Repo Reader ✅
- Connect any public GitHub repository by pasting its URL (e.g. `https://github.com/owner/repo`)
- Auto-detects repo default branch via GitHub REST API
- Fetches full recursive file tree (up to 150 files, 512 KB limit per file)
- Excludes `node_modules`, build artifacts, binary files, lock files automatically
- Batched file content fetching (5 concurrent requests, rate-limit respectful)
- Framework detection from `package.json`
- Builds compact codebase summary injected into every AI message
- Smart keyword-matched file injection per user query
- Side panel with folder expand/collapse tree and file search
- Optional Personal Access Token (PAT) field to increase rate limits to 5,000 req/hr
- 🐙 toolbar button with green dot badge showing live connection status
- One-click disconnect to clear all repo context

#### AI Context Injection Pipeline ✅
- Unified 9-layer context pipeline in `useChatStore.ts`
- Layer order: Base Prompt → Project Instructions → Local Codebase → GitHub Repo → GitHub Profile → AI Memory → Writing Style → AI Skill → Sandbox Format

#### Sidebar Navigation Updates ✅
- Added "Explore GPTs" button with Compass icon to sidebar (visible in both expanded and collapsed states)
- Added "Prompt Library" button with Sparkles icon to sidebar (visible in both expanded and collapsed states)

#### State Management
- All stores migrated to **Zustand**
- New `useGitHubRepoStore` store for GitHub repo reader state and file cache
- `useSettingsStore` extended with `githubUsername` and `githubToken` fields
- New `src/app/lib/githubFetcher.ts` utility for GitHub public profile data fetching

### Fixed
- **Critical**: Local codebase recursive scan was silently skipping all files inside subdirectories — fixed by using `dirHandle.getDirectoryHandle(entry.name)` instead of passing raw `.values()` iterator entry as a directory handle

---

## [MVP] — 2026

### Added — Core Platform (Phases 0–11)

#### Foundation (Phase 0)
- Project scaffolding with Next.js 16 + TypeScript
- localStorage data layer — all data stays on the user's device
- Design system: dark/light/system mode, themes, typography
- API route proxy for Gemini (thin layer, no auth, no storage)

#### API Key Management (Phase 1)
- Multi-provider key management console (Gemini, OpenAI, Claude, OpenRouter, Groq)
- Obfuscated password-style inputs
- Active key indicators and verify connection ping

#### Chat Persistence (Phase 2)
- Persistent chat history via `localStorage`
- Chat sidebar with chronological groups: Pinned / Today / Yesterday / Last 7 Days / Last 30 Days / Older
- Create, rename, delete, and pin conversations
- Auto title generation (AI generates 3–4 word title from first message)

#### Projects (Phase 3)
- Project workspaces with name, description, and system instructions
- Chat assignment to projects via context menu
- Direct new chat creation inside a project workspace (plus icon triggers)
- Collapsible sidebar nested project chat list rendering
- Resolved option dropdown menu clipping inside project item wrappers
- Automatic instruction injection into all AI prompts within a project

#### AI Memory System (Phase 4)
- Manual memory entry — user explicitly saves facts
- Automatic memory detection — AI identifies preference signals from messages
- Memory categories: Personal, Technical, Business
- Memory Dashboard in Settings — view, edit (inline CRUD), delete, clear all
- All memories injected into system prompts across all conversations

#### Custom Assistants / GPTs (Phase 5)
- Unlimited custom assistant creation (no paywall)
- Configuration: name, emoji, avatar color, system prompt, temperature, starter prompts
- Built-in featured assistants: Gemma Dev Pro, Creative Copywriter, Product Strategist, Academic Coach
- Explore GPTs modal
- Starter prompts displayed on assistant card

#### Conversation Search (Phase 6)
- Full-text search across all chat titles and message content
- Filter by project, date range, and assistant type
- Click result to jump directly to that chat session
- Keyboard shortcut (`Ctrl+Shift+F`) opens it instantly

#### Prompt Library (Phase 7)
- Personal prompt library stored in `localStorage`
- Categories: Development, Writing & Copy, Marketing, SEO, Business, Custom, Favorites
- Favorites, search, category tabs
- One-click inject directly into active chat input
- Inline edit custom templates

#### Export & Data Portability (Phase 8)
- Markdown (.md) export with headers and formatting
- Plain text (.txt) export for archiving
- Print to PDF via browser print dialog, rendered beautifully via marked.js
- Workspace JSON export backup and import restore

#### Multi-Provider AI Support (Phase 10)
- Seamless POST proxy router supporting Gemini, OpenAI, Claude, OpenRouter, and Groq streams.
- Unified SSE buffer readers translate provider deltas to clean plain-text streams.
- Added support for new OpenAI models: GPT-5.5, GPT-5.4, and GPT-5.4-mini.
- Enhanced the model selection dropdown into a premium, card-based interface detailing model providers and descriptions.

#### Settings & Personalization (Phase 11)
- Theme selection: Default, Claude, Midnight, Cyberpunk, Forest Green.
- Dynamic appearance switcher: Light, Dark, System (prefers-color-scheme listener).
- Mapped global keyboard shortcuts (Ctrl+N, Ctrl+,, Ctrl+/, Ctrl+K, Ctrl+Shift+F, Escape).
- Temperature control sliders.
- AI persona selection & custom system prompts.
- Web search grounding & Thinking mode toggles.

### Added — Multimodal (Phase 12, Complete)
- Image upload and analysis via Gemini Vision
- Clipboard paste support for screenshots
- Visual drag-and-drop overlay zone
- File context injection (text files, code files)
- Voice Mode overlay using Web Speech API (text-to-speech + speech-to-text)
- **Interactive Claude-like Artifacts System**:
  - Automatically identifies filenames and file structures from code comments using Regex.
  - Collapses large blocks (> 12 lines) or annotated files into sleek, horizontal Artifact Cards in the message feeds.
  - Cards support inline expand chevrons, quick copy-to-clipboard, and click actions to open the side-over workspace drawer.
  - Side-over workspace panel split into tabbed modes: **Code** (full-height syntax highlights + line numbers) and **Preview** (Sandpack execution).
  - Multi-file preview support for React/HTML sandboxes and auto-collapsing drawer for non-runnable files.
  - One-click native file downloading directly from the workspace header toolbar.
  - Re-anchored rendering via React Context prevents sandbox state reset or card collapse during viewport scrolling.
- **Premium Image Lightbox Viewer**:
  - Full-screen carousel modal for image attachments triggered by thread clicks.
  - Keyboard navigation (`ArrowRight`/`ArrowLeft`/`Escape`), touch swipes, and drag gestures.
  - Wheel and pinch-to-zoom (up to 4x scaling) with drag-panning capabilities.
- **Code Block Readability Overrides**:
  - Fixed syntax highlight text colors, enforcing unhighlighted words and variables (like `React`, `name`, `email`, `e`, etc.) to match current themes dynamically (e.g. `var(--text-primary)`).
  - Added style tokens for HTML attributes, CSS units, JS/TSX types/parameters, Python builtins, Markdown header tags, and JSON/YAML keys.
- Mobile responsive design optimizations

---

## Versioning Plan

| Version | Milestone Description |
|---------|----------------------|
| MVP     | All Phase 0–11 complete + Gemini, OpenAI, Claude, Router, Groq providers |
| V1      | Unified Folder organization + local Docker packaging |
| V1.1    | Image generation + PDF/DOCX intelligence |
| V1.2    | Advanced Voice Mode + Gemini Live |
| V2      | Deep research + code interpreter + offline Ollama |
| V2.1    | Google Workspace side panel extension |

---

## Privacy Commitment

> **Unchanged since launch**: This application stores zero user data on any server. All conversations, settings, API keys, memory, projects, and preferences live exclusively in your browser's `localStorage` on your own device. The only network requests made are directly to your chosen AI provider using your own API key.
