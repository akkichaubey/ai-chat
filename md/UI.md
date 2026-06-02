# UI — Design System & Component Architecture

> **Design Philosophy**: The application is built with a high-fidelity SaaS-quality style inspired by Linear, Notion, ChatGPT, Claude, and Vercel. Layout primitives, custom grids, and interactive modules utilize utility classes to structure a fluid desktop and mobile workspace.

---

## Tech Foundation

| Layer | Library / Tool |
|-------|---------------|
| Framework | Next.js 16 (App Router) |
| Primitive Layer | React 19 Client components |
| Styling | Tailwind CSS v4 + custom tokens |
| Icons | Lucide React |
| Typography | Inter (body), system monospace (code) |
| Code Sandbox | Sandpack (`@codesandbox/sandpack-react`) |
| Markdown Parser | `react-markdown` + `remark-gfm` + `marked.js` (for print) |

---

## Theme & Appearance System

### Modes

| Mode | Behavior |
|------|----------|
| **Light** | Clean, high-contrast, professional white/gray palette. Handled by `.light-mode` class overrides. |
| **Dark** | Deep dark, AMOLED-friendly, reduced eye strain. (Default app shell style). |
| **System** | Listens to OS `prefers-color-scheme` preferences and adjusts dynamically. |

### System Mode Implementation

Dynamic detection listens for system changes at the runtime layer:

```typescript
const mq = window.matchMedia('(prefers-color-scheme: dark)');
applyMode(mq.matches);
const handler = (e) => applyMode(e.matches);
mq.addEventListener('change', handler);
```

### Color Theme Presets

- **Google AI Studio (Default)**: Deep midnight space colors.
- **Claude Charcoal**: Elegant slate and off-black tones.
- **Midnight cosmic Purple**: Vibrant indigo and nebula highlights.
- **Cyberpunk Neon**: Retro-futuristic bright yellow and teal accents.
- **Forest Green**: Soft botanical leaf-green variables.

---

## Typography

### Font Stack

```css
font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
font-family: var(--font-mono, monospace, Courier);
```

### Type Scale

- `text-[10px]` — Labels, badges, metadata headings
- `text-xs` — Buttons, sidebar subtexts, input parameters
- `text-sm` — Chat message bodies, lists, selectors
- `text-base` — Thread headers, modal titles
- `text-lg` — Card groups, main subheadings
- `text-xl+` — Hero welcome titles

---

## App Layout Architecture

The application is structured around a split viewport:

```
┌─ Collapsible Sidebar ─┬─ Chat Workspace ─────────────────────────────┐
│                       │ [Header: Model | Grounding | Modals]         │
│  - New Chat           ├─────────────────────────────────────────────┤
│  - Search Trigger     │                                             │
│  - Projects Panel     │          Scrollable Message Feed            │
│  - Chronological List │          - Markdown Bubbles                 │
│  - Explore / Lib      │          - Sandpack Code Sandbox            │
│  - User Profile/Set   │                                             │
│                       ├─────────────────────────────────────────────┤
│ (Collapsed / Expand)  │ [Input box: Style | Skill | Voice | Attach] │
└───────────────────────┴─────────────────────────────────────────────┘
```

### Sidebar Views

- **Expanded View** (`260px`): Renders full text labels, search input bars, and collapsible project folders.
- **Collapsed Icon-only View** (`68px`): Displays key action icons (New chat, Search, Explore, Prompt library, Settings) with hover Tooltips.
- **Mobile View**: Sidebar slides out of view entirely, accessible via a top hamburger button.

---

## Modals & Overlays

Modals are rendered as fixed overlays in React portal trees with smooth fade-in animations and backdrop clicks:

- **SettingsModal**: Tabbed dashboard managing API keys, appearance modes, custom system prompts, temperature sliders, memory dashboards, and JSON backups.
- **ExploreGptsModal**: Explore featured personas or build custom assistants with custom temperatures and emojis.
- **PromptLibraryModal**: Personal templates categorized with favorites, SEO and Business prebuilts, inline edits, and injects.
- **SearchModal**: Full-text cross-chat search with project, date, and assistant filters.
- **ProjectModal**: Create project folders and assign shared context instructions.
- **VoiceModeOverlay**: ChatGPT-style voice interface showing transcription, autostart, speaker volumes, and a fluid breathing state orb.

---

## Keyboard Shortcuts

Global event listeners handle system keyboard shortcuts from any focus area:

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Create a new chat session |
| `Ctrl + ,` | Open the Settings Modal |
| `Ctrl + /` | Toggle Sidebar panel |
| `Ctrl + K` | Toggle Sidebar panel |
| `Ctrl + Shift + F` | Open global full-text search |
| `Escape` | Close any active modal / Cancel voice mode / Stop stream |
| `Enter` | Send message (when focus is in input textarea) |
| `Shift + Enter` | Create a newline in chat input |

---

## Component File Structure

The application is structured into modular client-side components to maintain single-page layout performance:

```
src/
  app/
    api/
      chat/
        route.ts            ← Stream router proxying payloads (OpenAI, Claude, etc.)
      validate-key/
        route.ts            ← Probes provider validation pings
    components/
      ChatArea.tsx          ← Scrollable message feed, inputs, code sandbox
      Sidebar.tsx           ← Navigation, projects, search buttons, chronological list
      SettingsModal.tsx     ← Multi-provider keys, appearance, backup/restore, memories
      ExploreGptsModal.tsx  ← Featured and custom assistant list & builder
      ProjectModal.tsx      ← Project instructions and details form
      PromptLibraryModal.tsx← SEO & Business templates, favorites, injects
      SearchModal.tsx       ← Cross-session query search
      VoiceModeOverlay.tsx  ← Text-to-speech visual orb voice console
    utils/
      ...                   ← Shared formatting methods
    layout.tsx              ← Standard HTML wrapper
    page.tsx                ← Core single page orchestrating state
    globals.css             ← Theme preset custom variables
```
