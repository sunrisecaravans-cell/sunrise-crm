// ═══════════════════════════════════════════════════════════════════════════════
// SUNRISE CARAVANS — Lead Scoring Cloudflare Worker
// WordPress Contact Form → Auto-Score → Supabase CRM
//
// Deploy: Cloudflare Dashboard → Workers → Create Worker → Paste this code
// Set environment variables: SUPABASE_URL, SUPABASE_KEY
// Point your WordPress form webhook to: https://your-worker.your-subdomain.workers.dev/lead
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// All Sunrise/Sunset/Blue Sky van models for matching
const VAN_MODELS = [
  "Wildtrekker 19ft8", "Wildtrekker", "Family Haven 18ft9", "Family Haven",
  "Family Horizon 23ft", "Family Horizon", "Sapphire 21ft", "Sapphire",
  "Red Centre", "Platinum 17ft", "Platinum",
  "Sunset", "Sunrise", "Blue Sky",
];

// Lead sources mapped from UTM or referrer
const UTM_SOURCE_MAP = {
  "facebook": "Facebook Ad",
  "fb": "Facebook Ad",
  "google": "Google Ad",
  "gclid": "Google Ad",
  "instagram": "Facebook Ad",
  "gumtree": "Gumtree",
  "caravanworld": "Caravan World",
};

// Sales team for round-robin assignment
const SALES_TEAM = ["Steve", "Mel", "Anita"];
let assignmentIndex = 0; // Rotates per worker instance

// ─── SCORING ENGINE ──────────────────────────────────────────────────────────
function scoreLead(data) {
  let points = 0;
  const reasons = [];
  const msg = (data.message || "").toLowerCase();
  const name = (data.name || "").toLowerCase();
  const allText = `${msg} ${data.subject || ""} ${data.interest || ""}`.toLowerCase();

  // 1. Specific model mentioned (+25)
  const matchedModel = VAN_MODELS.find(m => allText.includes(m.toLowerCase()));
  if (matchedModel) {
    points += 25;
    reasons.push(`Mentioned model: ${matchedModel}`);
  }

  // 2. Price/finance/deposit signals (+20)
  const financeWords = ["price", "cost", "finance", "deposit", "repayment", "loan", "budget", "afford", "payment", "how much"];
  if (financeWords.some(w => allText.includes(w))) {
    points += 20;
    reasons.push("Finance/price enquiry");
  }

  // 3. Trade-in mentioned (+20)
  const tradeWords = ["trade", "trade-in", "tradein", "swap", "selling my", "current van", "got a"];
  if (tradeWords.some(w => allText.includes(w))) {
    points += 20;
    reasons.push("Trade-in mentioned");
  }

  // 4. Phone number provided (+15)
  if (data.phone && data.phone.replace(/\s/g, "").length >= 8) {
    points += 15;
    reasons.push("Phone number provided");
  }

  // 5. Urgency signals (+15)
  const urgencyWords = ["ready", "soon", "this week", "this month", "asap", "today", "tomorrow", "keen", "when can", "available now", "in stock"];
  if (urgencyWords.some(w => allText.includes(w))) {
    points += 15;
    reasons.push("Urgency detected");
  }

  // 6. Came from a product page (+15)
  const pageUrl = (data.page_url || data.referrer || "").toLowerCase();
  if (pageUrl.includes("/products/") || pageUrl.includes("/sunset-") || pageUrl.includes("/sunrise-") || pageUrl.includes("/blue-sky")) {
    points += 15;
    reasons.push("Enquired from product page");
  }

  // 7. Stock/availability questions (+10)
  const stockWords = ["stock", "available", "availability", "have you got", "do you have", "any left", "how many"];
  if (stockWords.some(w => allText.includes(w))) {
    points += 10;
    reasons.push("Stock/availability query");
  }

  // 8. Lifestyle signals — family, grey nomads, retirement (+10)
  const lifeWords = ["family", "kids", "children", "retire", "retirement", "grey nomad", "lap of oz", "lap of australia", "full time", "travelling", "trip", "bunk"];
  if (lifeWords.some(w => allText.includes(w))) {
    points += 10;
    reasons.push("Lifestyle/family mention");
  }

  // 9. Paid ad source (+10)
  const utmSource = (data.utm_source || "").toLowerCase();
  const utmMedium = (data.utm_medium || "").toLowerCase();
  if (utmMedium === "cpc" || utmMedium === "paid" || utmSource === "facebook" || utmSource === "google" || data.gclid) {
    points += 10;
    reasons.push("Paid ad traffic");
  }

  // 10. Repeat visitor / returning customer signals (+10)
  const repeatWords = ["came back", "visited", "was in", "spoke to", "called", "saw your", "met you at"];
  if (repeatWords.some(w => allText.includes(w))) {
    points += 10;
    reasons.push("Returning/repeat contact");
  }

  // 11. Booking/inspection request (+15)
  const bookingWords = ["book", "inspect", "look at", "come in", "visit", "test drive", "walk through", "viewing", "appointment"];
  if (bookingWords.some(w => allText.includes(w))) {
    points += 15;
    reasons.push("Requested booking/inspection");
  }

  // 12. Low-intent penalty (-5)
  const lowIntent = ["just looking", "just browsing", "no rush", "maybe next year", "not ready", "just curious"];
  if (lowIntent.some(w => allText.includes(w))) {
    points -= 5;
    reasons.push("Low intent detected (-5)");
  }

  // Score → Status
  let status;
  if (points >= 50) status = "Hot Lead";
  else if (points >= 25) status = "Warm Lead";
  else status = "Cold Lead";

  return { points, status, reasons, matchedModel };
}

// ─── LEAD SOURCE DETECTION ───────────────────────────────────────────────────
function detectSource(data) {
  const utmSource = (data.utm_source || "").toLowerCase();
  const utmMedium = (data.utm_medium || "").toLowerCase();
  const referrer = (data.referrer || "").toLowerCase();

  // Check UTM params first
  for (const [key, value] of Object.entries(UTM_SOURCE_MAP)) {
    if (utmSource.includes(key)) return value;
  }
  if (data.gclid) return "Google Ad";
  if (utmMedium === "cpc" || utmMedium === "paid") return "Google Ad";

  // Check referrer
  if (referrer.includes("facebook.com") || referrer.includes("fb.com")) return "Facebook Ad";
  if (referrer.includes("google.com") || referrer.includes("google.com.au")) return "Google Ad";
  if (referrer.includes("gumtree.com.au")) return "Gumtree";

  // Default
  return "Website";
}

// ─── ROUND-ROBIN ASSIGNMENT ──────────────────────────────────────────────────
function assignRep(status) {
  // Hot leads always go to Steve
  if (status === "Hot Lead") return "Steve";
  // Others rotate
  const rep = SALES_TEAM[assignmentIndex % SALES_TEAM.length];
  assignmentIndex++;
  return rep;
}

// ─── SUPABASE INSERT ─────────────────────────────────────────────────────────
async function insertToSupabase(env, customer) {
  const url = env.SUPABASE_URL || "https://nubttdudughlriajikrr.supabase.co";
  const key = env.SUPABASE_KEY || "";

  if (!url || !key) {
    console.error("Missing Supabase credentials");
    return null;
  }

  const res = await fetch(`${url}/rest/v1/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(customer),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase insert failed:", err);
    return null;
  }

  const result = await res.json();
  return result;
}

// ─── NOTIFICATION EMAIL (optional) ──────────────────────────────────────────
// If you add MailChannels or SendGrid, uncomment this to email Steve on hot leads
/*
async function notifyHotLead(env, customer, score) {
  // MailChannels API (free on Cloudflare Workers)
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: "steve@sunrisecaravans.com.au", name: "Steve" }] }],
      from: { email: "crm@sunrisecaravans.com.au", name: "Sunrise CRM" },
      subject: `🔥 HOT LEAD: ${customer.name} — ${customer.interest || "General Enquiry"}`,
      content: [{
        type: "text/plain",
        value: `New hot lead scored ${score.points} points!\n\nName: ${customer.name}\nPhone: ${customer.phone}\nEmail: ${customer.email}\nInterest: ${customer.interest}\nSource: ${customer.source}\nScore reasons: ${score.reasons.join(", ")}\n\nCheck the CRM: https://your-crm-url.com`
      }],
    }),
  });
}
*/

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── Health check ──
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "Sunrise CRM Lead Scoring Worker",
        version: "1.0",
        endpoints: ["/lead", "/score-test", "/health"],
      }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── Score test (dry run — doesn't insert to DB) ──
    if (url.pathname === "/score-test" && request.method === "POST") {
      try {
        const data = await request.json();
        const score = scoreLead(data);
        const source = detectSource(data);
        const assigned = assignRep(score.status);

        return new Response(JSON.stringify({
          score: score.points,
          status: score.status,
          reasons: score.reasons,
          source,
          assigned_to: assigned,
          matched_model: score.matchedModel || null,
          message: "Dry run — not inserted to CRM",
        }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    // ── Main lead endpoint ──
    if (url.pathname === "/lead" && request.method === "POST") {
      try {
        let data;
        const contentType = request.headers.get("Content-Type") || "";

        // Handle both JSON and form-encoded data (WordPress sends form-encoded)
        if (contentType.includes("application/json")) {
          data = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          data = {};
          for (const [key, value] of formData.entries()) {
            data[key] = value;
          }
        } else {
          // Try JSON anyway
          data = await request.json();
        }

        // ── Normalise field names ──
        // WordPress forms can have weird field names. Map common ones.
        const normalised = {
          name: data.name || data.your_name || data["your-name"] || data.full_name || data.fullname || "",
          email: data.email || data.your_email || data["your-email"] || data.mail || "",
          phone: data.phone || data.your_phone || data["your-phone"] || data.tel || data.mobile || "",
          message: data.message || data.your_message || data["your-message"] || data.enquiry || data.comments || data.comment || "",
          interest: data.interest || data.van_model || data["van-model"] || data.model || data.caravan || "",
          subject: data.subject || data["your-subject"] || data._wpcf7_container_post || "",
          // Hidden fields from WordPress
          page_url: data.page_url || data._wp_http_referer || data.referrer || "",
          utm_source: data.utm_source || "",
          utm_medium: data.utm_medium || "",
          utm_campaign: data.utm_campaign || "",
          gclid: data.gclid || "",
          referrer: data.referrer || data._wp_http_referer || "",
        };

        // ── Score the lead ──
        const score = scoreLead(normalised);
        const source = detectSource(normalised);
        const assignedTo = assignRep(score.status);

        // ── Build customer record ──
        const today = new Date().toISOString().split("T")[0];
        const followUpDays = score.status === "Hot Lead" ? 0 : score.status === "Warm Lead" ? 2 : 5;
        const followUp = new Date(Date.now() + followUpDays * 86400000).toISOString().split("T")[0];

        const customer = {
          name: normalised.name || "Website Enquiry",
          email: normalised.email || null,
          phone: normalised.phone || null,
          status: score.status,
          interest: score.matchedModel
            ? VAN_MODELS.find(m => m.toLowerCase() === score.matchedModel.toLowerCase()) || normalised.interest || "General Enquiry"
            : normalised.interest || "General Enquiry",
          value: 0, // Will be updated by sales team
          last_contact: today,
          notes: `[AUTO] ${normalised.message}\n\n--- Lead Score: ${score.points}pts (${score.reasons.join(", ")})`,
          follow_up: followUp,
          source: source,
          assigned_to: assignedTo,
        };

        // ── Insert to Supabase ──
        const result = await insertToSupabase(env, customer);

        // ── Notify on hot leads (uncomment notifyHotLead above to enable) ──
        // if (score.status === "Hot Lead") await notifyHotLead(env, customer, score);

        return new Response(JSON.stringify({
          success: true,
          score: score.points,
          status: score.status,
          assigned_to: assignedTo,
          source: source,
          reasons: score.reasons,
          customer_id: result?.[0]?.id || null,
          follow_up: followUp,
          message: result ? "Lead scored and saved to CRM" : "Lead scored but CRM insert failed — check Supabase keys",
        }), {
          status: result ? 201 : 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });

      } catch (err) {
        console.error("Worker error:", err);
        return new Response(JSON.stringify({
          error: "Failed to process lead",
          detail: err.message,
        }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    // ── 404 ──
    return new Response(JSON.stringify({ error: "Not found", endpoints: ["/lead", "/score-test", "/health"] }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  },
};
