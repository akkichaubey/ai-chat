# Deployment

> The platform is designed to be zero-config for personal use and trivially self-hostable for teams. No database setup, no auth configuration, no secrets required to get started.

---

## Deployment Options

| Option            | Effort       | Best For                            |
|-------------------|--------------|-------------------------------------|
| Vercel (hosted)   | Zero-config  | Quick hosted deployment             |
| Docker            | One command  | Self-hosted, isolated environments  |
| Node.js server    | Manual       | Custom infrastructure               |

---

## Option 1: Vercel (Recommended for Hosted)

### Steps

1. Push the repository to GitHub / GitLab / Bitbucket
2. Import the project into [vercel.com](https://vercel.com)
3. Vercel auto-detects Next.js — no configuration needed
4. (Optional) Add environment variable `GEMINI_API_KEY` for a shared fallback key
5. Deploy

### Environment Variables (Optional)

```env
GEMINI_API_KEY=AIzaSy...
```

No other variables required.

### Notes

- All user data stays in the user's browser localStorage
- The Vercel deployment only hosts the app shell and API proxy
- Free tier is sufficient for personal use

---

## Option 2: Docker (Self-Hosted)

### Quick Start

```bash
docker run -p 3000:3000 ai-chat:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  ai-chat:
    image: ai-chat:latest
    ports:
      - "3000:3000"
    environment:
      # Optional: shared fallback key for users without their own
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

### Build from Source

```bash
git clone https://github.com/your-org/ai-chat.git
cd ai-chat
docker build -t ai-chat:latest .
docker run -p 3000:3000 ai-chat:latest
```

### Status

- [ ] Docker image (planned — Phase 14)
- [ ] `docker-compose.yml` (planned — Phase 14)
- [ ] Docker Hub image (planned — V1)

---

## Option 3: Node.js Server (Manual)

### Prerequisites

- Node.js 20+
- npm or pnpm

### Steps

```bash
# Clone the repository
git clone https://github.com/your-org/ai-chat.git
cd ai-chat

# Install dependencies
npm install

# (Optional) Create environment file
cp .env.local.example .env.local
# Edit .env.local and add GEMINI_API_KEY if desired

# Build for production
npm run build

# Start the production server
npm start
```

### Running Behind a Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name chat.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Required for SSE (streaming responses)
        proxy_buffering off;
        proxy_set_header X-Accel-Buffering no;
    }
}
```

---

## Environment Variables

```env
# .env.local

# Optional: Provide a shared fallback Gemini API key.
# Users can always override this with their own key in Settings.
GEMINI_API_KEY=AIzaSy...

# No database credentials needed
# No auth secrets needed
# No session secrets needed
```

---

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Available Scripts

| Script          | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Build production bundle                  |
| `npm start`     | Start production server                  |
| `npm run lint`  | Run ESLint                               |

---

## Offline Mode (Planned)

With Ollama integration (Phase 14), the entire application can run completely offline:

1. Install [Ollama](https://ollama.ai) locally
2. Pull a model: `ollama pull llama3`
3. Open the AI Chat app — add `http://localhost:11434` as an Ollama provider
4. All AI requests are processed locally — no internet required

---

## Data Backup & Migration

### Export All Data

Users can export their full workspace as a JSON file from Settings → Export → Full Workspace Export.

```json
{
  "exportedAt": "2026-05-30T00:00:00Z",
  "version": "1.0",
  "chat_sessions": [...],
  "messages_map": {...},
  "projects": [...],
  "memories": [...],
  "custom_gpts": [...],
  "custom_prompts": [...],
  "settings": {...}
}
```

### Import / Restore

Drop the JSON backup file into Settings → Import to restore all data on any device or browser.

**Status:** Complete

---

## Security Considerations

### API Key Exposure

- User API keys are stored in `localStorage` — only accessible to JavaScript on the same origin
- Keys are forwarded from the browser to the Next.js proxy in POST request bodies over HTTPS
- The proxy never logs request bodies
- For extra security, users can self-host on their own domain with HTTPS enforced

### Content Security Policy

Recommended CSP headers for self-hosted deployments:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com;
```

### HTTPS

Always deploy behind HTTPS in production. `localStorage` is origin-scoped — using HTTPS ensures isolation from HTTP variants of the same domain.

---

## System Requirements

### Server (for hosted deployment)

- **CPU**: 1 vCPU minimum (2+ recommended for streaming)
- **RAM**: 512 MB minimum (1 GB recommended)
- **Storage**: 500 MB for app files
- **Node.js**: 20+

### Client (browser)

- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- JavaScript enabled
- localStorage enabled (not in private/incognito mode by default)
- ~5–10 MB localStorage available
