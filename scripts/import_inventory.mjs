// Sunrise CRM — Inventory bulk loader
// Reads a CSV of vans and pushes to Supabase inventory table.
//
// CSV format (header row required):
//   model,year,status,price,cost_price,stock,vin,chassis_no,tare_kg,atm_kg,
//   ball_weight_kg,length_m,arrived_date,features,video_url
//
// Minimum required: model
// Status values: Available | Reserved | On Hold | Sold | Delivered (default: Available)
//
// Run: node scripts/import_inventory.mjs <path-to-csv>

import fs from "node:fs";

const SUPABASE_URL = "https://nubttdudughlriajikrr.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnR0ZHVkdWdobHJpYWppa3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzI2MTYsImV4cCI6MjA5MDYwODYxNn0.HDtxkWPvCfHYkqy6r1IlnAYJMoKh5gtYIocC402XwJo";

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else if (c === '"') inQuotes = true;
    else cur += c;
  }
  out.push(cur);
  return out;
}

function num(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function int(v) {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function buildRow(row, idx) {
  const r = {
    model: (row[idx.model] || "").trim(),
    year: int(row[idx.year]),
    status: (row[idx.status] || "Available").trim() || "Available",
    price: num(row[idx.price]) ?? 0,
    cost_price: num(row[idx.cost_price]) ?? 0,
    stock: int(row[idx.stock]) ?? 1,
    features: (row[idx.features] || "").trim() || null,
    vin: (row[idx.vin] || "").trim() || null,
    chassis_no: (row[idx.chassis_no] || "").trim() || null,
    tare_kg: num(row[idx.tare_kg]),
    atm_kg: num(row[idx.atm_kg]),
    ball_weight_kg: num(row[idx.ball_weight_kg]),
    length_m: num(row[idx.length_m]),
    arrived_date: (row[idx.arrived_date] || "").trim() || null,
    video_url: (row[idx.video_url] || "").trim() || null,
  };
  if (!r.model) return null;
  // Strip out null fields so we don't override DB defaults
  for (const k of Object.keys(r)) if (r[k] === null) delete r[k];
  return r;
}

async function postBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node import_inventory.mjs <path-to-csv>");
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const data = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "");
  const lines = data.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    console.error("CSV must have a header row + at least one data row.");
    process.exit(1);
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idx = {};
  headers.forEach((h, i) => (idx[h] = i));

  if (idx.model === undefined) {
    console.error('CSV must include a "model" column.');
    console.error("Available columns:", headers.join(", "));
    process.exit(1);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const r = buildRow(parseCsvLine(lines[i]), idx);
    if (r) rows.push(r);
  }

  console.log(`Parsed ${rows.length} rows. Sending to Supabase...`);

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    try {
      await postBatch(batch);
      console.log(`✓ Batch ${Math.floor(i / BATCH) + 1} sent (${i + batch.length}/${rows.length})`);
    } catch (e) {
      console.error(`✗ Batch failed at offset ${i}:`, e.message);
      // Retry per-row to find the bad one
      for (const r of batch) {
        try {
          await postBatch([r]);
        } catch (err) {
          console.error(`  Bad row "${r.model}":`, err.message);
        }
      }
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
