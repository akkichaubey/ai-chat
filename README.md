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
- **custom styling** — inspired by Linear, Notion, Vercel, and ChatGPT

### Backend

- **Next.js API Routes** — thin proxy layer only
- No user database required (100% localStorage)

### Storage

- **Browser `localStorage`** — all chat history, settings, projects, memory, prompts, and API keys stored locally on the user's device
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
- **System Mode** — automatically follows OS preference (default)
- Theme resolves instantly before hydration to avoid light flashes
- **5 Custom Color Themes**: Default, Claude Charcoal, Midnight Cosmic Purple, Cyberpunk Neon, and Forest Green.

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

- 🔑 **Multi-Provider BYOK API Keys** — Grid picker for Gemini, OpenAI, Claude, Router, and Groq with active connection validate pings.
- 💬 **Chat Persistence** — Chronologically grouped conversations saved locally.
- 📁 **Projects** — Group threads with custom workspace system instructions.
- 🧠 **AI Memory System** — Auto-keyword facts commit + manual memory + dashboard inline editor.
- 🤖 **Custom Assistants / GPTs** — Avatars, emoji bg, starters, and custom temperature sliders.
- 🔍 **Conversation Search** — Full-text query match on titles & content with filters.
- 📚 **Prompt Library** — Templates, favorites, SEO and Business tabs, inline edits, and injects.
- 📤 **Export** — Markdown, text, and PDF (via marked.js formatting).
- 🎙️ **Voice Mode overlay** — Waveform, sentence queue, autostart, and TTS playback.
- 📦 **Interactive Artifacts & Code Sandbox** — Claude-style collapsible Artifact Cards, path/filename extraction, side-over split drawer workspace with Code/Preview tabs, file downloads, and in-chat multi-file Sandpack execution.
- 🖼️ **Image Lightbox Carousel** — Full-screen carousel viewer for image attachments supporting keyboard navigation, touch swipes, drag gestures, wheel/pinch-to-zoom (up to 4x), and drag-panning.
- 🌗 **Themes** — Light, Dark, and 5 color themes.
- 📱 **Mobile Responsive** — collapses sidebar, optimized for touches.
- 🌐 **Web Search** — grounding with Google Search.
- 💡 **Writing Styles & Skills** — Concise, Formal, Tutor, UX Auditor, Debugger.
- 🔄 **Backup/Restore** — JSON export/import of the entire workspace database.

---

## Privacy Commitment

> This application stores **zero user data on any server**. All conversations, settings, API keys, memory, projects, and preferences live exclusively in your browser's `localStorage` on your own device. The only network requests made are directly to your chosen AI provider using your own API key.
