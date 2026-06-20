# Sunrise Caravans — Lead Re-engagement Campaign (EMAIL ONLY)

**Voice:** Caravan Steve — honest, warm, Aussie, educator-first, never pitchy.
**Audience:** Past enquirers who've gone quiet (some for years).
**Channel:** Email only (SMS dropped — consent not confirmed).
**Reply mechanic:** one word — **BOUGHT** or **LOOKING**.
**Merge fields:** `{{first_name}}`, `{{guide_link}}` (host the 5-Questions PDF and paste the link).

**Compliance (built in):** every email carries a real unsubscribe + full sender details.
Basis: these contacts enquired with us (existing relationship). Honour unsubscribes
immediately; stop emailing anyone who never engages after this sequence.

**Standard signature (use on every email):**
```
Cheers,
Steve
Caravan Steve — Sunrise Caravans
Mobile 0477 220 296  |  steve@sunrisecaravans.com.au
```
**Standard footer (use on every email):**
```
Sunrise Caravans · 290 Eastern Service Road, Burpengary QLD 4505 · (07) 3888 4455
You're getting this because you enquired with us about a caravan.
Not in the market anymore? Unsubscribe here and I won't email you again.
```

---

## SEND SCHEDULE
| Day | Send | Exit rule |
|-----|------|-----------|
| 1 | Email 1 — Reconnect | Replies BOUGHT/LOOKING → exit sequence |
| 4 | Email 2 — Value (payload) | " |
| 10 | Email 3 — Two quick questions | " |
| 18 | Email 4 — Close the file | " |

**On reply LOOKING (the hot one):** send the LOOKING auto-reply **+ alert Steve & Mel + tag the lead "Reactivated — Hot Lead" in the CRM** so it lands in the pipeline, not an inbox. Speed-to-lead within the hour converts far better.
**On reply BOUGHT:** send the BOUGHT auto-reply (goodwill + referral + guide).

---

## EMAIL 1 — Reconnect (Day 1)
**Subject:** Did you ever find your van, {{first_name}}?

Hi {{first_name}},

It has been a fair while since we last spoke — and that one is on me. You came to us a while back looking at a caravan, and I have honestly wondered how you went. So I am just going to ask.

**Did you ever find your van?**

If you did — good on you, genuinely. I hope she is getting you out there.

If you did not, or you settled for one that never quite fit, I would love the chance to help you sort it properly this time.

No pressure, no sales spin — that has never been my style. Just hit reply with one word:

**BOUGHT** — if you are sorted.
**LOOKING** — if you are still in the market.

If you are still searching, I will personally match the right Australian-made van to what you actually need. No obligation. And if you have already bought elsewhere, reply anyway and I will send you my free guide — the five questions worth asking any dealer before you sign. My shout. Nobody should get done over on a van.

Same honest Queensland family team you dealt with back then — still here, 400-plus reviews at 4.9 stars later.

Whenever you are ready, I am here.

*(signature + footer)*

---

## EMAIL 2 — Follow-up 1 (Day 4) · lead with value
**Subject:** One thing worth knowing before you buy, {{first_name}}

Hi {{first_name}},

No dramas if my last one slipped past — I know life gets busy.

Quick bit of value while I have you. The single biggest thing that catches Aussie caravan buyers out is **payload** — the weight you are actually allowed to load before you are over your ATM. Plenty of vans look the part and leave you next to nothing once the water, gas, food and gear go in. Go over it and you are not just voiding your warranty — you can void your insurance too.

If you are still looking, reply **LOOKING** and I will make sure you never get caught by it.

*(signature + footer)*

---

## EMAIL 3 — Follow-up 2 (Day 10) · make it about them
**Subject:** What were you after again, {{first_name}}?

Hi {{first_name}},

Last couple of things from me, then I will get out of your hair.

If you are still in the market, just tell me two things — the size van you are after, and whether you want off-road or on-road — and I will send you a couple of options that actually fit. No obligation.

If you are sorted, a quick **BOUGHT** and I will leave you be.

*(signature + footer)*

---

## EMAIL 4 — Follow-up 3 (Day 18) · close the loop (the takeaway)
**Subject:** Should I close your file, {{first_name}}?

Hi {{first_name}},

I have not heard back — which is totally fine — but I do not want to keep landing in your inbox if the timing is not right.

So this is the last one from me. If you would like me to keep an eye out for the right van for you, just reply **LOOKING**. If not, no hard feelings at all — I will close your file and leave you to it.

Either way, happy travels.

*(signature + footer)*

---

## AUTO-REPLY — triggered by reply "LOOKING" (HOT)
**Subject:** Great to hear, {{first_name}} — let's get you sorted

Hi {{first_name}},

Bloody good to hear you are still on the hunt — thanks for getting back to me.

I will personally come back to you within one business day. To get you sorted faster, hit reply and tell me three quick things:

- The size van you are after
- Off-road or on-road
- Roughly when you are hoping to be on the road

That is all I need to start lining up a couple of options that actually fit. No obligation, no pressure.

Prefer a yarn? Call the yard on (07) 3888 4455 and ask for me, or my mobile 0477 220 296.

Talk soon,

*(signature + footer)*

> **System:** also alert Steve & Mel, and tag this lead **"Reactivated — Hot Lead"** in the CRM.

---

## AUTO-REPLY — triggered by reply "BOUGHT" (goodwill + referral)
**Subject:** Good on you, {{first_name}}

Hi {{first_name}},

Love it — good on you. Genuinely happy you got yourself sorted. I hope she is everything you wanted and gets you to some cracking spots.

As promised, here is my free guide — the five questions worth asking any dealer: {{guide_link}}. Even with your buying done, it is a handy one to pass to any mate about to take the plunge.

If you ever need a hand down the track — service, parts, an honest second opinion, or an upgrade when the time comes — you know where I am. And if you were happy with how we looked after you, sending a mate our way is the biggest compliment you can give.

Happy travels,

*(signature + footer)*

---

## STILL TO DO BEFORE SENDING
1. **Host the guide:** upload `5_Questions_Australian_Made.pdf` somewhere public (website or Google Drive) and paste the URL into `{{guide_link}}`.
2. **Confirm consent comfort:** these are past enquirers — fine for a re-connect email with unsubscribe. Don't re-email non-responders after Email 4.
3. **Load into your tools:** paste Emails 1–4 into Mailchimp as a 4-step automation (Day 1/4/10/18, exit on reply); set the two auto-replies.
4. **Wire the CRM rule:** LOOKING reply → tag "Reactivated — Hot Lead" + alert (comes with the deploy + notifier step).

---

## INTERNAL HOT-LEAD ALERT (to Steve & Mel — NOT a customer message)
Fires only on **LOOKING**, never on BOUGHT. Internal staff alert = fine to send by SMS to your
own phones (it's not marketing); Slack + SMS to both phones is the safest "seen within the hour" combo.

**Slack / push / email version:**
```
🔥 HOT LEAD — old enquiry just replied LOOKING
Who: {{first_name}} {{last_name}}
Originally enquired: {{original_enquiry}}, about {{years_ago}} ago
They told us: {{their_answers}} (size, off/on road, timing)
Contact: {{phone}} | {{email}}
Open in CRM: {{crm_link}}
Action: call within the hour. {{assigned_to}}, this one is yours.
```
**SMS to Steve & Mel's phones (internal — OK):**
```
HOT LEAD: {{first_name}} {{last_name}} just replied LOOKING (enquired {{years_ago}} ago re {{original_enquiry}}). Call now: {{phone}}. Details: {{crm_link}}
```
Notes for Code: if they answered the 3 qualifiers, drop them into {{their_answers}}; if just the one
word, show the raw reply. Route to wherever you two look fastest.

---

## REACTIVATION CALL CHEAT-SHEET (for Steve & Mel — glance, don't read word-for-word)
**Before you dial (10 sec):** check the CRM — what they enquired about, how long ago, what they just said. Never make them repeat it.
1. **Open warm, get permission** — "Hi {{first_name}}, it's Steve from Sunrise — you got back to me about a van, thanks for that. Caught you at an alright time for a quick chat?"
2. **Own the gap** — "It's been a fair while, so I won't pretend I remember every detail. Where are you at with the van these days?"
3. **Listen 2/3, talk 1/3** — Did you buy or still looking? If bought & not thrilled, what'd you change? If not, what stopped you? Plan for the van? What are you towing with? Budget & timing? *Don't pitch a single van until you understand them.*
4. **Drop one bit of real value** — "Quick tip — the thing that catches most people out is payload, matching the van to what you're towing with. That's the first thing I'll check for you, not the last."
5. **Match & book the next step** — line up 2–3 that genuinely fit, book a time to view or a phone walk-through. A time in the diary beats "I'll think about it."

**Common ones:** *Just looking* → send a couple that fit, stay warm, no push. *Bought elsewhere* → "Good on you, genuinely" + referral seed. *Too expensive* → understand the real number, talk value, mention finance through **Finetic** if it helps; never discount on the spot. *Been burnt before* → lean in: "That's exactly why we do it the way we do — ask me the hard questions."

**Golden rules:** listen more than you talk; never pitch before you understand them; be honest even when it costs the sale; no pressure, ever — the trust does the selling.

