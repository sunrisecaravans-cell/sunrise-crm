# Sunrise Caravans — Data Breach Response Plan (one page)

*Practical plan aligned with Australia's Notifiable Data Breaches (NDB) scheme. Keep it
where the team can find it fast. Not formal legal advice — confirm against oaic.gov.au.*

**Response Officer: Steve Andonovski** — (07) 3888 4455 / 0477 220 296 / steve@sunrisecaravans.com.au
*(If Steve is unavailable, Mel acts in his place.)*

---

## What counts as a data breach
Customer personal information is lost, stolen, or seen/changed by someone who shouldn't —
for example: a login or password is compromised, a device with access is lost or stolen,
a customer list is emailed or exported to the wrong place, or someone gains access to the CRM.

## If a breach happens — work these 4 steps, in order

**1. CONTAIN (immediately)**
- Stop it spreading: change the affected password(s), sign the device out, disable any
  account that may be compromised (Supabase → Authentication → Users).
- If a wrong export went out, recall/delete it where possible.

**2. ASSESS (within 30 days — sooner is better)**
- Work out *what* information, *whose*, and *how much*. The CRM **audit log** shows who
  accessed, changed, deleted or exported what, and when — start there.
- Ask: is this likely to cause **serious harm** to anyone (e.g. identity theft, fraud,
  financial loss)? If yes, it's an "eligible data breach" and step 3 applies.

**3. NOTIFY (if serious harm is likely)**
- Notify the **OAIC** using the form at oaic.gov.au (Notifiable Data Breach form).
- Notify the **affected people** — tell them what happened, what information was involved,
  and what they should do (e.g. change passwords, watch their accounts).
- Be straight and prompt. A fast, honest heads-up protects people and your reputation.

**4. REVIEW (after)**
- Fix the cause so it can't happen again (e.g. turn on 2-factor login, tighten who has access).
- Write a short note of what happened and what you changed. Keep it on file.

## Prevention checklist (do these now — they stop most breaches)
- [ ] 2-factor login turned on for Steve, Mel, Anita
- [ ] Temp password changed; never share logins (each person has their own)
- [ ] Daily backups turned on (Supabase)
- [ ] Exports kept to the Owner only (already set) — exporting the customer list is the easiest leak
- [ ] When someone leaves the team, disable their login the same day

## Useful contacts
- **OAIC** (privacy regulator) — oaic.gov.au · 1300 363 992
- **Supabase support** (where the data is hosted) — supabase.com/support
- **IDCARE** (free identity-theft support to give affected customers) — idcare.org · 1800 595 160
