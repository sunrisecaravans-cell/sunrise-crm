// Sunrise CRM — shared Supabase REST client
// Used by SunriseCRM.jsx and WorkshopPage.jsx so both pages share the same connection.

const STORAGE_URL = "sunrise_crm_supabase_url";
const STORAGE_KEY = "sunrise_crm_supabase_key";

let SUPABASE_CONFIG = {
  url: typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_URL) || "" : "",
  key: typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "" : "",
};

export function setSBKeys(url, key) {
  SUPABASE_CONFIG = { url, key };
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_URL, url || "");
      localStorage.setItem(STORAGE_KEY, key || "");
    }
  } catch {
    // localStorage may be blocked in private mode — ignore
  }
}

export function getKeys() {
  return SUPABASE_CONFIG;
}

export function isConnected() {
  const { url, key } = SUPABASE_CONFIG;
  return Boolean(url && key);
}

function headers(extra = {}) {
  const { key } = SUPABASE_CONFIG;
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

export async function dbLoad(table, query = "") {
  const { url } = SUPABASE_CONFIG;
  if (!isConnected()) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}${query}`, {
      method: "GET",
      headers: headers(),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch {
    return null;
  }
}

export async function dbInsert(table, data) {
  const { url } = SUPABASE_CONFIG;
  if (!isConnected()) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function dbUpdate(table, id, data) {
  const { url } = SUPABASE_CONFIG;
  if (!isConnected()) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function dbDelete(table, id) {
  const { url } = SUPABASE_CONFIG;
  if (!isConnected()) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
