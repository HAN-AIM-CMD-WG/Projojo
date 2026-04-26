# PF-story-006 — Authenticated Portfolio Frontend Integration

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [PF-story-003](PF-story-003-authenticated-portfolio-visibility-and-review-management.md), [PF-story-004](PF-story-004-student-curation-and-controlled-world-public-publishing.md), [PF-story-005](PF-story-005-public-portfolio-viewing.md)  
**Child tasks**: [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md), [PF-task-015](PF-task-015-authenticated-portfolio-ui-completed-only.md), [PF-task-016a](PF-task-016a-portfolio-item-review-and-rating-display-ui.md), [PF-task-016b](PF-task-016b-portfolio-item-visibility-badges-and-explanations-ui.md), [PF-task-016c](PF-task-016c-portfolio-item-owner-curation-controls-ui.md), [PF-task-016d](PF-task-016d-teacher-portfolio-item-hide-control-ui.md), [PF-task-020](PF-task-020-portfolio-settings-and-curation-services.md), [PF-task-021a](PF-task-021a-lifecycle-completion-review-form-ui.md), [PF-task-021b](PF-task-021b-additional-review-creation-ui.md), [PF-task-021c](PF-task-021c-review-editing-ui.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As an **authenticated portfolio user**,  
I want the frontend to consume the new portfolio APIs while preserving the existing visual language,  
so that portfolio interactions match the new completed-work, review, visibility, and curation model.

---

## Scope Included

- Frontend read services for authenticated and public portfolio APIs
- Completed-only authenticated portfolio UI semantics
- Portfolio filters and roadmap timeline correction
- Review and rating display
- Visibility badges and explanations
- Owner curation controls
- Teacher hide controls
- Settings and curation mutation services
- Completion review form UI
- Additional review creation UI
- Review editing UI
- Frontend browser coverage and accessibility smoke checks

## Scope Excluded

- Backend portfolio API implementation
- Public page final UI owned by [PF-story-005](PF-story-005-public-portfolio-viewing.md)
- Admin-only hidden or retired item review surfaces
- Notification system implementation

---

## User Story Acceptance Criteria

1. Frontend read services call new portfolio APIs and stop depending on stale student portfolio response shapes.
2. Authenticated UI shows completed work only and removes active-work portfolio semantics.
3. UI exposes owner curation controls, teacher hide controls, and reviewer controls only to permitted roles.
4. Review forms support text, optional rating, validation, and notice acceptance.
5. Visibility badges, archived-source labels, and rating-gate explanations are role-appropriate.
6. Keyboard and screen reader behavior remains accessible across portfolio tabs, filters, item expansion, curation controls, and review forms.

---

## Child Tasks

1. [PF-task-014 — Frontend Portfolio Read Service Layer for New APIs](PF-task-014-portfolio-service-layer-and-data-wiring.md)
2. [PF-task-015 — Authenticated Portfolio UI Shows Completed Work Only](PF-task-015-authenticated-portfolio-ui-completed-only.md)
3. [PF-task-016a — Portfolio Item Review and Rating Display UI](PF-task-016a-portfolio-item-review-and-rating-display-ui.md)
4. [PF-task-016b — Portfolio Item Visibility Badges and Explanations UI](PF-task-016b-portfolio-item-visibility-badges-and-explanations-ui.md)
5. [PF-task-016c — Portfolio Item Owner Curation Controls UI](PF-task-016c-portfolio-item-owner-curation-controls-ui.md)
6. [PF-task-016d — Teacher Portfolio Item Hide Control UI](PF-task-016d-teacher-portfolio-item-hide-control-ui.md)
7. [PF-task-020 — Frontend Portfolio Settings and Curation Services](PF-task-020-portfolio-settings-and-curation-services.md)
8. [PF-task-021a — Lifecycle Completion Review Form UI](PF-task-021a-lifecycle-completion-review-form-ui.md)
9. [PF-task-021b — Additional Review Creation UI](PF-task-021b-additional-review-creation-ui.md)
10. [PF-task-021c — Review Editing UI](PF-task-021c-review-editing-ui.md)
11. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — Phase 5 coverage slice

---

## Definition of Done

- Authenticated portfolio frontend flows use the new portfolio contracts end-to-end.
- Controls and review forms are permission-aware and accessible.
- Existing neumorphic portfolio language is preserved where suitable while stale semantics are removed.

