# HM Dummy Dashboard POC — Requirements

**Source spec:** *Happiness Meter Scoring – Structured Spec (v0.1)*\
**Audience:** CX Design & Analytics (analysts, designers, FE devs)\
**Goal:** Build a proof‑of‑concept **dummy dashboard web app** that demonstrates the scoring logic and analyst UX using **json‑server** (mock API), **shadcn/ui** (React/Tailwind), and **Apache ECharts** (interactive charts).

---

## 0) Project Summary

A lightweight, local‑first React app that renders key Happiness Meter KPIs and drill‑downs for a single (or few) entities using mock data. The POC must:

- Implement the **EntityScore** stack per spec: Channel Score → Service Scores → Entity aggregation (with DCX cascade & Type‑2 splits).
- Provide 3 analyst views: **Overview**, **Services**, **Channels** with slicers and interactions.
- Use **json‑server** as the backing API with a realistic schema and seed data.
- Use **shadcn/ui** components for a polished, WCAG‑friendly baseline.
- Use **ECharts** for highly interactive charts (zoom/brush, legends, tooltips, drill hints).

---

## 1) In‑Scope / Out‑of‑Scope

**In‑scope**

- Read‑only POC UI; no auth, no persistence beyond json‑server.
- Basic i18n scaffolding (en→ar strings, RTL toggle).
- Calculation logic in FE selectors (or a small helper layer).
- Filters/slicers: Entity, channel type, service type, DCX membership, date range, min review count, search.
- Testable “golden numbers” that reproduce the sample calculations from the spec.

**Out‑of‑scope**

- Real integrations, server auth, role‑based access, write endpoints.
- Production hardening, scaling, or cloud deployment.

---

## 2) Target Users & Primary Goals

- **Analyst (primary):** monitor Happiness KPIs, find problem areas (worst services/channels), validate that scoring math matches spec.
- **Designer/PO (secondary):** review interaction patterns, component choices, and information architecture for future build‑out.

Top goals:

1. See **EntityScore, EntityServiceScore, EntityChannelScore** at a glance with trend.
2. Quickly identify **worst performing services/channels**.
3. Drill into a service, view channel‑of‑review mix, Type‑2 split (Process/Deliverable), and DCX influence.

---

## 3) KPI Definitions (per spec)

- **EntityScore = 0.70 × EntityServiceScore + 0.30 × EntityChannelScore**
- **Channel types & default weights:** App 50%, Web 20%, Service Center 30% (redistribute evenly if one/more types missing)
- **Service Types:**
  - Type‑1 (non‑deliverable): single score on completion.
  - Type‑2 (deliverable): **Standalone = 0.80 × Process + 0.20 × Deliverable**
- **DCX cascade:** DCX score distributed evenly across member services; each service blends **Overall = 0.70 × Standalone + 0.30 × DCX**
- **Channel‑of‑review weights**: Use from dataset; example mix (App 0.38, Web 0.26, Shared 0.36) when provided.

> All rounding: two decimals (display), but keep full precision for internal aggregation.

---

## 4) Views & UX

### 4.1 Overview (Analyst)

**Purpose:** Executive snapshot + triage.

**Key UI**

- KPI Cards:
  - **EntityScore** (big), **EntityServiceScore**, **EntityChannelScore**.
  - Delta vs previous period (↑/↓), color‑coded.
- Trend Line (ECharts): EntityScore over time (daily/weekly toggle).
- Bar: **Worst 10 Services** (Overall) with review counts as secondary axis/tooltip.
- Bar: **Worst Channels** by type (App/Web/Service Center), with asset drill hints.
- Pie/Donut: **Channel‑of‑Review mix** for the selected period.
- Table (DataTable): Alerts (low score, low volume, high variance).

**Slicers:** Entity, date range, min reviews, channel type, service type, DCX membership.

### 4.2 Services Page

**Purpose:** Compare services and dive into a single service.

**Key UI**

- Table: Service name, type (1/2), standalone score, DCX‑influenced overall score, review volume, owner (entity), DCX tags.
- Small multiples (spark lines) per service: trend of Overall.
- Detail panel (drawer):
  - Type‑2 breakdown (Process vs Deliverable).
  - Channel‑of‑review mix (stacked bar).
  - DCX influence: DCX score, distribution % across steps, contribution to service Overall.

**Slicers:** All from Overview + service type quick filter.

### 4.3 Channels Page

**Purpose:** Understand channel performance & inventory.

**Key UI**

- KPI Cards: App/Web/Service Center sub‑scores (weighted), asset counts.
- Grid of assets: apps, portals, and **service centers → booths** with mini charts.
- Bar: Channel Type averages; Table: worst assets; Map (optional later) for centers.

**Slicers:** Channel type, asset, location (if present), date range.

---

## 5) Data Model (json‑server)

Use a single `db.json`. Example entity sets:

```json
{
  "entities": [
    { "id": "ent-1", "name": "Dummy Entity A" }
  ],
  "services": [
    { "id": "srv-A", "entityId": "ent-1", "name": "Service A", "type": 1, "dcxIds": ["dcx-1"] },
    { "id": "srv-B", "entityId": "ent-1", "name": "Service B", "type": 2, "dcxIds": ["dcx-1"] },
    { "id": "srv-C", "entityId": "ent-1", "name": "Service C", "type": 1, "dcxIds": [] }
  ],
  "channels": [
    { "id": "ch-app-1", "entityId": "ent-1", "type": "app", "name": "Generic App 1" },
    { "id": "ch-app-2", "entityId": "ent-1", "type": "app", "name": "Generic App 2" },
    { "id": "ch-web-1", "entityId": "ent-1", "type": "web", "name": "Generic Portal 1" },
    { "id": "ch-web-2", "entityId": "ent-1", "type": "web", "name": "Generic Portal 2" },
    { "id": "ch-sc-1", "entityId": "ent-1", "type": "service_center", "name": "Jumeirah Service Center" },
    { "id": "ch-sc-2", "entityId": "ent-1", "type": "service_center", "name": "Mamzar Service Center" }
  ],
  "booths": [
    { "id": "booth-j-1", "centerId": "ch-sc-1", "name": "Booth 1" },
    { "id": "booth-j-2", "centerId": "ch-sc-1", "name": "Booth 2" },
    { "id": "booth-j-3", "centerId": "ch-sc-1", "name": "Booth 3" },
    { "id": "booth-m-1", "centerId": "ch-sc-2", "name": "Booth 1" },
    { "id": "booth-m-2", "centerId": "ch-sc-2", "name": "Booth 2" },
    { "id": "booth-m-3", "centerId": "ch-sc-2", "name": "Booth 3" }
  ],
  "channelRatings": [
    { "id": "cr-1", "channelId": "ch-app-1", "ts": "2025-09-01", "score": 90, "n": 100 },
    { "id": "cr-2", "channelId": "ch-app-2", "ts": "2025-09-01", "score": 80, "n": 80 },
    { "id": "cr-3", "channelId": "ch-web-1", "ts": "2025-09-01", "score": 40, "n": 50 },
    { "id": "cr-4", "channelId": "ch-web-2", "ts": "2025-09-01", "score": 10, "n": 30 },
    { "id": "cr-5", "boothId": "booth-j-1", "ts": "2025-09-01", "score": 50, "n": 30 },
    { "id": "cr-6", "boothId": "booth-j-2", "ts": "2025-09-01", "score": 20, "n": 20 },
    { "id": "cr-7", "boothId": "booth-j-3", "ts": "2025-09-01", "score": 50, "n": 30 },
    { "id": "cr-8", "boothId": "booth-m-1", "ts": "2025-09-01", "score": 50, "n": 20 },
    { "id": "cr-9", "boothId": "booth-m-2", "ts": "2025-09-01", "score": 20, "n": 20 },
    { "id": "cr-10", "boothId": "booth-m-3", "ts": "2025-09-01", "score": 50, "n": 20 }
  ],
  "serviceReviews": [
    { "id": "rv-a-app", "serviceId": "srv-A", "ts": "2025-09-01", "channelOfReview": "app", "score": 88, "n": 50 },
    { "id": "rv-a-web", "serviceId": "srv-A", "ts": "2025-09-01", "channelOfReview": "web", "score": 70, "n": 20 },
    { "id": "rv-a-shared", "serviceId": "srv-A", "ts": "2025-09-01", "channelOfReview": "shared", "score": 80, "n": 30 },

    { "id": "rv-b-proc-app", "serviceId": "srv-B", "ts": "2025-09-01", "channelOfReview": "app", "phase": "process", "score": 82, "n": 40 },
    { "id": "rv-b-proc-web", "serviceId": "srv-B", "ts": "2025-09-01", "channelOfReview": "web", "phase": "process", "score": 74, "n": 30 },
    { "id": "rv-b-proc-shared", "serviceId": "srv-B", "ts": "2025-09-01", "channelOfReview": "shared", "phase": "process", "score": 78, "n": 20 },
    { "id": "rv-b-del-app", "serviceId": "srv-B", "ts": "2025-09-01", "channelOfReview": "app", "phase": "deliverable", "score": 85, "n": 40 },
    { "id": "rv-b-del-web", "serviceId": "srv-B", "ts": "2025-09-01", "channelOfReview": "web", "phase": "deliverable", "score": 76, "n": 30 },
    { "id": "rv-b-del-shared", "serviceId": "srv-B", "ts": "2025-09-01", "channelOfReview": "shared", "phase": "deliverable", "score": 80, "n": 20 },

    { "id": "rv-c-app", "serviceId": "srv-C", "ts": "2025-09-01", "channelOfReview": "app", "score": 92, "n": 10 },
    { "id": "rv-c-web", "serviceId": "srv-C", "ts": "2025-09-01", "channelOfReview": "web", "score": 65, "n": 15 },
    { "id": "rv-c-shared", "serviceId": "srv-C", "ts": "2025-09-01", "channelOfReview": "shared", "score": 72, "n": 25 }
  ],
  "dcx": [
    { "id": "dcx-1", "name": "Build a House", "steps": ["srv-A", "srv-B"] }
  ],
  "dcxReviews": [
    { "id": "dcx-1-2025-09-01", "dcxId": "dcx-1", "ts": "2025-09-01", "score": 75, "n": 50 }
  ],
  "weights": {
    "channelTypeDefault": { "app": 0.5, "web": 0.2, "service_center": 0.3 },
    "channelOfReview": { "app": 0.38, "web": 0.26, "shared": 0.36 }
  }
}
```

> Notes
>
> - Service center scoring comes from **booth‑level ratings → center average → type average**.
> - If a channel type has no assets, **redistribute its default weight evenly** across present types.

**json‑server features used**: `_embed`, `_expand`, `_sort`, `_order`, `q`, `_limit` for list views; lightweight aggregation done client‑side.

---

## 6) Calculations (display‑critical)

Implement as pure functions/selectors (unit‑tested with the seed):

1. **Channel type averages**

   - App/Web: average of asset scores weighted by `n`.
   - Service Center: per‑center booth average (weighted by `n` per booth), then average centers (weighted by center `n`).
   - Apply **default weights** (w\_app, w\_web, w\_sc) with redistribution if a type is missing → **EntityChannelScore**.

2. **Service standalone score**

   - Gather all service reviews for the period.
   - For Type‑1: channel‑of‑review weighted average.
   - For Type‑2: compute Process and Deliverable sub‑averages, then `Standalone = 0.80·Process + 0.20·Deliverable`.

3. **DCX cascade**

   - For each completed DCX, distribute its score **evenly across member services** to get a **DCX‑sourced Service Score**.
   - Blend per service: `Overall = 0.70·Standalone + 0.30·DCX`.

4. **EntityServiceScore**

   - Weighted average of service **Overall** by standalone review counts (sum of `n` across service reviews in period).

5. **EntityScore**

   - `EntityScore = 0.70·EntityServiceScore + 0.30·EntityChannelScore`.

**Golden validation** (seed above should reproduce):

- `EntityChannelScore = 59.50`
- `EntityServiceScore = 78.45`
- `EntityScore = 72.77`

---

## 7) API Endpoints (examples)

- `GET /entities`
- `GET /entities/:id?_embed=services&_embed=channels`
- `GET /services?entityId=ent-1&_embed=reviews` *(use view model in FE)*
- `GET /channelRatings?channelId=ch-app-1&_sort=ts&_order=asc`
- `GET /booths?centerId=ch-sc-1&_embed=channelRatings`
- `GET /dcx/:id?_embed=dcxReviews`
- `GET /serviceReviews?serviceId=srv-A&ts_gte=2025-09-01&ts_lte=2025-09-30`

> POC keeps computations on the client for simplicity; no custom middleware required.

---

## 8) UX Components (shadcn/ui)

- **Layout:** App shell with header (entity picker, date range), left sidebar (tabs: Overview, Services, Channels).
- **Controls:** `Select`, `Popover` (date range), `Toggle`, `Badge`, `Input` (search), `Switch` (RTL), `Tooltip`.
- **Data:** `Table` (TanStack Table) for sort/filter/pagination; `Card` and `Separator`.
- **Feedback:** `Toast` for empty states and hints.
- **Internationalization:** simple dictionary + RTL class toggle; right‑aligned tables in ar.

---

## 9) Charts (Apache ECharts via `echarts-for-react`)

- Line (trend), Bar (rankings), Stacked Bar (channel‑of‑review mix), Pie/Donut, Gauge (optional), Bullet (optional).
- Interactions: legend toggles, **dataZoom** (wheel/drag), brush select, click → drill to detail panel.
- Tooltips with both value and share (% of total); annotations for thresholds (min review count).
- Tables where relevant

---

## 10) Non‑Functional Requirements

- **Accessibility:** WCAG 2.2 AA intent (contrast ≥ 4.5, focus rings, keyboard operability, aria‑described chart summaries).
- **Performance:** initial load < 2s on modern laptop; chart updates under 100ms for seed size.
- **Responsiveness:** desktop first; tablet down to 1024px; mobile rough support.
- **Quality:** unit tests for calc functions (golden numbers above).

---

## 11) Tech Stack & Local Setup

- **FE:** React + Vite, TailwindCSS, **shadcn/ui**, **echarts** + `echarts-for-react`, TanStack Table, Zod (validation).
- **API:** `json-server` serving `db.json` from `/data`.

**Scripts (example):**

```bash
# app
pnpm create vite hm-poc --template react-ts
cd hm-poc
pnpm add -D tailwindcss postcss autoprefixer
pnpm add class-variance-authority clsx tailwind-merge lucide-react
pnpm add echarts echarts-for-react @tanstack/react-table zod

# shadcn
pnpm add shadcn-ui@latest -D
# (init & pull components per docs)

# mock api
pnpm add -D json-server

# run
pnpm json-server --watch data/db.json --port 3001
pnpm dev
```

**Directory (suggested):**

```
/ data/db.json
/ src/calculations/*  # pure functions
/ src/components/*    # shadcn wrappers, Chart wrappers
/ src/pages/*         # Overview, Services, Channels
/ src/store/*         # query hooks, selectors
```

---

## 12) Acceptance Criteria

1. With seed data, Overview shows **EntityScore 72.77**, **Service 78.45**, **Channel 59.50** for the selected period.
2. Removing a channel type rebalances weights and updates **EntityChannelScore** accordingly.
3. Services Page correctly displays Type‑2 split and DCX contribution per service.
4. Channels Page correctly collapses booth scores → center → type.
5. All slicers impact tables and charts consistently.
6. Basic a11y checks pass (keyboard nav, visible focus, alt summaries for charts).

