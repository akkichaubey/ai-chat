<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## State Management

All state is managed via **Zustand** stores in `src/app/store/`:

| Store | Purpose |
|-------|---------|
| `useChatStore` | Chat sessions, messages, streaming, 9-layer AI context injection |
| `useSettingsStore` | API keys, model, persona, temperature, theme, githubUsername |
| `useProjectStore` | Projects, AI memory bank |
| `useLocalProjectStore` | Local codebase (File System Access API + IndexedDB) |
| `useGitHubRepoStore` | GitHub public repo reader (REST API + in-memory cache) |
| `useUsageStore` | Daily request/token usage limits |
| `useModelMonitorStore` | Model health check pings |

## Key Features to Be Aware Of

- **Local Codebase Reader**: `useLocalProjectStore` uses the File System Access API + IndexedDB. Never confuse `entry` from `.values()` iterator with a `FileSystemDirectoryHandle` — always call `dirHandle.getDirectoryHandle(entry.name)` explicitly.
- **GitHub Repo Reader**: `useGitHubRepoStore` fetches public repo trees/files via GitHub REST API. Files cached in-memory only (session-scoped).
- **Context Injection**: `useChatStore.triggerStreaming()` assembles a 9-layer system prompt. Modifying prompt assembly must preserve layer order.
- **Storage**: `localStorage` for chat/settings, `sessionStorage` for settings fallback, `IndexedDB` for large file caches.
