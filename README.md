### 1. Project name

10x-cards

Badges: Node v22.14.0 • Astro v5 • React v19 • Tailwind v4

### 2. Project description

10x-cards is a web application for creating and studying flashcards. The MVP focuses on helping users rapidly produce high‑quality cards by sending pasted text to an LLM (via API) that proposes Q/A pairs. Users can accept, edit, or discard suggestions, manage their own private card sets, and review them with a spaced‑repetition algorithm. The system stores user and card data securely and complies with GDPR, including the right to access and delete data.

Table of contents
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. Project scope](#6-project-scope)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

### 3. Tech stack

- Frontend
  - Astro 5 (https://astro.build/) (hybrid rendering, islands architecture)
  - React 19 (https://react.dev/) (interactive components where needed)
  - TypeScript 5(https://www.typescriptlang.org/)
  - Tailwind CSS 4 (https://tailwindcss.com/)
  
- Backend
  - Supabase (PostgreSQL, Auth, SDK; RLS for per-user data isolation)
- AI
  - OpenRouter.ai (access to multiple model providers, budget limits)
- CI/CD & Hosting
  - GitHub Actions (pipelines)
  - DigitalOcean (container-based hosting)
- Runtime
  - Node.js 22.14.0 (see .nvmrc)
  
- Suggested project layout
  - `src/` source code
  - `src/layouts/` Astro layouts
  - `src/pages/` Astro pages
  - `src/pages/api/` API endpoints (LLM proxy, GDPR actions)
  - `src/middleware/index.ts` middleware
  - `src/db/` Supabase client and types
  - `src/types.ts` shared types
  - `src/components/` Astro/React components
  - `src/components/ui/` shadcn/ui components
  - `src/lib/` services and helpers
  - `src/assets/` internal static assets
  - `public/` public assets

### 4. Getting started locally

Prerequisites
- Node 22.14.0 (nvm recommended)
- npm (comes with Node)

Setup
```bash
# 1) Use the correct Node version
nvm use

# 2) Install dependencies
npm install

# 3) Create a local env file
cp .env.example .env.local  # if present; otherwise create .env.local
```

Environment variables (example)
```bash
# Supabase
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_ANON_KEY="YOUR_ANON_KEY"

# OpenRouter (server-side usage only; do not expose to the client)
OPENROUTER_API_KEY="sk-or-..."
```

Notes
- Do NOT send the `OPENROUTER_API_KEY` from the browser. Route all LLM requests through a server endpoint (e.g., `src/pages/api/generate.ts`) or a Supabase Edge Function.
- Use Zod to validate all API inputs and enforce per-user access via Supabase RLS.

Run
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

### 5. Available scripts

```text
dev       Start Astro dev server
build     Build the production bundle
preview   Preview the production build locally
astro     Run Astro CLI directly
lint      Run ESLint
lint:fix  Fix lint issues automatically
format    Format files with Prettier
```

### 6. Project scope

In scope (MVP)
- Paste text and generate flashcard suggestions via LLM API
- Review suggestions and accept/edit/reject
- Manual card creation, editing, and deletion
- Basic authentication (registration, login)
- Delete account and all associated data on request
- Spaced-repetition session using an existing algorithm/library
- Basic analytics: number generated vs accepted cards
- Data stored with scalability and security in mind (Supabase + RLS)

Out of scope (MVP)
- Custom/advanced repetition algorithm (use an existing library)
- Gamification
- Mobile apps (web only)
- Multi-format document import (PDF/DOCX/etc.)
- Public API
- Card sharing between users
- Advanced notifications
- Advanced full‑text search

### 7. Project status

MVP in active development. Success metrics include:
- ≥ 75% of AI-generated cards accepted by users
- ≥ 75% of newly added cards created via AI suggestions
- Tracking of generated vs accepted counts for quality insights

### 8. License

TBD. If you plan to open-source this project, add a LICENSE file (e.g., MIT). If proprietary, state the applicable terms here.


