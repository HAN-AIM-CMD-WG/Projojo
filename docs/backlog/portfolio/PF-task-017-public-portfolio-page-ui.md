# PF-task-017 — Public Portfolio Page UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: World-Public Portfolio  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend)  
**Spec references**: [Portfolio spec §3.6.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:197), [§4.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:265), [Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748)  
**Current-state references**: [`App.jsx` public pages detection](../../../projojo_frontend/src/App.jsx:214), [`PublicDiscoveryPage`](../../../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:18), [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14)  
**Dependencies**: [PF-task-013](PF-task-013-world-public-portfolio-api-and-route.md), [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md)

---

## Task Story

As a **public visitor**,  
I want a clear public portfolio page that shows only student-selected content,  
so that I can understand a student's completed work without seeing private authenticated data.

---

## Acceptance Criteria

### AC-1: Public route renders portfolio page by slug

**Given** a visitor navigates to `/portfolio/{slug}`  
**When** the slug is published  
**Then** a public portfolio page renders without requiring login  
**And** it uses public page chrome without authenticated navbar/footer.

### AC-2: Summary-only public page renders cleanly

**Given** a published portfolio has summary text and no public items  
**When** the public page renders  
**Then** it shows the summary and an appropriate empty state  
**And** it does not imply hidden or private items exist.

### AC-3: Selected public items render with selected public reviews

**Given** the API returns selected world-visible items and selected world-visible reviews  
**When** the public page renders  
**Then** each item displays copied task, project, business, skill, timeline, archived-source, and review data allowed by the API  
**And** unselected reviews and authenticated-only fields are not displayed.

### AC-4: Private or unknown slug has public-safe error state

**Given** the API reports a private or unknown slug  
**When** the page renders  
**Then** the visitor sees a generic not-found or unavailable message  
**And** the UI does not reveal whether a student exists.

### AC-5: Existing design language is adapted for public use

**Given** the public portfolio page is implemented  
**When** compared to authenticated portfolio components  
**Then** it preserves the neumorphic visual style and portfolio card language where suitable  
**And** it removes authenticated-only controls and internal badges that would confuse public visitors.

### AC-6: Public page is accessible

**Given** the public page has item cards, review text, and navigation  
**When** accessed by keyboard or screen reader  
**Then** headings, landmarks, focus states, and alt text are usable  
**And** animations respect reduced-motion requirements.

---

## Implementation Notes

- Do not reuse authenticated components directly if they expose private controls or private visibility states.
- Reuse card styling and layout primitives where they do not leak authenticated semantics.

---

## Ambiguities and Defaults

- **Ambiguity**: Whether public page should show student profile image or other profile fields is unspecified.  
  **Default**: Show only fields returned by the public API.

---

## Test Expectations

- Browser tests must cover public vanity route, summary-only page, selected item/review rendering, and private slug handling.

