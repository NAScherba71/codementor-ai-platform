# Credits Utilization Plan: AI Revenue Engine MVP

## Objective
Use available Google Cloud and GenAI credits to launch a profitable AI-driven revenue engine for small e-commerce and local service businesses. The initial product is a multi-channel AI sales and support agent that increases conversions, upsells, and repeat purchases.

## Core Product (MVP)
**Name:** AI Revenue Engine

**Primary outcomes for customers:**
- +10–30% lift in lead conversion (chat/DM/email)
- Faster response times (24/7 coverage)
- Higher average order value via guided upsell

**MVP features (2–3 weeks):**
1. **AI Sales Agent**
   - Qualification flow (intent, budget, timeline)
   - Product/service recommendation
   - Hand-off to human when needed
2. **Knowledge-Base Answers (RAG)**
   - FAQ, policies, pricing, availability
   - Admin upload of docs/links
3. **Multichannel Intake**
   - Web chat widget
   - WhatsApp/Instagram/Telegram (single initial channel is OK for MVP)
4. **Lead Capture + CRM/Sheet Export**
   - Push leads into Google Sheets or CRM
5. **Weekly Performance Report**
   - Leads handled, conversions, top questions

## Credits Allocation Strategy
**Goal:** Maximize learning and traction before paid infrastructure.

| Credit Source | Target Usage | Value Created |
| --- | --- | --- |
| GenAI App Builder (~$1,000) | Rapid prototyping + prompt/RAG tuning | Working MVP + demo for sales |
| Free Trial (~$300) | Serverless hosting + monitoring | Reliable runtime + analytics |
| Cloud AI Companion (~$1,140) expiring | Content generation + scripts | Sales collateral + niche-specific playbooks |

## Technical Architecture (MVP)
- **Frontend:** Next.js (existing repo) with chat widget UI and admin settings
- **Backend:** Express API to store configs and lead data
- **AI Engine:** Flask service with RAG + LLM orchestration
- **Storage:** Vector DB for embeddings + Postgres for configs and leads
- **Channels:** Start with web chat, then WhatsApp/Instagram via adapter

## 30-Day Execution Plan
### Week 1: MVP Build
- Chat widget UI (frontend)
- Single business onboarding form
- RAG ingestion pipeline (docs + FAQ)
- AI response loop (LLM + retrieval)

### Week 2: Pilot Readiness
- Lead capture pipeline (Google Sheets/CRM)
- Simple admin dashboard (conversations + stats)
- Deploy to cloud with monitoring

### Week 3: Pilot Launch (5–10 customers)
- Niche focus: salons, restaurants, or small e-commerce
- Offer setup fee + monthly subscription
- Collect metrics and case studies

### Week 4: Scale
- Sales playbook + landing page
- Add second channel (WhatsApp or Instagram)
- Optimize prompts and upsell scripts

## Monetization
**Pricing model (starting point):**
- Setup fee: $300–$1,500
- Monthly: $150–$500 for 1–3 channels
- Add-ons: content packs, CRM integration, analytics

## Success Metrics
- 5–10 paid pilots in first month
- $1,500–$5,000 MRR by month 2
- >15% conversion lift for pilot customers

## Next Implementation Steps (Repo-specific)
1. Add a simple chat widget in `frontend` with a single endpoint.
2. Expose `POST /ai/assist` endpoint in `backend` to relay prompts.
3. Build an AI Engine endpoint with RAG + fallback response.
4. Add simple admin view for conversations and lead capture.

## Risks and Mitigations
- **Low conversion impact:** Start with 1–2 niches and tailor scripts.
- **High infra costs:** Use credits for heavy inference; optimize prompt length.
- **Integration complexity:** Ship web chat first, then add channels.

---

If approved, the next step is to scaffold the chat widget and AI endpoint flows to turn the plan into a working MVP.
