# Business-Logic Delta Report: `main` vs `next-ui`

## Scope and Method

This report compares [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md) and [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) as the primary source of truth for functional behavior.

### Filtering rule

Presentation-only changes are excluded: layout, visual styling, animation polish, component cosmetics, and UI-only preference rendering that do not alter business outcomes.

---

## 1) Unchanged functionality/rules (behavior equivalent)

### U-01 — Skill Taxonomy Integrity
- **Main defines:** Skill name must be non-empty and unique (with case-insensitive duplicate protection in creation flow).
- **Next-ui defines:** Skill identity is unique with mandatory attributes.
- **Classification:** **Unchanged** (different wording, same business behavior: deduplicated/valid skill taxonomy).
- **Main citation:** [`C-VAL-04`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L289), [`C-UNIQ-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L302)
- **Next-ui citation:** [`C-001`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L92)

### U-02 — Registration Core Relation Semantics
- **Main defines:** Registration tri-state lifecycle (`pending`/`accepted`/`rejected`) from acceptance attribute semantics.
- **Next-ui defines:** Registration relation shape and acceptance-state lifecycle base.
- **Classification:** **Unchanged (core)**. Next-ui adds timeline phrasing, but core registration decision semantics remain aligned.
- **Main citation:** [`C-CARD-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L349), [`D-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L554)
- **Next-ui citation:** [`C-002`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L113), [`D-002`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L317)

### U-03 — Role + Ownership Access Model
- **Main defines:** RBAC hierarchy and ownership scoping (student self-scope, supervisor business-scope, teacher bypass).
- **Next-ui defines:** Role-based authorization with ownership gating.
- **Classification:** **Unchanged (model)**. The foundational access model is the same.
- **Main citation:** [`C-RBAC-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L150), [`C-OWN-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L211), [`C-OWN-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L220), [`C-OWN-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L231)
- **Next-ui citation:** [`C-003`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L133)

### U-04 — JWT-Protected API Boundary
- **Main defines:** JWT required for protected routes, with public/excluded route exceptions.
- **Next-ui defines:** Middleware-enforced JWT boundary with explicit exceptions.
- **Classification:** **Unchanged** at policy level.
- **Main citation:** [`C-AUTH-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L80)
- **Next-ui citation:** [`C-004`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L153)

### U-05 — Capacity / No Overbooking
- **Main defines:** Block registration/acceptance when full; reject reducing `total_needed` below accepted count.
- **Next-ui defines:** Same overbooking block and downsize guard.
- **Classification:** **Unchanged** (equivalent decision logic and business outcome).
- **Main citation:** [`C-REG-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L455), [`C-REG-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L476), [`C-REG-04`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L485)
- **Next-ui citation:** [`C-005`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L171)

### U-06 — Duplicate Registration Prevention (Backend)
- **Main defines:** Student cannot register twice for the same task.
- **Next-ui defines:** Duplicate registrations rejected by backend (frontend precheck concerns noted separately).
- **Classification:** **Unchanged** for true business enforcement path.
- **Main citation:** [`C-REG-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L465)
- **Next-ui citation:** [`C-006`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L193)

### U-07 — File Safety Controls
- **Main defines:** Max size, MIME restrictions, magic-byte validation, URL/domain safety checks.
- **Next-ui defines:** Extension/content/header/size/domain safety validations.
- **Classification:** **Unchanged** (same functional security constraints).
- **Main citation:** [`C-FILE-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L372), [`C-FILE-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L382), [`C-FILE-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L392), [`C-FILE-04`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L401)
- **Next-ui citation:** [`C-010`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L271)

---

## 2) Newly added in next-ui (non-conflicting with main)

### N-01 — Task-Skill Mutation Lock After Registrations Exist
- **Main defines:** Task skills are updated set-wise (add/remove/retain), with ID validation and clear-all support.
- **Next-ui defines:** Additional lock preventing required-skill mutation once registrations exist.
- **Classification:** **New non-conflicting addition** (strictness increase; does not negate main rule outcomes).
- **Main citation:** [`OP-TASK-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L735), [`Addendum OP-TASK-03 detail`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L1287)
- **Next-ui citation:** [`C-007`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L211)

### N-02 — Expanded Read-Model Derivations for Matching and KPI Views
- **Main defines:** Core derivations for registration counts/status, user type, colleagues, and defaults.
- **Next-ui defines:** Additional derivations (active/pending work sets, skill-match, top-skill demand, dashboard KPI aggregation).
- **Classification:** **New non-conflicting additions** (analytical/read-model expansions without direct contradiction).
- **Main citation:** [`Derivations baseline`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L530)
- **Next-ui citation:** [`D-003`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L339), [`D-004`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L358), [`D-005`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L380), [`D-006`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L399)

### N-03 — Notification-Service Layer Explicitly Cataloged as Partial
- **Main defines:** Email service exists, but business-triggered notifications are not operationally wired.
- **Next-ui defines:** Notification service integration exists as scaffold with disabled send path.
- **Classification:** **New non-conflicting articulation** (same operational reality; next-ui adds layer-specific framing).
- **Main citation:** [`A-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L924), [`R-05`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L1017)
- **Next-ui citation:** [`A-002`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L596)

---

## 3) Overlapping rules with inconsistency/conflict

### X-01 — OAuth/JWT Claim Contract
- **Main defines:** Supervisor sessions require `businessId` in JWT and enforce this in middleware.
- **Next-ui defines:** Critical discrepancy claim: callback-issued JWT lacks role/business claims expected by middleware/frontend.
- **Consistent portion:** OAuth + JWT flow exists in both documents.
- **Conflicting portion:** Required JWT claim contract is contradictory.
- **Classification:** **Conflict** (authentication payload semantics directly affect authorization behavior).
- **Main citation:** [`C-AUTH-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L104), [`OP-AUTH-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L617)
- **Next-ui citation:** [`O-001 verdict`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L676), [`High-impact discrepancy`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L701)

### X-02 — Ownership Enforcement Completeness
- **Main defines:** Ownership scoping is formalized and broadly enforced (student self, supervisor business, teacher bypass).
- **Next-ui defines:** Ownership gaps for specific operations (theme linking, registration progress/timeline, some portfolio access scope).
- **Consistent portion:** Both agree role + ownership is intended governance model.
- **Conflicting portion:** Enforcement completeness for specific endpoints diverges.
- **Classification:** **Conflict (partial overlap)**.
- **Main citation:** [`C-OWN-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L211), [`C-OWN-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L220), [`C-OWN-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L231)
- **Next-ui citation:** [`C-003 verdict`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L657), [`O-005 verdict`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L680), [`O-007 verdict`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L682)

### X-03 — Invite Lifecycle Semantics
- **Main defines:** Invite must be unused and unexpired; successful onboarding marks invite used.
- **Next-ui defines:** Invite generation exists but consumption/expiry enforcement is claimed missing.
- **Consistent portion:** Invite creation/generation capability exists.
- **Conflicting portion:** One-time/expiry enforcement and consumption semantics contradict.
- **Classification:** **Conflict** (onboarding security and access-control impact).
- **Main citation:** [`C-INVITE-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L423), [`C-INVITE-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L433), [`OP-INVITE-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L911)
- **Next-ui citation:** [`O-008 verdict`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L683), [`High-impact discrepancy`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L705)

### X-04 — Registration State Machine Scope (Cancel/Progress/Complete)
- **Main defines:** Decision lifecycle centers on pending/accepted/rejected; explicit risk note says no withdrawal endpoint.
- **Next-ui defines:** Registration lifecycle includes start/complete transitions and student cancellation of pending registration.
- **Consistent portion:** Create + accept/reject flow exists in both.
- **Conflicting portion:** Extra state transitions/cancellation behavior in next-ui vs absence in main.
- **Classification:** **Conflict (partial overlap)**.
- **Main citation:** [`D-03`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L554), [`OP-REG-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L765), [`R-11`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L1059)
- **Next-ui citation:** [`O-005`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L506), [`D-002`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L317)

### X-05 — Project Deletion/Hard-Delete + Portfolio Snapshotting
- **Main defines:** Project operations documented for create/update; risk note states no delete endpoints for major entities.
- **Next-ui defines:** Archive/delete confirmation flow and teacher-only hard delete with portfolio snapshotting.
- **Consistent portion:** Create/update lifecycle overlap exists.
- **Conflicting portion:** Destructive operations and side effects differ materially.
- **Classification:** **Conflict**.
- **Main citation:** [`OP-PROJ-01`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L680), [`OP-PROJ-02`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L694), [`R-12`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L1066)
- **Next-ui citation:** [`C-008`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L229), [`C-009`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L250), [`O-003`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L470)

### X-06 — Authoritative Domain Model Expansion (`theme`, `portfolioItem`)
- **Main defines:** Authoritative model lists entities/relations without `theme` and `portfolioItem` constructs.
- **Next-ui defines:** Authoritative model explicitly includes `theme`, `portfolioItem`, `hasTheme`, and `hasPortfolio`.
- **Classification:** **Conflict** (domain-surface mismatch in stated source-of-truth model).
- **Main citation:** [`Domain entities`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L47), [`Domain relations`](./BUSINESS_RULES_FROM_MAIN_BRANCH.md#L62)
- **Next-ui citation:** [`Authoritative Domain Model`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L77)

---

## 4) Excluded as presentation-only (not business-logic deltas)

The following next-ui items were intentionally excluded from functional delta scoring:
- Theme/high-contrast preference inference from local storage/system media queries: [`D-007`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L417)
- Local browser conveniences (bookmarks, clipboard, local preference persistence): [`A-005`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L628)
- Public map/location presentation integration: [`A-006`](./BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#L640)

These can affect UX but do not inherently alter permissions, validation, workflow states, calculations, or API business outcomes.

---

## 5) Overall conflict-risk assessment

**Risk level: High (business-logic merge risk).**

### Why
- Conflicts exist in security-critical and lifecycle-critical domains:
  - JWT claim contract and authorization path (X-01)
  - ownership/scoping guarantees (X-02)
  - invite validity/consumption semantics (X-03)
  - registration state machine scope (X-04)
  - destructive project operations and side effects (X-05)
  - authoritative domain model boundaries (X-06)

---

## 6) Merge-readiness recommendation (business logic only)

**Recommendation: Not merge-ready for business logic convergence yet.**

### Practical path to merge readiness
1. Resolve X-01..X-06 as explicit architecture/business decisions (single canonical behavior for each).
2. Update both rule catalogs to one aligned contract after decisions.
3. Add policy regression tests for:
   - JWT claim contract + middleware checks
   - ownership-scoped endpoints
   - invite expiry/consumption/one-time guarantees
   - registration transition matrix (including cancel/progress semantics)
   - project archive/delete/hard-delete authorization and side effects
4. Merge presentation-only changes independently from business-logic changes to avoid semantic drift.

