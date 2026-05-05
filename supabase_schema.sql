-- ═══════════════════════════════════════════════════════════════════════════════
-- SUNRISE CRM v9 — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates all tables, enables RLS, and seeds demo data.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── USERS TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Sales',
  avatar TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOMERS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Hot Lead',
  interest TEXT,
  value NUMERIC DEFAULT 0,
  last_contact DATE,
  notes TEXT,
  follow_up DATE,
  source TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVENTORY TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  model TEXT NOT NULL,
  year INTEGER DEFAULT 2026,
  status TEXT NOT NULL DEFAULT 'Available',
  price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  features TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRADE-INS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_ins (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  van_make TEXT,
  van_model TEXT,
  year INTEGER,
  condition TEXT DEFAULT 'Good',
  est_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SERVICE JOBS TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_jobs (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  van_model TEXT,
  job_type TEXT NOT NULL DEFAULT 'Service',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Booked',
  booked_date DATE,
  hours NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 140,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DELIVERIES TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  van_model TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  pdi_date DATE,
  delivery_date DATE,
  checklist JSONB DEFAULT '{"pdi":false,"cleaned":false,"gas":false,"rego":false,"insurance":false,"walkthrough":false}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACTIVITIES TABLE (Customer Timeline) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  type TEXT NOT NULL DEFAULT 'Note',
  notes TEXT,
  created_by TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FINANCE DEALS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_deals (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  van_model TEXT,
  loan_amount NUMERIC DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  term INTEGER DEFAULT 60,
  rate NUMERIC DEFAULT 0,
  lender TEXT,
  status TEXT NOT NULL DEFAULT 'Enquired',
  monthly NUMERIC DEFAULT 0,
  submitted TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EMAIL TEMPLATES TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (basic — allows all authenticated requests via anon key)
-- You can tighten this later with proper Supabase Auth policies.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (your CRM app uses the publishable key)
-- In production, replace with proper auth policies.
CREATE POLICY "Allow all for anon" ON crm_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON trade_ins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON service_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON finance_deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON email_templates FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Same demo data as the CRM
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users
INSERT INTO crm_users (id, name, email, role, avatar, password) VALUES
  (1, 'Steve Andonovski', 'steve@sunrisecaravans.com.au', 'Owner', 'SA', 'sunrise2026'),
  (2, 'Mel Ruffy', 'mel@sunrisecaravans.com.au', 'Sales Manager', 'MR', 'mel2026'),
  (3, 'Anita', 'anita@sunrisecaravans.com.au', 'Sales', 'AN', 'anita2026')
ON CONFLICT (email) DO NOTHING;

-- Customers
INSERT INTO customers (id, name, email, phone, status, interest, value, last_contact, notes, follow_up, source, assigned_to) VALUES
  (1, 'James Hartley', 'james.h@email.com', '0412 345 678', 'Hot Lead', 'Sunset Wildtrekker 19ft8', 109900, '2026-03-28', 'Family of 4, wants ATM info', '2026-04-03', 'Facebook Ad', 'Steve'),
  (2, 'Sandra Nguyen', 'sandra.n@email.com', '0423 456 789', 'Negotiating', 'Blue Sky Sapphire 21ft', 89900, '2026-03-30', 'Comparing with competitor', '2026-04-02', 'Website', 'Mel'),
  (3, 'Peter Walsh', 'peter.w@email.com', '0434 567 890', 'Won', 'Sunset Family Haven 18ft9', 94900, '2026-03-25', 'Sold! Delivery booked', NULL, 'Walk-In', 'Steve'),
  (4, 'Laura Simmons', 'laura.s@email.com', '0445 678 901', 'Cold Lead', 'Sunset Family Horizon 23ft', 119900, '2026-03-10', 'Enquired online, no reply', '2026-04-05', 'Google Ad', 'Anita'),
  (5, 'Michael Chen', 'm.chen@email.com', '0456 789 012', 'Hot Lead', 'Blue Sky Sapphire 21ft', 89900, '2026-04-01', 'Retiring soon, ready to buy', '2026-04-04', 'Referral', 'Steve'),
  (6, 'Tracey Burns', 'tracey.b@email.com', '0467 890 123', 'Warm Lead', 'Sunset Wildtrekker 19ft8', 109900, '2026-03-29', 'First time buyer', '2026-04-06', 'Caravan Show', 'Mel'),
  (7, 'David Okafor', 'd.okafor@email.com', '0478 901 234', 'Won', 'Sunset Family Haven 18ft9', 94900, '2026-03-20', 'Repeat customer', NULL, 'Referral', 'Anita'),
  (8, 'Fiona Marshall', 'fiona.m@email.com', '0489 012 345', 'Negotiating', 'Sunset Family Horizon 23ft', 119900, '2026-03-31', 'Wants extended warranty', '2026-04-03', 'Website', 'Steve')
ON CONFLICT (id) DO NOTHING;

-- Inventory
INSERT INTO inventory (id, model, year, status, price, cost_price, stock, features) VALUES
  (1, 'Sunset Wildtrekker 19ft8', 2026, 'Available', 109900, 82000, 3, 'Off-road, Solar 200W, Lithium 100Ah'),
  (2, 'Sunset Family Haven 18ft9', 2026, 'Reserved', 94900, 68000, 1, 'Ensuite, Air Con, Bunk beds'),
  (3, 'Sunset Family Horizon 23ft', 2026, 'Available', 119900, 89000, 2, 'Rear lounge, 3 zone AC, 300Ah lithium'),
  (4, 'Blue Sky Sapphire 21ft', 2026, 'Available', 89900, 64000, 4, 'Australian made, Airbag suspension, Victron')
ON CONFLICT (id) DO NOTHING;

-- Trade-ins
INSERT INTO trade_ins (id, customer_name, van_make, van_model, year, condition, est_value, notes) VALUES
  (1, 'Sandra Nguyen', 'Jayco', 'Journey 17', 2019, 'Good', 28000, 'Some wear on annexe'),
  (2, 'Michael Chen', 'Coromal', 'Element 511S', 2018, 'Fair', 22000, 'Fridge not working')
ON CONFLICT (id) DO NOTHING;

-- Service Jobs
INSERT INTO service_jobs (id, customer_name, van_model, job_type, description, status, booked_date, hours, rate) VALUES
  (1, 'Peter Walsh', 'Sunset Family Haven 18ft9', 'Warranty', 'Water ingress rear tunnel boot', 'In Progress', '2026-04-02', 8, 140),
  (2, 'David Okafor', 'Sunset Family Haven 18ft9', 'Service', 'Annual service and brake check', 'Booked', '2026-04-05', 3, 140),
  (3, 'Tracey Burns', 'Sunset Wildtrekker 19ft8', 'PDI', 'Pre-delivery inspection', 'Completed', '2026-03-28', 2, 140)
ON CONFLICT (id) DO NOTHING;

-- Deliveries
INSERT INTO deliveries (id, customer_name, van_model, status, pdi_date, delivery_date, checklist, notes) VALUES
  (1, 'Peter Walsh', 'Sunset Family Haven 18ft9', 'PDI Complete', '2026-04-02', '2026-04-10', '{"pdi":true,"cleaned":true,"gas":false,"rego":true,"insurance":false,"walkthrough":false}', 'Customer picking up Saturday morning'),
  (2, 'David Okafor', 'Sunset Family Haven 18ft9', 'Scheduled', '2026-04-05', '2026-04-12', '{"pdi":false,"cleaned":false,"gas":false,"rego":true,"insurance":true,"walkthrough":false}', 'Repeat customer, knows the drill')
ON CONFLICT (id) DO NOTHING;

-- Finance Deals
INSERT INTO finance_deals (id, customer_name, van_model, loan_amount, deposit, term, rate, lender, status, monthly, submitted, notes) VALUES
  (1, 'Sandra Nguyen', 'Blue Sky Sapphire 21ft', 75000, 14900, 84, 8.5, 'Pepper Money', 'Conditionally Approved', 1159.89, '30/03/2026', 'Awaiting payslips'),
  (2, 'Michael Chen', 'Blue Sky Sapphire 21ft', 89900, 0, 60, 7.9, 'Liberty Financial', 'Applied', 1815.46, '01/04/2026', 'Self employed — 2yr BAS required')
ON CONFLICT (id) DO NOTHING;

-- Email Templates
INSERT INTO email_templates (id, name, category, subject, body) VALUES
  (1, 'First Enquiry Response', 'Lead', 'Thanks for your enquiry — {van_model}', E'Hi {first_name},\n\nThanks for reaching out about the {van_model}. Great choice — it''s one of our most popular models.\n\nI''d love to have a yarn about what you''re looking for and make sure it''s the right fit. Are you free for a quick call this week, or would you prefer to come down to the yard for a look?\n\nWe''re at 290 Eastern Service Rd, Burpengary — open 7 days.\n\nCheers,\nSteve\nSunrise Caravans\n(07) 3888 4455'),
  (2, 'Quote Follow Up', 'Sales', 'Following up on your {van_model} quote', E'Hey {first_name},\n\nJust touching base on the quote I sent through for the {van_model}.\n\nHave you had a chance to look it over? Happy to answer any questions or chat through the numbers. If you want to pop in for another look, we''ve still got {stock} in stock.\n\nNo pressure at all — just don''t want you to miss out.\n\nCheers,\nSteve\nSunrise Caravans\n0483 922 811'),
  (3, 'Post-Sale Thank You', 'After Sale', 'Welcome to the Sunrise family!', E'Hey {first_name},\n\nJust wanted to say a massive congrats on the new {van_model}! You''ve made an awesome choice.\n\nA few things for your records:\n- Your warranty starts from delivery date\n- First service is due at 3 months or 5,000km\n- If anything comes up, call us on (07) 3888 4455\n\nWe''d really appreciate if you could leave us a Google review when you get a chance — it helps other families find us.\n\nHappy travels!\nSteve & the Sunrise team'),
  (4, 'Service Reminder', 'Service', 'Time for a service on your {van_model}', E'Hi {first_name},\n\nHope you''re getting plenty of use out of the {van_model}!\n\nJust a friendly heads up — it''s about time for a service. We recommend a full check every 12 months or 10,000km to keep everything running sweet.\n\nWe can usually book you in within the week. Give us a call on (07) 3888 4455 or reply to this email and we''ll sort a time.\n\nCheers,\nSunrise Caravans Service Team'),
  (5, 'Cold Lead Re-engagement', 'Lead', 'Still thinking about a caravan?', E'Hey {first_name},\n\nSteve from Sunrise Caravans here. You had a look at the {van_model} a little while back — just wanted to check in and see if you''re still in the market?\n\nWe''ve got some great stock in right now and a few things have changed since we last spoke. Happy to give you an updated price if you''re interested.\n\nNo worries if the timing''s not right — just wanted you to know we''re here when you''re ready.\n\nCheers,\nSteve\n0483 922 811'),
  (6, 'Finance Approval', 'Finance', 'Great news — your finance is approved!', E'Hey {first_name},\n\nGreat news! Your finance application for the {van_model} has been approved through {lender}.\n\nHere are the key details:\n- Loan amount: {loan_amount}\n- Monthly repayment: {monthly}\n- Term: {term}\n\nNext steps — we need to lock in a delivery date and get you booked in for a handover walkthrough.\n\nGive me a call when you''re free and we''ll get the ball rolling.\n\nCheers,\nSteve\nSunrise Caravans')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to avoid ID conflicts with future inserts
SELECT setval('crm_users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM crm_users) + 1, false);
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 0) FROM customers) + 1, false);
SELECT setval('inventory_id_seq', (SELECT COALESCE(MAX(id), 0) FROM inventory) + 1, false);
SELECT setval('trade_ins_id_seq', (SELECT COALESCE(MAX(id), 0) FROM trade_ins) + 1, false);
SELECT setval('service_jobs_id_seq', (SELECT COALESCE(MAX(id), 0) FROM service_jobs) + 1, false);
SELECT setval('deliveries_id_seq', (SELECT COALESCE(MAX(id), 0) FROM deliveries) + 1, false);
SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 0) FROM activities) + 1, false);
SELECT setval('finance_deals_id_seq', (SELECT COALESCE(MAX(id), 0) FROM finance_deals) + 1, false);
SELECT setval('email_templates_id_seq', (SELECT COALESCE(MAX(id), 0) FROM email_templates) + 1, false);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Your Sunrise CRM database is ready.
-- Go back to the CRM, enter your Supabase URL and anon key in Settings,
-- and you'll see the green "Connected" badge appear.
-- ═══════════════════════════════════════════════════════════════════════════════
