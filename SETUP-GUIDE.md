# Sunrise CRM v9 — Setup Guide

## What You've Got

Three files that work together:

1. **SunriseCRM.jsx** — Your full CRM app (14 pages, auto-scoring ready)
2. **supabase_schema.sql** — Database setup script for Supabase
3. **sunrise-lead-worker.js** — Cloudflare Worker that scores website leads and pushes them into the CRM

---

## Step 1: Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and open your project (or create one)
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click **Run** — this creates all 9 tables and loads your demo data
6. Go to **Settings → API** and copy your:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 2: Connect the CRM to Supabase

1. Open the CRM and go to **Settings**
2. Paste your Supabase URL and anon key
3. Click **Save** — you should see the green "Connected" badge appear
4. Your data now persists. Close the tab, reopen, everything's still there.

## Step 3: Deploy the Lead Scoring Worker (10 minutes)

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** → **Create** → **Create Worker**
3. Name it something like `sunrise-lead-scorer`
4. Click **Deploy** (don't worry about the default code)
5. Click **Edit Code** and replace everything with the contents of `sunrise-lead-worker.js`
6. Click **Deploy**
7. Go to the Worker's **Settings → Variables and Secrets** and add:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_KEY` = your Supabase anon key
8. Your worker is now live at: `https://sunrise-lead-scorer.your-subdomain.workers.dev`

### Test it works

Open a terminal or use a tool like Postman and send:

```bash
curl -X POST https://sunrise-lead-scorer.your-subdomain.workers.dev/score-test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bloke",
    "email": "test@email.com",
    "phone": "0412 345 678",
    "message": "Hey mate, keen to check out the Wildtrekker 19ft8. What sort of price are we looking at? Got a Jayco to trade in.",
    "utm_source": "facebook"
  }'
```

You should get back something like:

```json
{
  "score": 95,
  "status": "Hot Lead",
  "reasons": ["Mentioned model: Wildtrekker 19ft8", "Finance/price enquiry", "Trade-in mentioned", "Phone number provided", "Paid ad traffic"],
  "source": "Facebook Ad",
  "assigned_to": "Steve"
}
```

## Step 4: Connect WordPress (depends on your form plugin)

### Option A: Contact Form 7

Install the free plugin **Contact Form 7 to Webhook** (or CF7 Webhook).

1. Install and activate the plugin
2. Edit your contact form
3. Go to the **Webhook** tab
4. Set the URL to: `https://sunrise-lead-scorer.your-subdomain.workers.dev/lead`
5. Method: POST
6. Format: JSON

Add these hidden fields to your form template to capture UTM data:

```
[hidden utm_source default:get]
[hidden utm_medium default:get]
[hidden utm_campaign default:get]
[hidden gclid default:get]
[hidden page_url default:shortcode_attr]
```

And add this to your form's Additional Settings:
```
on_submit: "document.querySelector('[name=page_url]').value = window.location.href;"
```

### Option B: WPForms

1. Go to **WPForms → Settings → Integrations**
2. If you have WPForms Pro, use the Webhooks addon
3. Or install the free plugin **WPForms Webhook**
4. Set webhook URL to: `https://sunrise-lead-scorer.your-subdomain.workers.dev/lead`
5. Map your form fields to: `name`, `email`, `phone`, `message`

### Option C: Gravity Forms

1. Install the **Gravity Forms Webhooks** addon
2. Add a new feed on your form
3. Request URL: `https://sunrise-lead-scorer.your-subdomain.workers.dev/lead`
4. Method: POST
5. Format: JSON
6. Map fields: name, email, phone, message

### Option D: Any Plugin (Generic)

If you use Elementor, Ninja Forms, or anything else — you just need a way to POST form data as JSON to:

```
https://sunrise-lead-scorer.your-subdomain.workers.dev/lead
```

Most form plugins support webhooks or Zapier. If yours doesn't, install the free **WP Webhooks** plugin which works with any form.

## Step 5: Add UTM Tracking to Your Ads (Important!)

For the lead scoring to know where people came from, your Facebook and Google ad URLs need UTM parameters:

**Facebook Ads:**
```
https://sunrisecaravans.com.au/contact/?utm_source=facebook&utm_medium=cpc&utm_campaign=wildtrekker-promo
```

**Google Ads:**
Google auto-adds `gclid` if auto-tagging is on (it usually is). The worker detects this automatically.

**Gumtree / Caravan World / Other:**
```
https://sunrisecaravans.com.au/contact/?utm_source=gumtree&utm_medium=listing
https://sunrisecaravans.com.au/contact/?utm_source=caravanworld&utm_medium=magazine
```

---

## How The Scoring Works

Every enquiry gets scored on a point system:

| Signal | Points |
|--------|--------|
| Mentions specific van model | +25 |
| Asks about price/finance/deposit | +20 |
| Mentions trade-in | +20 |
| Phone number provided | +15 |
| Urgency words ("ready", "soon", "keen") | +15 |
| Came from a product page | +15 |
| Requests booking/inspection | +15 |
| Stock/availability question | +10 |
| Lifestyle mention (family, retirement) | +10 |
| Paid ad traffic (Facebook/Google) | +10 |
| Returning contact | +10 |
| Low intent ("just looking") | -5 |

**Score thresholds:**
- **50+ = Hot Lead** → Assigned to Steve, follow up today
- **25–49 = Warm Lead** → Round-robin assignment, follow up in 2 days
- **0–24 = Cold Lead** → Round-robin assignment, follow up in 5 days

The score and reasoning are saved in the customer's notes field so you can see exactly why they were scored that way.

---

## What Happens When Someone Fills Out Your Form

1. Customer submits enquiry on sunrisecaravans.com.au
2. WordPress fires webhook to your Cloudflare Worker
3. Worker scores the lead across 12 signals
4. Worker detects the source (Facebook Ad, Google Ad, Website, etc.)
5. Worker assigns a sales rep (hot leads → Steve, others rotate)
6. Worker sets a follow-up date based on lead temperature
7. Worker inserts the customer into Supabase
8. CRM shows the new lead with score, source, and assignment
9. Notification bell pings if it's a hot lead

All of this happens in under 200ms.

---

## Optional: Hot Lead Email Alerts

The worker has a commented-out section for MailChannels email notifications. To enable:

1. Uncomment the `notifyHotLead` function in the worker code
2. Uncomment the call in the main handler
3. Set up MailChannels DNS records (free on Cloudflare — Google "MailChannels Cloudflare Workers")
4. Steve gets an instant email every time a hot lead comes in

---

## Troubleshooting

**"Not connected" in CRM Settings**
→ Check your Supabase URL and key are correct. The URL should NOT have a trailing slash.

**Form submissions not appearing in CRM**
→ Test the worker directly with curl (Step 3). If that works, the issue is your WordPress webhook setup.

**All leads scoring as Cold**
→ Make sure your form is sending the `message` field. The scorer needs the message text to detect buying signals.

**Wrong source detected**
→ Add UTM parameters to your ad URLs (Step 5). Without them, everything shows as "Website".
