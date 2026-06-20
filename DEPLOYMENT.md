# Sunrise CRM — Deployment Guide (May 2026)

This is the up-to-date guide for getting the Sunrise CRM live. The original `SETUP-GUIDE.md` is preserved for reference but assumes a fresh DB; use this guide instead if you're picking up where things left off.

## Where you are now

| ✅ Already done | ⏳ Still to do |
|---|---|
| Supabase project deployed (Sydney) | React app live on Vercel |
| 13 tables with RLS | Cloudflare Worker deployed |
| 1,237 customers imported | Make.com webhook URL |
| 12 upsell products seeded | Inventory data loaded |
| App-aligned schema (Deliveries / Activities / Finance work) | Reactivation campaign Batch 2 |
| Worker URL bug fixed | |

## Step 1 — Get the code on GitHub (5 min, easiest path)

The full deployable package lives at: `C:\Users\User\sunrise-crm-package\`

**Drag-and-drop method (no command line):**
1. Open https://github.com/sunrisecaravans-cell/sunrise-crm
2. Click **"Add file" → "Upload files"**
3. Drag every file & folder from `C:\Users\User\sunrise-crm-package\` into the upload area:
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `.gitignore`
   - `README.md`
   - `DEPLOYMENT.md` (this file)
   - `SETUP-GUIDE.md`
   - `src/` (folder containing main.jsx + SunriseCRM.jsx)
   - `scripts/` (folder containing import_inventory.mjs + template)
   - `supabase_schema.sql`, `sunrise-lead-worker.js`, `oncord-crm-snippet.js`
   - The 3 `.docx` / `.xlsx` documents (optional in repo — fine to leave on disk)
4. Commit message: "Recover full CRM from prior Cowork session + schema fixes"
5. Click **Commit changes**

## Step 2 — Deploy to Vercel (10 min, free)

1. Go to https://vercel.com → **Sign up with GitHub**
2. **Add New Project** → import `sunrisecaravans-cell/sunrise-crm`
3. Framework preset: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click **Deploy**
7. After ~2 minutes you'll get a live URL (e.g. `sunrise-crm-xxxxx.vercel.app`)

## Step 3 — Connect the live CRM to Supabase (3 min)

1. Open the live Vercel URL
2. Go to the **Settings** page in the CRM
3. Paste:
   - **Supabase URL:** `https://nubttdudughlriajikrr.supabase.co`
   - **Anon key:** (get from Supabase Dashboard → Project Settings → API → Project API keys → "anon public")
4. Click **Connect** — green "Connected" badge appears
5. Customers, templates, products all populate

## Step 4 — Deploy the Cloudflare Worker (10 min)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**
2. Name it `sunrise-lead-scorer`
3. Click **Deploy** (don't worry about the default code)
4. **Edit Code** → replace everything with contents of `sunrise-lead-worker.js`
5. **Deploy**
6. Worker page → **Settings → Variables and Secrets** → add:
   - `SUPABASE_URL` = `https://nubttdudughlriajikrr.supabase.co`
   - `SUPABASE_KEY` = your anon key (same one as Step 3)
7. Test:
   ```
   curl -X POST https://sunrise-lead-scorer.<your-subdomain>.workers.dev/score-test \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"t@e.com","phone":"0400000000","message":"Keen on the Wildtrekker 19ft8, what'\''s the price?"}'
   ```
   You should get a score back.

## Step 5 — Hook up your website (depends on form plugin)

See original `SETUP-GUIDE.md` Step 4 — instructions for Contact Form 7, WPForms, Gravity Forms, or generic webhook. Webhook URL to use:
```
https://sunrise-lead-scorer.<your-subdomain>.workers.dev/lead
```

## Step 6 — Load inventory (when ready)

1. Make a CSV based on `scripts/inventory_template.csv`
2. Run:
   ```
   cd C:\Users\User\sunrise-crm-package
   node scripts/import_inventory.mjs path\to\your-vans.csv
   ```
3. Vans appear in the CRM Inventory page

## Step 7 — Reactivation campaign

- 1,189 contacts are flagged status = `Reactivation`
- Batch 1 (20 emails, dealer language) is in `Sunrise_Reactivation_Emails_Batch1.docx`
- Batch 2 (27 contacts that need caravan models tagged) — pending Oncord lookup

## Security checklist before going live

- [ ] 2FA on Supabase, GitHub, Vercel, Cloudflare, Gmail
- [ ] Anon key only — never commit service_role key
- [ ] Privacy policy on the website (Australian Privacy Act)
- [ ] Each staff member has their own login
- [ ] Tighten RLS from "allow all" to proper Supabase Auth policies before broad rollout

## What to do if something breaks

| Symptom | Likely cause |
|---|---|
| "Not connected" in CRM Settings | Supabase URL or anon key wrong; URL must NOT have trailing slash |
| Customer page empty | Anon key invalid or RLS broke |
| Worker returns "CRM insert failed" | `SUPABASE_KEY` env var missing in Worker |
| Form submissions not landing in CRM | Webhook URL wrong, or form plugin not sending JSON |
| All leads scoring "Cold" | Form not sending the `message` field |

When in doubt, check Supabase Dashboard → Table Editor → customers — the data should be appearing there directly.
