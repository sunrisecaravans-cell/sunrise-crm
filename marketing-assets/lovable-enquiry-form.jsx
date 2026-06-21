// Sunrise Caravans — enquiry form for the LOVABLE site (React).
// Drop this component into your Lovable project (sunrise-van-mate) and place
// <EnquiryForm /> wherever you want the form — e.g. a "Contact" or "Enquire" section.
//
// When someone submits, the lead lands in your CRM instantly as a Hot Lead
// (source = "Website"), is logged, and appears on your Dashboard chase list.
//
// The key below is your PUBLIC anon key — safe in a website because your database
// is locked down with row-level security. The hidden "company" field is a honeypot:
// real people never fill it, bots do, and those get silently dropped.

import { useState } from "react";

const ENDPOINT = "https://nubttdudughlriajikrr.supabase.co/functions/v1/lead-capture";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnR0ZHVkdWdobHJpYWppa3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzI2MTYsImV4cCI6MjA5MDYwODYxNn0.HDtxkWPvCfHYkqy6r1IlnAYJMoKh5gtYIocC402XwJo";

export default function EnquiryForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "", message: "", company: "" });
  const [status, setStatus] = useState({ state: "idle", msg: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: "sending", msg: "Sending…" });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "Website" }),
      });
      const data = await res.json();
      if (data.ok) {
        setForm({ name: "", email: "", phone: "", interest: "", message: "", company: "" });
        setStatus({ state: "done", msg: "Thanks! Steve will be in touch shortly." });
      } else {
        setStatus({ state: "error", msg: data.error || "Something went wrong — please call us on (07) 3888 4455." });
      }
    } catch {
      setStatus({ state: "error", msg: "Couldn't send — please call us on (07) 3888 4455." });
    }
  };

  const input = { padding: "12px", border: "1px solid #d4d4d4", borderRadius: "10px", fontSize: "15px", width: "100%" };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "12px", maxWidth: "480px" }}>
      {/* Honeypot — keep this, leave it hidden */}
      <input name="company" value={form.company} onChange={set("company")} tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: "absolute", left: "-5000px", height: 0, width: 0, opacity: 0 }} />

      <input placeholder="Your name *" required value={form.name} onChange={set("name")} style={input} />
      <input type="email" placeholder="Email *" required value={form.email} onChange={set("email")} style={input} />
      <input type="tel" placeholder="Phone" value={form.phone} onChange={set("phone")} style={input} />
      <input placeholder="Which van are you interested in?" value={form.interest} onChange={set("interest")} style={input} />
      <textarea placeholder="Anything you'd like us to know?" rows={3} value={form.message} onChange={set("message")} style={input} />

      <button type="submit" disabled={status.state === "sending"}
        style={{ padding: "14px", background: "#FF6B00", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "16px", cursor: "pointer", opacity: status.state === "sending" ? 0.7 : 1 }}>
        {status.state === "sending" ? "Sending…" : "Send enquiry"}
      </button>

      {status.msg && (
        <p style={{ margin: 0, fontSize: "14px", color: status.state === "error" ? "#b91c1c" : status.state === "done" ? "#16a34a" : "#555" }}>
          {status.msg}
        </p>
      )}
    </form>
  );
}
