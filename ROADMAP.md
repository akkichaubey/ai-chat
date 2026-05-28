# AI Chat SaaS Roadmap

> Product Vision: Build a ChatGPT-style AI SaaS using Next.js + Supabase + Gemini with premium features such as Memory, Projects, Assistants, Search, Export, and Subscriptions.
>
> **NOTE**: Premium client features such as **Voice Mode**, **Multi-File Sandpack Sandbox**, **Custom Themes**, **Screenshotting**, and **Context-Aware Quick Actions** are already fully implemented on the client-side and will be securely migrated to database storage during the SaaS transition phases.
>
> Multimodal features (Image Generation, Video, Advanced File Intelligence) are postponed for a future release.

---

# Tech Stack

## Frontend
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend
- Next.js API Routes
- Gemini API

## Database
- Supabase PostgreSQL

## Authentication
- Supabase Auth
  - Google Login
  - GitHub Login
  - Magic Link Login

## Payments
- Razorpay

## Deployment
- Vercel

---

# Product Roadmap

---

# Phase 0 — Foundation

## Goal
Set up authentication, database, and user management.

## Supabase Setup
Enable:
- Authentication
- PostgreSQL
- RLS
- Storage (future use)

## Database Tables

### profiles
```sql
id uuid primary key
email text
name text
avatar_url text
plan text default 'free'
created_at timestamptz
updated_at timestamptz
```

### chats
```sql
id uuid primary key
user_id uuid references profiles(id)
title text
project_id uuid
pinned boolean default false
created_at timestamptz
updated_at timestamptz
```

### messages
```sql
id uuid primary key
chat_id uuid references chats(id)
role text
content text
created_at timestamptz
```

### projects
```sql
id uuid primary key
user_id uuid references profiles(id)
name text
description text
instructions text
created_at timestamptz
updated_at timestamptz
```

### memories
```sql
id uuid primary key
user_id uuid references profiles(id)
key text
value text
created_at timestamptz
updated_at timestamptz
```

### assistants
```sql
id uuid primary key
user_id uuid references profiles(id)
name text
description text
system_prompt text
icon text
temperature numeric
created_at timestamptz
updated_at timestamptz
```

### subscriptions
```sql
id uuid primary key
user_id uuid references profiles(id)
plan text
status text
current_period_end timestamptz
created_at timestamptz
```

### usage_logs
```sql
id uuid primary key
user_id uuid references profiles(id)
messages_used integer
tokens_used integer
usage_date date
```

---

# Phase 1 — Authentication

## Features
### Google Login
- One-click sign in

### GitHub Login
- Developer-friendly authentication

### Magic Link
- Passwordless authentication

## Deliverables
- User registration
- Login
- Logout
- Session persistence
- Protected routes

---

# Phase 2 — Chat Persistence

## Goal
Save chats permanently.

## Features
### Create Chat
- New conversation

### Rename Chat
- Editable title

### Delete Chat
- Soft delete

### Pin Chat
- Important conversations

### Auto Title Generation
Generate title using first prompt.

Example:
```text
Build AI startup
```
↓
```text
AI Startup Planning
```

## Sidebar Groups
```text
Today
Yesterday
Previous 7 Days
Previous 30 Days
```

## Deliverables
- Persistent chat history
- Chat sidebar
- Chat management

---

# Phase 3 — Projects

## Goal
Organize chats.

Example:
```text
Startup Project
 ├─ Marketing Chat
 ├─ Pricing Chat
 ├─ Investor Pitch Chat
```

## Features
### Create Project
### Rename Project
### Delete Project
### Move Chat To Project
### Project Instructions

Example:
```text
Company Name: AI Chat
Target Audience: Developers
Tone: Professional
Industry: SaaS
```
Automatically added to prompts.

## Deliverables
- Project management
- Shared project context

---

# Phase 4 — Memory System

## Goal
Allow AI to remember user preferences.

## Manual Memory
User saves memory.

Example:
```text
My preferred language is Hindi.
```

## Automatic Memory
AI detects:
```text
User prefers TypeScript.
```
and stores it.

## Memory Categories
### Personal
```text
Name
Location
Language
```

### Technical
```text
Framework
Programming Language
Database
```

### Business
```text
Startup
Agency
Product
```

## Memory Dashboard
Users can:
- View memory
- Edit memory
- Delete memory

## Deliverables
- Cross-chat memory

---

# Phase 5 — Custom Assistants

## Goal
Create Custom GPT-style assistants.

## Examples
### Coding Expert
```text
You are a senior software engineer.
```

### Startup Mentor
```text
You help founders build SaaS businesses.
```

### SEO Expert
```text
You are an SEO consultant.
```

## Assistant Configuration
### Name
### Icon
### Description
### System Prompt
### Temperature

## Deliverables
- Unlimited custom assistants (Premium)

---

# Phase 6 — Search

## Goal
Search old conversations.

## Search Types
### Global Search
```text
pricing strategy
supabase
nextjs auth
```

### Filter By
- Project
- Date
- Assistant

## Deliverables
- Fast conversation search

---

# Phase 7 — Prompt Library

## Goal
Store reusable prompts.

## Categories
### Development
### Marketing
### SEO
### Writing
### Business

## Features
### Save Prompt
### Favorite Prompt
### Edit Prompt
### Delete Prompt
### Share Prompt

## Deliverables
- Personal prompt library

---

# Phase 8 — Export

## Formats
### Markdown
### TXT
### PDF

## Export Scope
### Single Chat
### Entire Project
### All Conversations

## Deliverables
- Data portability

---

# Phase 9 — Workspace Organization

## Goal
Keep chats organized.

## Folders
Example:
```text
Work
Personal
Research
Clients
```

## Features
### Create Folder
### Move Chat
### Archive Folder
### Delete Folder

## Deliverables
- Better organization

---

# Phase 10 — Usage Tracking

## Track
### Messages Used
### Tokens Used
### Projects Created
### Assistants Created
### Storage Used

## Dashboard
```text
Messages: 1,250
Projects: 12
Assistants: 8
Memory Entries: 45
```

## Deliverables
- User analytics

---

# Phase 11 — Subscription System

## Razorpay Integration

### Free Plan
```text
50 Messages / Day
3 Projects
3 Assistants
Basic Memory
Limited Search
```

### Pro Plan
```text
Unlimited Messages
Unlimited Projects
Unlimited Assistants
Advanced Memory
Search
Export
Priority Access
```
Suggested Pricing:
```text
₹99/month
```

### Pro Plus
```text
Everything in Pro
Future Premium Models
Future Deep Research
Future Voice Mode
```
Suggested Pricing:
```text
₹199/month
```

## Deliverables
- Subscription billing
- Plan enforcement

---

# Phase 12 — Settings & Personalization

## User Settings
### Theme
- Light
- Dark
- System

### Chat Settings
- Temperature
- Thinking Mode
- Web Search

### Profile Settings
- Name
- Avatar
- Email

## Deliverables
- Personalized experience

---

# Launch MVP Checklist

## Required Before Launch
- [ ] Supabase Auth
- [ ] Profiles Table
- [ ] Chats Table
- [ ] Messages Table
- [ ] Chat Persistence
- [ ] Projects
- [ ] Memory
- [ ] Custom Assistants
- [ ] Search
- [ ] Prompt Library
- [ ] Export
- [ ] Usage Tracking
- [ ] Razorpay Subscription
- [ ] Mobile Responsive Design
- [ ] Dark Mode
- [ ] Error Handling
- [ ] Rate Limiting

---

# Future Features (Post Launch)

## Multimodal
- Image Upload Understanding
- Image Generation
- Voice Mode
- Video Understanding
- PDF Intelligence

## Multi-Provider Support
- OpenAI
- Claude
- Gemini

## Deep Research
- Web Crawling
- Citation Generation
- Long-form Reports

## Code Interpreter
- Python Execution
- CSV Analysis
- Data Visualization

## Team Workspace
- Shared Projects
- Shared Chats
- Team Billing
- Admin Dashboard

---

# Recommended Development Order

1. Supabase Auth
2. Database Schema
3. Chat Persistence
4. Projects
5. Memory
6. Custom Assistants
7. Search
8. Prompt Library
9. Export
10. Usage Tracking
11. Razorpay
12. Workspace Organization
13. Settings Page
14. Production Deployment

---

# Success Criteria

## MVP
- Persistent chats
- Projects
- Memory
- Assistants
- Search
- Premium subscriptions

## V1
- Stable paid product
- 100+ users
- Recurring subscriptions

## V2
- Multi-provider AI
- Deep Research
- Multimodal Features
- Team Collaboration
