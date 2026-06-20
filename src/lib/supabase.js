// ============================================================
// Sunrise CRM — Supabase client (real Auth + audited data layer)
// ------------------------------------------------------------
// Auth: email/password via Supabase Auth. Session is persisted &
// auto-refreshed by supabase-js. Every data call runs as the
// logged-in user, so RLS decides what they can see/do.
// ============================================================
import { createClient } from "@supabase/supabase-js";

const URL =
  import.meta.env.VITE_SUPABASE_URL || "https://nubttdudughlriajikrr.supabase.co";
// Public anon key — safe in the browser bundle because the database is locked down
// with row-level security. Used as a fallback so any build/host works out of the box.
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnR0ZHVkdWdobHJpYWppa3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzI2MTYsImV4cCI6MjA5MDYwODYxNn0.HDtxkWPvCfHYkqy6r1IlnAYJMoKh5gtYIocC402XwJo";

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

// ─── Auth helpers ────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || "").trim().toLowerCase(),
    password,
  });
  return { user: data?.user || null, error: friendlyAuthError(error) };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: friendlyAuthError(error) };
}

// Load the logged-in user's CRM profile (name, role) from crm_users.
export async function loadProfile() {
  const { data: au } = await supabase.auth.getUser();
  const uid = au?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("crm_users")
    .select("name, email, role, avatar")
    .eq("auth_id", uid)
    .maybeSingle();
  if (error || !data) {
    // Authenticated but no linked staff row → not provisioned.
    return { name: au.user.email, email: au.user.email, role: null, avatar: "?" };
  }
  return data;
}

// ─── Data helpers (thin wrappers; RLS enforced server-side) ──
export async function loadTable(table, columns = "*", opts = {}) {
  // Supabase caps each request at 1000 rows, so page through until exhausted.
  const PAGE = 1000;
  let from = 0;
  let all = [];
  for (;;) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (opts.notDeleted) q = q.or("is_deleted.is.null,is_deleted.eq.false");
    if (opts.order) q = q.order(opts.order, { ascending: opts.ascending ?? true });
    const { data, error } = await q;
    if (error) return { rows: all, error: friendlyDbError(error, table) };
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return { rows: all, error: null };
}

export async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().maybeSingle();
  return { row: data, error: friendlyDbError(error, table) };
}

export async function updateRow(table, id, patch) {
  const { data, error } = await supabase
    .from(table).update(patch).eq("id", id).select().maybeSingle();
  return { row: data, error: friendlyDbError(error, table) };
}

// Soft delete for customers; hard delete elsewhere (Owner-only via RLS).
export async function softDeleteCustomer(id) {
  const { data: au } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("customers")
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: au?.user?.id })
    .eq("id", id);
  return { error: friendlyDbError(error, "customers") };
}

// Record an export in the audit log (customer data leaving the system).
export async function logExport(table, count) {
  try {
    const profile = await loadProfile();
    await supabase.from("audit_log").insert({
      table_name: table, action: "EXPORT", actor_email: profile?.email,
      actor_role: profile?.role, details: { count },
    });
  } catch {
    /* non-fatal */
  }
}

// ─── Friendly error mapping (never leak raw DB/stack to users) ─
function friendlyAuthError(error) {
  if (!error) return null;
  const m = (error.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("email not confirmed")) return "This account isn't confirmed yet.";
  if (m.includes("network")) return "Can't reach the server — check your connection.";
  if (m.includes("rate")) return "Too many attempts. Please wait a moment and try again.";
  return "Couldn't sign in. Please try again.";
}

function friendlyDbError(error, table) {
  if (!error) return null;
  const code = error.code || "";
  if (code === "42501" || (error.message || "").includes("row-level security"))
    return "You don't have permission to do that.";
  if (code === "23505") return "That record already exists.";
  if (code === "23503") return "That's linked to other records and can't be changed.";
  if ((error.message || "").toLowerCase().includes("network"))
    return "Network problem — your change wasn't saved. Try again.";
  return "Something went wrong saving your change. Please try again.";
}
