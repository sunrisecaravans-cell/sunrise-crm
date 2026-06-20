# Going live on Vercel — the one step that needs you

Everything's built and tested. This is the final step to put the CRM online so the
team can use it from anywhere (and so website lead-capture + alerts go live). It needs
*you* once, because it involves logging into accounts — I can't do that part.

It takes about 10 minutes. Two ways; the first is easiest.

---

## Option A — Vercel CLI (fastest, no GitHub needed)
1. Open a terminal in `C:\Users\User\sunrise-crm-package`.
2. Run: `npm install -g vercel`
3. Run: `vercel login` — pick "Continue with GitHub/Google/Email" and confirm in your browser.
4. Run: `vercel` — accept the defaults (it detects Vite automatically).
5. When it asks for **Environment Variables**, add these two (or add them in the Vercel dashboard → Project → Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = `https://nubttdudughlriajikrr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (the anon key — it's in your `.env` file)
6. Run: `vercel --prod` to publish. It gives you a live URL.

## Option B — Connect Vercel to GitHub (auto-deploys on every change)
1. Get the latest code into your GitHub repo `sunrisecaravans-cell/sunrise-crm`
   (tell me when you're ready and I'll walk you through the push — the repo currently
   has older code).
2. Go to vercel.com → "Add New Project" → import that repo.
3. Framework: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Add the same two environment variables as above.
5. Deploy. From then on, every change I push auto-updates the live site.

---

## After it's live (quick wins, all optional)
- **Custom domain:** add e.g. `crm.sunrisecaravans.com.au` in Vercel → Settings → Domains.
- **Instant new-lead alerts:** create a free account at resend.com, get an API key, then in
  Supabase → Project → Edge Functions → Secrets, add `RESEND_API_KEY`. The lead-capture
  function already has the alert code — it switches on the moment that key exists, emailing
  Steve & Mel the second a website lead lands.
- **Website form:** paste `marketing-assets/website-lead-capture-form.html` into your site.
- **Turn on the safety switches** (Supabase dashboard): 2-factor login, daily backups,
  leaked-password protection. And change the temp password `Sunrise#Temp2026` in the app's Settings.

## Logins for the team (once live)
- Steve — steve@sunrisecaravans.com.au (Owner — sees everything)
- Mel — mel@sunrisecaravans.com.au (Sales Manager)
- Anita — anita@sunrisecaravans.com.au (Sales)
- Temporary password for all three: `Sunrise#Temp2026` — change it on first login (Settings → Change password).
