# Trailhead — AI Career Roadmap Generator

**Live app:** https://career-mentor-two-gamma.vercel.app
**Repo:** https://github.com/Tabassum1757/career-mentor

Trailhead generates personalized, AI-reasoned learning roadmaps based on a person's existing skills and their target career role — instead of the generic "learn X then Y" advice most tutorials give, it maps a path specific to where you're actually starting from.

## The problem

Most learning roadmaps online are static and one-size-fits-all. They don't account for what someone already knows, so a beginner and someone with three years of adjacent experience get the same advice. Trailhead takes a person's real, current skill set and their target role, then computes exactly what's missing — and uses an LLM to explain *why* that particular order makes sense, with rough time estimates per phase.

## Features

- **Skill + role selection** — pick from a real, database-backed list of skills and target roles
- **Two roadmap modes**
  - *Simple*: instant, rule-based gap analysis (no AI cost, zero latency, always available as a fallback)
  - *AI-generated*: calls Google's Gemini API to group missing skills into logical phases, each with reasoning and an estimated timeframe
- **Accounts & persistence** — sign up, save every generated roadmap, and revisit it later from a personal dashboard
- **Secure by design** — Row Level Security (RLS) ensures each user can only ever see their own saved roadmaps

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | Next.js (TypeScript, App Router) | Combines UI and API routes in one project — no separate backend to host |
| Styling | Tailwind CSS | Fast, consistent styling without maintaining separate CSS files |
| Database & Auth | Supabase (PostgreSQL) | Real relational database + built-in auth + auto-generated APIs, all free to start |
| AI | Google Gemini API (`gemini-3.6-flash`) | Free tier with no billing setup required, sufficient for demo/portfolio traffic |
| Hosting | Vercel | Auto-deploys from GitHub on every push (CI/CD) |

## Architecture

```
Browser (React UI)
      │
      ├─► Supabase (Postgres) ── skills / roles / role_requirements / user_roadmaps
      │
      └─► /api/generate-roadmap (Next.js API route)
                │
                └─► Google Gemini API
```

### Database design

Rather than hardcoding "Frontend Developer needs HTML, then JS, then React" into application logic, the relationships are modeled as data:

- **`skills`** — every individual skill in the system
- **`roles`** — every target career role
- **`role_requirements`** — a join table linking skills to roles with an explicit `step_order`, capturing the dependency sequence
- **`user_roadmaps`** — every AI-generated roadmap a logged-in user has saved, stored as structured JSON (`roadmap_data`), scoped to that user via RLS

This separation means new roles or reordered skill paths can be added by editing database rows — no code changes required.

### AI prompting approach

The `/api/generate-roadmap` route sends the model a prompt constrained to:
- Only use skills that already exist in the user's missing-skills list (prevents hallucinating skills outside the data model)
- Group them into 2–4 logical phases based on dependency order
- Return **strict JSON only** — no freeform text — so the response can be reliably parsed and rendered as UI, not just displayed as a wall of text

If the AI call fails (rate limits, downtime), the app falls back gracefully to the rule-based roadmap so the user is never left with nothing.

## Key engineering decisions

- **Why keep a non-AI fallback?** Reliability and cost control — a simple database query always works, instantly and for free, even if the AI provider is down or rate-limited.
- **Why JSONB for `roadmap_data`?** The AI response is a nested structure (phases → skills, reasoning, estimates). Storing it as one JSONB blob avoids designing and joining multiple additional relational tables just to reconstruct a single roadmap.
- **Why RLS instead of just filtering in application code?** Enforcing `auth.uid() = user_id` at the database level means access control can't be bypassed by a bug in the frontend or API code — it's guaranteed by Postgres itself.

## Running locally

```bash
git clone https://github.com/Tabassum1757/career-mentor.git
cd career-mentor
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm run dev
```

## Roadmap (future improvements)

- Curated resource links per skill (courses, docs, articles)
- Progress tracking — mark skills as completed on a saved roadmap
- More roles and skills for broader coverage
- Aggregate, anonymized insights across users (e.g., "most learners tackle Git before React")
