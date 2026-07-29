# StudySpark

A study app (dashboard, AI tutor, notes, flashcards, quizzes, planner, focus
timer, essay helper) where every signed-in user has their own private data,
backed by Supabase.

## What's wired to your account vs. what's local

Saved to your Supabase account, private per user:
- Flashcards
- Notes / generated study guides
- Study planner deadlines
- Quiz history and scores

Runs entirely in the browser, not saved anywhere (by design, no setup needed):
- AI Tutor chat (simulated locally — see note below on making it real)
- Essay Helper
- Focus timer session count (resets on refresh)
- "Study streak" / "Time studied" on the dashboard — placeholders, not tracked yet

## Setup

### 1. Run the database schema

In your Supabase project: **SQL Editor → New query**, paste in everything
from `supabase-schema.sql`, and run it. This creates the tables and turns on
Row Level Security so users can only ever see their own rows.

### 2. Get your API keys

In Supabase: tap **Connect** (top of the project page) or **Settings → API
Keys**. You need the **Project URL** and the **anon / public** key (or
**publishable** key on newer projects — same purpose).

### 3. Set your environment variables

Copy `.env.example` to a new file named `.env`, and fill in the two values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### 4. Install and run

```
npm install
npm run dev
```

This opens the app locally. Create an account, sign in, and everything you
add will be saved to your Supabase project under your user ID.

### 5. Deploy it for free

Push this folder to a GitHub repo, then connect it on
[vercel.com](https://vercel.com) or [netlify.com](https://netlify.com) (both
have free tiers). When you set up the project there, add the same two
environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in
their dashboard's project settings — that's the only extra step, since your
`.env` file itself isn't pushed to GitHub.

## Making the AI Tutor / Essay Helper actually AI-powered

Right now those two features use templated logic, not a real model — no data
leaves the browser and there's no ongoing cost. To make them genuinely
AI-powered, you'd add a small serverless function (a Vercel/Netlify function
works well) that calls an LLM API with the user's question, and have the
Tutor/Essay components call that function instead of `simulateAnswer`. This
requires an API key from an LLM provider and isn't free at scale, though
providers often have starting credits.
