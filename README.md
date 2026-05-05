# Sunrise CRM

Custom-built CRM for Sunrise Caravans — caravan dealership operations, lead pipeline, inventory, quotes, service jobs, deliveries, finance, and post-sale upsell journeys.

**Stack**
- React 18 (single-file `SunriseCRM.jsx` v9)
- Supabase (Postgres + Auth + RLS) — Sydney region
- Cloudflare Workers — lead scoring + Supabase insert
- Make.com — workflow automation engine
- Oncord tracking snippet — auto-captures website enquiries

## Live infrastructure

| Piece | Value |
|---|---|
| Supabase URL | `https://nubttdudughlriajikrr.supabase.co` |
| Supabase region | `ap-southeast-2` (Sydney) |
| GitHub repo | https://github.com/sunrisecaravans-cell/sunrise-crm |

## What's in this folder

| File | Purpose |
|---|---|
| `SunriseCRM.jsx` | The full 15-page React app |
| `supabase_schema.sql` | Original DB schema (already deployed; superseded by live state) |
| `sunrise-lead-worker.js` | Cloudflare Worker — scores website leads and posts to Supabase |
| `oncord-crm-snippet.js` | JS snippet for Oncord pages — captures visitor data |
| `SETUP-GUIDE.md` | Full setup walkthrough |
| `Sunrise_Reactivation_Leads.xlsx` | 47-contact reactivation list with caravan models tagged |
| `Sunrise_Reactivation_Emails_Batch1.docx` | First 20 personalised reactivation emails |
| `Make.com_Webhook_Setup_Guide.docx` | Webhook setup instructions for Make.com |

## Status (May 2026)

- ✅ Database deployed with 13 tables (10 original + 3 new: `products`, `customer_journeys`, `commissions`)
- ✅ 1,237 customers imported from Oncord export
- ✅ 12 upsell products seeded (insurance, warranty, annexes, accessories)
- ✅ All app-required columns present
- ⏳ React app not yet deployed — see SETUP-GUIDE
- ⏳ Cloudflare Worker not yet deployed — paste `sunrise-lead-worker.js` into dashboard
- ⏳ Make.com webhook URL — pending

## Deploy in 30 minutes

See `SETUP-GUIDE.md`. Short version:
1. Sign in to Vercel with GitHub → import this repo → Deploy
2. Open the live URL → Settings → paste Supabase URL + anon key → Connect
3. Paste `sunrise-lead-worker.js` into a new Cloudflare Worker → set `SUPABASE_URL` and `SUPABASE_KEY` env vars

## Security

- All tables have Row-Level Security enabled (currently permissive `allow all` — tighten with Supabase Auth before going public)
- Anon key is publicly safe (frontend-friendly, RLS-gated)
- Service-role key MUST never be committed
- HTTPS automatic via Vercel + Cloudflare
- Customer data stays in Sydney region for Australian Privacy Act compliance
