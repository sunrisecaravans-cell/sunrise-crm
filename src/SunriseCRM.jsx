import { useState, useRef, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { signIn, signOut, changePassword, loadProfile, loadTable, insertRow, updateRow, softDeleteCustomer, logExport, supabase } from "./lib/supabase";

// ═══════════════════════════════════════════════════════════════════════════════
// SUNRISE CRM v9 — Supabase Persistence Layer
// Built for Sunrise Caravans & Sunset Caravans
// Calendar • Deliveries • Lead Sources • Leaderboard • Templates • Margins
// ═══════════════════════════════════════════════════════════════════════════════

// ─── DATA LAYER ──────────────────────────────────────────────────────────────
// Real Supabase Auth + data access live in ./lib/supabase.js
// (signIn, loadTable, insertRow, updateRow, softDeleteCustomer, logExport, …).
// Every call runs as the logged-in user, so RLS decides what is allowed.

// ─── COLOUR PALETTE ──────────────────────────────────────────────────────────
const C = {
  navy: "#1A2B4A", navyLight: "#243a63", navyDark: "#111d33",
  orange: "#FF6B00", orangeHover: "#e55f00",
  bg: "#f2f5fa", white: "#ffffff",
  text: "#1A2B4A", textMid: "#4a5a7a", textLight: "#8a9ab8",
  border: "#dde4ef", green: "#22c55e", red: "#ef4444", amber: "#f59e0b", purple: "#8b5cf6",
  blue: "#3b82f6", teal: "#14b8a6", pink: "#ec4899",
};
const SC = { "Hot Lead": "#ef4444", "Warm Lead": "#f59e0b", "Cold Lead": "#94a3b8", "Negotiating": "#8b5cf6", "Won": "#22c55e", "Lost": "#64748b" };
const PS = ["Hot Lead", "Warm Lead", "Cold Lead", "Negotiating", "Won", "Lost"];
const LEAD_SOURCES = ["Website", "Facebook Ad", "Google Ad", "Walk-In", "Referral", "Caravan Show", "Caravan World", "Gumtree", "Phone Enquiry", "Other"];
const SOURCE_COLORS = { "Website": "#3b82f6", "Facebook Ad": "#1877f2", "Google Ad": "#ea4335", "Walk-In": "#22c55e", "Referral": "#8b5cf6", "Caravan Show": "#f59e0b", "Caravan World": "#14b8a6", "Gumtree": "#65a30d", "Phone Enquiry": "#ec4899", "Other": "#94a3b8" };

// ─── MAKE.COM WEBHOOK CONFIG ──────────────────────────────────────────────────
const MAKE_WEBHOOK = "YOUR_MAKE_COM_WEBHOOK_URL";

// ─── DEMO DATA (with source, assigned_to, cost_price) ────────────────────────
const DC = [
  { id: 1, name: "James Hartley", email: "james.h@email.com", phone: "0412 345 678", status: "Hot Lead", interest: "Sunset Wildtrekker 19ft8", value: 109900, last_contact: "2026-03-28", notes: "Family of 4, wants ATM info", follow_up: "2026-04-03", source: "Facebook Ad", assigned_to: "Steve" },
  { id: 2, name: "Sandra Nguyen", email: "sandra.n@email.com", phone: "0423 456 789", status: "Negotiating", interest: "Blue Sky Sapphire 21ft", value: 89900, last_contact: "2026-03-30", notes: "Comparing with competitor", follow_up: "2026-04-02", source: "Website", assigned_to: "Mel" },
  { id: 3, name: "Peter Walsh", email: "peter.w@email.com", phone: "0434 567 890", status: "Won", interest: "Sunset Family Haven 18ft9", value: 94900, last_contact: "2026-03-25", notes: "Sold! Delivery booked", follow_up: null, source: "Walk-In", assigned_to: "Steve" },
  { id: 4, name: "Laura Simmons", email: "laura.s@email.com", phone: "0445 678 901", status: "Cold Lead", interest: "Sunset Family Horizon 23ft", value: 119900, last_contact: "2026-03-10", notes: "Enquired online, no reply", follow_up: "2026-04-05", source: "Google Ad", assigned_to: "Anita" },
  { id: 5, name: "Michael Chen", email: "m.chen@email.com", phone: "0456 789 012", status: "Hot Lead", interest: "Blue Sky Sapphire 21ft", value: 89900, last_contact: "2026-04-01", notes: "Retiring soon, ready to buy", follow_up: "2026-04-04", source: "Referral", assigned_to: "Steve" },
  { id: 6, name: "Tracey Burns", email: "tracey.b@email.com", phone: "0467 890 123", status: "Warm Lead", interest: "Sunset Wildtrekker 19ft8", value: 109900, last_contact: "2026-03-29", notes: "First time buyer", follow_up: "2026-04-06", source: "Caravan Show", assigned_to: "Mel" },
  { id: 7, name: "David Okafor", email: "d.okafor@email.com", phone: "0478 901 234", status: "Won", interest: "Sunset Family Haven 18ft9", value: 94900, last_contact: "2026-03-20", notes: "Repeat customer", follow_up: null, source: "Referral", assigned_to: "Anita" },
  { id: 8, name: "Fiona Marshall", email: "fiona.m@email.com", phone: "0489 012 345", status: "Negotiating", interest: "Sunset Family Horizon 23ft", value: 119900, last_contact: "2026-03-31", notes: "Wants extended warranty", follow_up: "2026-04-03", source: "Website", assigned_to: "Steve" },
];
const DI = [
  { id: 1, model: "Sunset Wildtrekker 19ft8", year: 2026, status: "Available", price: 109900, cost_price: 82000, stock: 3, features: "Off-road, Solar 200W, Lithium 100Ah" },
  { id: 2, model: "Sunset Family Haven 18ft9", year: 2026, status: "Reserved", price: 94900, cost_price: 68000, stock: 1, features: "Ensuite, Air Con, Bunk beds" },
  { id: 3, model: "Sunset Family Horizon 23ft", year: 2026, status: "Available", price: 119900, cost_price: 89000, stock: 2, features: "Rear lounge, 3 zone AC, 300Ah lithium" },
  { id: 4, model: "Blue Sky Sapphire 21ft", year: 2026, status: "Available", price: 89900, cost_price: 64000, stock: 4, features: "Australian made, Airbag suspension, Victron" },
];
const DT = [
  { id: 1, customer_name: "Sandra Nguyen", van_make: "Jayco", van_model: "Journey 17", year: 2019, condition: "Good", est_value: 28000, notes: "Some wear on annexe" },
  { id: 2, customer_name: "Michael Chen", van_make: "Coromal", van_model: "Element 511S", year: 2018, condition: "Fair", est_value: 22000, notes: "Fridge not working" },
];
const DS = [
  { id: 1, customer_name: "Peter Walsh", van_model: "Sunset Family Haven 18ft9", job_type: "Warranty", description: "Water ingress rear tunnel boot", status: "In Progress", booked_date: "2026-04-02", hours: 8, rate: 140 },
  { id: 2, customer_name: "David Okafor", van_model: "Sunset Family Haven 18ft9", job_type: "Service", description: "Annual service and brake check", status: "Booked", booked_date: "2026-04-05", hours: 3, rate: 140 },
  { id: 3, customer_name: "Tracey Burns", van_model: "Sunset Wildtrekker 19ft8", job_type: "PDI", description: "Pre-delivery inspection", status: "Completed", booked_date: "2026-03-28", hours: 2, rate: 140 },
];
const DD = [
  { id: 1, customer_name: "Peter Walsh", van_model: "Sunset Family Haven 18ft9", status: "PDI Complete", pdi_date: "2026-04-02", delivery_date: "2026-04-10", checklist: { pdi: true, cleaned: true, gas: false, rego: true, insurance: false, walkthrough: false }, notes: "Customer picking up Saturday morning" },
  { id: 2, customer_name: "David Okafor", van_model: "Sunset Family Haven 18ft9", status: "Scheduled", pdi_date: "2026-04-05", delivery_date: "2026-04-12", checklist: { pdi: false, cleaned: false, gas: false, rego: true, insurance: true, walkthrough: false }, notes: "Repeat customer, knows the drill" },
];

const EMAIL_TEMPLATES = [
  { id: 1, name: "First Enquiry Response", category: "Lead", subject: "Thanks for your enquiry — {van_model}", body: `Hi {first_name},\n\nThanks for reaching out about the {van_model}. Great choice — it's one of our most popular models.\n\nI'd love to have a yarn about what you're looking for and make sure it's the right fit. Are you free for a quick call this week, or would you prefer to come down to the yard for a look?\n\nWe're at 290 Eastern Service Rd, Burpengary — open 7 days.\n\nCheers,\nSteve\nSunrise Caravans\n(07) 3888 4455` },
  { id: 2, name: "Quote Follow Up", category: "Sales", subject: "Following up on your {van_model} quote", body: `Hey {first_name},\n\nJust touching base on the quote I sent through for the {van_model}.\n\nHave you had a chance to look it over? Happy to answer any questions or chat through the numbers. If you want to pop in for another look, we've still got {stock} in stock.\n\nNo pressure at all — just don't want you to miss out.\n\nCheers,\nSteve\nSunrise Caravans\n0483 922 811` },
  { id: 3, name: "Post-Sale Thank You", category: "After Sale", subject: "Welcome to the Sunrise family!", body: `Hey {first_name},\n\nJust wanted to say a massive congrats on the new {van_model}! You've made an awesome choice.\n\nA few things for your records:\n- Your warranty starts from delivery date\n- First service is due at 3 months or 5,000km\n- If anything comes up, call us on (07) 3888 4455\n\nWe'd really appreciate if you could leave us a Google review when you get a chance — it helps other families find us.\n\nHappy travels!\nSteve & the Sunrise team` },
  { id: 4, name: "Service Reminder", category: "Service", subject: "Time for a service on your {van_model}", body: `Hi {first_name},\n\nHope you're getting plenty of use out of the {van_model}!\n\nJust a friendly heads up — it's about time for a service. We recommend a full check every 12 months or 10,000km to keep everything running sweet.\n\nWe can usually book you in within the week. Give us a call on (07) 3888 4455 or reply to this email and we'll sort a time.\n\nCheers,\nSunrise Caravans Service Team` },
  { id: 5, name: "Cold Lead Re-engagement", category: "Lead", subject: "Still thinking about a caravan?", body: `Hey {first_name},\n\nSteve from Sunrise Caravans here. You had a look at the {van_model} a little while back — just wanted to check in and see if you're still in the market?\n\nWe've got some great stock in right now and a few things have changed since we last spoke. Happy to give you an updated price if you're interested.\n\nNo worries if the timing's not right — just wanted you to know we're here when you're ready.\n\nCheers,\nSteve\n0483 922 811` },
  { id: 6, name: "Finance Approval", category: "Finance", subject: "Great news — your finance is approved!", body: `Hey {first_name},\n\nGreat news! Your finance application for the {van_model} has been approved through {lender}.\n\nHere are the key details:\n- Loan amount: {loan_amount}\n- Monthly repayment: {monthly}\n- Term: {term}\n\nNext steps — we need to lock in a delivery date and get you booked in for a handover walkthrough.\n\nGive me a call when you're free and we'll get the ball rolling.\n\nCheers,\nSteve\nSunrise Caravans` },
];

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:${C.bg};color:${C.text}}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
  input,textarea,select{font-family:'DM Sans',sans-serif;border:1.5px solid ${C.border};border-radius:8px;padding:9px 12px;font-size:14px;color:${C.text};background:white;outline:none;width:100%;transition:border .2s}
  input:focus,textarea:focus,select:focus{border-color:${C.orange}}
  button{cursor:pointer;font-family:'DM Sans',sans-serif}
  .card{background:white;border-radius:14px;padding:20px;border:1px solid ${C.border};box-shadow:0 2px 8px rgba(26,43,74,.05)}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-size:14px;font-weight:600;border:none;transition:all .15s}
  .btn-primary{background:${C.orange};color:white}.btn-primary:hover{background:${C.orangeHover}}
  .btn-navy{background:${C.navy};color:white}.btn-navy:hover{background:${C.navyLight}}
  .btn-ghost{background:transparent;color:${C.textMid};border:1.5px solid ${C.border}}.btn-ghost:hover{border-color:${C.orange};color:${C.orange}}
  .btn-danger{background:#fee2e2;color:#ef4444}.btn-green{background:#dcfce7;color:#16a34a}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;color:white}
  .modal-overlay{position:fixed;inset:0;background:rgba(26,43,74,.55);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
  .modal-content{background:white;border-radius:14px;padding:30px;width:100%;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 25px rgba(0,0,0,.15)}
  .modal-title{font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:20px;color:${C.text}}
  .modal-close{position:absolute;top:20px;right:20px;background:${C.border};border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${C.text};font-size:18px;transition:all .2s}
  .modal-close:hover{background:${C.orange};color:white}
  .toast{position:fixed;bottom:20px;right:20px;background:${C.navy};color:white;padding:12px 20px;border-radius:8px;font-size:13px;z-index:2000;animation:slideUp .3s ease}
  @keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}
  /* ── Responsive shell ── */
  .app-shell{display:flex;min-height:100vh;background:${C.bg}}
  .sidebar{width:280px;background:${C.navy};color:white;padding:20px;overflow-y:auto;flex-shrink:0}
  .main-col{flex:1;display:flex;flex-direction:column;overflow-y:auto;min-width:0}
  .topbar{background:${C.white};padding:16px 30px;border-bottom:1px solid ${C.border};display:flex;align-items:center;justify-content:space-between;gap:12px}
  .hamburger{display:none;background:transparent;border:none;font-size:22px;cursor:pointer;color:${C.navy};padding:4px 8px;line-height:1}
  .sidebar-backdrop{display:none}
  @media (max-width:820px){
    .sidebar{position:fixed;top:0;left:0;bottom:0;z-index:1200;transform:translateX(-100%);transition:transform .25s ease}
    .sidebar.open{transform:translateX(0);box-shadow:0 0 40px rgba(0,0,0,.35)}
    .hamburger{display:inline-flex}
    .sidebar-backdrop.show{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100}
    .topbar{padding:12px 16px}
  }
`;

// ─── CONNECTION BADGE COMPONENT ──────────────────────────────────────────────
function ConnectionBadge({ connected }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: connected ? "#dcfce7" : "#fee2e2", color: connected ? "#16a34a" : "#ef4444" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
      {connected ? "Connected" : "Demo Mode"}
    </div>
  );
}

// ─── GLOBAL SEARCH COMPONENT ────────────────────────────────────────────────
function GlobalSearch({ customers, inventory, tradeins, serviceJobs, deliveries, onNavigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  const searchAll = (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const customerMatches = customers.filter(c => (c.name || "").toLowerCase().includes(q.toLowerCase()) || (c.email || "").toLowerCase().includes(q.toLowerCase()));
    const inventoryMatches = inventory.filter(i => i.model.toLowerCase().includes(q.toLowerCase()));
    setResults([...customerMatches.map(c => ({ type: "customer", item: c, label: c.name })), ...inventoryMatches.map(i => ({ type: "inventory", item: i, label: i.model }))]);
  };

  return (
    <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
      <input type="text" placeholder="Search..." value={query} onChange={(e) => { setQuery(e.target.value); searchAll(e.target.value); setOpen(true); }} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1.5px solid ${C.border}`, fontSize: "13px" }} />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: `1px solid ${C.border}`, borderRadius: "8px", marginTop: "4px", boxShadow: "0 4px 12px rgba(0,0,0,.1)", zIndex: 100 }}>
          {results.slice(0, 5).map((r, i) => (
            <div key={i} onClick={() => { setOpen(false); setQuery(""); }} style={{ padding: "10px 12px", borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", fontSize: "13px", color: C.text }} className="hover">
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Enter your email and password."); return; }
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    // On success the app's auth listener swaps to the CRM automatically.
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`, padding: "20px" }}>
      <div className="modal-content" style={{ maxWidth: "400px" }}>
        <div style={{ fontSize: "36px", marginBottom: "12px", textAlign: "center" }}>🚐</div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "24px", fontWeight: "700", marginBottom: "6px", textAlign: "center", color: C.text }}>Sunrise CRM</h1>
        <p style={{ fontSize: "13px", color: C.textMid, marginBottom: "24px", textAlign: "center" }}>Sales & Service Management for Caravans</p>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.text }}>Email</label>
            <input type="email" autoComplete="username" placeholder="steve@sunrisecaravans.com.au" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.text }}>Password</label>
            <input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: "8px", opacity: busy ? 0.7 : 1 }}>{busy ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ customers = [], onNavigate }) {
  const hot = customers.filter(c => c.status === "Hot Lead").length;
  const warm = customers.filter(c => c.status === "Warm Lead").length;
  const negotiating = customers.filter(c => c.status === "Negotiating").length;
  const won = customers.filter(c => c.status === "Won").length;
  const totalValue = customers.filter(c => c.status === "Won").reduce((sum, c) => sum + (Number(c.value) || 0), 0);

  // ── Needs attention: active opportunities, oldest-contact first ──
  const now = new Date();
  const daysSince = (d) => d ? Math.floor((now - new Date(d)) / 86400000) : null;
  const active = customers.filter(c => ["Hot Lead", "Warm Lead", "Negotiating"].includes(c.status));
  const toChase = [...active].sort((a, b) => new Date(a.last_contact || 0) - new Date(b.last_contact || 0)).slice(0, 8);
  const followUpsDue = customers.filter(c => c.follow_up && new Date(c.follow_up) <= now && !["Won", "Lost"].includes(c.status)).length;

  // ── Owner aftercare reminders: service/warranty/rego/insurance due within 45 days ──
  const dueWithin = (d, days) => { if (!d) return false; const diff = (new Date(d) - now) / 86400000; return diff <= days; };
  const reminders = [];
  customers.forEach(c => {
    [["next_service_due", "Service due"], ["warranty_expiry", "Warranty expiry"], ["rego_expiry", "Rego expiry"], ["insurance_renewal_date", "Insurance renewal"]].forEach(([f, label]) => {
      if (c[f] && dueWithin(c[f], 45)) reminders.push({ key: c.id + f, name: c.name, phone: c.phone, label, date: c[f], overdue: new Date(c[f]) < now });
    });
  });
  reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
  const hasOwners = customers.some(c => c.customer_type === "Owner");

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "24px", color: C.text }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "30px" }}>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Hot Leads</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: C.orange }}>{hot}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Warm Leads</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: C.amber }}>{warm}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Negotiating</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: C.purple }}>{negotiating}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Won This Month</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: C.green }}>{won}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "30px", borderLeft: `4px solid ${C.orange}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.text }}>🔔 Needs attention — leads to chase</h2>
          {followUpsDue > 0 && <span className="badge" style={{ background: C.red }}>{followUpsDue} follow-up{followUpsDue === 1 ? "" : "s"} due</span>}
        </div>
        {toChase.length === 0 ? (
          <div style={{ fontSize: "13px", color: C.textMid }}>No active leads to chase right now. 🎉</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {toChase.map(c => {
              const d = daysSince(c.last_contact);
              return (
                <div key={c.id} onClick={() => onNavigate && onNavigate("customers")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: C.bg, cursor: "pointer", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: C.textMid }}>{c.interest || "—"}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span className="badge" style={{ background: SC[c.status] || C.textLight }}>{c.status}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: d != null && d > 14 ? C.red : C.textMid, whiteSpace: "nowrap" }}>
                      {d == null ? "no contact date" : d === 0 ? "today" : `${d} day${d === 1 ? "" : "s"} ago`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "30px", borderLeft: `4px solid ${C.teal}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.text }}>🔧 Owner aftercare — due soon</h2>
          {reminders.length > 0 && <span className="badge" style={{ background: C.teal }}>{reminders.length}</span>}
        </div>
        {reminders.length === 0 ? (
          <div style={{ fontSize: "13px", color: C.textMid }}>{hasOwners ? "Nothing due in the next 45 days. 👍" : "Service, warranty, rego and insurance reminders will show here once your owners are loaded with their dates — that's recurring service & renewal revenue."}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {reminders.slice(0, 8).map(r => (
              <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: C.bg, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>{r.name}</div><div style={{ fontSize: "12px", color: C.textMid }}>{r.label}{r.phone ? ` · ${r.phone}` : ""}</div></div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: r.overdue ? C.red : C.textMid, whiteSpace: "nowrap" }}>{r.overdue ? "Overdue " : "Due "}{String(r.date).slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>Pipeline by Status</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={[{ name: "Hot", value: hot }, { name: "Warm", value: warm }, { name: "Negotiating", value: negotiating }]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill={C.orange} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="card">
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>Recent Wins</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {customers.filter(c => c.status === "Won").slice(0, 3).map(c => (
              <div key={c.id} style={{ paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>{c.name}</div>
                <div style={{ fontSize: "12px", color: C.textMid }}>{c.interest}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>Total Pipeline Value</h2>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.orange, marginBottom: "8px" }}>${totalValue.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: C.textMid }}>From {won} completed deals</div>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR PAGE ───────────────────────────────────────────────────────────
function CalendarPage({ customers = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => null);

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "24px", color: C.text }}>Calendar</h1>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: C.text }}>{currentDate.toLocaleString("en-au", { month: "long", year: "numeric" })}</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} style={{ fontSize: "12px" }}>Prev</button>
            <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())} style={{ fontSize: "12px" }}>Today</button>
            <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} style={{ fontSize: "12px" }}>Next</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: C.border }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ background: C.bg, padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: C.textMid }}>{d}</div>
          ))}
          {[...blanks, ...days].map((day, i) => (
            <div key={i} style={{ background: day ? "white" : C.bg, padding: "12px", minHeight: "80px", borderRight: i % 7 !== 6 ? `1px solid ${C.border}` : "none", borderBottom: `1px solid ${C.border}`, fontSize: day ? "13px" : "12px", color: day ? C.text : C.textLight }}>
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMERS PAGE ──────────────────────────────────────────────────────────
function CustomersPage({ customers = [], inventory = [], onAdd, onUpdate, onDelete, onLogContact, onLogActivity, activities = [], currentRole }) {
  const blank = { name: "", email: "", phone: "", status: "Hot Lead", interest: "", value: "", source: "Website" };
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formErr, setFormErr] = useState("");
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [actType, setActType] = useState("Call");
  const [actText, setActText] = useState("");

  const handleSave = async () => {
    setFormErr("");
    if (!form.name?.trim()) { setFormErr("Name is required."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email || "")) { setFormErr("A valid email is required."); return; }
    const res = editId ? await onUpdate("customers", editId, form) : await onAdd("customers", form);
    if (!res) return; // save failed — message already shown via toast
    setShowModal(false);
    setForm(blank);
    setEditId(null);
  };

  // Search + filter + sort, then cap how many rows we render (keeps it fast at 1,200+).
  const CAP = 100;
  const q = search.trim().toLowerCase();
  const filtered = customers
    .filter(c => (statusFilter === "All" || c.status === statusFilter))
    .filter(c => !q || [c.name, c.email, c.phone, c.interest].some(v => (v || "").toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "value") return (Number(b.value) || 0) - (Number(a.value) || 0);
      return 0; // "recent" — keep the newest-first load order
    });
  const shown = filtered.slice(0, CAP);

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", color: C.text }}>Customers</h1>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(blank); setFormErr(""); setShowModal(true); }}>+ New Customer</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search name, email, phone, interest…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1 1 240px", maxWidth: "360px" }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: "0 0 auto", width: "auto" }}>
          <option value="All">All statuses</option>
          {[...new Set(customers.map(c => c.status).filter(Boolean))].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: "0 0 auto", width: "auto" }}>
          <option value="recent">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="value">Value high–low</option>
        </select>
      </div>

      <div style={{ fontSize: "12px", color: C.textMid, marginBottom: "10px" }}>
        Showing {Math.min(shown.length, filtered.length)} of {filtered.length}{filtered.length !== customers.length ? ` (filtered from ${customers.length})` : ""}{filtered.length > CAP ? " — refine your search to see more" : ""}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: C.textMid }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: C.textMid }}>Email</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: C.textMid }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: C.textMid }}>Interest</th>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: C.textMid }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: C.textLight, fontSize: "14px" }}>No customers match your search.</td></tr>
            )}
            {shown.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }} onClick={() => { setEditId(c.id); setForm(c); setFormErr(""); setShowModal(true); }}>
                <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: C.text }}>{c.name} <span title={c.marketing_consent ? "OK to email" : "No email consent recorded"} style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: c.marketing_consent ? C.green : C.border, marginLeft: "4px", verticalAlign: "middle" }} /></td>
                <td style={{ padding: "12px", fontSize: "13px", color: C.textMid }}>{c.email}</td>
                <td style={{ padding: "12px" }}><span style={{ background: SC[c.status] || C.textLight, color: "white", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>{c.status}</span></td>
                <td style={{ padding: "12px", fontSize: "13px", color: C.textMid }}>{c.interest || "—"}</td>
                <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: C.orange }}>{c.value ? "$" + Number(c.value).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? "Edit Customer" : "New Customer"}</h2>
            <div style={{ display: "grid", gap: "14px" }}>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Name *</label><input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Email *</label><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Phone</label><input type="tel" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Status</label><select value={form.status || "Hot Lead"} onChange={(e) => setForm({ ...form, status: e.target.value })}>{PS.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Interested in</label><input type="text" placeholder="e.g. Sunset Wildtrekker 19ft8" value={form.interest || ""} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Value ($)</label><input type="number" value={form.value ?? ""} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Source</label><select value={form.source || "Website"} onChange={(e) => setForm({ ...form, source: e.target.value })}>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Next follow-up date</label><input type="date" value={form.follow_up ? String(form.follow_up).slice(0, 10) : ""} onChange={(e) => setForm({ ...form, follow_up: e.target.value || null })} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 11px", borderRadius: "8px", background: form.marketing_consent ? "#dcfce7" : C.bg, fontSize: "12px", color: C.text, cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.marketing_consent} onChange={(e) => setForm({ ...form, marketing_consent: e.target.checked })} style={{ width: "auto" }} />
                OK to email — marketing consent{form.marketing_consent && form.marketing_consent_date ? ` (recorded ${String(form.marketing_consent_date).slice(0, 10)})` : ""}
              </label>
              {editId && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: C.textMid }}>Matching stock for this lead</label>
                  {(() => {
                    const budget = Number(form.value) || 0;
                    const want = (form.interest || "").toLowerCase();
                    const avail = inventory.filter(v => (v.status || "Available") === "Available");
                    if (avail.length === 0) return <div style={{ fontSize: "12px", color: C.textLight }}>No stock loaded yet — add vans in Inventory and they'll match here automatically.</div>;
                    const matches = avail
                      .map(v => ({ v, score: (want && (v.model || "").toLowerCase().includes(want) ? 2 : 0) + (budget && v.price && Number(v.price) <= budget * 1.1 ? 1 : 0) }))
                      .sort((a, b) => b.score - a.score).slice(0, 4).map(x => x.v);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {matches.map(v => (
                          <div key={v.id} style={{ display: "flex", justifyContent: "space-between", background: C.bg, borderRadius: "8px", padding: "8px 10px", fontSize: "12px" }}>
                            <span style={{ fontWeight: 600, color: C.text }}>{v.model}</span>
                            <span style={{ color: C.orange, fontWeight: 600 }}>{v.price ? "$" + Number(v.price).toLocaleString() : ""}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {editId && onLogContact && (
                <button type="button" className="btn btn-green" onClick={async () => { const r = await onLogContact(editId, form.follow_up); if (r) { setShowModal(false); setEditId(null); } }} style={{ width: "100%", justifyContent: "center" }}>📞 Mark contacted today</button>
              )}
              {formErr && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}>{formErr}</div>}
              <button className="btn btn-primary" onClick={handleSave} style={{ width: "100%", justifyContent: "center", marginTop: "6px" }}>{editId ? "Save Changes" : "Add Customer"}</button>
              {editId && currentRole === "Owner" && <button className="btn btn-danger" onClick={async () => { if (window.confirm("Remove this customer? It can be recovered later.")) { await onDelete(editId); setShowModal(false); setEditId(null); } }} style={{ width: "100%", justifyContent: "center" }}>Delete Customer</button>}

              {editId && onLogActivity && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "14px", marginTop: "4px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: C.textMid }}>Log a call, email or note</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <select value={actType} onChange={(e) => setActType(e.target.value)} style={{ flex: "0 0 auto", width: "auto" }}>{["Call", "Email", "SMS", "Meeting", "Note"].map(t => <option key={t}>{t}</option>)}</select>
                    <input type="text" placeholder="What happened?" value={actText} onChange={(e) => setActText(e.target.value)} style={{ flex: "1 1 160px" }} />
                    <button type="button" className="btn btn-navy" style={{ flex: "0 0 auto" }} onClick={async () => { const r = await onLogActivity(editId, actType, actText); if (r) setActText(""); }}>Add</button>
                  </div>
                  <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activities.filter(a => a.customer_id === editId).length === 0 && <div style={{ fontSize: "12px", color: C.textLight }}>No history yet — log your first call or note above.</div>}
                    {activities.filter(a => a.customer_id === editId).map(a => (
                      <div key={a.id} style={{ background: C.bg, borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "12px", color: C.text }}><span className="badge" style={{ background: C.navy, marginRight: "6px" }}>{a.type}</span>{a.description}</div>
                        <div style={{ fontSize: "11px", color: C.textLight, marginTop: "4px" }}>{a.created_by || "—"}{a.created_at ? " · " + new Date(a.created_at).toLocaleString() : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PIPELINE PAGE (Kanban) ──────────────────────────────────────────────────
function PipelinePage({ customers = [] }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Sales Pipeline</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
        {PS.map(status => (
          <div key={status} style={{ background: C.bg, padding: "16px", borderRadius: "12px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "700", color: C.text, marginBottom: "12px" }}>{status} ({customers.filter(c => c.status === status).length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {customers.filter(c => c.status === status).map(c => (
                <div key={c.id} className="card" style={{ cursor: "pointer" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, marginBottom: "4px" }}>{c.name}</div>
                  <div style={{ fontSize: "12px", color: C.textMid, marginBottom: "8px" }}>{c.interest}</div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: C.orange }}>{c.value ? "$" + Number(c.value).toLocaleString() : "—"}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INVENTORY PAGE ──────────────────────────────────────────────────────────
function InventoryPage({ inventory = [] }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Inventory</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {inventory.map(item => (
          <div key={item.id} className="card">
            <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>{item.model}</div>
            <div style={{ fontSize: "12px", color: C.textMid, marginBottom: "12px" }}>{item.year} — {item.features}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>Price</div><div style={{ fontSize: "14px", fontWeight: "700", color: C.orange }}>{item.price ? "$" + Number(item.price).toLocaleString() : "—"}</div></div>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>In Stock</div><div style={{ fontSize: "14px", fontWeight: "700", color: C.green }}>{item.stock}</div></div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "12px" }}>Quote Request</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QUOTES PAGE ──────────────────────────────────────────────────────────────
const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Declined", "Expired"];
const QSC = { Draft: "#94a3b8", Sent: "#3b82f6", Accepted: "#22c55e", Declined: "#ef4444", Expired: "#f59e0b" };
const fmtMoney = (v) => (v || v === 0) ? "$" + Number(v).toLocaleString() : "—";
const isExpiring = (q) => q.status === "Sent" && q.valid_until && new Date(q.valid_until) < new Date(new Date().toDateString());

function QuotesPage({ customers = [], inventory = [], quotes = [], onAdd, onUpdate }) {
  const plus14 = () => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); };
  const blank = { customer_id: "", customer_name: "", van_model: "", price: "", deposit: "", valid_until: "", status: "Draft", notes: "" };
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blank);
  const [formErr, setFormErr] = useState("");
  const [filter, setFilter] = useState("All");

  const openNew = () => { setEditId(null); setForm({ ...blank, valid_until: plus14() }); setFormErr(""); setShowModal(true); };
  const openEdit = (q) => { setEditId(q.id); setForm({ ...q, valid_until: q.valid_until ? String(q.valid_until).slice(0, 10) : "" }); setFormErr(""); setShowModal(true); };

  const handleSave = async () => {
    setFormErr("");
    if (!form.customer_name?.trim()) { setFormErr("Pick a customer."); return; }
    if (!form.van_model?.trim()) { setFormErr("Enter the van."); return; }
    if (form.price === "" || form.price == null || isNaN(Number(form.price))) { setFormErr("Enter a valid price."); return; }
    const res = editId ? await onUpdate(editId, form) : await onAdd(form);
    if (!res) return;
    setShowModal(false); setForm(blank); setEditId(null);
  };

  const shown = filter === "All" ? quotes : filter === "Needs chasing" ? quotes.filter(isExpiring) : quotes.filter(q => q.status === filter);
  const expiringCount = quotes.filter(isExpiring).length;
  const stat = (s) => quotes.filter(q => q.status === s).length;

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", color: C.text }}>Quotes</h1>
        <button className="btn btn-primary" onClick={openNew}>+ New Quote</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="card"><div style={{ fontSize: "13px", color: C.textMid, marginBottom: "6px" }}>Sent (awaiting)</div><div style={{ fontSize: "26px", fontWeight: "700", color: C.blue }}>{stat("Sent")}</div></div>
        <div className="card"><div style={{ fontSize: "13px", color: C.textMid, marginBottom: "6px" }}>Accepted</div><div style={{ fontSize: "26px", fontWeight: "700", color: C.green }}>{stat("Accepted")}</div></div>
        <div className="card" style={{ borderLeft: expiringCount ? `4px solid ${C.amber}` : undefined }}><div style={{ fontSize: "13px", color: C.textMid, marginBottom: "6px" }}>Needs chasing</div><div style={{ fontSize: "26px", fontWeight: "700", color: expiringCount ? C.amber : C.textLight }}>{expiringCount}</div></div>
        <div className="card"><div style={{ fontSize: "13px", color: C.textMid, marginBottom: "6px" }}>Total quotes</div><div style={{ fontSize: "26px", fontWeight: "700", color: C.text }}>{quotes.length}</div></div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        {["All", "Needs chasing", ...QUOTE_STATUSES].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn btn-navy" : "btn btn-ghost"} style={{ fontSize: "12px", padding: "6px 12px" }}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Customer", "Van", "Price", "Deposit", "Balance", "Valid until", "Status"].map(h => (
                <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: C.textMid }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.textLight, fontSize: "14px" }}>No quotes here yet. Hit "+ New Quote" to create one.</td></tr>}
            {shown.map(q => {
              const bal = (Number(q.price) || 0) - (Number(q.deposit) || 0);
              const exp = isExpiring(q);
              return (
                <tr key={q.id} onClick={() => openEdit(q)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: C.text }}>{q.customer_name || "—"}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: C.textMid }}>{q.van_model || "—"}</td>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: C.orange }}>{fmtMoney(q.price)}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: C.textMid }}>{fmtMoney(q.deposit)}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: C.text }}>{fmtMoney(bal)}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: exp ? C.red : C.textMid, fontWeight: exp ? 700 : 400 }}>{q.valid_until ? String(q.valid_until).slice(0, 10) : "—"}{exp ? " ⚠" : ""}</td>
                  <td style={{ padding: "12px" }}><span className="badge" style={{ background: QSC[q.status] || C.textLight }}>{q.status || "Draft"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? "Edit Quote" : "New Quote"}</h2>
            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Customer *</label>
                <select value={form.customer_id || ""} onChange={(e) => { const c = customers.find(x => String(x.id) === e.target.value); setForm({ ...form, customer_id: e.target.value, customer_name: c ? c.name : form.customer_name }); }}>
                  <option value="">— pick a customer —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Van *</label>
                <input type="text" list="van-models" placeholder="e.g. Sunset Wildtrekker 19ft8" value={form.van_model || ""} onChange={(e) => setForm({ ...form, van_model: e.target.value })} />
                <datalist id="van-models">{inventory.map(i => <option key={i.id} value={i.model} />)}</datalist>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Price ($) *</label><input type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Deposit ($)</label><input type="number" value={form.deposit ?? ""} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Valid until</label><input type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Status</label><select value={form.status || "Draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}>{QUOTE_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Notes</label><textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              {form.price !== "" && <div style={{ fontSize: "13px", color: C.textMid }}>Balance owing: <strong style={{ color: C.text }}>{fmtMoney((Number(form.price) || 0) - (Number(form.deposit) || 0))}</strong></div>}
              {formErr && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}>{formErr}</div>}
              <button className="btn btn-primary" onClick={handleSave} style={{ width: "100%", justifyContent: "center", marginTop: "6px" }}>{editId ? "Save Quote" : "Create Quote"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FINANCE PAGE ────────────────────────────────────────────────────────────
function FinancePage({ customers = [], inventory = [] }) {
  const wonDeals = customers.filter(c => c.status === "Won");
  const totalRevenue = wonDeals.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  const avgDealValue = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0;
  const totalCost = inventory.reduce((sum, i) => sum + ((Number(i.cost_price) || 0) * (Number(i.stock) || 0)), 0);
  const totalMargin = totalRevenue - totalCost;

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "24px", color: C.text }}>Finance</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "30px" }}>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Total Revenue</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.green }}>${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Total Margin</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.orange }}>${totalMargin.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Avg Deal Value</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.blue }}>${avgDealValue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Deals Closed</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.purple }}>{wonDeals.length}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>Revenue by Deal</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {wonDeals.map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>{c.name}</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: C.green }}>{c.value ? "$" + Number(c.value).toLocaleString() : "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DELIVERY PAGE ───────────────────────────────────────────────────────────
function DeliveryPage({ deliveries = [] }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Deliveries</h1>
      <div style={{ display: "grid", gap: "16px" }}>
        {deliveries.map(d => (
          <div key={d.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{d.customer_name}</div>
                <div style={{ fontSize: "12px", color: C.textMid }}>{d.van_model}</div>
              </div>
              <span className="badge" style={{ background: d.status === "PDI Complete" ? C.green : C.amber }}>{d.status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>Delivery Date</div><div style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>{new Date(d.delivery_date).toLocaleDateString("en-au")}</div></div>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>Notes</div><div style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>{d.notes}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRADE-INS PAGE ──────────────────────────────────────────────────────────
function TradeInsPage({ tradeins = [] }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Trade-Ins</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {tradeins.map(t => (
          <div key={t.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{t.customer_name}</div>
                <div style={{ fontSize: "12px", color: C.textMid }}>{t.van_make} {t.van_model}</div>
              </div>
              <span className="badge" style={{ background: t.condition === "Good" ? C.green : C.amber }}>{t.condition}</span>
            </div>
            <div style={{ paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "11px", color: C.textMid }}>Est. Value</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: C.orange }}>{t.est_value ? "$" + Number(t.est_value).toLocaleString() : "—"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SERVICE PAGE ────────────────────────────────────────────────────────────
function ServicePage({ serviceJobs = [] }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Service Jobs</h1>
      <div style={{ display: "grid", gap: "16px" }}>
        {serviceJobs.map(job => (
          <div key={job.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{job.customer_name}</div>
                <div style={{ fontSize: "12px", color: C.textMid }}>{job.van_model} — {job.job_type}</div>
              </div>
              <span className="badge" style={{ background: job.status === "Completed" ? C.green : job.status === "In Progress" ? C.orange : C.amber }}>{job.status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>Hours</div><div style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>{job.hours}h</div></div>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>Rate</div><div style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>${job.rate}/hr</div></div>
              <div><div style={{ fontSize: "11px", color: C.textMid }}>Total</div><div style={{ fontSize: "12px", fontWeight: "600", color: C.orange }}>${((Number(job.hours)||0) * (Number(job.rate)||0)).toLocaleString()}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEMPLATES PAGE ──────────────────────────────────────────────────────────
function TemplatesPage() {
  const categories = [...new Set(EMAIL_TEMPLATES.map(t => t.category))];

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Email Templates</h1>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: C.text, marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>{cat}</h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {EMAIL_TEMPLATES.filter(t => t.category === cat).map(t => (
              <div key={t.id} className="card" style={{ background: C.bg, borderLeft: `3px solid ${C.orange}` }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: C.text, marginBottom: "6px" }}>{t.name}</div>
                <div style={{ fontSize: "12px", color: C.textMid }}>{t.subject}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MISSED LEADS PAGE ───────────────────────────────────────────────────────
function MissedLeadsPage({ customers = [] }) {
  const [sentIds, setSentIds] = useState([]);
  const [editingEmails, setEditingEmails] = useState({});
  const [toast, setToast] = useState(null);
  const [expandedLeads, setExpandedLeads] = useState({});

  // Reactivation email templates with variations
  const emailTemplates = [
    {
      subject: "Still thinking about the {model}?",
      body: `Hey {firstName},\n\nSteve from Sunrise Caravans here. You had a look at the {model} a little while back — just checking in to see if you're still in the market. We've still got stock and I'd love to show you through one properly if the timing's better now.\n\nNo pressure at all — give me a buzz on 0483 922 811 whenever suits.\n\nCheers,\nSteve — Sunrise Caravans\nsunrisecaravans.com.au`
    },
    {
      subject: "That {model} is still available if you're keen",
      body: `Hey {firstName},\n\nJust a quick one — the {model} you were looking at is still available. A few things have changed since we last chatted and I reckon it's worth another look.\n\nGive me a call on 0483 922 811 or just reply to this email. No rush.\n\nCheers,\nSteve — Sunrise Caravans\nsunrisecaravans.com.au`
    },
    {
      subject: "Quick check in about the {model}",
      body: `Hey {firstName},\n\nSteve from Sunrise here. Haven't heard from you in a bit so just wanted to touch base. If the {model} is still on your radar, I'm happy to chat through any questions. If the timing's not right, no worries at all.\n\nCatch me on 0483 922 811 anytime.\n\nCheers,\nSteve — Sunrise Caravans\nsunrisecaravans.com.au`
    },
    {
      subject: "{firstName}, got a minute?",
      body: `Hey {firstName},\n\nSteve from Sunrise Caravans. I know it's been a while since you looked at the {model} — just wanted to let you know we're still here when you're ready. Happy to give you an updated price or just have a yarn about what you're after.\n\n0483 922 811 — call or text anytime.\n\nCheers,\nSteve\nsunrisecaravans.com.au`
    },
    {
      subject: "{firstName}, {model} update",
      body: `Hey {firstName},\n\nJust touching base from Sunrise Caravans. The {model} you were keen on is still here and we'd love to help you get on the road. No pressure whatsoever — just wanted to stay in touch.\n\nHappy to chat anytime on 0483 922 811.\n\nAll the best,\nSteve\nSunrise Caravans\nsunrisecaravans.com.au`
    }
  ];

  const generateReactivationEmail = (customer) => {
    const templateIndex = customer.id % emailTemplates.length;
    const template = emailTemplates[templateIndex];
    const firstName = customer.name.split(" ")[0];
    const model = customer.interest || "our range";

    return {
      subject: template.subject.replace("{model}", model).replace("{firstName}", firstName),
      body: template.body.replace("{model}", model).replace("{firstName}", firstName)
    };
  };

  // Identify cold leads
  const coldLeads = customers.filter(c => {
    if (c.status === "Won") return false;
    if (c.status === "Cold Lead" || c.status === "Lost") return true;
    if (!c.last_contact) return true; // never contacted → worth chasing
    const daysSinceContact = Math.floor((new Date() - new Date(c.last_contact)) / (1000 * 60 * 60 * 24));
    return daysSinceContact >= 30;
  });

  const sendReactivation = async (customer, subject, body) => {
    if (MAKE_WEBHOOK === "YOUR_MAKE_COM_WEBHOOK_URL") {
      setToast("Set your Make.com webhook URL first — check the code");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!customer.email) {
      setToast("No email address — follow up by phone instead");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      await fetch(MAKE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: subject,
          body: body,
          customer_name: customer.name,
          customer_id: customer.id,
        }),
      });
      setSentIds(prev => [...prev, customer.id]);
      setToast(`Email queued for ${customer.name}`);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast("Failed to send — check Make.com webhook");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const copyToClipboard = (subject, body) => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setToast("Email copied to clipboard");
    setTimeout(() => setToast(null), 3000);
  };

  const datedColdLeads = coldLeads.filter(c => c.last_contact);
  const avgDaysSinceContact = datedColdLeads.length > 0
    ? Math.round(datedColdLeads.reduce((sum, c) => sum + Math.floor((new Date() - new Date(c.last_contact)) / (1000 * 60 * 60 * 24)), 0) / datedColdLeads.length)
    : 0;

  const leadsWithoutEmail = coldLeads.filter(c => !c.email).length;

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: C.text }}>📩 Missed Leads</h1>
      <p style={{ fontSize: "14px", color: C.textMid, marginBottom: "24px" }}>Leads that have gone cold. Review and send reactivation emails.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Total Cold Leads</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.orange }}>{coldLeads.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>Avg Days Since Contact</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.blue }}>{datedColdLeads.length ? avgDaysSinceContact : "—"}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "8px" }}>No Email Address</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: C.red }}>{leadsWithoutEmail}</div>
        </div>
      </div>

      {coldLeads.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: C.text, marginBottom: "8px" }}>No cold leads right now</div>
          <div style={{ fontSize: "13px", color: C.textMid }}>Great job keeping your pipeline warm!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {coldLeads.map(customer => {
            const email = editingEmails[customer.id] || generateReactivationEmail(customer);
            const daysSinceContact = customer.last_contact ? Math.floor((new Date() - new Date(customer.last_contact)) / (1000 * 60 * 60 * 24)) : null;
            const isSent = sentIds.includes(customer.id);

            return (
              <div key={customer.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "4px" }}>{customer.name}</div>
                    <div style={{ fontSize: "12px", color: C.textMid, marginBottom: "6px" }}>{customer.interest}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span className="badge" style={{ background: SC[customer.status] }}>{customer.status}</span>
                      <span className="badge" style={{ background: SOURCE_COLORS[customer.source] }}>{customer.source}</span>
                      <span className="badge" style={{ background: C.textLight }}>{daysSinceContact == null ? "Never contacted" : `Days: ${daysSinceContact}`}</span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: isSent ? C.green : C.bg, color: isSent ? "white" : C.textMid }}>{isSent ? "✅ Sent" : "Draft"}</span>
                </div>

                {!customer.email && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#dc2626", fontSize: "13px", fontWeight: "600" }}>
                    ⚠️ No email address — follow up by phone instead: {customer.phone}
                  </div>
                )}

                {customer.email && (
                  <div style={{ background: C.bg, borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: C.text, marginBottom: "6px" }}>Subject</label>
                    <textarea
                      value={email.subject}
                      onChange={(e) => setEditingEmails({ ...editingEmails, [customer.id]: { ...email, subject: e.target.value } })}
                      style={{ resize: "vertical", minHeight: "40px", marginBottom: "12px" }}
                    />

                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: C.text, marginBottom: "6px" }}>Email Body</label>
                    <textarea
                      value={email.body}
                      onChange={(e) => setEditingEmails({ ...editingEmails, [customer.id]: { ...email, body: e.target.value } })}
                      style={{ resize: "vertical", minHeight: "150px", marginBottom: "12px" }}
                    />

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => sendReactivation(customer, email.subject, email.body)}
                        disabled={isSent || !customer.email || MAKE_WEBHOOK === "YOUR_MAKE_COM_WEBHOOK_URL"}
                        style={{ opacity: isSent || !customer.email || MAKE_WEBHOOK === "YOUR_MAKE_COM_WEBHOOK_URL" ? 0.5 : 1, cursor: isSent || !customer.email ? "not-allowed" : "pointer" }}
                      >
                        ✅ Approve & Send
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => copyToClipboard(email.subject, email.body)}
                      >
                        📋 Copy Email
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => setExpandedLeads({ ...expandedLeads, [customer.id]: !expandedLeads[customer.id] })}
                      >
                        {expandedLeads[customer.id] ? "👁️ Hide" : "👁️ Preview"}
                      </button>
                    </div>
                  </div>
                )}

                {expandedLeads[customer.id] && customer.email && (
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px", fontSize: "13px", lineHeight: "1.6", color: C.text, whiteSpace: "pre-wrap", wordWrap: "break-word", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", marginBottom: "12px" }}>From: support@sunrisecaravans.com.au</div>
                    <div style={{ fontWeight: "700", marginBottom: "12px" }}>To: {customer.email}</div>
                    <div style={{ fontWeight: "700", marginBottom: "12px" }}>Subject: {email.subject}</div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px", marginTop: "12px" }}>{email.body}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── AI AGENT PAGE ───────────────────────────────────────────────────────────
function AIAgent({ customers = [] }) {
  const hotLeads = customers.filter(c => c.status === "Hot Lead");
  const coldLeads = customers.filter(c => c.status === "Cold Lead" && new Date(c.last_contact) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
  const suggestions = [
    { icon: "🔥", title: "Follow up Hot Leads", desc: `${hotLeads.length} hot leads ready to convert — check in this week`, action: "View Hot Leads" },
    { icon: "❄️", title: "Re-engage Cold Leads", desc: `${coldLeads.length} cold leads inactive for 2+ weeks`, action: "View Cold Leads" },
    { icon: "📧", title: "Send Service Reminders", desc: "5 customers due for service — send batch email", action: "Send Reminders" },
  ];

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>AI Suggestions</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {suggestions.map((s, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${C.orange}` }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>{s.icon}</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "6px" }}>{s.title}</div>
            <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "16px" }}>{s.desc}</div>
            <button className="btn btn-ghost" style={{ fontSize: "12px" }}>{s.action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REPORTS PAGE ───────────────────────────────────────────────────────────
function ReportsPage({ customers = [], inventory = [], user }) {
  const bySource = {};
  customers.forEach(c => {
    bySource[c.source || "Unknown"] = (bySource[c.source || "Unknown"] || 0) + 1;
  });

  const sourceData = Object.entries(bySource).map(([name, count]) => ({ name, count }));
  const isOwner = user?.role === "Owner";

  // Conversion analytics (live from your data — source & rep are set on every lead).
  const pipelineValue = customers.filter(c => ["Hot Lead", "Warm Lead", "Negotiating"].includes(c.status)).reduce((s, c) => s + (Number(c.value) || 0), 0);
  const wonValue = customers.filter(c => c.status === "Won").reduce((s, c) => s + (Number(c.value) || 0), 0);
  const totalWon = customers.filter(c => c.status === "Won").length;
  const totalLost = customers.filter(c => c.status === "Lost").length;
  const groupStats = (key) => {
    const map = {};
    customers.forEach(c => { const k = c[key] || "Unassigned"; (map[k] = map[k] || []).push(c); });
    return Object.entries(map).map(([name, arr]) => {
      const w = arr.filter(c => c.status === "Won").length;
      const l = arr.filter(c => c.status === "Lost").length;
      return { name, total: arr.length, won: w, lost: l, conv: (w + l) ? Math.round((w / (w + l)) * 100) : null };
    }).sort((a, b) => b.total - a.total);
  };
  const bySalesperson = groupStats("assigned_to");
  const bySourceStats = groupStats("source");
  const StatTable = ({ title, rows, label }) => (
    <div className="card" style={{ overflowX: "auto" }}>
      <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>{title}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {[label, "Leads", "Won", "Lost", "Conversion"].map(h => <th key={h} style={{ padding: "10px", textAlign: h === label ? "left" : "right", fontSize: "12px", fontWeight: "700", color: C.textMid }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: "10px", fontSize: "13px", fontWeight: "600", color: C.text }}>{r.name}</td>
              <td style={{ padding: "10px", fontSize: "13px", color: C.textMid, textAlign: "right" }}>{r.total}</td>
              <td style={{ padding: "10px", fontSize: "13px", color: C.green, textAlign: "right", fontWeight: 600 }}>{r.won}</td>
              <td style={{ padding: "10px", fontSize: "13px", color: C.textMid, textAlign: "right" }}>{r.lost}</td>
              <td style={{ padding: "10px", fontSize: "13px", textAlign: "right", fontWeight: 700, color: r.conv == null ? C.textLight : r.conv >= 50 ? C.green : C.orange }}>{r.conv == null ? "—" : r.conv + "%"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Owner-only customer export. Every export is recorded in the audit log,
  // because exporting customer data is the easiest way for it to leak.
  const exportCsv = async () => {
    const cols = ["name", "email", "phone", "status", "source", "interest", "value", "assigned_to", "last_contact"];
    const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [cols.join(",")];
    customers.forEach(c => lines.push(cols.map(k => esc(c[k])).join(",")));
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sunrise-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    await logExport("customers", customers.length);
  };

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", color: C.text }}>Reports</h1>
        {isOwner
          ? <button className="btn btn-navy" onClick={exportCsv}>⬇ Export customers (CSV)</button>
          : <span style={{ fontSize: "12px", color: C.textLight }}>Exports are restricted to the owner</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        <div className="card">
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>Leads by Source</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sourceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill={C.orange}>
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: C.text }}>Leads by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={PS.map(s => ({ name: s, count: customers.filter(c => c.status === s).length }))}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Bar dataKey="count" fill={C.orange} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", margin: "20px 0" }}>
        <div className="card"><div style={{ fontSize: "12px", color: C.textMid, marginBottom: "6px" }}>Open pipeline value</div><div style={{ fontSize: "24px", fontWeight: "700", color: C.orange }}>{pipelineValue ? "$" + pipelineValue.toLocaleString() : "—"}</div></div>
        <div className="card"><div style={{ fontSize: "12px", color: C.textMid, marginBottom: "6px" }}>Won value</div><div style={{ fontSize: "24px", fontWeight: "700", color: C.green }}>{wonValue ? "$" + wonValue.toLocaleString() : "—"}</div></div>
        <div className="card"><div style={{ fontSize: "12px", color: C.textMid, marginBottom: "6px" }}>Won</div><div style={{ fontSize: "24px", fontWeight: "700", color: C.green }}>{totalWon}</div></div>
        <div className="card"><div style={{ fontSize: "12px", color: C.textMid, marginBottom: "6px" }}>Lost</div><div style={{ fontSize: "24px", fontWeight: "700", color: C.red }}>{totalLost}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <StatTable title="Conversion by salesperson" rows={bySalesperson} label="Salesperson" />
        <StatTable title="Conversion by source" rows={bySourceStats} label="Source" />
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ───────────────────────────────────────────────────────────
function SettingsPage({ user }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMsg(""); setErr("");
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setErr("The two passwords don't match."); return; }
    setBusy(true);
    const res = await changePassword(pw);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    setPw(""); setPw2(""); setMsg("Password updated — use it next time you sign in.");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "28px", fontWeight: "700", marginBottom: "30px", color: C.text }}>Settings</h1>

      <div className="card" style={{ maxWidth: "500px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px", color: C.text }}>Your account</h2>
        <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "18px" }}>{user?.name} · {user?.email} · <strong style={{ color: C.orange }}>{user?.role || "no role"}</strong></div>
        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>New password</label>
            <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: C.textMid }}>Confirm new password</label>
            <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          {err && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}>{err}</div>}
          {msg && <div style={{ background: "#dcfce7", color: "#16a34a", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}>{msg}</div>}
          <button className="btn btn-primary" onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>{busy ? "Saving…" : "Change password"}</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "500px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px", color: C.text }}>Security</h2>
        <div style={{ fontSize: "13px", color: C.textMid, lineHeight: "1.6" }}>
          Connected securely to your database. Every record is protected by row-level security, so each person only sees and changes what their role allows. All changes and deletions are recorded in an audit log.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SunriseCRM() {
  const [user, setUser] = useState(null);        // CRM profile (name, email, role)
  const [authReady, setAuthReady] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [tradeins, setTradeins] = useState([]);
  const [serviceJobs, setServiceJobs] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Watch the auth session → load the CRM profile when signed in.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) setUser(await loadProfile());
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!active) return;
      setUser(session ? await loadProfile() : null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // Load CRM data once we have a signed-in profile.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true); setLoadError("");
      const [cu, inv, ti, sj, de, qt, ac] = await Promise.all([
        loadTable("customers", "*", { notDeleted: true, order: "created_at", ascending: false }),
        loadTable("inventory"),
        loadTable("trade_ins"),
        loadTable("service_jobs"),
        loadTable("deliveries"),
        loadTable("quotes", "*", { order: "created_at", ascending: false }),
        loadTable("activities", "*", { order: "created_at", ascending: false }),
      ]);
      if (!active) return;
      if (cu.error) setLoadError(cu.error);
      setCustomers(cu.rows); setInventory(inv.rows); setTradeins(ti.rows);
      setServiceJobs(sj.rows); setDeliveries(de.rows); setQuotes(qt.rows); setActivities(ac.rows);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  // Only these fields are writable from the customer form (ignore the other 40+).
  const CUST_FIELDS = ["name", "email", "phone", "status", "interest", "value", "source", "notes", "follow_up", "assigned_to", "marketing_consent", "marketing_consent_date", "marketing_consent_source"];
  const cleanCustomer = (data) => {
    const out = {};
    for (const k of CUST_FIELDS) if (k in data) out[k] = data[k];
    if ("value" in out) out.value = (out.value === "" || out.value == null) ? null : Number(out.value);
    if ("marketing_consent" in out) {
      out.marketing_consent = !!out.marketing_consent;
      // stamp the date/source the moment consent is recorded
      if (out.marketing_consent && !data.marketing_consent_date) {
        out.marketing_consent_date = new Date().toISOString().split("T")[0];
        out.marketing_consent_source = data.marketing_consent_source || "CRM (manual)";
      }
    }
    return out;
  };

  const dbAdd = async (table, data) => {
    if (table !== "customers") return null;
    const row = { ...cleanCustomer(data), source: data.source || "Website", assigned_to: user?.name || data.assigned_to || null, last_contact: new Date().toISOString().split("T")[0] };
    const res = await insertRow("customers", row);
    if (res.error) { flash(res.error); return null; }
    setCustomers((cur) => [res.row, ...cur]);
    flash("Customer added.");
    return res.row;
  };

  const dbEdit = async (table, id, data) => {
    if (table !== "customers") return null;
    const res = await updateRow("customers", id, cleanCustomer(data));
    if (res.error) { flash(res.error); return null; }
    setCustomers((cur) => cur.map((c) => (c.id === id ? res.row : c)));
    flash("Customer updated.");
    return res.row;
  };

  const dbRemove = async (id) => {
    const res = await softDeleteCustomer(id);
    if (res.error) { flash(res.error); return; }
    setCustomers((cur) => cur.filter((c) => c.id !== id));
    flash("Customer removed (recoverable).");
  };

  // Log a call/email: stamps last_contact today and sets the next follow-up date,
  // which is what makes a lead drop off (and re-appear on) the chase queue.
  const dbLogContact = async (id, nextFollowUp) => {
    const patch = { last_contact: new Date().toISOString().split("T")[0] };
    if (nextFollowUp !== undefined) patch.follow_up = nextFollowUp || null;
    const res = await updateRow("customers", id, patch);
    if (res.error) { flash(res.error); return null; }
    setCustomers((cur) => cur.map((c) => (c.id === id ? res.row : c)));
    flash("Contact logged — nice work.");
    return res.row;
  };

  const QUOTE_FIELDS = ["customer_id", "customer_name", "van_model", "price", "deposit", "valid_until", "status", "notes", "assigned_to"];
  const cleanQuote = (data) => {
    const out = {};
    for (const k of QUOTE_FIELDS) if (k in data) out[k] = data[k];
    if ("price" in out) out.price = (out.price === "" || out.price == null) ? null : Number(out.price);
    if ("deposit" in out) out.deposit = (out.deposit === "" || out.deposit == null) ? null : Number(out.deposit);
    if ("valid_until" in out) out.valid_until = out.valid_until || null;
    if ("customer_id" in out) out.customer_id = out.customer_id || null;
    return out;
  };
  const dbAddQuote = async (data) => {
    const res = await insertRow("quotes", { ...cleanQuote(data), assigned_to: data.assigned_to || user?.name || null });
    if (res.error) { flash(res.error); return null; }
    setQuotes((cur) => [res.row, ...cur]);
    flash("Quote created.");
    return res.row;
  };
  const dbEditQuote = async (id, data) => {
    const res = await updateRow("quotes", id, cleanQuote(data));
    if (res.error) { flash(res.error); return null; }
    setQuotes((cur) => cur.map((q) => (q.id === id ? res.row : q)));
    flash("Quote updated.");
    return res.row;
  };

  const dbLogActivity = async (customerId, type, text) => {
    if (!text || !text.trim()) return null;
    const res = await insertRow("activities", { customer_id: customerId, type, description: text.trim(), created_by: user?.name || null });
    if (res.error) { flash(res.error); return null; }
    setActivities((cur) => [res.row, ...cur]);
    if (["Call", "Email", "SMS", "Meeting"].includes(type)) {
      const upd = await updateRow("customers", customerId, { last_contact: new Date().toISOString().split("T")[0] });
      if (upd.row) setCustomers((cur) => cur.map((c) => (c.id === customerId ? upd.row : c)));
    }
    flash("Logged.");
    return res.row;
  };

  const handleSignOut = async () => { await signOut(); setUser(null); };

  // Gates: wait for the auth check, then require a real login.
  if (!authReady) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: C.textMid, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>;
  }
  if (!user) {
    return <LoginPage />;
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "pipeline", label: "Pipeline", icon: "🎯" },
    { id: "inventory", label: "Inventory", icon: "🚐" },
    { id: "quotes", label: "Quotes", icon: "📄" },
    { id: "finance", label: "Finance", icon: "💰" },
    { id: "deliveries", label: "Deliveries", icon: "📦" },
    { id: "tradeins", label: "Trade-Ins", icon: "🔄" },
    { id: "service", label: "Service", icon: "🔧" },
    { id: "templates", label: "Templates", icon: "📧" },
    { id: "missedleads", label: "Missed Leads", icon: "📩" },
    { id: "ai", label: "AI", icon: "🤖" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const PAGES = {
    dashboard: <Dashboard customers={customers} onNavigate={setCurrentPage} />,
    calendar: <CalendarPage customers={customers} />,
    customers: <CustomersPage customers={customers} inventory={inventory} onAdd={dbAdd} onUpdate={dbEdit} onDelete={dbRemove} onLogContact={dbLogContact} onLogActivity={dbLogActivity} activities={activities} currentRole={user?.role} />,
    pipeline: <PipelinePage customers={customers} />,
    inventory: <InventoryPage inventory={inventory} />,
    quotes: <QuotesPage customers={customers} inventory={inventory} quotes={quotes} onAdd={dbAddQuote} onUpdate={dbEditQuote} />,
    finance: <FinancePage customers={customers} inventory={inventory} />,
    deliveries: <DeliveryPage deliveries={deliveries} />,
    tradeins: <TradeInsPage tradeins={tradeins} />,
    service: <ServicePage serviceJobs={serviceJobs} />,
    templates: <TemplatesPage />,
    missedleads: <MissedLeadsPage customers={customers} />,
    ai: <AIAgent customers={customers} />,
    reports: <ReportsPage customers={customers} inventory={inventory} user={user} />,
    settings: <SettingsPage user={user} />,
  };

  return (
    <>
      <style>{G}</style>
      <div className={"sidebar-backdrop" + (mobileNavOpen ? " show" : "")} onClick={() => setMobileNavOpen(false)} />
      <div className="app-shell">
        <div className={"sidebar" + (mobileNavOpen ? " open" : "")}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>🚐 Sunrise</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,.6)", marginBottom: "24px" }}>CRM v9</div>

          <div style={{ marginBottom: "24px" }}>
            <ConnectionBadge connected={!loadError} />
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => { setCurrentPage(n.id); setMobileNavOpen(false); }} style={{ background: currentPage === n.id ? C.orange : "transparent", color: "white", border: "none", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textAlign: "left", cursor: "pointer", transition: "all .2s", display: "flex", gap: "8px", alignItems: "center" }}>
                <span>{n.icon}</span> {n.label}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,.1)", fontSize: "12px", color: "rgba(255,255,255,.6)" }}>
            <div style={{ fontWeight: "600", marginBottom: "2px" }}>{user?.name || "User"}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,.5)", marginBottom: "6px" }}>{user?.role || "No role"}</div>
            <button onClick={handleSignOut} style={{ background: "rgba(255,255,255,.1)", color: "white", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer", width: "100%", transition: "all .2s" }} onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,.2)"} onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,.1)"}>Sign Out</button>
          </div>
        </div>

        <div className="main-col">
          <div className="topbar">
            <button className="hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">☰</button>
            <GlobalSearch customers={customers} inventory={inventory} tradeins={tradeins} serviceJobs={serviceJobs} deliveries={deliveries} onNavigate={setCurrentPage} />
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: C.textMid }}>Welcome, {user?.name?.split(" ")[0]}</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.orange, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", flexShrink: 0 }}>{user?.avatar}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadError && <div style={{ margin: "16px 30px 0", background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" }}>{loadError}</div>}
            {loading ? <div style={{ padding: "40px", color: C.textMid, fontSize: "14px" }}>Loading your data…</div> : PAGES[currentPage]}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
