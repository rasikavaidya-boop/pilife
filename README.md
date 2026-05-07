# PiLife

Time tracker with dashboard, live timer, logs, and weekly goals.  
**Stack:** React + Vite · Supabase · Vercel

---

## Setup (10 minutes)

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Wait for it to spin up (~2 min)
3. **SQL Editor → New query** → paste `supabase_schema.sql` → **Run**
4. **Project Settings → API** → copy:
   - Project URL
   - `anon` / public key

> If you get "policy already exists" errors, that's fine — the tables were already created.

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 → create an account → you're in.

---

## Deploy to Vercel

1. Push to GitHub
2. [vercel.com](https://vercel.com) → **New Project** → import repo
3. Framework: **Vite**
4. Add environment variables (same two as `.env`)
5. **Deploy**

Every `git push` auto-deploys after that.

---

## Supabase tip

By default Supabase requires email confirmation before sign-in works.  
To skip this during development:  
**Authentication → Providers → Email → disable "Confirm email"**
