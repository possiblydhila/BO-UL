# Loyalty Portal Back Office — Technical Breakdown & Architecture Plan

**Document date:** 2025-06-25  
**Scope:** Earning Rule, Redemption Rule, Analytics Dashboard, Reporting  
**Out of scope here:** User module, Rewards Points Management (referenced where dependencies exist)

**Related docs:** For front-end prototype feature status, UI flows, and mock data shapes, see [FEATURES.md](FEATURES.md). Rule lifecycle state diagram is documented there — not duplicated below.

---

## Changelog

**Update 1 — Earning Rule tab structure clarified.** The Earning Rule menu is confirmed as (at least) two tabs: **General** (point currency identity + expiry/reset policy) and **Rule** (the rule CRUD documented in §4). This resolves the point-expiry gap previously flagged as Gap #5 in §9, and is reflected in §3 (domain model) and §4.1.

**Update 2 — Third-party points structure clarified (working assumption).** Confirmed: a single rule can support multiple amount tiers, multiple simultaneous partner programs, and accumulation caps across daily/weekly/monthly/annual windows. Full nesting documented in §4.4.1. Gap #6 is updated from "confirmed pending" to **working assumption** — prototype UI can proceed; one smaller question on per-block card subsets remains open (Gap #16).

---

## 1. Scope & Reading of the Source Spec

The source sheet defines six back-office menus. This plan covers four of them in depth:

| # | Menu | Status in sheet | Covered here |
|---|------|-----------------|--------------|
| 1 | Analytics Dashboard | Ready to Design | Yes |
| 2 | User | To Do | Out of scope |
| 3 | Earning Rule | Ready to Design | Yes |
| 4 | Redemption Rule | To Do | Yes |
| 5 | Rewards Points Management | To Do | Out of scope |
| 6 | Reporting | To Do | Yes |

A key observation up front: **Earning Rule and Redemption Rule are structurally almost identical.** Both have the same five rule types (transactional, activity, tactical, personal earning, third-party points), the same nested conditional fields per type, and the same draft → in review → scheduled → active → inactive/expired lifecycle with the same maker/checker permission logic. Redemption only adds a `CAP_TYPE` enum and `VALUE_POIN_PERCENTAGE / VALUE_MIN / VALUE_MAX` fields on top. This is the single most important architectural decision in the whole system: **build one Rule Engine with a `rule_mode` flag (EARN / REDEEM)**, not two parallel systems. Two separate engines means every future change to rule types, approval flow, or capping logic has to be made twice and will drift out of sync.

---

## 2. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BACK OFFICE PORTAL (SPA)                       │
│   Rule Management UI │ Analytics Dashboard UI │ Reporting UI │ Auth UI │
└───────────────────────────────┬──────────────────────────────────────┘
                                 │ REST/GraphQL (BFF)
┌───────────────────────────────▼──────────────────────────────────────┐
│                         BACK OFFICE API / BFF LAYER                    │
│   - AuthN/AuthZ (RBAC: Employee / Approver / Admin)                    │
│   - Request validation, audit logging                                  │
└───────┬───────────────────┬───────────────────┬────────────────────┬─┘
        │                   │                   │                    │
┌───────▼──────┐   ┌────────▼────────┐  ┌───────▼───────┐   ┌────────▼────────┐
│ Rule Engine   │   │ Approval        │  │ Point Ledger  │   │ Reporting &     │
│ Service       │   │ Workflow Service│  │ Service       │   │ Analytics Svc   │
│ (Earn/Redeem) │   │ (maker-checker) │  │ (earn/burn/exp)│  │ (KPI + reports) │
└───────┬───────┘   └────────┬────────┘  └───────┬───────┘   └────────┬────────┘
        │                    │                    │                    │
        └─────────┬──────────┴──────────┬─────────┴──────────┬─────────┘
                   │                     │                    │
           ┌───────▼───────┐    ┌────────▼────────┐   ┌───────▼────────┐
           │  OLTP Database │    │  Event Stream /  │   │  Analytics DW /│
           │  (rules, CIF,  │    │  Message Broker   │   │  Data Mart     │
           │  ledger)       │    │ (txn events from  │   │ (aggregated,   │
           │                │    │  Saving & Cardlink)│   │  pre-computed) │
           └───────────────┘    └─────────┬─────────┘   └────────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │   Source Systems            │
                              │  Saving Core Banking         │
                              │  Cardlink                     │
                              │  Channels: Wondr, ATM, SMS,   │
                              │  BNI Direct, Mbank, API       │
                              └─────────────────────────────┘
```

**Why this shape:**

- Transaction volume from Saving/Cardlink is the system's real load. Rule evaluation against every transaction needs to be async and stream-based (Kafka/Kinesis-style), not a synchronous API call from the back office portal. The back office only *authors* rules; a separate real-time scoring/evaluation engine consumes the event stream and applies active rules.
- Analytics needs its own read-optimized store. Computing MTD/YTD CIF earning counts, redemption rate, MoM/YoY trend lines directly against the OLTP ledger table at query time will not scale once CIF volume is real. This needs a nightly/intraday ETL or CDC pipeline into a data mart with pre-aggregated fact tables.
- Reporting and Analytics share the same data mart but serve different consumption patterns: Analytics is dashboard/visual (KPIs, charts, trends), Reporting is tabular/exportable (Earning Poin, Redemption Poin, Manual Adjustment, Manual Redemption, posting results, reconciliation results). They can be the same service with two front-end surfaces.

---

## 3. Core Domain Model

| Entity | Purpose | Key fields (indicative) |
|---|---|---|
| `Rule` | Header record for an earning or redemption rule | rule_id, rule_code, rule_name, rule_mode (EARN/REDEEM), rule_type (transactional/activity/tactical/personal_earning/third_party), period_start, period_end, status, created_by, created_at, updated_at |
| `RuleConfig` | Type-specific config payload, polymorphic per rule_type | stored as structured JSON or type-specific child tables (see §4.4) |
| `RuleApproval` | Maker-checker audit trail | rule_id, action (submit/approve/reject), actor, role, timestamp, comment |
| `PointTransaction` | Immutable ledger entry for every earn/redeem event | cif_id, rule_id, txn_ref, source_system, channel, points, direction (EARN/REDEEM/EXPIRE/ADJUST), created_at |
| `PointBalance` | Current balance snapshot per CIF (derived/cached) | cif_id, balance, last_updated |
| `Reward` | Catalog item redeemable via redemption rules (Rewards Points Management menu, referenced but out of scope here) | reward_id, reward_type, stock |
| `Channel` | Wondr, ATM, SMS, BNI Direct, Mbank, API, Cardlink-channel | channel_code, channel_name, source_system |
| `MerchantCategory` / `Merchant` | Category and merchant master data | category_code, merchant_name |
| `Campaign` | Tactical/personal-earning campaign reference | campaign_id, name, target_user_type |
| `PointConfig` | Point-currency identity and expiry/reset policy — from Tab General (see §4.1) | point_logo, point_name, expired_duration_value, expired_duration_unit (monthly/yearly/...), reset_time, updated_by, updated_at |

The polymorphic `RuleConfig` is the trickiest modeling decision. Two viable approaches:

1. **JSON column on `Rule`** holding the type-specific payload, validated against a per-type JSON schema at the API layer. Fast to evolve when new rule types or fields get added (which the spec already hints will happen — note the channel list for cardlink is left blank in the source data). Harder to query/report on directly.
2. **Five child tables**, one per rule_type, each with strict typed columns, joined to `Rule` by rule_id. Easier to query and report against, but every new rule type or field requires a migration.

**Recommendation:** JSON config column for authoring/storage, with a denormalized projection job that flattens key fields into the Analytics/Reporting data mart for query performance. This gets flexibility for the rule authoring side and query performance for the reporting side.

---

## 4. Module: Earning Rule & Redemption Rule Engine

### 4.1 Tab Structure

The requirement confirms Earning Rule is a two-tab page, not a single list view:

| Tab | Purpose | Cardinality |
|---|---|---|
| **General** | Point currency identity and expiry/reset policy: point logo, point name, expired duration (numeric value + timeframe unit — monthly, yearly, etc.), reset time | Single record |
| **Rule** | The rule list/CRUD documented in §4.2–§4.6 below (transactional / activity / tactical / personal earning / third-party points) | Many records |

This Tab General record is the actual source of the point-expiry policy that the "Expired Points" KPI in §6 depends on.

**Open question:** the spec scopes this explicitly as "Earning Rule – Tab General," but `point_name` and `point_logo` describe the loyalty point currency itself, which is shared between earning and redemption — it isn't conceptually an earning-only setting. Worth confirming whether this is (a) one shared `PointConfig` object referenced read-only from both Earning Rule and Redemption Rule, or (b) two independently-edited records that happen to be redundant. (a) is the architecturally cleaner choice and avoids the two modules ever disagreeing about what the currency is called or how long it lives — recommend pushing for that in the next round of requirements.

### 4.2 Status Lifecycle (shared by both modes)

| Status | Meaning | Who can move it here | Who can edit while in this state |
|---|---|---|---|
| Draft | Rule being created/edited | Employee | Employee only |
| In Review | Submitted, awaiting approver | Employee (submit action) | Approver only (approve/reject) |
| Scheduled | Approved, waiting for period_start | Approver (approve action) | Approver only |
| Active | Currently running | System (automatic, at period_start) | No one edits an active rule directly — must deactivate first |
| Inactive | Manually disabled before period_end | Employee or Approver (toggle) | — |
| Expired | Past period_end | System (automatic) | — |

This maps directly to the maker-checker pattern called out in the spec: **Employee role can only edit rules in Draft; Approver role can only act on rules in In Review or Scheduled.** That's a hard permission rule, not just a UI convenience — it needs to be enforced server-side in the Rule Engine Service, not just hidden in the frontend.

### 4.3 Point Calculation Formula (generic, applies to both earn and redeem)

```
points = floor(transaction_amount / conversion_unit) × multiplier
points = min(points, max_capacity)   // capacity scope: per transaction / per feature / per user
                                       // capacity window: daily / monthly
```

One spec inconsistency worth flagging: the Redemption Rule section's worked example is labeled "Redeem Points" in one place and "Earned Points" in three other places, despite being under the redemption rule type detail. Confirm with stakeholders whether redemption truly uses the *same* divide-and-multiply formula (likely, since it's a generic point-conversion engine) or whether it should instead be a *deduction* (points spent) rather than points awarded. This affects sign conventions in the ledger.

### 4.4 Field Schema per Rule Type

| Rule Type | Key fields |
|---|---|
| **Transactional** | source_system (saving/cardlink), transaction_type (depends on source_system), merchant_category, merchant_name, card_type, channel, transaction_amount, conversion_unit, multiplier, max_capacity (+ type + timeframe) |
| **Activity** | activity_type (10 enumerated values e.g. account activation, first transaction by card type, balance increase), amount (only if activity_type = balance increase), receive_point (fixed value) |
| **Tactical** | campaign/event name, target_user (all / limited), reward_type (bonus point / transactional) → branches into either a fixed receive_point OR the full transactional field set above |
| **Personal Earning** | type (birthday / behavior-based personalization), target_user upload (CSV/XLSX, only for behavior-based), reward_type → same branch as Tactical |
| **Third Party Points** | Header: `card_type` (multi-select co-branded cards). One or more **Partner Earning Blocks** per rule — see §4.4.1 |

Redemption Rule adds at the header level (before the rule_type branch): `period_start`/`period_end` as explicit timestamps, `CAP_TYPE` (cashback, discount, bill payment, donation, third-party points, prize draw coupon, voucher, e-wallet, auction, goods, annual fee), and `VALUE_POIN_PERCENTAGE` / `VALUE_MIN` / `VALUE_MAX`. These look like they define *how* a redemption converts into the reward type's monetary/unit value — worth confirming whether `CAP_TYPE` constrains which `Reward` catalog entries the rule applies to.

### 4.4.1 Third-Party Points — Detailed Structure (working assumption)

A Third-Party Points rule is not a single flat conversion rate — it's a header plus one or more **Partner Earning Blocks**, each of which has its own tier table:

**Header:** `card_type` — multi-select list of co-branded cards this rule applies to (e.g., BIC Co-Branding Biru A, C, D, E).

**Partner Earning Block** (repeatable, 1..N per rule):

- `third_party` — one partner program per block (MAP, Garuda, KrisFlyer, …). A rule earns into every block's program simultaneously from the same qualifying transaction — this is how a card can dual-accrue into more than one program at once.
- **Tier table** (repeatable, 1..N per block):
  - `operator_type` — `<`, `-`, or `>`, defining whether `transaction_amount` is an upper bound, one bound of a range, or a lower bound.
  - `transaction_amount` — single value for `</>`, min+max for a `-` range.
  - `miles_point` — miles awarded for a transaction landing in this tier.
- **Accumulation cap** (per block):
  - `cap_type` — per transaction / per feature / per user (same enum as the other rule types' `max_capacity`).
  - `timeframe` — daily / weekly / monthly / annually (wider than the daily/monthly-only timeframe used elsewhere).
  - `max_capacity` — ceiling on miles awarded within that timeframe.

**Worked example (illustrative, not from the source spec):**

Rule "Biru Series – Dual Mileage," `card_type` = Biru A, C, D, E:

| Block | Tier (transaction amount) | Miles | Cap |
|-------|---------------------------|-------|-----|
| Garuda | < 100,000 | 2 | 30 miles / user / monthly |
| Garuda | 100,001–200,000 | 5 | |
| Garuda | > 200,000 | 10 | |
| KrisFlyer | < 100,000 | 1 | 30 miles / user / monthly |
| KrisFlyer | 100,001–200,000 | 3 | |
| KrisFlyer | > 200,000 | 6 | |

A single qualifying transaction on a Biru-series card earns into both Garuda and KrisFlyer at once, each governed by its own tier table and its own cap.

**Modeling implication:** this nesting (rule → many partner blocks → many tiers) is a third level deep and a different shape per block. It's a strong argument for the JSON-config approach in §3 over flat child tables — a relational schema for this would need at least two join tables (`rule_partner_block`, `rule_partner_tier`) just for this one rule type, while the other four rule types stay flat.

**Smaller remaining question:** does every Partner Earning Block in a rule apply to the rule's full `card_type` list, or can individual blocks restrict to a subset of those cards? The example above assumes all blocks apply to all listed cards — see Gap #16 in §9.

**Indicative JSON shape:**

```json
{
  "card_types": ["bic-co-cobranding-biru-a", "bic-co-cobranding-biru-c"],
  "partner_blocks": [
    {
      "third_party": "garuda",
      "tiers": [
        { "operator_type": "lt", "transaction_amount": 100000, "miles_point": 2 },
        { "operator_type": "range", "transaction_amount_min": 100001, "transaction_amount_max": 200000, "miles_point": 5 },
        { "operator_type": "gt", "transaction_amount": 200000, "miles_point": 10 }
      ],
      "cap": { "cap_type": "per-user", "timeframe": "monthly", "max_capacity": 30 }
    }
  ]
}
```

### 4.5 List View & Summary

Both Earning Rule and Redemption Rule need:

- A summary strip above the table: All / Active / Inactive / Expired / Scheduled / In Review / Draft counts — essentially a `GROUP BY status` query, cheap to serve live from OLTP.
- List columns: no, rule code, rule name, rule period, rule type, status, created time, total CIF that earned/redeemed from this rule, total points from this rule. The last two are aggregates — they should be read from the data mart, not computed live against the ledger, once volume grows.
- Row actions: edit (status + role gated per §4.2), activate/deactivate toggle (only visible on Active rows), export (CSV/XLSX), add rule.

### 4.6 API Surface (indicative)

`POST /rules` (create draft) · `PUT /rules/{id}` (edit, status+role gated) · `POST /rules/{id}/submit` · `POST /rules/{id}/approve` · `POST /rules/{id}/reject` · `POST /rules/{id}/toggle-status` · `GET /rules?mode=EARN&status=&type=&page=` · `GET /rules/{id}` · `GET /rules/summary?mode=EARN` · `GET /rules/export?format=csv|xlsx` · `GET /point-config` · `PUT /point-config` (Tab General — single-record read/update, pending the shared-vs-duplicated decision in §4.1)

---

## 5. RBAC Summary

| Role | Draft | In Review | Scheduled | Active | Inactive/Expired |
|---|---|---|---|---|---|
| Employee | Create / Edit / Submit | View only | View only | Toggle inactive | View only |
| Approver | View only | Approve / Reject | Edit / Approve | Toggle inactive | View only |
| Admin (implied, not in spec) | Full override — recommend adding this role explicitly for emergency fixes | | | | |

---

## 6. Module: Analytics Dashboard

### 6.1 KPI Catalog

| Category | KPI | Definition |
|---|---|---|
| Customer Engagement | CIF Earning (MTD/YTD) | Unique CIFs that earned points in period |
| | CIF Redeem (MTD/YTD) | Unique CIFs that redeemed points in period |
| | Redemption rate (by point / by CIF) | Redeemed ÷ earned, two denominators |
| Point Performance | Points issued (MTD/YTD) | Sum of earn-direction ledger entries |
| | Points redeemed (MTD/YTD) | Sum of redeem-direction ledger entries |
| | Point balance / liability (MTD/YTD) | Outstanding unredeemed points |
| | Expired points (MTD/YTD) | Points written off by expiry job |
| Transaction Impact | Earning per activity | Points grouped by activity type |
| | Earning per source | Points grouped by source_system |
| Channel Performance | Redemption per channel | Points grouped by channel |
| | Top channel (earn + redeem) | Single highest-contributing channel |
| | Redemption per reward type | Points grouped by reward category |
| | Top reward | Single highest-redemption reward |
| Campaign | Active campaign count | Count of currently active tactical/personal-earning rules |
| | Participation rate | Actual participants ÷ target users |
| | Top campaign | Highest-participation campaign + count |
| Trend & Comparison | Daily/Weekly/Monthly trend | Time series of CIF earn/redeem, point earn/redeem |
| | MoM / YoY growth | Period-over-period delta |
| | Before vs. after campaign | Comparative window analysis |

Every one of these is a `GROUP BY` + `SUM`/`COUNT DISTINCT` over the point ledger, sliced by time, channel, source_system, or rule. This is a textbook star-schema case: one `fact_point_transaction` table (grain: one row per ledger entry) plus dimension tables for date, channel, source_system, rule, CIF, merchant. Pre-aggregating MTD/YTD rollups nightly (with an intraday incremental refresh) avoids scanning the full fact table on every dashboard load.

### 6.2 Filters & Export

Global filters: date range, channel, source system, and a conditional transaction_type filter (only shown when source_system = saving). Export to PDF/PNG implies the dashboard renders charts client-side and needs a "snapshot" export — typically handled by either server-side headless rendering or a client library capturing the rendered DOM/canvas.

---

## 7. Module: Reporting

The spec lists six reports, presented as tabs (matching the existing dashboard pattern): Earning Poin, Redemption Poin, Manual Adjustment, Manual Redemption, posting/bookkeeping processing results, and system reconciliation results.

| Report | Likely data source |
|---|---|
| Earning Poin | `fact_point_transaction` filtered to EARN direction |
| Redemption Poin | `fact_point_transaction` filtered to REDEEM direction |
| Manual Adjustment | A separate `manual_adjustment` table — these are operator-initiated corrections and should NOT live in the same table as system-generated ledger entries, to keep audit trails clean |
| Manual Redemption | Same reasoning — operator-initiated, separate table from rule-driven redemptions |
| Posting/bookkeeping results | Output of the batch job that posts point movements to the core banking GL — needs its own job-run log table (run_id, status, record_count, error_count) |
| Reconciliation results | Comparison output between point ledger and core banking GL/source system feeds — needs a `reconciliation_run` table tracking mismatches found and resolution status |

Each report needs the same export capability as Analytics (CSV/XLSX at minimum; the spreadsheet doesn't specify PDF for reporting, only for the dashboard).

---

## 8. Cross-Cutting Concerns

- **Point expiry job.** Now configurable via Tab General's `expired_duration` / `reset_time` (§4.1), so the missing-policy gap itself is resolved. Still need the exact semantics confirmed — rolling per-transaction TTL vs. fixed calendar reset (see Gap #5 in §9) — before the scheduled expiry job can be built.
- **Rule versioning / audit.** Once a rule goes Active, its config shouldn't be silently mutable — every edit needs to be versioned so historical point calculations remain explainable (a CIF who earned points under v1 of a rule shouldn't have that retroactively reinterpreted under v2).
- **Idempotency on transaction events.** Source systems (Saving, Cardlink) will redeliver events on retry; the rule evaluation engine needs a dedup key (e.g., txn_ref + rule_id) before writing to the ledger.
- **Reconciliation feedback loop.** Reporting's "reconciliation results" implies a process comparing the point ledger against core banking postings — this needs to exist as a real batch job, not just a report screen.

---

## 9. Gaps & Open Questions to Resolve Before Build

This section consolidates architecture gaps with dashboard audit items from [FEATURES.md § Open Items](FEATURES.md#open-items--business-sign-off). Resolved items are annotated; dashboard-specific items cross-reference FEATURES audit notes.

| # | Gap / question | Status | Source | Notes |
|---|----------------|--------|--------|-------|
| 1 | Cardlink channel codes are blank in the source spec (only Saving's channels — API, Wondr, SMS, BNI Direct, Mbank — have codes). | Open | Architecture | Need list before channel dimension can be finalized. |
| 2 | Merchant category is "BNI doesn't have this data, just make something up" — confirm whether this is a real near-term data gap. | Open | Architecture | Several KPIs depend on category-level reporting. |
| 3 | Redemption Rule worked example uses "Earned Points" terminology in 3 of 4 occurrences — confirm sign/direction semantics for redemption. | Open | Architecture | Affects ledger sign conventions. |
| 4 | `RULE_TAB_ID` and `SOURCE_TYPE_ID` appear in Redemption Rule list columns with no definition elsewhere. | Open | Architecture + prototype | Clarify FK to lookup tables vs. legacy columns to drop. Prototype stores these as optional fields on `RedemptionHeader` in `src/domain/rule.ts`. |
| 5 | Point-expiry policy configuration. | **Partially resolved** | Architecture | Tab General adds `expired_duration` + `reset_time`. **Still open:** rolling TTL per earn-transaction vs. fixed calendar reset governed by `reset_time`. Confirm before Phase 2 evaluation engine and expiry job. |
| 6 | Third-party points tier structure — nested partner blocks and tier tables. | **Working assumption** | Architecture (Update 2) | Structure documented in §4.4.1. Prototype drawer implements nested UI. Await formal business sign-off before Phase 2 eval engine. |
| 16 | Per-block `card_type` subset — can a partner block apply to fewer cards than the rule header? | Open | Architecture (Update 2) | Example assumes all blocks use full header card list. |
| 7 | `PointConfig` (Tab General): one shared record vs. two independently-maintained records. | Open | Architecture | See §4.1; recommend single shared record. |
| 8 | Metric formulas (redemption rate by point vs CIF, liability, expired points, participation, growth, campaign comparison). | Open | FEATURES audit #1 | Dashboard KPI definitions need sign-off before Analytics data mart. |
| 9 | Estimated Point Cost KPI definition. | Open | FEATURES audit #2 | Placeholder in prototype. |
| 10 | Real-time SLA for dashboard refresh. | Open | FEATURES audit #3 | Prototype shows "Last updated: just now" without polling. |
| 11 | Filter option sources (channel, source, transaction type). | Open | FEATURES audit #4 | Prototype mocks options; transaction type gated on Saving source. |
| 12 | Drill-down targets for "View details" on KPI cards. | Open | FEATURES audit #5 | Not specified in requirements. |
| 13 | Reconciliation workflow ownership. | Open | FEATURES audit #6 | Referenced in Reporting; batch job + report screen both needed. |
| 14 | Campaign comparison baseline period semantics. | Open | FEATURES audit #7 | Prototype uses mock campaign periods. |
| 15 | Finance governance / audit trails for liability and expired points. | Open | FEATURES audit #8 | Read-only in prototype; production needs audit trail. |

**Suggested stakeholder review order:**

1. §4.1 — Confirm `PointConfig` is one shared record (recommended) vs duplicated per module (Gap #7)
2. Gap #5 — Rolling TTL vs calendar reset for point expiry
3. Gap #3 — Redemption sign/direction semantics
4. Gap #4 — `ruleTabId` / `sourceTypeId` meaning or removal
5. Gap #16 — Per-block card subset vs. rule-level card list (third-party points)
6. §12 Prototype Alignment Matrix — Sign off Phase 1 UI scope (Tab General + rule workflow wiring)

---

## 10. Suggested Build Phasing

**Phase 1 — Foundation:** Rule Engine data model (shared earn/redeem), CRUD APIs, status state machine, maker-checker workflow, list/summary UI, plus the Tab General `PointConfig` record (logo, name, expiry, reset time) — Phase 2's expiry logic depends on it. No real-time scoring yet — rules can be authored and approved.

**Phase 2 — Evaluation Engine:** Event stream consumer that evaluates active rules against incoming Saving/Cardlink transactions and writes to the point ledger. This is the highest-risk, highest-effort phase — budget accordingly.

**Phase 3 — Analytics Data Mart:** ETL/CDC pipeline from ledger to star schema, KPI queries, dashboard UI with filters and PDF/PNG export.

**Phase 4 — Reporting:** Tabbed report UI reusing the Phase 3 data mart, plus the manual adjustment/redemption tables and posting/reconciliation job logs.

Rewards Points Management and User modules (out of scope here) sit logically between Phase 1 and Phase 2 — redemption rules need a reward catalog to point at, and the evaluation engine needs CIF/user master data.

### Phase 1 Scope Card (implementation checklist)

Use when Phase 1 build starts. The prototype today covers only the Rule tab UI mock — see §12.

**Backend (future):**

- [ ] `Rule` + `rule_mode` (EARN/REDEEM) + JSON `RuleConfig` tables
- [ ] `PointConfig` single-record API (`GET /point-config`, `PUT /point-config`)
- [ ] Status state machine + maker-checker endpoints (§4.6)
- [ ] `RuleApproval` audit trail
- [ ] Server-side RBAC enforcement (Employee / Approver / Admin)

**Frontend (future, against APIs):**

- [ ] Earning Rule page: **General** tab + **Rule** tab
- [x] Shared rule list/drawer refactored to consume unified `Rule` type with `rule_mode`
- [ ] Wire submit / approve / reject / toggle (replace non-functional buttons in prototype)
- [ ] Read-only `PointConfig` reference from Redemption Rule if shared-record decision (Gap #7) is adopted

- [x] Third-party points nested partner-block UI (working assumption per §4.4.1 — prototype implemented)

**Explicitly out of Phase 1:**

- Evaluation engine (Phase 2)
- Analytics data mart and live KPI queries (Phase 3)
- Reporting tables and export (Phase 4)
- User and Rewards modules

---

## 11. Architecture Style — Open Decisions

- **Rule storage:** config-driven rules in your own DB (recommended given the bank-specific nuance in this spec) vs. adopting an off-the-shelf BRMS (Drools, etc.) — likely overkill here given the rule shapes are fixed and enumerable.
- **Event backbone:** Kafka, AWS Kinesis, or whatever your existing core banking integration already standardizes on — this should follow whatever pattern Saving/Cardlink already use to publish transaction events, not be a net-new choice.
- **Analytics store:** columnar OLAP (ClickHouse, Redshift, BigQuery) vs. materialized views in your existing OLTP if data volume permits — this is the one place transaction volume should genuinely drive the decision.

---

## 12. Prototype Alignment Matrix

Maps architecture concepts to the current `banking-loyalty-back-office` React prototype ([FEATURES.md](FEATURES.md)). Focused on Phase 1 scope.

| Architecture concept | Prototype location | Status | Phase 1 note |
|---|---|---|---|
| Unified Rule Engine (`rule_mode` EARN/REDEEM) | `RuleModule` in `src/App.tsx` + `Rule` in `src/domain/rule.ts` + `rules[]` in `src/data/mockData.ts` | **Done (prototype domain)** | Single `Rule` type with `ruleMode`; two nav routes filter by mode |
| Tab General `PointConfig` | — | **Missing** | No UI, type, or mock record |
| Rule tab CRUD + lifecycle | `earning-rules`, `redemption-rules` routes | UI mock | List, drawer, search, filters done; no persistence, submit/approve/toggle |
| Maker-checker RBAC | `canEdit()` in `src/domain/ruleStatus.ts` | UI only | Role toggle; workflow stubs in `src/services/ruleWorkflow.ts` |
| `RuleConfig` JSON polymorphism | `Rule.config` discriminated union in `src/domain/rule.ts` | Done (prototype) | Type-specific fields nested under `config`; accessors in `ruleConfig.ts` |
| Redemption `CAP_TYPE` + value fields | `Rule.redemption` (`RedemptionHeader`) | Done (UI) | Present in drawer + table column when `ruleMode === "REDEEM"` |
| `ruleTabId` / `sourceTypeId` | `RedemptionHeader` in mock data | Present, undefined | Gap #4 — needs business clarification |
| Third-party points (partner blocks + tiers) | `ThirdPartyPointsRuleFields` in `src/App.tsx` | UI mock (Update 2) | Nested blocks/tiers/caps per §4.4.1; Gap #16 open |
| Analytics KPIs + data mart | `dashboardData` in `src/data/mockData.ts` | UI only | Phase 3; formulas still open (FEATURES audit panel) |
| Reporting six tabs | `reporting` route | Tabs only | Phase 4 |
| Point expiry job | — | N/A in prototype | Depends on Tab General semantics (Gap #5 partial) |
| API surface (§4.6) | — | Not built | Target contract for Phase 1 backend |
| Rule lifecycle state machine | Documented in FEATURES.md | Aligned (docs) | UI shows statuses; transitions non-functional |
