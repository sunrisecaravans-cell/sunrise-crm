// ═══════════════════════════════════════════════════════════════════════════════
// SUNRISE CARAVANS — Oncord → CRM Integration Snippet
//
// WHAT THIS DOES:
// Listens for product enquiry form submissions on your Oncord site.
// When someone submits an enquiry, it sends their details to your
// Cloudflare Worker which auto-scores the lead and pushes it into
// your Supabase CRM database — in real time.
//
// HOW TO INSTALL:
// 1. Log into your Oncord admin
// 2. Go to Settings → Website → Header/Footer Code (or Custom Scripts)
// 3. Paste this entire script inside a <script> tag
// 4. Replace YOUR_WORKER_URL with your actual Cloudflare Worker URL
// 5. Save
//
// The form still works normally — Oncord still sends the email to
// sales@sunrisecaravans.com.au as usual. This just ALSO sends
// the data to your CRM. Belt and braces.
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  // ─── CONFIG ──────────────────────────────────────────────────────────────
  var WORKER_URL = "YOUR_WORKER_URL/lead";
  // Replace with your actual Cloudflare Worker URL, e.g.:
  // "https://sunrise-lead-scorer.steve-a.workers.dev/lead"

  // ─── GRAB UTM PARAMS FROM URL ────────────────────────────────────────────
  function getParam(name) {
    var match = window.location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  // ─── LISTEN FOR FORM SUBMIT ──────────────────────────────────────────────
  document.addEventListener("submit", function(e) {
    var form = e.target;

    // Only intercept Oncord product enquiry forms
    if (form.id !== "product_enquiry_form") return;

    // Grab form field values
    var firstName = (form.querySelector('[name="contact_first_name"]') || {}).value || "";
    var lastName = (form.querySelector('[name="contact_last_name"]') || {}).value || "";
    var email = (form.querySelector('[name="contact_email"]') || {}).value || "";
    var phone = (form.querySelector('[name="contact_phone"]') || {}).value || "";
    var caravan = (form.querySelector('[name="contact_caravan"]') || {}).value || "";

    // Don't send if no name or email
    if (!firstName && !email) return;

    // Build the payload matching our Cloudflare Worker's expected format
    var payload = {
      name: firstName + (lastName ? " " + lastName : ""),
      email: email,
      phone: phone,
      interest: caravan,
      message: "Product enquiry for " + caravan + " via sunrisecaravans.com.au",

      // Page and source tracking
      page_url: window.location.href,
      referrer: document.referrer || "",
      utm_source: getParam("utm_source"),
      utm_medium: getParam("utm_medium"),
      utm_campaign: getParam("utm_campaign"),
      gclid: getParam("gclid"),

      // Oncord-specific metadata
      source_platform: "oncord",
      form_id: "product_enquiry_form",
      submitted_at: new Date().toISOString()
    };

    // ─── SEND TO CLOUDFLARE WORKER (async, non-blocking) ─────────────────
    // This runs in the background — doesn't slow down or block the
    // normal Oncord form submission. The customer won't notice a thing.
    if (WORKER_URL && WORKER_URL !== "YOUR_WORKER_URL/lead") {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", WORKER_URL, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(payload));
      } catch (err) {
        // Silent fail — don't break the normal form submission
        console.log("CRM sync error:", err);
      }
    }

    // Let the normal Oncord form submission continue as usual
    // (this function doesn't call e.preventDefault())

  }, true); // useCapture = true to fire before other handlers

  // ─── ALSO TRACK "BOOK A TOUR" / "CONTACT US" CLICKS ─────────────────────
  // Since those pages don't have forms, track phone/email clicks as leads
  document.addEventListener("click", function(e) {
    var link = e.target.closest("a");
    if (!link) return;

    var href = link.href || "";

    // Track phone call clicks
    if (href.indexOf("tel:") === 0) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", WORKER_URL.replace("/lead", "/lead"), true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({
          name: "Phone Enquiry",
          phone: href.replace("tel:", "").replace("+61", "0"),
          message: "Clicked phone number on " + window.location.pathname,
          page_url: window.location.href,
          utm_source: getParam("utm_source"),
          utm_medium: getParam("utm_medium"),
          source_platform: "oncord",
          interaction_type: "phone_click"
        }));
      } catch (err) {}
    }

    // Track email clicks
    if (href.indexOf("mailto:sales@") === 0) {
      try {
        var xhr2 = new XMLHttpRequest();
        xhr2.open("POST", WORKER_URL.replace("/lead", "/lead"), true);
        xhr2.setRequestHeader("Content-Type", "application/json");
        xhr2.send(JSON.stringify({
          name: "Email Enquiry",
          email: "sales@sunrisecaravans.com.au",
          message: "Clicked email link on " + window.location.pathname,
          page_url: window.location.href,
          utm_source: getParam("utm_source"),
          utm_medium: getParam("utm_medium"),
          source_platform: "oncord",
          interaction_type: "email_click"
        }));
      } catch (err) {}
    }
  }, true);

})();
