# AI Workspace & Productivity Dashboard

## Product Requirements, Architecture & Development Roadmap

This document serves as the developer guidelines and context directory for the AI Workspace Dashboard. It outlines the project's vision, active system architecture, implemented components, coding standards, styling choices, and future modules.

---

## 📖 Project Vision & Overview
The AI Workspace Dashboard is designed to serve as a high-performance web dashboard. It acts as an intelligent assistant capable of content writing, brainstorming, programming help, sandboxed code testing, document understanding, and real-time voice conversations.

### Core Tech Stack
- **Framework**: Next.js 15 (Turbopack) using the App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4.0 with customized color directives
- **AI Integration**: Official `@google/genai` JS SDK
- **Speech Capabilities**: Browser Web Speech API (`SpeechRecognition` and `SpeechSynthesis`)

---

## 📂 Project Directory Structure
```
ai-chat/
├── .env.local                    # Local environment keys (e.g. GEMINI_API_KEY)
├── package.json                  # Dependencies (google/genai, lucide-react, react-markdown)
├── tsconfig.json                 # TypeScript configurations
├── src/
│   └── app/
│       ├── layout.tsx            # Global HTML wrapper
│       ├── page.tsx              # Main dashboard wrapper coordinating all sub-states
│       ├── globals.css           # Styling system & custom Google AI Studio theme
│       ├── api/
│       │   └── chat/
│       │       └── route.ts      # Server-side Gemini/Gemma API stream orchestrator
│       └── components/
│           ├── Sidebar.tsx       # ChatGPT-style collapsible, chronologically-grouped history with options menus
│           ├── ChatArea.tsx      # Conversation viewport & toolbar controls
│           ├── SettingsModal.tsx # AI customization modal (Personas, Temperature, System Instructions)
│           ├── ExploreGptsModal.tsx # Custom GPT explore list & custom assistant builder form
│           └── VoiceModeOverlay.tsx # ChatGPT-style fullscreen voice dialogue overlay
```

---

## 🎨 Theme & Styling System
The application features a comprehensive theme customization engine with presets defined in [globals.css](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/globals.css) and switchable in [SettingsModal.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/SettingsModal.tsx):

### Supported Theme Presets
1. **Google AI Studio (Default)**: Deep charcoal neutral grays (`#131314` background, `#a8c7fa` blue highlights).
2. **Claude Charcoal**: Charcoal dark UI mimicking Claude's workspace (`#191919` background, `#cc9c7a` tan highlights).
3. **Midnight Cosmic Purple**: Galactic indigo workspace (`#090616` background, `#c084fc` purple highlights).
4. **Cyberpunk Neon**: High-contrast cyberpunk styling (`#040406` background, `#ff007f` neon accents).
5. **Forest Green**: Calming organic dark theme (`#0a0f0b` background, `#4ade80` emerald highlights).

- **CSS Variables & Tailwind v4.0**: System colors are bound to CSS variables (`--background`, `--border`, etc.) inside the theme classes. Tailwind v4.0 `@theme` overrides reference these custom properties dynamically.
- **Animations**: Expanding scale animations (`pulse-glow`) are used for loading states and interactive hovering.
- **Visual Refinements**: Built with a border-free chat canvas layout by omitting horizontal dividers around the header and footer inside [ChatArea.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/ChatArea.tsx) for a cleaner, modern look.

---

## 🤖 AI Conversation Features (Phase 1 MVP - Fully Implemented)

### 1. High-Reasoning Companion (Gemma 4)
- Powered by `gemma-4-31b-it` by default.
- Supports **Thinking Mode** toggles. When enabled, it configures Gemma 4's high-reasoning mode (`thinkingLevel: 'high'`) or Gemini's thinking budget (`thinkingBudget: -1`) to yield deep, step-by-step reasoning steps.

### 2. Grounded Web Search Override
- When the **Web Search** toggle is active, the system dynamically routes queries to `gemini-2.5-flash` with the Google Search tool (`googleSearch: {}`) enabled for real-time market grounding.

### 3. Custom AI Personas & System Instructions
- **General Assistant**: General-purpose helpful AI.
- **Creative Writer**: Brainstorms outline scripts, drafting essays, copy editing.
- **Code Architect**: Writes modular, performance-optimized, secure script files.
- **Custom Prompt**: Allows user-defined behavior instructions.
- Selectable inside [SettingsModal.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/SettingsModal.tsx), automatically updating the system instructions parameter (`systemInstruction`) sent to the backend endpoint.

### 4. Robust API Handler & Backoff Retry Loop
- Implemented in [route.ts](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/api/chat/route.ts).
- Integrates a **4-attempt exponential backoff retry mechanism** to intercept transient `500 Internal` and `503 Service Unavailable` error spikes from Google AI Studio under heavy load, ensuring zero session drops for the frontend client.

### 5. Multimodal & Document Attachments
- **Images & PDFs**: Converted client-side to Base64 using `FileReader` and streamed in the API payload under `inlineData`.
- **Text documents (TXT, CSV, JSON, LOG)**: Parsed client-side and dynamically appended inline into the prompt text container using structural formatting tags.

### 6. Quick Model Selector
- Fully decoupled from the workspace settings modal to optimize workspace usability. A quick dropdown selector is situated directly on the input chat toolbar in [ChatArea.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/ChatArea.tsx) for hot-swapping active model instances.

### 7. Rich Chat Interaction Controls
- **Clipboard Asset Paste**: Support for capturing and attaching clipboard-copied images and documents directly in the text input box using native `onPaste` handlers.
- **In-place Prompt Editing**: Users can hover over and edit their sent messages. Modifying a message updates the workspace history and triggers a clean streaming regeneration from that point.

### 8. Claude-Style Nested "+" Popover Menu
Replaced the simple attachment button with a nested menu in [ChatArea.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/ChatArea.tsx) supporting:
- **Attach Files**: Standard file uploads.
- **Take a Screenshot**: Triggers native browser window/screen sharing and captures the frame to a canvas to attach.
- **Web Search Toggle**: Quickly turns Google search grounding on/off.
- **Use Style (Submenu)**: Set tone modifiers (**Normal**, **Learning**, **Concise**, **Explanatory**, **Formal**).
- **Skills (Submenu)**: Choose specific capabilities (**Default**, **Code Debugger**, **UI/UX Inspector**, **Language Tutor**).

### 9. Context-Aware Quick Action Pills
When files are uploaded, context-aware prompt pills appear under the attachments inside [ChatArea.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/ChatArea.tsx). Clicking a pill instantly runs it:
- **Image Actions**: `Convert to Code`, `UX/UI Audit`, `Suggest Variations`, `Extract Text (OCR)`.
- **Document Actions**: `Summarize Takeaways`, `Extract Key Figures`, `Translate to English`.

---

## 🎤 ChatGPT-Style Voice Mode (Talk to AI)
A fullscreen voice mode is available by clicking the **Headphones button** in the chat header, featuring hands-free continuous conversation:

### Speech Engines (Client-Side)
- **Voice Input (STT)**: Utilizes browser `SpeechRecognition` to dictate sentences, auto-submitting them when the user stops talking.
  - *Bug Fix*: Exposes an `isRecognitionActiveRef` state tracker inside [VoiceModeOverlay.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/VoiceModeOverlay.tsx) to prevent duplicate `.start()` calls, eliminating `InvalidStateError` browser console exceptions.
- **Voice Output (TTS)**: Utilizes browser `SpeechSynthesis` to speak text responses.
  - *Streaming Speech Synthesis*: Implements a sentence-by-sentence queue. As chunks stream from the API, completed sentences are enqueued for playback immediately, minimizing speaker latency.
  - *Interruption Handling*: Tapping the visualizer or speaking while the AI is talking instantly triggers `window.speechSynthesis.cancel()`, stops audio output, and reactivates the microphone.
  - *Silence Filters*: Filters out `'interrupted'` and `'canceled'` exceptions from utterance error hooks to keep the developer console clean.

### Overlay UI States
- **Listening State**: Central blue mic circle with expanding pulse waves.
- **Thinking State**: Rotating dashed ring with a breathing glow core.
- **Speaking State**: Multi-bar audio EQ equalizer animating scale.
- **Settings Drawer**: Adjust language locales, synthesis voice models, continuous chat triggers, and speech rates (0.5x to 2.0x).

---

## 💻 Developer Features: Sandboxed Console
Inside assistant responses, any JavaScript or HTML code block features a **Run Code** panel:
- Launches a sandboxed `iframe` with `sandbox="allow-scripts"` to execute scripts safely.
- Overrides `console.log`, `console.warn`, `console.error`, and `console.info` to collect logs and render them inside a stylized console readout matching the dark Google grays theme.
- Captures and displays runtime syntax or execution errors in red formatting.

---

## ⚙️ Coding Standards & Reusable Patterns

### 1. File & Module Structure
- All core views must belong to `/src/app/components` as standalone client components (`'use client'`).
- Shared services belong to `/src/app/services`.
- State syncs belong to the parent page controller (`/src/app/page.tsx`).

### 2. State Propagation
- Child components must remain stateless wherever possible, receiving values and action triggers via props.
- Message histories are updated using unified helper functions (like `triggerStreaming`) to guarantee that user message edits and assistant regenerations maintain state consistency:
```typescript
// Reusable pattern for triggering a streamed response from any message index
const triggerStreaming = async (history: Message[]) => { ... }
```

### 3. Links and Citations
- Any documentation referencing files must provide direct, clickable links with forward slashes (e.g. [Sidebar.tsx](file:///d:/htdocs/Goal/react/demo/ai-chat/src/app/components/Sidebar.tsx)).

---

## 🗺️ Roadmap & Phase Execution

### Phase 1: AI Chat Workspace (Completed ✅)
- [x] Streamed text replies for Gemma 4 and Gemini models.
- [x] Long memory conversation storage inside browser localStorage.
- [x] ChatGPT-style sidebar with collapsible support, chronological grouping, search, and session pinning.
- [x] Custom AI personas (General, Creative Writer, Code Architect, Custom) and system instructions.
- [x] Web Search toggle (Gemini Google grounding routing) and Thinking Mode toggles.
- [x] Client-side Base64 parsing for images and PDFs.
- [x] Continuous voice mode overlay (STT + queue-based streaming TTS + animation states).
- [x] Sandboxed JS/HTML execution consoles.
- [x] Export session history to Markdown (`.md`) format.
- [x] Clipboard image/document pasting directly in the message input field.
- [x] Inline user message editing and prompt regeneration flows.
- [x] Quick model selector toolbar directly below the main chat viewport.
- [x] Custom GPT Creator & Explorer (Featured pre-built assistants + user-designed builders, customizable prompts, emojis, and themes).
- [x] Claude-Style Popover Menu with submenus for writing styles, conversational skills, and Web Search/File tools.
- [x] Native Canvas Screenshot Capturing tool integrated directly into the workspace.
- [x] Context-Aware Quick Action Pills for images and document uploads.
- [x] Global Theme Customization System supporting 5 custom presets.
- [x] Clean, border-free layout aesthetics for the main chat interface.

### Phase 2: User Profiles & Cloud Storage (Planned 📅)
- [ ] Connect authentication providers.
- [ ] Initialize cloud database structures to sync session histories across devices.
- [ ] Support cloud attachment file uploads.

### Phase 3: Advanced Document Intelligence (Planned 📅)
- [ ] Multi-document summarization overlays.
- [ ] Interactive text segment search and semantic citation mapping.
- [ ] Image annotations editor inside the chat.
