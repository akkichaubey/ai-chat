# Architecture

> **Design Philosophy**: All application state is managed client-side. No backend database is used. The server acts as a thin, stateless proxy to AI provider APIs — it never stores or reads user data.

---

## System Overview

```text
┌────────────────────────────────────────────────────────┐
│                    User Browser                        │
│                                                        │
│   ┌──────────────┐    ┌──────────────────────────┐    │
│   │  React / UI  │◄──►│   localStorage (all data) │    │
│   └──────┬───────┘    └──────────────────────────┘    │
│          │                                             │
│          ▼                                             │
│   ┌──────────────┐                                     │
│   │ Next.js API  │  (thin proxy — no storage)          │
│   │    Routes    │                                     │
│   └──────┬───────┘                                     │
│          │                                             │
└──────────┼─────────────────────────────────────────────┘
           │
           ▼
   ┌───────────────┐
   │  AI Provider  │  (Gemini / OpenAI / Claude / etc.)
   └───────────────┘
```

---

## Data Flow

```text
User Browser
  └─ localStorage
       ├─ api_keys          (per-provider API keys)
       ├─ chat_sessions     (all conversations)
       ├─ messages_map      (all messages per session)
       ├─ projects          (workspace projects)
       ├─ memories          (AI memory bank)
       ├─ custom_gpts       (custom assistants)
       ├─ custom_prompts    (prompt library entries)
       ├─ favorite_prompts  (favorited prompt IDs)
       └─ settings          (theme, temperature, persona, etc.)
  └─ IndexedDB
       ├─ project_directories  (FileSystemDirectoryHandle per project)
       └─ file_contents        (cached file content by projectId:path)
  └─ In-Memory (session only)
       └─ GitHub repo files    (useGitHubRepoStore — cleared on page reload)
```

---

## Frontend Architecture

### Framework

- **Next.js 16** with App Router
- **React 19** for UI components
- **TypeScript** throughout

### UI Layer

- **shadcn/ui** — component library built on Radix UI primitives
- **Tailwind CSS v4** — utility-first styling
- All components are client-side rendered (no SSR for user data)

### State Management

- **Zustand** — all persistent and ephemeral state managed via Zustand stores
- **localStorage** — chat sessions, messages, projects, memories, custom GPTs, prompts, settings
- **IndexedDB** — large local codebase file content (via `useLocalProjectStore`)
- **In-memory** — GitHub repo file cache (via `useGitHubRepoStore`, session-only)
- React hooks manage local UI state (modal open/close, input values, etc.)

### Zustand Stores

| Store | Responsibility |
|-------|----------------|
| `useChatStore` | Chat sessions, messages, streaming, 9-layer AI context injection |
| `useSettingsStore` | API keys, model, persona, temperature, theme, GitHub username |
| `useProjectStore` | Projects, AI memory bank |
| `useLocalProjectStore` | Local codebase (File System Access API + IndexedDB cache) |
| `useGitHubRepoStore` | GitHub public repo reader (REST API + in-memory cache) |
| `useUsageStore` | Daily request/token usage tracking |
| `useModelMonitorStore` | Model health check pings |

---

## Backend Architecture

### Next.js API Routes (Proxy Only)

The server does **not**:
- Store any user data
- Read API keys (passed directly from client)
- Authenticate users
- Log conversations

The server **only**:
- Forwards streaming requests to AI providers
- Handles CORS and request proxying

### Why a Proxy?

- Prevents browser CORS issues with AI provider APIs
- Allows future rate-limiting or abuse prevention without touching client code
- Optional: can be replaced by direct client-to-provider calls for fully serverless mode

---

## AI Provider Integration

### Request Flow

```text
User types message
  → Client reads active API key from localStorage
    → POST /api/chat with { message, key, provider, model }
      → Next.js route forwards to provider (e.g., Gemini API)
        → Streams response back to client
          → Client renders tokens as they arrive
```

### Provider Abstraction

A unified provider interface normalizes differences between APIs:

```typescript
interface AIProvider {
  name: string;
  sendMessage(params: ChatParams): AsyncIterable<string>;
  listModels(): Promise<Model[]>;
  validateKey(key: string): Promise<boolean>;
}
```

---

## AI Context Injection Pipeline

Every AI message passes through a 9-layer context injection pipeline in `useChatStore.ts`:

```text
1. Base System Prompt        — session or global settings persona
2. Project Instructions      — workspace-specific instructions (if in a project)
3. Local Codebase Context    — indexed files via IndexedDB (if local folder connected)
4. GitHub Repo Context       — summary + keyword-matched files (if GitHub repo connected)
5. GitHub Profile Context    — developer profile data (if username configured in settings)
6. AI Memory Bank            — user facts and preferences committed to memory
7. Writing Style Guide       — Concise / Formal / Explanatory / Learning
8. AI Skill Mode             — Code Debugger / UI Inspector / Language Tutor
9. Sandbox Format            — multi-file artifact output format instructions
```

This pipeline ensures every AI response is maximally context-aware without the user needing to re-explain their project on every message.

---

## Local AI Project Workspace Architecture

> The Local AI Workspace is a separate product mode that works directly with local file systems.

### Core Promise

A fully local, privacy-first AI coding environment. No login. No cloud. No Git required.

### Guiding Principles

| Principle        | What it means                                      |
|------------------|----------------------------------------------------|
| Local-first      | All data stays on your machine — no uploads, no sync |
| No login         | Open and use immediately, zero account required    |
| Bring your own key | User provides their own AI API key               |
| No Git / GitHub  | Works directly with plain folders                  |
| Unlimited projects | Open as many projects as you need              |
| Privacy by design | Nothing leaves your device without your explicit action |

### Project Intelligence Flow

```text
Open local folder
  → Scan entire folder tree
    → Read and parse all source files
      → Build semantic index of codebase
        → Detect dependencies and architecture patterns
          → Map relationships and imports between files
            → AI has full codebase context for queries
```

### AI Coding Modes

| Mode       | What it does                                                       |
|------------|--------------------------------------------------------------------|
| Chat       | Answers questions. Reads code. Never writes.                       |
| Edit       | Modifies only the files you select. Shows diff. Requires approval. |
| Agent      | Completes multi-step tasks across files. Shows plan first.         |
| Autonomous | Full cycle: Read → Plan → Edit → Build → Test → Verify → Done     |

### Safe Edit Workflow

> No file is ever modified without explicit user approval.

1. AI shows a plain-language explanation of what will change
2. Side-by-side diff preview of every modified file
3. List of all affected files
4. User reviews and approves (or rejects) before anything is written
5. Changes applied atomically — all succeed or none do

### Auto-Fix Loop

```text
Scan project
  → Detect issue
    → Analyse root cause
      → Generate fix
        → Preview fix (user approves)
          → Apply changes
            → Run build / lint / test
              → Verify success
                → Repeat for remaining issues
```

### Rollback & Snapshot System

- Before any AI edit is applied, an automatic local snapshot is created
- Snapshots stored in `.workspace/snapshots/` folder
- Each snapshot records which files changed and the full diff
- Every AI-generated change is snapshotted before applying
- Rollback is instant — no network, no Git history required
- Snapshots compressed and kept for 30 days (configurable)

---

## Security Architecture

### API Key Security

- Keys stored in `localStorage` — never transmitted to the application server
- All AI requests go directly from browser → Next.js proxy → AI provider
- The proxy does not log, cache, or inspect key values
- Optional: AES encryption of stored keys using a user-defined PIN

### Data Privacy

- Zero server-side storage of any user data
- No analytics, no telemetry, no tracking
- Self-hostable — users can run their own isolated instance

### Content Security

The Security Agent scans for:
- Hardcoded API keys, tokens, passwords in source files
- Unsafe `eval()` or `dangerouslySetInnerHTML` usage
- Unvalidated user input passed to queries
- Dependency vulnerabilities (via local audit)
- Overly permissive CORS or CSP configurations

---

## Deployment Architecture

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment details.

```text
Options:
  1. Vercel (zero-config, recommended for hosted version)
  2. Docker (self-hosted, single command)
  3. Node.js server (manual self-hosting)
  4. Static export (limited — no API proxy)
```

---

## Supported File Types (Local Workspace)

```text
TypeScript · JavaScript · TSX · JSX · HTML · CSS · SCSS ·
JSON · YAML · Markdown · Python · Java · Go · Rust · PHP · C# · C++
```

## Framework Auto-Detection

```text
Next.js · React · Vue · Nuxt · Angular · Express · NestJS ·
Node.js · FastAPI · Django · Laravel · Spring Boot
```
