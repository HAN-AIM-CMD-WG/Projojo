# PF-story-004 — Student Curation and Controlled World-Public Publishing

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [PF-story-003](PF-story-003-authenticated-portfolio-visibility-and-review-management.md)  
**Child tasks**: [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md), [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md), [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md), [PF-task-012a](PF-task-012a-student-review-world-public-selection-api.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As a **student**,  
I want to curate my portfolio summary, slug, item visibility, and review publication,  
so that I control what is visible to authenticated viewers and public visitors.

---

## Scope Included

- Student portfolio summary, slug, and world-public page settings API
- Private-by-default world-public setting
- Student item ordering, hide/show, and world-visible item selection
- Teacher portfolio item soft-hide and precedence over student show
- Student review world-public selection and retraction
- Notice-aware public eligibility for reviews
- Phase 4 curation coverage slice

## Scope Excluded

- Final world-public API response and public route shell
- Public portfolio page UI
- Frontend curation controls and mutation services
- Reviewer-facing completion or review submission forms

---

## User Story Acceptance Criteria

1. Portfolio page is world-private by default and slug access leaks no private item or review data.
2. Student can update summary, unique slug, and world-public page setting.
3. Student can order items, hide/show own items, retract authenticated-public visibility through earlier visibility API, and select items for world-public display.
4. Teacher soft-hide removes items from normal views and cannot be overridden by student show.
5. Student can select or retract review world-public visibility only for reviews on owned portfolio items.
6. Review publication remains governed by persisted public-use notice acceptance.

---

## Child Tasks

1. [PF-task-010 — Student Portfolio Summary, Slug, and World-Public Page Settings](PF-task-010-student-summary-slug-and-public-settings.md)
2. [PF-task-011a — Student Item Ordering, Hide/Show, and World-Visible Selection](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md)
3. [PF-task-011b — Teacher Portfolio Item Soft-Hide and Precedence](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md)
4. [PF-task-012a — Student Review World-Public Selection API](PF-task-012a-student-review-world-public-selection-api.md)
5. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — Phase 4 curation coverage slice

---

## Definition of Done

- Student curation APIs allow intentional control of portfolio presentation.
- Teacher moderation rules are explicit and do not delete evidence.
- Public item and review selection are ready for the world-public API and UI stories.

