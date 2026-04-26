# Next-UI Branch — Complete Merge Review

**Gegenereerd**: 2026-02-26
**Branch**: `next-ui`
**Base branch**: `main`
**Merge base**: `9b315052ade144eddc9c3b5d94a33a7198097895`
**Periode**: 2025-12-09 tot 2026-02-12
**Merge conflict status**: **0 conflicten** (clean merge mogelijk)

---

## 1. Executive Summary

| Metriek | Waarde |
|---------|--------|
| Totaal commits | 89 |
| Bestanden gewijzigd | 138 |
| Bestanden toegevoegd | 57 |
| Bestanden gewijzigd | 80 |
| Bestanden verwijderd | 1 |
| Insertions | +28.567 |
| Deletions | -3.216 |
| Auteurs | WouterNordsiek (87), Stijn Appeldoorn (2) |
| Merge commits | 3 |

### Commit type verdeling

| Type | Aantal |
|------|--------|
| feat | 56 |
| fix | 18 |
| refactor | 8 |
| style | 2 |
| fix/feat | 1 |
| merge | 3 |
| overig | 1 |

### Hotspots (meest aangeraakte bestanden)

| Bestand | Aantal commits |
|---------|---------------|
| `projojo_frontend/src/index.css` | 22 |
| `projojo_frontend/src/components/BusinessCard.jsx` | 20 |
| `projojo_frontend/src/pages/StudentDashboard.jsx` | 18 |
| `projojo_frontend/src/components/Task.jsx` | 18 |
| `projojo_frontend/src/components/ProjectDetails.jsx` | 17 |
| `projojo_frontend/src/components/ProjectCard.jsx` | 16 |
| `projojo_frontend/src/components/Navbar.jsx` | 15 |
| `projojo_frontend/src/components/Filter.jsx` | 14 |
| `projojo_frontend/src/App.jsx` | 14 |
| `projojo_frontend/src/pages/OverviewPage.jsx` | 11 |
| `projojo_frontend/src/pages/LandingPage.jsx` | 10 |
| `projojo_frontend/src/services.js` | 9 |
| `projojo_frontend/src/components/OverviewMap.jsx` | 9 |
| `projojo_backend/routes/task_router.py` | 9 |
| `projojo_backend/db/schema.tql` | 9 |
| `projojo_frontend/src/pages/SupervisorDashboard.jsx` | 8 |
| `projojo_frontend/src/components/SkillsEditor.jsx` | 8 |
| `projojo_backend/domain/repositories/business_repository.py` | 8 |
| `projojo_backend/db/seed.tql` | 8 |
| `projojo_frontend/src/pages/LoginPage.jsx` | 7 |

> **Dit is GEEN simpele UI refresh.** De branch bevat complete nieuwe feature-systemen (portfolio, discovery, themas, maps, dashboards) naast de UI/UX overhaul.

---

## 2. Feature Overview

### Design System / Neumorphic UI
Volledige visuele overhaul van HAN pink → Indigo → Coral. Neumorphic design system met shadows, cards, buttons, pills. Dark mode support. Accessibility verbeteringen (WCAG 2.1 AA).
- Gerelateerde commits: #2, #3, #4, #5, #7, #30, #48

### Student Dashboard (nieuw)
Nieuw dashboard voor studenten met actieve taken, registraties, quick actions. Iteratief ontwikkeld over 18 commits.
- Gerelateerde commits: #17, #18, #19, #20, #27, #28, #29

### Supervisor Dashboard (nieuw)
Dashboard voor supervisors met pending registraties, projectoverzicht, actieve studenten.
- Gerelateerde commits: #35

### Landing Page (nieuw)
Publieke landing page met hero section, features, journey sectie. Neumorphic styling.
- Gerelateerde commits: #42, #43, #57, #58

### Portfolio Systeem (nieuw backend + frontend)
Student portfolio management: snapshots van werk na projectdeleties, actieve/afgeronde taken, roadmap timeline.
- Gerelateerde commits: #59, #66

### Location Maps (Leaflet)
Interactieve kaarten met OpenStreetMap, marker clustering, dark mode support. Gebruikt bestaande location data.
- Gerelateerde commits: #17, #21, #22, #23, #41, #49, #52, #77

### Skill Matching & Filtering
Marketplace UX model met skill matching, coral badges, filter UX verbeteringen.
- Gerelateerde commits: #6, #7, #31, #61, #62

### Business Archiving (nieuw backend + frontend)
Archiveren en herstellen van bedrijven, draft modus, teacher management UI.
- Gerelateerde commits: #38, #39, #40

### Task Management
Start/end dates, registratie systeem, skill updates, role checks.
- Gerelateerde commits: #62, #63, #64, #65, #68

### Public Discovery (nieuw)
Publieke projectontdekking met themas/SDGs, zoeken/filteren, discovery section.
- Gerelateerde commits: #72, #78, #84

### Notification System (nieuw backend)
Notificatiesysteem met progress bar, success/error/info types, email alerts.
- Gerelateerde commits: #59, #80

### Terminologie Update
"Bedrijf" → "Organisatie" door hele applicatie.
- Gerelateerde commits: #71

### Subtask Feature (netto nul)
Toegevoegd in commit #67 (+2.035 regels) en volledig verwijderd in commit #74 (-2.182 regels). Geen impact op uiteindelijke diff.
- Gerelateerde commits: #67, #74

### Documentatie
User stories, roadmap, ecosystem strategie, AI coding guidelines, design system docs.
- Gerelateerde commits: #36, #73, #75, #83

### App Rename
"Opdrachtenbox" → "Projojo" overal.
- Gerelateerde commits: #24, #25

---

## 3. Bestandsinventaris (138 bestanden)

**Legenda**: A = Added, M = Modified, D = Deleted

### 3.1 Config & Root

| Status | Bestand | +/- |
|--------|---------|-----|
| D | `.cursorrules` | -340 |
| M | `.gitignore` | +5 |
| A | `AGENTS.md` | +140 |
| M | `README.md` | +11 / -1 |
| A | `design-planning/Gemini_Designs/businesscards.html` | +1.110 |

### 3.2 AI Agent Skills

| Status | Bestand | +/- |
|--------|---------|-----|
| A | `.agents/skills/agenticsorg-ux-designer/ACCESSIBILITY.md` | +825 |
| A | `.agents/skills/agenticsorg-ux-designer/README.md` | +248 |
| A | `.agents/skills/agenticsorg-ux-designer/RESPONSIVE-DESIGN.md` | +599 |
| A | `.agents/skills/agenticsorg-ux-designer/SKILL.md` | +497 |
| A | `.agents/skills/anthropics-frontend-design/SKILL.md` | +42 |
| A | `.agents/skills/code-yeongyu-frontend-ui-ux/SKILL.md` | +78 |
| A | `.agents/skills/nextlevelbuilder-ui-ux-pro-max/SKILL.md` | +386 |
| A | `.agents/skills/nextlevelbuilder-ui-ux-pro-max/data` | +1 |
| A | `.agents/skills/nextlevelbuilder-ui-ux-pro-max/scripts` | +1 |
| A | `.cursor/skills/agenticsorg-ux-designer` | +1 |
| A | `.cursor/skills/anthropics-frontend-design` | +1 |
| A | `.cursor/skills/code-yeongyu-frontend-ui-ux` | +1 |
| A | `.cursor/skills/nextlevelbuilder-ui-ux-pro-max` | +1 |

### 3.3 Documentation

| Status | Bestand | +/- |
|--------|---------|-----|
| A | `docs/ECOSYSTEEM_STRATEGIE.md` | +1.027 |
| A | `docs/GEBRUIKERSSCENARIOS_V1.md` | +353 |
| A | `docs/GEBRUIKERSSCENARIOS_V2.md` | +474 |
| A | `docs/NEXT-UI-BRANCH-ANALYSIS.md` | +249 |
| A | `docs/ROADMAP.md` | +364 |
| A | `docs/USER_STORIES_DISCOVERY.md` | +223 |
| A | `docs/USER_STORIES_DOCENT.md` | +231 |
| A | `docs/USER_STORIES_ORGANISATIE.md` | +260 |
| A | `docs/USER_STORIES_PLATFORM.md` | +152 |
| A | `docs/USER_STORIES_PORTFOLIO.md` | +111 |
| A | `docs/USER_STORIES_STUDENT.md` | +200 |
| A | `projojo_frontend/src/DESIGN_SYSTEM.md` | +177 |

### 3.4 Backend — Schema & Seed

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_backend/db/schema.tql` | +74 / -? |
| M | `projojo_backend/db/seed.tql` | +963 / -? |

### 3.5 Backend — Models

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_backend/domain/models/__init__.py` | +3 / -1 |
| M | `projojo_backend/domain/models/business.py` | +5 |
| M | `projojo_backend/domain/models/project.py` | +4 |
| M | `projojo_backend/domain/models/task.py` | +18 / -? |
| A | `projojo_backend/domain/models/theme.py` | +36 |

### 3.6 Backend — Repositories

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_backend/domain/repositories/__init__.py` | +4 / -1 |
| M | `projojo_backend/domain/repositories/business_repository.py` | +212 / -? |
| A | `projojo_backend/domain/repositories/portfolio_repository.py` | +432 |
| M | `projojo_backend/domain/repositories/project_repository.py` | +524 / -? |
| M | `projojo_backend/domain/repositories/skill_repository.py` | +87 / -? |
| M | `projojo_backend/domain/repositories/task_repository.py` | +422 / -? |
| A | `projojo_backend/domain/repositories/theme_repository.py` | +210 |
| M | `projojo_backend/domain/repositories/user_repository.py` | +47 / -? |

### 3.7 Backend — Routes

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_backend/routes/business_router.py` | +138 / -? |
| M | `projojo_backend/routes/project_router.py` | +335 / -? |
| M | `projojo_backend/routes/student_router.py` | +115 / -? |
| M | `projojo_backend/routes/supervisor_router.py` | +52 / -? |
| M | `projojo_backend/routes/task_router.py` | +280 / -? |
| A | `projojo_backend/routes/theme_router.py` | +111 |

### 3.8 Backend — Services & Auth

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_backend/auth/jwt_middleware.py` | +6 |
| M | `projojo_backend/main.py` | +2 |
| M | `projojo_backend/service/__init__.py` | +3 / -1 |
| A | `projojo_backend/service/notification_service.py` | +276 |
| M | `projojo_backend/service/task_service.py` | +9 / -? |

### 3.9 Frontend — Core

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_frontend/index.html` | +12 / -? |
| M | `projojo_frontend/package-lock.json` | ~2.774 +/- |
| M | `projojo_frontend/package.json` | +3 |
| M | `projojo_frontend/src/App.jsx` | +245 / -? |
| M | `projojo_frontend/src/index.css` | +1.370 / -? |
| M | `projojo_frontend/src/services.js` | +325 / -? |

### 3.10 Frontend — Components (nieuw, 15 bestanden)

| Status | Bestand | +/- |
|--------|---------|-----|
| A | `projojo_frontend/src/components/Breadcrumb.jsx` | +52 |
| A | `projojo_frontend/src/components/DiscoverySection.jsx` | +293 |
| A | `projojo_frontend/src/components/FilterChip.jsx` | +89 |
| A | `projojo_frontend/src/components/LocationMap.jsx` | +241 |
| A | `projojo_frontend/src/components/OverviewMap.jsx` | +402 |
| A | `projojo_frontend/src/components/PortfolioItem.jsx` | +298 |
| A | `projojo_frontend/src/components/PortfolioList.jsx` | +272 |
| A | `projojo_frontend/src/components/PortfolioRoadmap.jsx` | +639 |
| A | `projojo_frontend/src/components/ProjectActionModal.jsx` | +242 |
| A | `projojo_frontend/src/components/PublicProjectCard.jsx` | +149 |
| A | `projojo_frontend/src/components/SkeletonCard.jsx` | +59 |
| A | `projojo_frontend/src/components/SkeletonList.jsx` | +24 |
| A | `projojo_frontend/src/components/SkeletonOverview.jsx` | +51 |
| A | `projojo_frontend/src/components/StudentPortfolio.jsx` | +174 |
| A | `projojo_frontend/src/components/ThemeToggle.jsx` | +283 |

### 3.11 Frontend — Components (gewijzigd, 30 bestanden)

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_frontend/src/components/AddProjectForm.jsx` | +187 / -? |
| M | `projojo_frontend/src/components/Alert.jsx` | +14 / -? |
| M | `projojo_frontend/src/components/BusinessCard.jsx` | +355 / -? |
| M | `projojo_frontend/src/components/BusinessProjectDashboard.jsx` | +36 / -? |
| M | `projojo_frontend/src/components/CreateBusinessEmail.jsx` | +46 / -? |
| M | `projojo_frontend/src/components/DragDrop.jsx` | +54 / -? |
| M | `projojo_frontend/src/components/Filter.jsx` | +666 / -? |
| M | `projojo_frontend/src/components/Footer.jsx` | +7 / -? |
| M | `projojo_frontend/src/components/FormInput.jsx` | +8 / -? |
| M | `projojo_frontend/src/components/InfoBox.jsx` | +2 / -? |
| M | `projojo_frontend/src/components/Modal.jsx` | +151 / -? |
| M | `projojo_frontend/src/components/Navbar.jsx` | +214 / -? |
| M | `projojo_frontend/src/components/NewSkillsManagement.jsx` | +82 / -? |
| M | `projojo_frontend/src/components/PageHeader.jsx` | +16 / -? |
| M | `projojo_frontend/src/components/ProjectCard.jsx` | +254 / -? |
| M | `projojo_frontend/src/components/ProjectDashboard.jsx` | +45 / -? |
| M | `projojo_frontend/src/components/ProjectDetails.jsx` | +665 / -? |
| M | `projojo_frontend/src/components/ProjectTasks.jsx` | +59 / -? |
| M | `projojo_frontend/src/components/RichTextEditor.jsx` | +105 / -? |
| M | `projojo_frontend/src/components/RichTextEditorButton.jsx` | +10 / -? |
| M | `projojo_frontend/src/components/SkillBadge.jsx` | +28 / -? |
| M | `projojo_frontend/src/components/SkillsEditor.jsx` | +340 / -? |
| M | `projojo_frontend/src/components/StudentProfile.jsx` | +13 / -? |
| M | `projojo_frontend/src/components/StudentProfileCv.jsx` | +100 / -? |
| M | `projojo_frontend/src/components/StudentProfileHeader.jsx` | +177 / -? |
| M | `projojo_frontend/src/components/StudentProfileSkill.jsx` | +76 / -? |
| M | `projojo_frontend/src/components/StudentProfileSkills.jsx` | +76 / -? |
| M | `projojo_frontend/src/components/Task.jsx` | +969 / -? |
| M | `projojo_frontend/src/components/TaskCard.jsx` | +150 / -? |
| M | `projojo_frontend/src/components/TestUserSelector.jsx` | +266 / -? |
| M | `projojo_frontend/src/components/Tooltip.jsx` | +59 / -? |
| M | `projojo_frontend/src/components/notifications/Notification.jsx` | +161 / -? |
| M | `projojo_frontend/src/components/notifications/NotifySystem.jsx` | +2 / -? |
| M | `projojo_frontend/src/components/paged_component/paged_component.jsx` | +4 / -? |

### 3.12 Frontend — Pages (nieuw, 5 bestanden)

| Status | Bestand | +/- |
|--------|---------|-----|
| A | `projojo_frontend/src/pages/DesignDemoPage.jsx` | +1.183 |
| A | `projojo_frontend/src/pages/LandingPage.jsx` | +545 |
| A | `projojo_frontend/src/pages/PublicDiscoveryPage.jsx` | +674 |
| A | `projojo_frontend/src/pages/StudentDashboard.jsx` | +803 |
| A | `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +608 |

### 3.13 Frontend — Pages (gewijzigd, 10 bestanden)

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_frontend/src/pages/BusinessPage.jsx` | +27 / -? |
| M | `projojo_frontend/src/pages/EmailNotFoundPage.jsx` | +47 / -? |
| M | `projojo_frontend/src/pages/LoginPage.jsx` | +140 / -? |
| M | `projojo_frontend/src/pages/NotFound.jsx` | +18 / -? |
| M | `projojo_frontend/src/pages/OverviewPage.jsx` | +194 / -? |
| M | `projojo_frontend/src/pages/ProfilePage.jsx` | +44 / -? |
| M | `projojo_frontend/src/pages/ProjectDetailsPage.jsx` | +39 / -? |
| M | `projojo_frontend/src/pages/ProjectsAddPage.jsx` | +10 / -? |
| M | `projojo_frontend/src/pages/TeacherPage.jsx` | +284 / -? |
| M | `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +270 / -? |
| M | `projojo_frontend/src/pages/update_student_page/update_student_page.jsx` | +357 / -? |

### 3.14 Frontend — Context, Hooks & Utils (nieuw, 4 bestanden)

| Status | Bestand | +/- |
|--------|---------|-----|
| A | `projojo_frontend/src/context/StudentSkillsContext.jsx` | +91 |
| A | `projojo_frontend/src/context/StudentWorkContext.jsx` | +171 |
| A | `projojo_frontend/src/context/ThemeContext.jsx` | +221 |
| A | `projojo_frontend/src/hooks/useBookmarks.js` | +53 |
| A | `projojo_frontend/src/utils/dates.js` | +100 |

### 3.15 Frontend — Tests

| Status | Bestand | +/- |
|--------|---------|-----|
| M | `projojo_frontend/src/tests/BusinessCard.stories.jsx` | +10 / -? |
| M | `projojo_frontend/src/tests/BusinessProjectDashboard.stories.jsx` | +2 / -? |
| M | `projojo_frontend/src/tests/DashboardsOverview.stories.jsx` | +6 / -? |
| M | `projojo_frontend/src/tests/Filter.stories.jsx` | +8 / -? |
| M | `projojo_frontend/src/tests/Navbar.stories.jsx` | +2 / -? |
| M | `projojo_frontend/src/tests/ProjectDetails.stories.jsx` | +6 / -? |

---

## 4. Volledige Commit Log (89 commits, chronologisch)

---

### #1 `0245febb` — Merge pull request #240 from HAN-AIM-CMD-WG/main

- **Hash**: `0245febb5b91b37ce99cdf98a78269b5716f48c2`
- **Author**: Stijn Appeldoorn <102795120+stijnapp@users.noreply.github.com>
- **Date**: 2025-12-09 09:15:12 +0100
- **Type**: merge

> Main naar Wouter's branche

**Files**: (merge commit, geen eigen wijzigingen)

---

### #2 `22e35779` — feat: Update primary color from HAN pink to Indigo for student focus

- **Hash**: `22e35779cf5a13408a7b6a899813c56a36625a18`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 09:36:02 +0100
- **Type**: feat

> - Update index.css: Change primary color to #6366F1 (Indigo) in @theme blocks
> - Add neumorphic design system classes (.neu-flat, .neu-btn, .neu-pill, etc.)
> - Update .cursorrules: Document Indigo color palette and Tailwind v4 syntax
> - Fix docker-compose.yml: Add JWT_SECRET_KEY for backend authentication
> - Fix business_repository.py: TypeDB query syntax for location attribute array
>
> Breaking changes:
> - Tailwind CSS v4 migration with new @theme syntax
> - Remove package-lock.json (project uses pnpm)

**Files changed (5)**:
- `.cursorrules` | +79 / -?
- `docker-compose.yml` | +3
- `projojo_backend/domain/repositories/business_repository.py` | +2 / -1
- `projojo_frontend/package-lock.json` | -13.089
- `projojo_frontend/src/index.css` | +316 / -?

---

### #3 `50bd1ead` — feat: Restore neumorphic design system across all components

- **Hash**: `50bd1eadea2833b4b5b03e8612db4bca25e260af`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 09:47:24 +0100
- **Type**: feat

> Apply neumorphic styling to all frontend components after Tailwind v4 migration:
>
> Global:
> - index.html: Add Nunito font and Material Symbols icons
> - App.jsx: Add bg-neu-bg wrapper and proper main element styling
>
> Components:
> - Navbar: Neumorphic styling, Material icons, z-40 stacking
> - Footer: Restored content with proper styling
> - ProjectCard: neu-flat cards with hover overlay (z-10)
> - BusinessCard: neu-flat with Material icons
> - BusinessProjectDashboard: neu-flat wrapper
> - ProjectDashboard: Removed bg-slate-100, use neu-btn-primary
> - Filter: neu-flat, neu-input, Material icons, search placeholder updated
> - SkillsEditor: neu-flat, neu-pressed, z-30 for proper stacking
> - Modal: neu-card-lg with backdrop blur
> - Alert: Gradient background with error icon
> - InfoBox: neu-pressed styling
> - FormInput: neu-input with proper label styling
>
> Pages:
> - LoginPage: Full neumorphic redesign with neu-card-lg
> - NotFound: neu-card-lg with Material icon
>
> All components now use consistent Indigo (#6366F1) color scheme.

**Files changed (16)**:
- `projojo_frontend/index.html` | +8 / -?
- `projojo_frontend/src/App.jsx` | +8 / -?
- `projojo_frontend/src/components/Alert.jsx` | +11 / -?
- `projojo_frontend/src/components/BusinessCard.jsx` | +47 / -?
- `projojo_frontend/src/components/BusinessProjectDashboard.jsx` | +2 / -1
- `projojo_frontend/src/components/Filter.jsx` | +41 / -?
- `projojo_frontend/src/components/Footer.jsx` | +7 / -?
- `projojo_frontend/src/components/FormInput.jsx` | +8 / -?
- `projojo_frontend/src/components/InfoBox.jsx` | +2 / -1
- `projojo_frontend/src/components/Modal.jsx` | +16 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +85 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +30 / -?
- `projojo_frontend/src/components/ProjectDashboard.jsx` | +6 / -?
- `projojo_frontend/src/components/SkillsEditor.jsx` | +28 / -?
- `projojo_frontend/src/pages/LoginPage.jsx` | +76 / -?
- `projojo_frontend/src/pages/NotFound.jsx` | +18 / -?

---

### #4 `f0692678` — feat: Change primary color from Indigo to Coral

- **Hash**: `f06926789b4e886c361ab73b195f4ce5c4258089`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 09:54:16 +0100
- **Type**: feat

> Update color scheme to match Gemini design:
> - Primary: #FF7F50 (Coral)
> - Dark: #FF6347 (Tomato)
> - Light: #FFA07A (Light Salmon)
>
> Changes:
> - index.css: Update all @theme and :root color variables
> - index.css: Update .btn focus rings to orange-300
> - index.css: Update .neu-pill gradients and shadows
> - index.css: Update .neu-badge-primary-solid
> - .cursorrules: Document coral color palette

**Files changed (2)**:
- `.cursorrules` | +8 / -4
- `projojo_frontend/src/index.css` | +28 / -13

---

### #5 `92219342` — feat: Refine neumorphic design system based on Gemini reference

- **Hash**: `922193424f391b80d7f182ecae04bff86e932158`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 10:14:00 +0100
- **Type**: feat

> - Increase border-radius (1.5rem → 2rem) for softer appearance
> - Add refined typography: extrabold headings, uppercase labels with tracking
> - Implement fade-in-up animations for cards
> - Update Navbar with larger height (h-24) and circular icon buttons
> - Refine ProjectCard with glassmorphism badges and image overlays
> - Update Filter with improved spacing and focus states
> - Add shadow-inner to progress bars for depth
> - Replace HAN logo with Material Symbol school icon
> - Add new utility classes: neu-label, neu-task-box, neu-icon-container
> - Implement glassmorphism status badges with backdrop-blur
> - Refine LoginPage with centered card layout

**Files changed (10)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +83 / -?
- `projojo_frontend/src/components/Filter.jsx` | +49 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +51 / -?
- `projojo_frontend/src/components/PageHeader.jsx` | +16 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +115 / -?
- `projojo_frontend/src/components/SkillBadge.jsx` | +24 / -?
- `projojo_frontend/src/components/TaskCard.jsx` | +116 / -?
- `projojo_frontend/src/index.css` | +425 / -?
- `projojo_frontend/src/pages/DesignDemoPage.jsx` | +480
- `projojo_frontend/src/pages/LoginPage.jsx` | +51 / -?

---

### #6 `2332902d` — feat: Implement marketplace UX model with skill matching

- **Hash**: `2332902df7b6e89aa660929d1c70e2f17219088c`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 10:56:32 +0100
- **Type**: feat

> - Replace progress-based framing with "open positions" marketplace model
> - Add StudentSkillsContext for app-wide student skill data
> - Show personalized welcome with time-based greeting and matching positions count
> - Add skill match indicators on ProjectCard (coral outline for matches)
> - Update status badges: smaller, cleaner, green for available
> - Student-friendly Dutch labels (Open, Binnenkort, In behandeling)
> - Add click-outside-to-close for SkillsEditor popup
> - Widen SkillsEditor dialog for better usability
>
> UX improvements based on Nielsen heuristics and UI design patterns.

**Files changed (7)**:
- `projojo_frontend/src/App.jsx` | +55 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +258 / -?
- `projojo_frontend/src/components/SkillsEditor.jsx` | +36 / -?
- `projojo_frontend/src/components/TaskCard.jsx` | +67 / -?
- `projojo_frontend/src/context/StudentSkillsContext.jsx` | +87
- `projojo_frontend/src/index.css` | +17 / -?
- `projojo_frontend/src/pages/OverviewPage.jsx` | +52 / -?

---

### #7 `ee65fb0c` — feat: improve skill filter UX and neumorphic design refinements

- **Hash**: `ee65fb0c481e4ca253cd0abee4cf1a68997cc179`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 13:18:27 +0100
- **Type**: feat

> - Skill filter: instant apply, 3-section organization (Jouw skills, In afwachting, Andere skills)
> - Skill badges: coral filled for own skills, coral dashed outline for pending
> - Filter: individual skill removal with X button, selected skills visible in popup
> - Alert component: redesigned with neumorphic styling (soft shadows, coral accent)
> - Filter button: fixed click handling, simplified badge (only shows active filters when closed)
> - Project details page: full neumorphic styling applied
> - SkillsEditor: smooth animations, click-outside-to-close, instant apply mode

**Files changed (9)**:
- `projojo_frontend/src/components/Alert.jsx` | +12 / -?
- `projojo_frontend/src/components/Filter.jsx` | +80 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +15 / -?
- `projojo_frontend/src/components/ProjectDetails.jsx` | +149 / -?
- `projojo_frontend/src/components/ProjectTasks.jsx` | +63 / -?
- `projojo_frontend/src/components/SkillBadge.jsx` | +16 / -?
- `projojo_frontend/src/components/SkillsEditor.jsx` | +258 / -?
- `projojo_frontend/src/components/Task.jsx` | +246 / -?
- `projojo_frontend/src/pages/ProjectDetailsPage.jsx` | +6 / -?

---

### #8 `1536c79a` — feat: Redesign student profile page and single-page profile editor

- **Hash**: `1536c79a3a23a4f4f49ef7ca1db07667e562e4fd`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 15:07:45 +0100
- **Type**: feat

> - Redesign profile page with 2-column layout (skills/CV left, stats right)
> - Add profile completeness progress bar with actionable tips
> - Create single-page profile editor (replaces multi-step wizard)
> - Simplify navbar logo (remove shadow, consistent alignment)
> - Add CV management buttons on profile page (view, edit, upload)
> - Strip markdown/HTML from bio display in profile header
> - Remove HAN branding from footer
> - Improve DragDrop component with view/delete buttons

**Files changed (11)**:
- `projojo_frontend/src/components/DragDrop.jsx` | +26 / -?
- `projojo_frontend/src/components/Footer.jsx` | +2 / -1
- `projojo_frontend/src/components/Navbar.jsx` | +15 / -?
- `projojo_frontend/src/components/StudentProfile.jsx` | +13 / -?
- `projojo_frontend/src/components/StudentProfileCv.jsx` | +100 / -?
- `projojo_frontend/src/components/StudentProfileHeader.jsx` | +177 / -?
- `projojo_frontend/src/components/StudentProfileSkill.jsx` | +76 / -?
- `projojo_frontend/src/components/StudentProfileSkills.jsx` | +94 / -?
- `projojo_frontend/src/components/paged_component/paged_component.jsx` | +4 / -?
- `projojo_frontend/src/pages/ProfilePage.jsx` | +34 / -?
- `projojo_frontend/src/pages/update_student_page/update_student_page.jsx` | +352 / -?

---

### #9 `d4d2e290` — feat: Redesign BusinessCard and forms with neumorphic style

- **Hash**: `d4d2e290ad460af1a120c694bafed80822806bea`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 16:56:01 +0100
- **Type**: feat

> BusinessCard improvements:
> - Add sector, company size, website fields to display
> - Info pills with neu-pressed style and Material Symbols icons
> - Skills with coral border pill design
> - Clickable logo and name linking to business page
> - Remove hover shadow animation
>
> Backend updates:
> - Extend TypeDB schema with sector, companySize, website attributes
> - Update business repository and router to support new fields
> - Seed data with example values for all businesses
>
> Form redesigns (consistent neumorphic style):
> - UpdateBusinessPage: Add new fields, sectioned layout
> - AddProjectForm: Sectioned layout with tip box
> - CreateBusinessEmail: Updated button styles
> - EmailNotFoundPage: Full page redesign
> - NewSkillsManagement: Table and modal redesign
>
> Also: Simplify .cursorrules to focus on UI/UX and backend guidelines

**Files changed (15)**:
- `.cursorrules` | +460 / -?
- `design-planning/Gemini_Designs/businesscards.html` | +1.110
- `projojo_backend/db/schema.tql` | +6
- `projojo_backend/db/seed.tql` | +50 / -?
- `projojo_backend/domain/models/business.py` | +3
- `projojo_backend/domain/repositories/business_repository.py` | +44 / -?
- `projojo_backend/routes/business_router.py` | +5 / -?
- `projojo_frontend/src/components/AddProjectForm.jsx` | +142 / -?
- `projojo_frontend/src/components/BusinessCard.jsx` | +239 / -?
- `projojo_frontend/src/components/BusinessProjectDashboard.jsx` | +3
- `projojo_frontend/src/components/CreateBusinessEmail.jsx` | +39 / -?
- `projojo_frontend/src/components/NewSkillsManagement.jsx` | +82 / -?
- `projojo_frontend/src/pages/EmailNotFoundPage.jsx` | +47 / -?
- `projojo_frontend/src/pages/ProjectsAddPage.jsx` | +10 / -?
- `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +218 / -?

---

### #10 `d10cd446` — fix: Mobile menu overlay issue in Navbar

- **Hash**: `d10cd44626f920e36b4912e8b22454886543f7e4`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:00:58 +0100
- **Type**: fix

> - Add background color to mobile dropdown menu
> - Position menu absolutely below navbar
> - Add shadow for visual depth
> - Prevents page content from showing through menu

**Files changed (1)**:
- `projojo_frontend/src/components/Navbar.jsx` | +5 / -2

---

### #11 `efccbf5b` — feat: Add button hierarchy and gamified match text

- **Hash**: `efccbf5b6d287ee4a3fc93de951ae2f2b2d7b881`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:13:48 +0100
- **Type**: feat

> Button consistency:
> - Add new .neu-btn-outline class for tertiary actions
> - Change Website button to outline style (less prominent)
> - Maintain neu-btn-primary for important CTAs
> - Maintain neu-btn for secondary actions
>
> Gamification:
> - Change "X passen bij jouw skills" to "Xx match!" with fire icon
> - More engaging and game-like language

**Files changed (4)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +4 / -2
- `projojo_frontend/src/components/ProjectCard.jsx` | +6 / -3
- `projojo_frontend/src/index.css` | +20
- `projojo_frontend/src/pages/OverviewPage.jsx` | +4 / -2

---

### #12 `b40ffa73` — fix: Add neumorphic shadows to outline button

- **Hash**: `b40ffa73ace30c7b5a344c4d37c4b35e2e070b83`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:16:08 +0100
- **Type**: fix

**Files changed (1)**:
- `projojo_frontend/src/index.css` | +6 / -4

---

### #13 `6a61bc12` — style: Change BusinessCard skills to solid coral pills

- **Hash**: `6a61bc1257e870deca4f5ef30d9972e5a9f79909`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:19:50 +0100
- **Type**: style

**Files changed (1)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +5 / -5

---

### #14 `cf2dc0e5` — style: Improve match text and smaller BusinessCard skills

- **Hash**: `cf2dc0e592169bf51320623e4ecf7435558056b8`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:23:09 +0100
- **Type**: style

> - Change '2x match!' to '2 skill matches' (clearer)
> - Make BusinessCard skill pills smaller (text-xs, less padding)

**Files changed (3)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +4 / -2
- `projojo_frontend/src/components/ProjectCard.jsx` | +2 / -1
- `projojo_frontend/src/pages/OverviewPage.jsx` | +2 / -1

---

### #15 `10a56a77` — fix: Student skills not loading on initial login

- **Hash**: `10a56a772b897aba609dd7adb3a965443ee710fe`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:31:09 +0100
- **Type**: fix

> - Keep isLoading=true while auth is still loading
> - Only set isLoading=false after auth completes
> - Fixes skills filter being empty after login

**Files changed (1)**:
- `projojo_frontend/src/context/StudentSkillsContext.jsx` | +8 / -1

---

### #16 `b8d3474c` — fix: SkillsEditor not loading student skills on initial login

- **Hash**: `b8d3474cd3986db576cdb2cbd9e04ada5f510443`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 17:39:51 +0100
- **Type**: fix

> - Add authData.type and authData.userId to useEffect dependencies
> - Effect now re-runs when auth data becomes available
> - Previously only ran on isLoading change, missing the actual data

**Files changed (1)**:
- `projojo_frontend/src/components/SkillsEditor.jsx` | +20 / -17

---

### #17 `c6cb73c5` — feat: Add student dashboard and location maps

- **Hash**: `c6cb73c54732b5d212bd524473de45a0adc69dbe`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 18:03:08 +0100
- **Type**: feat

> - Add StudentDashboard page showing active tasks and registrations
> - Add LocationMap component using Leaflet/OpenStreetMap (free)
> - Update routing: /home = dashboard, /ontdek = discover page
> - Update Navbar with new "Ontdek" link for students
> - Integrate LocationMap in BusinessPage and ProjectDetails
> - Install leaflet and react-leaflet dependencies

**Files changed (9)**:
- `projojo_frontend/package-lock.json` | +13.187
- `projojo_frontend/package.json` | +2
- `projojo_frontend/src/App.jsx` | +4 / -?
- `projojo_frontend/src/components/LocationMap.jsx` | +157
- `projojo_frontend/src/components/Navbar.jsx` | +8
- `projojo_frontend/src/components/ProjectDetails.jsx` | +16
- `projojo_frontend/src/index.css` | +1
- `projojo_frontend/src/pages/BusinessPage.jsx` | +34 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +351

---

### #18 `fc7bcfc7` — fix: Correct broken links in StudentDashboard

- **Hash**: `fc7bcfc771c201593d0db91e784c162dfef17dd7`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 18:06:55 +0100
- **Type**: fix

> - /profile → /student/{userId}
> - /project/ → /projects/ (with 's')

**Files changed (1)**:
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +2 / -2

---

### #19 `e50ad3d5` — fix: Improve TaskCard styling in StudentDashboard

- **Hash**: `e50ad3d54bd89bacaf84ecf56a0180f61649b706`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 18:11:13 +0100
- **Type**: fix

> - Add status icon with neumorphic container
> - Always show task name (fallback to 'Taak')
> - Show task metadata (slots count)
> - Better visual hierarchy and spacing
> - Improved empty state design
> - Use neu-flat instead of neu-pressed for cards

**Files changed (1)**:
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +66 / -32

---

### #20 `cebf54ec` — fix: Improve dashboard styling and fix task links

- **Hash**: `cebf54ecaeecb5c846a139c44e7cb6c27e199f28`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-09 18:19:12 +0100
- **Type**: fix

> Frontend:
> - Use coral/primary colors consistently for pending status
> - Add outline badge style for 'In behandeling'
> - Fix task card links by using project_id from API
> - Simplify registration fetch (single API call)
>
> Backend:
> - Add project_id to task get_by_id and get_all queries
> - Enhance student registrations endpoint to return full task details with status

**Files changed (5)**:
- `projojo_backend/domain/repositories/task_repository.py` | +6
- `projojo_backend/domain/repositories/user_repository.py` | +21 / -?
- `projojo_backend/routes/student_router.py` | +4 / -?
- `projojo_frontend/src/index.css` | +30 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +65 / -?

---

### #21 `ea923f5e` — fix: Import Leaflet CSS in main.jsx instead of index.css

- **Hash**: `ea923f5e0a05c1c8d84824ec7eaaad5362862045`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 10:41:12 +0100
- **Type**: fix

> Tailwind v4 doesn't support @import for node_modules in CSS files

**Files changed (2)**:
- `projojo_frontend/src/index.css` | -1
- `projojo_frontend/src/main.jsx` | +1

---

### #22 `477002ef` — fix: Load Leaflet CSS via CDN, add troubleshooting docs

- **Hash**: `477002efbfdfe872c2da7c8c745869a3d223b0f0`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 10:48:19 +0100
- **Type**: fix

> - Load Leaflet CSS from unpkg CDN in index.html
> - Remove problematic CSS import from main.jsx
> - Add troubleshooting section for import errors after git pull

**Files changed (3)**:
- `README.md` | +11 / -1
- `projojo_frontend/index.html` | +2
- `projojo_frontend/src/main.jsx` | -1

---

### #23 `cf5a48ea` — fix: Lower z-index of Leaflet map to prevent overlap on scroll

- **Hash**: `cf5a48ea1116afac894171a136b5bf566d70a475`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 10:52:26 +0100
- **Type**: fix

**Files changed (2)**:
- `projojo_frontend/src/components/LocationMap.jsx` | +2 / -1
- `projojo_frontend/src/index.css` | +10

---

### #24 `71fd4b10` — feat: Redesign project header, rename app to Projojo

- **Hash**: `71fd4b10a477f6befc28f42287f05759043dbbba`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 11:50:22 +0100
- **Type**: feat

> - Compact project header with thumbnail instead of large banner
> - Add 'Project' badge to distinguish from business pages
> - Business info integrated in header with clickable link
> - Rename app from 'Opdrachtenbox' to 'Projojo' everywhere

**Files changed (5)**:
- `projojo_frontend/index.html` | +2 / -1
- `projojo_frontend/src/components/Footer.jsx` | +2 / -1
- `projojo_frontend/src/components/Navbar.jsx` | +2 / -1
- `projojo_frontend/src/components/ProjectDetails.jsx` | +82 / -?
- `projojo_frontend/src/pages/LoginPage.jsx` | +2 / -1

---

### #25 `588b7e00` — feat: Rename app to Projojo, add PROJECT badge to project page

- **Hash**: `588b7e001f13e7de3f2d6e1347b59ed585df8a86`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 11:53:53 +0100
- **Type**: feat

> - Rename 'Opdrachtenbox' to 'Projojo' everywhere
> - Add 'Project' badge in hero section
> - Make business info a clickable card with 'Aangeboden door' label
> - Consistent styling with dashboard

**Files changed (1)**:
- `projojo_frontend/src/components/ProjectDetails.jsx` | +47 / -44

---

### #26 `4e5df093` — fix: Scroll to top on route change

- **Hash**: `4e5df093d34cd0eae9b3a894197587339e7d9b2c`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 11:56:18 +0100
- **Type**: fix

**Files changed (1)**:
- `projojo_frontend/src/App.jsx` | +5

---

### #27 `448b42c4` — feat: Redesign dashboard layout - tasks side by side, cleaner buttons

- **Hash**: `448b42c438a0a5770a7ebe6a34577e44eb6a7a3e`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 12:36:32 +0100
- **Type**: feat

> - Active tasks and Registrations now side by side in 2 columns
> - TaskCard uses same neu-btn styling as quick actions
> - Swapped order: Mijn profiel now above Ontdek projecten
> - Cleaner, more compact design

**Files changed (1)**:
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +66 / -118

---

### #28 `64b56fc1` — feat: Expand TaskCard with more info - description, status badge, slots

- **Hash**: `64b56fc143f70d4cbdcda83187a66f14e64d9341`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 12:44:24 +0100
- **Type**: feat

> - Show full description (up to 50 words)
> - Add status badge (Aangenomen/In behandeling)
> - Show available slots
> - Add 'Bekijk taak' link indicator
> - Color-coded left border by status

**Files changed (7)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +4 / -?
- `projojo_frontend/src/components/Filter.jsx` | +2 / -1
- `projojo_frontend/src/components/ProjectDetails.jsx` | +40 / -?
- `projojo_frontend/src/components/ProjectTasks.jsx` | +16 / -?
- `projojo_frontend/src/components/StudentProfileSkills.jsx` | +20 / -?
- `projojo_frontend/src/components/Task.jsx` | +68 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +65 / -?

---

### #29 `fab6bc04` — feat: Show task skills on student dashboard + fix backend bug

- **Hash**: `fab6bc0403188b290b71bedae6041eae2de42af1`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-11 12:57:35 +0100
- **Type**: feat

> Frontend (StudentDashboard.jsx):
> - Redesigned TaskCard with better layout
> - Status badge on own line (no longer truncates title)
> - Description in normal weight text (not bold)
> - Fetch and display required skills per task (max 5 shown)
> - Added slots count and "Bekijk" link in footer
>
> Backend (task_service.py):
> - Fixed get_task_with_skills() not returning skills
> - The skills fetch was accidentally commented out in commit 773c384
> - Now correctly calls skill_repo.get_task_skills(task_id)

**Files changed (2)**:
- `projojo_backend/service/task_service.py` | +9 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +57 / -33

---

### #30 `4c90c1ec` — refactor: Simplify neu-pill styles by removing hover effects and transitions

- **Hash**: `4c90c1ec1098d95ef363f4f70ae00fe038fd19de`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-12 11:04:07 +0100
- **Type**: refactor

**Files changed (1)**:
- `projojo_frontend/src/index.css` | +1 / -17

---

### #31 `a8d82826` — feat: Add skill matching visualization across all pages

- **Hash**: `a8d82826d3b73aaa5187feae25156fcf33e866f9`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-13 21:32:35 +0100
- **Type**: feat

> - Swap skill badge styling: matching skills now prominent (coral), requested skills subtle (gray outline)
> - Add skill match indicators to BusinessCard, ProjectCard, ProjectDetails, Task, and StudentDashboard
> - Show check icon and match count for skills that match student profile
> - Make "Bekijk bedrijf" button more prominent with primary styling

**Files changed (7)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +60 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +6 / -?
- `projojo_frontend/src/components/ProjectDetails.jsx` | +24 / -?
- `projojo_frontend/src/components/SkillBadge.jsx` | +22 / -?
- `projojo_frontend/src/components/Task.jsx` | +51 / -?
- `projojo_frontend/src/index.css` | +85 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +26 / -?

---

### #32 `08c8f022` — fix: Fix registration duplicate check and location field consistency

- **Hash**: `08c8f02272f309330b17fd9088506099dce00cef`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-13 21:37:03 +0100
- **Type**: fix

> - Fix task_router.py: Extract task IDs from registration dicts before checking for duplicates (was comparing string to list of dicts)
> - Fix business_repository.py: Return location as string instead of array in get_all_with_full_nesting to match other methods

**Files changed (2)**:
- `projojo_backend/domain/repositories/business_repository.py` | +5 / -2
- `projojo_backend/routes/task_router.py` | +5 / -2

---

### #33 `a4fcf679` — fix: Handle task retrieval exceptions in registration endpoints

- **Hash**: `a4fcf679e45860242588fb6e4d8ac3aaf3a5fa99`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-13 21:42:58 +0100
- **Type**: fix

> - Updated create_registration and update_registration functions in task_router.py to handle ItemRetrievalException when fetching tasks by ID.
> - Improved error handling to return a 404 HTTPException if the task is not found.

**Files changed (2)**:
- `projojo_backend/routes/task_router.py` | +11 / -4
- `projojo_frontend/src/DESIGN_SYSTEM.md` | +177

---

### #34 `8a0cd756` — feat: Implement cancellation of task registrations

- **Hash**: `8a0cd7564e5e4ef93d1c7e0ee69e1cc906f0097a`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-13 22:10:46 +0100
- **Type**: feat

> - Added delete_registration method in TaskRepository to handle the deletion of pending registrations.
> - Introduced cancel_registration endpoint in task_router to allow students to cancel their registrations.
> - Updated frontend to include cancel registration functionality in TaskCard and StudentDashboard components, with confirmation dialog and error handling.
> - Adjusted CSS for improved button styling and interaction feedback.

**Files changed (6)**:
- `projojo_backend/domain/repositories/task_repository.py` | +43
- `projojo_backend/routes/task_router.py` | +27
- `projojo_frontend/src/components/Task.jsx` | +2 / -1
- `projojo_frontend/src/index.css` | +6 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +107 / -?
- `projojo_frontend/src/services.js` | +11

---

### #35 `b17674b7` — feat: Add Supervisor Dashboard with pending registrations management

- **Hash**: `b17674b7b2266257d92a5b9c11d8ed2eca6c4c40`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-13 22:40:36 +0100
- **Type**: feat

> - Create SupervisorDashboard page with sections for pending registrations, projects overview, and active students
> - Add backend endpoint GET /supervisors/dashboard with business data aggregation
> - Implement accept/reject registration flow with coral-themed action buttons
> - Add pending registration badges to project cards
> - Order sections by priority: Aanmeldingen → Projecten → Actieve Studenten

**Files changed (7)**:
- `projojo_backend/domain/repositories/project_repository.py` | +29 / -?
- `projojo_backend/domain/repositories/task_repository.py` | +70
- `projojo_backend/domain/repositories/user_repository.py` | +19
- `projojo_backend/routes/supervisor_router.py` | +52 / -?
- `projojo_frontend/src/App.jsx` | +17 / -?
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +613
- `projojo_frontend/src/services.js` | +8

---

### #36 `4b561e1a` — feat: Add User Stories for Portfolio Feature

- **Hash**: `4b561e1aa3363466a204c96af78c1792b958b479`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-13 23:37:40 +0100
- **Type**: feat

> - Introduced a new document outlining user stories related to the portfolio feature.
> - Defined acceptance criteria for each user story to guide development.
> - Specified technical requirements and priorities for implementation.

**Files changed (4)**:
- `docs/USER_STORIES_PORTFOLIO.md` | +111
- `projojo_frontend/src/components/Navbar.jsx` | +62 / -?
- `projojo_frontend/src/components/TestUserSelector.jsx` | +259 / -?
- `projojo_frontend/src/index.css` | +10

---

### #37 `b5b32af1` — feat: Enhance user and project information in task registrations

- **Hash**: `b5b32af127899cf7c547bcdb048ece175e2a7d73`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 00:13:11 +0100
- **Type**: feat

> - Updated get_student_registrations in user_repository.py to include business info alongside task details.
> - Modified BusinessCard component to improve layout and accessibility.
> - Adjusted Navbar for better responsiveness.
> - Refactored ProjectCard and ProjectDashboard.
> - Added business information display in StudentDashboard.

**Files changed (7)**:
- `projojo_backend/domain/repositories/user_repository.py` | +10 / -2
- `projojo_frontend/src/components/BusinessCard.jsx` | +14 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +13 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +9 / -?
- `projojo_frontend/src/components/ProjectDashboard.jsx` | +17 / -?
- `projojo_frontend/src/components/ProjectDetails.jsx` | +4 / -2
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +25 / -?

---

### #38 `1cd7b3a0` — feat: Implement business archiving and restoration functionality

- **Hash**: `1cd7b3a09ebfc2a37d0a2f3408d1bc1037e9ba3e`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 00:42:31 +0100
- **Type**: feat

> - Added isArchived attribute to business entity in database schema.
> - Updated Business model to include is_archived property.
> - Enhanced BusinessRepository with methods to archive and restore businesses.
> - Created new API endpoints for archiving and restoring businesses (teachers only).
> - Updated frontend components to support business archiving in TeacherPage.
> - Adjusted business creation to allow for drafts (archived by default).

**Files changed (9)**:
- `projojo_backend/db/schema.tql` | +2
- `projojo_backend/domain/models/business.py` | +1
- `projojo_backend/domain/repositories/business_repository.py` | +138 / -?
- `projojo_backend/routes/business_router.py` | +70 / -?
- `projojo_frontend/src/App.jsx` | +1
- `projojo_frontend/src/components/BusinessCard.jsx` | +14 / -?
- `projojo_frontend/src/pages/TeacherPage.jsx` | +269 / -?
- `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +27 / -?
- `projojo_frontend/src/services.js` | +39 / -?

---

### #39 `fd1fa752` — feat: Enhance business retrieval with archiving support

- **Hash**: `fd1fa752f0c7e18bb400dac2b789a5f7225aef53`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 00:49:25 +0100
- **Type**: feat

> - Updated get_all_with_full_nesting to include include_archived parameter.
> - Added is_archived field to returned business data.
> - Modified Navbar to fetch user profile pictures.

**Files changed (2)**:
- `projojo_backend/domain/repositories/business_repository.py` | +14 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +93 / -?

---

### #40 `816d5eac` — refactor: Improve business archiving logic and error handling

- **Hash**: `816d5eacd7f6e546efaa08b3fc578e3e545bc3ed`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 01:25:27 +0100
- **Type**: refactor

> - Simplified archive_business and restore_business methods.
> - Updated deletion logic to check for existing isArchived attributes.
> - Adjusted BusinessCard component for conditional line clamping.
> - Enhanced error messaging in TeacherPage.

**Files changed (3)**:
- `projojo_backend/domain/repositories/business_repository.py` | +47 / -?
- `projojo_frontend/src/components/BusinessCard.jsx` | +2 / -1
- `projojo_frontend/src/pages/TeacherPage.jsx` | +4 / -?

---

### #41 `f360021f` — refactor: Update LocationMap and ProjectTasks components for improved layout

- **Hash**: `f360021f4293eb39f2040ae70a01fe0374fd67af`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 09:46:06 +0100
- **Type**: refactor

> - Adjusted default zoom level in LocationMap to 8.
> - Refactored ProjectTasks component with grid system.
> - Ensured consistent height for task elements.

**Files changed (3)**:
- `projojo_frontend/src/components/LocationMap.jsx` | +3 / -?
- `projojo_frontend/src/components/ProjectTasks.jsx` | +39 / -?
- `projojo_frontend/src/components/Task.jsx` | +8 / -?

---

### #42 `b951e299` — feat: Add Landing Page and update routing for public pages

- **Hash**: `b951e299177ab01183e7fbc3d9cbb4a458916283`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 15:56:39 +0100
- **Type**: feat

> - Introduced a new LandingPage component as entry point.
> - Updated App component routing for LandingPage and LoginPage.
> - Adjusted Navbar and Footer visibility based on public page status.
> - Enhanced LoginPage with link back to LandingPage.

**Files changed (3)**:
- `projojo_frontend/src/App.jsx` | +13 / -?
- `projojo_frontend/src/pages/LandingPage.jsx` | +386
- `projojo_frontend/src/pages/LoginPage.jsx` | +10

---

### #43 `7de71a15` — feat: Revamp Landing Page for enhanced user engagement

- **Hash**: `7de71a15f6a8311b13644b56d0c26d4868fd89e8`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-14 16:06:50 +0100
- **Type**: feat

> - Redesigned LandingPage with modern, student-focused layout.
> - Implemented scroll detection for dynamic navbar styling.
> - Updated feature descriptions and icons.
> - Introduced visual journey section.
> - Enhanced with neumorphic design principles and accessibility.

**Files changed (1)**:
- `projojo_frontend/src/pages/LandingPage.jsx` | +362 / -227

---

### #44 `39290f8a` — feat: Add Design Demo Page and update routing

- **Hash**: `39290f8afd9b5b45cdec4f2320b7cd80978ef547`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2025-12-19 15:24:16 +0100
- **Type**: feat

> - Introduced DesignDemoPage showcasing UI elements and neumorphic design principles.
> - Updated App routing for DesignDemoPage.
> - Enhanced with interactive buttons, alerts, notifications, and form elements.

**Files changed (2)**:
- `projojo_frontend/src/App.jsx` | +6 / -?
- `projojo_frontend/src/pages/DesignDemoPage.jsx` | +654 / -41

---

### #45 `ebc91e7f` — feat: Enhance modal components with improved accessibility and styling

- **Hash**: `ebc91e7fdbbd6dd58906f2ae614d4ae79435d217`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-05 15:41:14 +0100
- **Type**: feat

> - Updated Modal with optional subtitle and icon props.
> - Refined BusinessCard and Task components for colleague/task registration processes.
> - Improved RichTextEditor and CreateBusinessEmail with neumorphic design.
> - Enhanced DesignDemoPage with modal preview.

**Files changed (7)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +6 / -?
- `projojo_frontend/src/components/CreateBusinessEmail.jsx` | +2 / -1
- `projojo_frontend/src/components/Modal.jsx` | +74 / -?
- `projojo_frontend/src/components/RichTextEditor.jsx` | +105 / -?
- `projojo_frontend/src/components/RichTextEditorButton.jsx` | +10 / -?
- `projojo_frontend/src/components/Task.jsx` | +275 / -?
- `projojo_frontend/src/pages/DesignDemoPage.jsx` | +142 / -?

---

### #46 `962a6887` — feat: Enhance accessibility across components and improve user interaction

- **Hash**: `962a6887326ef1b9b5ae28237cfd84183c58af85`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 10:58:06 +0100
- **Type**: feat

> - Added skip link for keyboard navigation (WCAG 2.4.1).
> - Implemented reduced motion support in CSS.
> - Updated Alert, DragDrop, Filter, Modal, Navbar, Tooltip with improved ARIA attributes.
> - Enhanced focus management in Modal.

**Files changed (8)**:
- `projojo_frontend/src/App.jsx` | +14 / -?
- `projojo_frontend/src/components/Alert.jsx` | +7 / -?
- `projojo_frontend/src/components/DragDrop.jsx` | +32 / -?
- `projojo_frontend/src/components/Filter.jsx` | +18 / -?
- `projojo_frontend/src/components/Modal.jsx` | +165 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +16 / -?
- `projojo_frontend/src/components/Tooltip.jsx` | +59 / -?
- `projojo_frontend/src/index.css` | +28

---

### #47 `79acc2c7` — feat: Implement theme management with dark mode and high contrast support

- **Hash**: `79acc2c7f168991665bdcaefcd55bec9d4be9068`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 11:33:29 +0100
- **Type**: feat

> - Introduced ThemeProvider for light/dark themes and high contrast mode (localStorage).
> - Added ThemeToggle component.
> - Updated App and Navbar for theme context integration.
> - Enhanced accessibility with keyboard navigation and screen reader support.

**Files changed (5)**:
- `projojo_frontend/src/App.jsx` | +91 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +14 / -?
- `projojo_frontend/src/components/ThemeToggle.jsx` | +279
- `projojo_frontend/src/context/ThemeContext.jsx` | +221
- `projojo_frontend/src/index.css` | +533 / -176

---

### #48 `1ddaa9e6` — feat: Update styling and accessibility across components

- **Hash**: `1ddaa9e6192e0ebe7cdccc9f0dc6aff93c60db15`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 13:31:12 +0100
- **Type**: feat

> - Refined CSS styles with CSS variables for consistent theming.
> - Enhanced accessibility including high contrast and focus indicators.
> - Updated various components for neumorphic design.
> - Improved text color contrasts and hover states.

**Files changed (35)**:
- `projojo_frontend/src/components/AddProjectForm.jsx` | +14 / -?
- `projojo_frontend/src/components/BusinessCard.jsx` | +69 / -?
- `projojo_frontend/src/components/DragDrop.jsx` | +2 / -1
- `projojo_frontend/src/components/LocationMap.jsx` | +10 / -?
- `projojo_frontend/src/components/Modal.jsx` | +15 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +10 / -?
- `projojo_frontend/src/components/NewSkillsManagement.jsx` | +16 / -?
- `projojo_frontend/src/components/PageHeader.jsx` | +4 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +39 / -?
- `projojo_frontend/src/components/ProjectDashboard.jsx` | +9
- `projojo_frontend/src/components/ProjectDetails.jsx` | +10 / -?
- `projojo_frontend/src/components/ProjectTasks.jsx` | +6 / -?
- `projojo_frontend/src/components/RichTextEditor.jsx` | +14 / -?
- `projojo_frontend/src/components/RichTextEditorButton.jsx` | +2 / -1
- `projojo_frontend/src/components/SkillsEditor.jsx` | +17 / -?
- `projojo_frontend/src/components/StudentProfileCv.jsx` | +6 / -?
- `projojo_frontend/src/components/StudentProfileHeader.jsx` | +16 / -?
- `projojo_frontend/src/components/StudentProfileSkill.jsx` | +4 / -?
- `projojo_frontend/src/components/StudentProfileSkills.jsx` | +6 / -?
- `projojo_frontend/src/components/Task.jsx` | +51 / -?
- `projojo_frontend/src/components/TaskCard.jsx` | +8 / -?
- `projojo_frontend/src/components/TestUserSelector.jsx` | +21 / -?
- `projojo_frontend/src/components/ThemeToggle.jsx` | +8 / -?
- `projojo_frontend/src/index.css` | +124 / -?
- `projojo_frontend/src/pages/BusinessPage.jsx` | +2 / -1
- `projojo_frontend/src/pages/EmailNotFoundPage.jsx` | +4 / -?
- `projojo_frontend/src/pages/LandingPage.jsx` | +72 / -?
- `projojo_frontend/src/pages/LoginPage.jsx` | +4 / -?
- `projojo_frontend/src/pages/OverviewPage.jsx` | +6 / -?
- `projojo_frontend/src/pages/ProfilePage.jsx` | +8 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +46 / -?
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +74 / -?
- `projojo_frontend/src/pages/TeacherPage.jsx` | +28 / -?
- `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +18 / -?
- `projojo_frontend/src/pages/update_student_page/update_student_page.jsx` | +30 / -?

---

### #49 `03ba0f16` — feat: Integrate react-leaflet-cluster for enhanced map functionality

- **Hash**: `03ba0f16cad61a03078416c0179d4e307dbb9217`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 13:50:16 +0100
- **Type**: feat

> - Added react-leaflet-cluster package for marker clustering.
> - Implemented custom coral marker and cluster styles.
> - Enhanced Filter with businesses data for map interaction.
> - Introduced OverviewMap component with geocoded locations and clustering.

**Files changed (6)**:
- `projojo_frontend/package-lock.json` | +26
- `projojo_frontend/package.json` | +1
- `projojo_frontend/src/components/Filter.jsx` | +119 / -?
- `projojo_frontend/src/components/OverviewMap.jsx` | +264
- `projojo_frontend/src/index.css` | +54
- `projojo_frontend/src/pages/OverviewPage.jsx` | +12 / -?

---

### #50 `ae2d51bc` — feat: Add country field to business entity and enhance filtering

- **Hash**: `ae2d51bcecb58de2ffa699e02260163764a91ad6`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 15:43:50 +0100
- **Type**: feat

> - Introduced optional country field in business entity schema.
> - Updated Business model and repository.
> - Enhanced Filter component with country filter option.
> - Implemented country selection in UpdateBusinessPage.
> - Improved OverviewPage to display country information.

**Files changed (10)**:
- `projojo_backend/db/schema.tql` | +2
- `projojo_backend/domain/models/business.py` | +1
- `projojo_backend/domain/repositories/business_repository.py` | +16 / -?
- `projojo_backend/routes/business_router.py` | +3 / -?
- `projojo_frontend/src/components/Filter.jsx` | +346 / -?
- `projojo_frontend/src/components/FilterChip.jsx` | +89
- `projojo_frontend/src/components/OverviewMap.jsx` | +62 / -?
- `projojo_frontend/src/index.css` | +38
- `projojo_frontend/src/pages/OverviewPage.jsx` | +63 / -?
- `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +45 / -?

---

### #51 `fb7a9fd9` — fix: Update Filter component button labels for clarity

- **Hash**: `fb7a9fd920929929cca1a04ffe357a1da1c12305`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 15:46:15 +0100
- **Type**: fix

> - Changed visibility icon to 'close' and text from 'Toon alle' to 'Toon alles'
> - Changed 'Mijn skills' to 'Alleen mijn matches'

**Files changed (1)**:
- `projojo_frontend/src/components/Filter.jsx` | +2 / -2

---

### #52 `66a7ea9f` — feat: Enhance LocationMap and OverviewMap with dark mode support

- **Hash**: `66a7ea9ff9d55d718fa48c686a1cee9058d74b22`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 16:03:27 +0100
- **Type**: feat

> - Integrated theme context for light and dark map styles.
> - Implemented custom coral marker icon.
> - Updated TileLayer to dynamically switch based on theme.

**Files changed (2)**:
- `projojo_frontend/src/components/LocationMap.jsx` | +45 / -?
- `projojo_frontend/src/components/OverviewMap.jsx` | +16 / -?

---

### #53 `aacf28a0` — fix: Update button class in TaskCard for consistent styling

- **Hash**: `aacf28a0d99f8dd4f702fd08142ba13cd9c6d21e`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 16:03:34 +0100
- **Type**: fix

> Changed button class from "neu-btn w-full mb-3 !text-primary" to "neu-btn-primary w-full mb-3"

**Files changed (1)**:
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +1 / -1

---

### #54 `a411e3f2` — refactor: Update page headers and text for improved clarity

- **Hash**: `a411e3f21ba51f75115b6a689f49c9601f73f492`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 16:09:37 +0100
- **Type**: refactor

> - Changed header styles across multiple pages for visual hierarchy.
> - Updated text content for better alignment with user intent.
> - Increased header font size and adjusted paragraph styles.

**Files changed (4)**:
- `projojo_frontend/src/pages/OverviewPage.jsx` | +14 / -7
- `projojo_frontend/src/pages/ProfilePage.jsx` | +10 / -5
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +20 / -10
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +20 / -10

---

### #55 `47ac4657` — refactor: Improve code formatting and structure for better readability

- **Hash**: `47ac46578813e13326ad887c4620344ad6d3b072`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-06 16:23:07 +0100
- **Type**: refactor

> - Adjusted indentation and spacing in App, BusinessCard, DragDrop, Filter, Modal, ProjectCard, SkillsEditor, and UpdateBusinessPage.
> - Ensured consistent formatting across components.

**Files changed (8)**:
- `projojo_frontend/src/App.jsx` | +60 / -?
- `projojo_frontend/src/components/BusinessCard.jsx` | +24 / -?
- `projojo_frontend/src/components/DragDrop.jsx` | +4 / -?
- `projojo_frontend/src/components/Filter.jsx` | +4 / -?
- `projojo_frontend/src/components/Modal.jsx` | +76 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +10 / -?
- `projojo_frontend/src/components/SkillsEditor.jsx` | +2 / -1
- `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +18 / -?

---

### #56 `7254c04b` — feat: Add business image handling and placeholders

- **Hash**: `7254c04bcd759c33249cf0e719c3d46d52dc0c71`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-08 10:17:12 +0100
- **Type**: feat

> - Implemented logic to check for valid business images across components.
> - Introduced BusinessPlaceholder component (initials for businesses without images).
> - Updated styling for neumorphic design principles.

**Files changed (5)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +39 / -?
- `projojo_frontend/src/components/Navbar.jsx` | +8 / -?
- `projojo_frontend/src/components/OverviewMap.jsx` | +8 / -?
- `projojo_frontend/src/components/ProjectDetails.jsx` | +18 / -?
- `projojo_frontend/src/pages/TeacherPage.jsx` | +14 / -?

---

### #57 `7e6d45c0` — feat: Enhance LandingPage with theme toggle and neumorphic styling

- **Hash**: `7e6d45c0e9817c96733a63ef6c1d6f3e1c86bdd7`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-08 11:06:45 +0100
- **Type**: feat

> - Integrated theme context for light/dark mode switching.
> - Updated navigation and card components with neumorphic design.
> - Improved accessibility with aria-labels for theme toggle.

**Files changed (1)**:
- `projojo_frontend/src/pages/LandingPage.jsx` | +30 / -18

---

### #58 `0a6fb882` — fix: Remove celebratory emoji from LandingPage text

- **Hash**: `0a6fb882b6179eae6f6bdd98a83e0d483c9c475d`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-08 11:56:47 +0100
- **Type**: fix

**Files changed (1)**:
- `projojo_frontend/src/pages/LandingPage.jsx` | +1 / -1

---

### #59 `81f3449a` — feat: Implement portfolio management features and enhance project actions

- **Hash**: `81f3449ad6069bbe03462c6fc4a0ff9c923b9184`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-20 17:38:34 +0100
- **Type**: feat

> - Added PortfolioRepository for managing portfolio snapshots.
> - Introduced hasPortfolio relation for students.
> - Enhanced project deletion to create portfolio snapshots for completed tasks.
> - Implemented notification service for email alerts.
> - Updated routers for portfolio functionalities.
> - Created PortfolioItem, PortfolioList, PortfolioRoadmap, ProjectActionModal, StudentPortfolio components.
> - Added confirmation modal for project actions affecting students.

**Files changed (23)**:
- `projojo_backend/db/schema.tql` | +30 / -?
- `projojo_backend/db/seed.tql` | +135 / -?
- `projojo_backend/domain/repositories/__init__.py` | +3 / -?
- `projojo_backend/domain/repositories/portfolio_repository.py` | +293
- `projojo_backend/domain/repositories/project_repository.py` | +268
- `projojo_backend/domain/repositories/task_repository.py` | +117 / -?
- `projojo_backend/domain/repositories/user_repository.py` | +1
- `projojo_backend/routes/project_router.py` | +211 / -?
- `projojo_backend/routes/student_router.py` | +103 / -?
- `projojo_backend/routes/task_router.py` | +86
- `projojo_backend/service/__init__.py` | +3 / -?
- `projojo_backend/service/notification_service.py` | +276
- `projojo_frontend/src/components/LocationMap.jsx` | +10 / -?
- `projojo_frontend/src/components/OverviewMap.jsx` | +10 / -?
- `projojo_frontend/src/components/PortfolioItem.jsx` | +298
- `projojo_frontend/src/components/PortfolioList.jsx` | +272
- `projojo_frontend/src/components/PortfolioRoadmap.jsx` | +444
- `projojo_frontend/src/components/ProjectActionModal.jsx` | +242
- `projojo_frontend/src/components/ProjectDetails.jsx` | +178 / -?
- `projojo_frontend/src/components/StudentPortfolio.jsx` | +164
- `projojo_frontend/src/pages/ProfilePage.jsx` | +10
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +44 / -?
- `projojo_frontend/src/services.js` | +96

---

### #60 `39a91c69` — Merge branch 'main' into next-ui

- **Hash**: `39a91c690419040df47cf373806f5e9689a234fc`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-29 17:15:22 +0100
- **Type**: merge

**Files**: (merge commit, geen eigen wijzigingen)

---

### #61 `b3d7205a` — refactor: Update skill ID handling across components and routers

- **Hash**: `b3d7205a63e4462a0271dc329969d55a0fb5616e`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-29 18:29:02 +0100
- **Type**: refactor

> - Modified backend routes to include Depends for JWT token payload retrieval.
> - Updated frontend components to consistently use skillId instead of id.
> - Enhanced skill ID mapping in BusinessCard, ProjectCard, Task.
> - Adjusted context and service files for new skill ID structure.

**Files changed (13)**:
- `projojo_backend/routes/business_router.py` | +3 / -1
- `projojo_backend/routes/student_router.py` | +3 / -1
- `projojo_backend/routes/task_router.py` | +3 / -1
- `projojo_frontend/src/components/BusinessCard.jsx` | +2 / -1
- `projojo_frontend/src/components/Filter.jsx` | +3 / -1
- `projojo_frontend/src/components/ProjectCard.jsx` | +10 / -5
- `projojo_frontend/src/components/ProjectDetails.jsx` | +18 / -9
- `projojo_frontend/src/components/Task.jsx` | +3 / -1
- `projojo_frontend/src/context/StudentSkillsContext.jsx` | +17 / -10
- `projojo_frontend/src/pages/OverviewPage.jsx` | +2 / -1
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +2 / -1
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +2 / -1
- `projojo_frontend/src/services.js` | +3 / -1

---

### #62 `9ddc1520` — feat: Enhance task skill management and UI components

- **Hash**: `9ddc1520edff74545fb490108d4ee5f4ba220215`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-29 19:10:18 +0100
- **Type**: feat

> - Added has_task_registrations and update_task_skills methods in SkillRepository.
> - Updated task_router with endpoint for updating task skills.
> - Enhanced SkillsEditor with embedded prop.
> - Modified Task component for skill updates and task details.

**Files changed (4)**:
- `projojo_backend/domain/repositories/skill_repository.py` | +87 / -?
- `projojo_backend/routes/task_router.py` | +39 / -?
- `projojo_frontend/src/components/SkillsEditor.jsx` | +14 / -?
- `projojo_frontend/src/components/Task.jsx` | +357 / -?

---

### #63 `1aba424f` — fix: Correct user role check in task registration endpoint

- **Hash**: `1aba424faa5a99ebd4e916ce44b4f8663cb49211`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-30 10:45:06 +0100
- **Type**: fix

> - Updated user role verification to use request.state.user_role instead of payload.
> - Removed redundant comments.

**Files changed (1)**:
- `projojo_backend/routes/task_router.py` | +3 / -4

---

### #64 `451e027f` — feat: Add start and end date fields to projects and tasks

- **Hash**: `451e027f55b67006151e1c760d032606a7461dc9`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-30 12:23:41 +0100
- **Type**: feat

> - Introduced optional startDate and endDate fields in project and task entities.
> - Updated Project and Task models with new date attributes.
> - Enhanced repositories to handle new date fields with validation.
> - Modified endpoints to accept and validate start and end dates.
> - Updated frontend with date input fields.
> - Implemented logic to inherit project dates in task creation.

**Files changed (12)**:
- `projojo_backend/db/schema.tql` | +6
- `projojo_backend/domain/models/project.py` | +2
- `projojo_backend/domain/models/task.py` | +18 / -?
- `projojo_backend/domain/repositories/business_repository.py` | +16
- `projojo_backend/domain/repositories/project_repository.py` | +41 / -?
- `projojo_backend/domain/repositories/task_repository.py` | +186 / -?
- `projojo_backend/routes/project_router.py` | +32 / -?
- `projojo_backend/routes/task_router.py` | +90 / -?
- `projojo_frontend/src/components/AddProjectForm.jsx` | +36 / -?
- `projojo_frontend/src/components/ProjectDetails.jsx` | +28
- `projojo_frontend/src/components/Task.jsx` | +485 / -?
- `projojo_frontend/src/services.js` | +25 / -?

---

### #65 `308168da` — feat: Enhance project and task management with date handling and UI improvements

- **Hash**: `308168da6f6f8d05541e07fa508e4176caa80876`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-30 14:30:36 +0100
- **Type**: feat

> - Added startDate and endDate fields to project and task entities in TypeDB.
> - Updated frontend with countdowns and progress indicators.
> - Implemented scroll restoration logic.
> - Introduced utility module for date formatting and countdown calculations.
> - Enhanced accessibility features.

**Files changed (10)**:
- `projojo_backend/db/seed.tql` | +355 / -?
- `projojo_frontend/src/App.jsx` | +147 / -?
- `projojo_frontend/src/components/Filter.jsx` | +36 / -?
- `projojo_frontend/src/components/Modal.jsx` | +33 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +9
- `projojo_frontend/src/components/ProjectDetails.jsx` | +39
- `projojo_frontend/src/components/SkillsEditor.jsx` | +34 / -?
- `projojo_frontend/src/components/Task.jsx` | +168 / -?
- `projojo_frontend/src/components/TaskCard.jsx` | +21 / -?
- `projojo_frontend/src/utils/dates.js` | +100

---

### #66 `309356c4` — feat: Add active task management and enhance portfolio features

- **Hash**: `309356c43b489d0f3653dd3dbd0e48fb58038cf1`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-30 15:00:04 +0100
- **Type**: feat

> - Introduced active task registrations for Emma in database.
> - Updated PortfolioRepository with methods for active portfolio items.
> - Modified student portfolio response with active/completed counts.
> - Enhanced PortfolioRoadmap with task period timeline calculations.
> - Updated StudentPortfolio to differentiate active and completed tasks.

**Files changed (6)**:
- `projojo_backend/db/seed.tql` | +34
- `projojo_backend/domain/repositories/portfolio_repository.py` | +130 / -?
- `projojo_backend/routes/student_router.py` | +5 / -?
- `projojo_frontend/src/components/PortfolioRoadmap.jsx` | +501 / -?
- `projojo_frontend/src/components/StudentPortfolio.jsx` | +22 / -?
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +21 / -?

---

### #67 `207bff21` — feat: Introduce subtask management features and enhance task functionality

- **Hash**: `207bff21172a674531a79c99b5d923fbe2e951d0`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-30 15:36:20 +0100
- **Type**: feat

> - Added Subtask entity and SubtaskTemplate entity in TypeDB schema.
> - Implemented CRUD operations for subtasks.
> - Developed subtask_router for API requests.
> - Created TaskSubtasks component.
> - Enhanced SubtaskForm with template selection.
> - Updated Task component for subtask display.
>
> **NB: Deze feature is later volledig verwijderd in commit #74.**

**Files changed (13)**:
- `projojo_backend/db/schema.tql` | +46
- `projojo_backend/db/seed.tql` | +107
- `projojo_backend/domain/models/__init__.py` | +3 / -?
- `projojo_backend/domain/models/subtask.py` | +77
- `projojo_backend/domain/repositories/__init__.py` | +3 / -?
- `projojo_backend/domain/repositories/subtask_repository.py` | +487
- `projojo_backend/main.py` | +2
- `projojo_backend/routes/subtask_router.py` | +255
- `projojo_frontend/src/components/SubtaskForm.jsx` | +201
- `projojo_frontend/src/components/Task.jsx` | +19 / -?
- `projojo_frontend/src/components/TaskSubtasks.jsx` | +416
- `projojo_frontend/src/components/TemplateManager.jsx` | +282
- `projojo_frontend/src/services.js` | +140

**Totaal**: 13 files, +2.035 insertions, -3 deletions

---

### #68 `a65cea74` — feat: Update TypeDB schema and enhance frontend components for task management

- **Hash**: `a65cea74afbceeff7d0f4696e5e727d6edc1f63d`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-31 20:17:26 +0100
- **Type**: feat

> - Added new relationships in TypeDB for claimedBy and belongsToTask.
> - Introduced normalize_datetime utility in task_router.
> - Enhanced CreateBusinessEmail with compact mode.
> - Updated Task and TaskSubtasks for layout and accessibility.
> - Added scrollbar utilities and tab navigation styling.

**Files changed (9)**:
- `.gitignore` | +5
- `projojo_backend/db/schema.tql` | +11 / -?
- `projojo_backend/domain/repositories/subtask_repository.py` | +6 / -?
- `projojo_backend/routes/task_router.py` | +37 / -?
- `projojo_frontend/src/components/CreateBusinessEmail.jsx` | +11 / -?
- `projojo_frontend/src/components/ProjectTasks.jsx` | +11 / -?
- `projojo_frontend/src/components/Task.jsx` | +809 / -?
- `projojo_frontend/src/components/TaskSubtasks.jsx` | +85 / -?
- `projojo_frontend/src/index.css` | +63

---

### #69 `95d6fbea` — feat: Enhance task and project components with skill management and UI improvements

- **Hash**: `95d6fbeaa8ca3ed48445c03641905e8d1fe99547`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-31 21:12:06 +0100
- **Type**: feat

> - Introduced collapsible map in BusinessCard.
> - Implemented skill click handling in BusinessProjectDashboard.
> - Updated ProjectDetails for task highlighting based on skills.
> - Enhanced Task component for subtasks and progress indicators.
> - Improved CSS animations for task highlighting.

**Files changed (8)**:
- `projojo_frontend/src/components/BusinessCard.jsx` | +57 / -?
- `projojo_frontend/src/components/BusinessProjectDashboard.jsx` | +31
- `projojo_frontend/src/components/ProjectCard.jsx` | +2 / -1
- `projojo_frontend/src/components/ProjectDetails.jsx` | +426 / -?
- `projojo_frontend/src/components/Task.jsx` | +31 / -?
- `projojo_frontend/src/index.css` | +23 / -?
- `projojo_frontend/src/pages/ProjectDetailsPage.jsx` | +13 / -?
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +91 / -?

---

### #70 `37cfa654` — feat: Update ProjectDetails with neumorphic styling and improved image handling

- **Hash**: `37cfa6546e6aafc7f0d28dfcc7a33d003fb6619d`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-01-31 21:18:42 +0100
- **Type**: feat

> - Applied neumorphic design principles to project image section.
> - Adjusted image dimensions and added subtle vignette overlay.
> - Ensured accessibility compliance with alt text.

**Files changed (1)**:
- `projojo_frontend/src/components/ProjectDetails.jsx` | +15 / -11

---

### #71 `0995c7dc` — feat: Update terminology from "bedrijf" to "organisatie" across components

- **Hash**: `0995c7dc7dfc58179c93ee2b273fa82a8bd91cbf`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-02 13:45:52 +0100
- **Type**: feat

> Replaced instances of "bedrijf" with "organisatie" in AddProjectForm, BusinessCard, Filter, Navbar, OverviewMap, PortfolioItem, PortfolioList, ProjectDashboard, BusinessPage, LandingPage, SupervisorDashboard, TeacherPage, UpdateBusinessPage, and test files.

**Files changed (19)**:
- `projojo_frontend/src/components/AddProjectForm.jsx` | +4 / -2
- `projojo_frontend/src/components/BusinessCard.jsx` | +4 / -2
- `projojo_frontend/src/components/Filter.jsx` | +12 / -5
- `projojo_frontend/src/components/Navbar.jsx` | +2 / -1
- `projojo_frontend/src/components/OverviewMap.jsx` | +2 / -1
- `projojo_frontend/src/components/PortfolioItem.jsx` | +2 / -1
- `projojo_frontend/src/components/PortfolioList.jsx` | +4 / -2
- `projojo_frontend/src/components/ProjectDashboard.jsx` | +2 / -1
- `projojo_frontend/src/pages/BusinessPage.jsx` | +2 / -1
- `projojo_frontend/src/pages/LandingPage.jsx` | +4 / -2
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +4 / -2
- `projojo_frontend/src/pages/TeacherPage.jsx` | +26 / -11
- `projojo_frontend/src/pages/UpdateBusinessPage.jsx` | +16 / -7
- `projojo_frontend/src/tests/BusinessCard.stories.jsx` | +10 / -5
- `projojo_frontend/src/tests/BusinessProjectDashboard.stories.jsx` | +2 / -1
- `projojo_frontend/src/tests/DashboardsOverview.stories.jsx` | +6 / -3
- `projojo_frontend/src/tests/Filter.stories.jsx` | +8 / -4
- `projojo_frontend/src/tests/Navbar.stories.jsx` | +2 / -1
- `projojo_frontend/src/tests/ProjectDetails.stories.jsx` | +6 / -3

---

### #72 `40be8290` — feat: Introduce public project discovery and theme management features

- **Hash**: `40be829067290f512de1e5048d9ec3757f568097`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-03 11:13:45 +0100
- **Type**: feat

> - Added Theme entity and CRUD operations in backend.
> - Implemented public endpoints for retrieving public projects.
> - Developed PublicDiscoveryPage.
> - Updated Project entity with isPublic and impactSummary fields.
> - Enhanced ProjectRepository for project visibility management.

**Files changed (22)**:
- `docs/GEBRUIKERSSCENARIOS_V1.md` | +353
- `projojo_backend/auth/jwt_middleware.py` | +6
- `projojo_backend/db/schema.tql` | +30 / -?
- `projojo_backend/db/seed.tql` | +211 / -?
- `projojo_backend/domain/models/__init__.py` | +3 / -?
- `projojo_backend/domain/models/project.py` | +2
- `projojo_backend/domain/models/theme.py` | +36
- `projojo_backend/domain/repositories/__init__.py` | +3 / -?
- `projojo_backend/domain/repositories/project_repository.py` | +190 / -?
- `projojo_backend/domain/repositories/theme_repository.py` | +210
- `projojo_backend/main.py` | +2
- `projojo_backend/routes/project_router.py` | +92 / -?
- `projojo_backend/routes/theme_router.py` | +111
- `projojo_frontend/src/App.jsx` | +7 / -?
- `projojo_frontend/src/components/DiscoverySection.jsx` | +383
- `projojo_frontend/src/components/ProjectDetails.jsx` | +214 / -?
- `projojo_frontend/src/components/PublicProjectCard.jsx` | +174
- `projojo_frontend/src/components/TemplateManager.jsx` | +206 / -?
- `projojo_frontend/src/pages/LandingPage.jsx` | +12 / -?
- `projojo_frontend/src/pages/PublicDiscoveryPage.jsx` | +566
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | +17
- `projojo_frontend/src/services.js` | +143

---

### #73 `ef5738d5` — feat: Add comprehensive user stories and ecosystem strategy documentation

- **Hash**: `ef5738d566f9d8248588f551c25aff65dcd82329`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 12:56:29 +0100
- **Type**: feat

> Introduced user stories for students, organizations, teachers. Added ecosystem strategy document. Renamed GEBRUIKERSSCENARIOS.md to V1 and added V2.

**Files changed (9)**:
- `docs/ECOSYSTEEM_STRATEGIE.md` | +1.027
- `docs/GEBRUIKERSSCENARIOS_V2.md` | +474
- `docs/ROADMAP.md` | +364
- `docs/USER_STORIES_DISCOVERY.md` | +223
- `docs/USER_STORIES_DOCENT.md` | +231
- `docs/USER_STORIES_ORGANISATIE.md` | +260
- `docs/USER_STORIES_PLATFORM.md` | +152
- `docs/USER_STORIES_STUDENT.md` | +200

(+ rename GEBRUIKERSSCENARIOS.md → GEBRUIKERSSCENARIOS_V1.md)

---

### #74 `a666e34c` — refactor: Remove subtask (deeltaken) feature from codebase

- **Hash**: `a666e34c7c83bf68036da54b446044e5c81fbcef`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 13:05:16 +0100
- **Type**: refactor

> Remove the entire subtask/deeltaken functionality as it is not needed for MVP.
> This includes:
> - Frontend: TaskSubtasks, SubtaskForm, TemplateManager components
> - Frontend: Subtask tab in Task.jsx, template manager in SupervisorDashboard
> - Frontend: All subtask API functions in services.js
> - Backend: subtask_router, subtask_repository, subtask model
> - Database: subtask and subtaskTemplate entities, relations, and attributes
> - Seed data: All subtask templates and example subtasks
>
> The feature was fully isolated and no other business rules are affected.
>
> Co-authored-by: Cursor <cursoragent@cursor.com>

**Files changed (14)**:
- `projojo_backend/db/schema.tql` | +55 / -?
- `projojo_backend/db/seed.tql` | -226
- `projojo_backend/domain/models/__init__.py` | -1
- `projojo_backend/domain/models/subtask.py` | -77
- `projojo_backend/domain/repositories/__init__.py` | -1
- `projojo_backend/domain/repositories/subtask_repository.py` | -487
- `projojo_backend/main.py` | -2
- `projojo_backend/routes/subtask_router.py` | -255
- `projojo_frontend/src/components/SubtaskForm.jsx` | -201
- `projojo_frontend/src/components/Task.jsx` | -28
- `projojo_frontend/src/components/TaskSubtasks.jsx` | -421
- `projojo_frontend/src/components/TemplateManager.jsx` | -274
- `projojo_frontend/src/pages/SupervisorDashboard.jsx` | -17
- `projojo_frontend/src/services.js` | -140

**Totaal**: 14 files, +3 insertions, -2.182 deletions

---

### #75 `77f11398` — feat: Add AI coding guidelines documentation for Projojo project

- **Hash**: `77f11398c7f7fbfe3b904fa6f64086f882b01672`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 13:54:58 +0100
- **Type**: feat

> Introduced comprehensive AGENTS.md with AI coding guidelines, project context, tech stack, design principles, accessibility requirements, animation guidelines, backend guidelines, code organization, and dos/donts.

**Files changed (1)**:
- `AGENTS.md` | +140

---

### #76 `a0a0fdca` — refactor: Remove .cursorrules file and update UI components for consistency

- **Hash**: `a0a0fdcaf8051139ef45854f475911071380bfa7`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 13:55:12 +0100
- **Type**: refactor

> - Deleted .cursorrules file (replaced by AGENTS.md).
> - Updated CSS: replaced stormy teal with coral primary for skill badges/pills.
> - Refactored BusinessCard, OverviewMap, ProjectCard, Task for new status badge styles.

**Files changed (6)**:
- `.cursorrules` | -127
- `projojo_frontend/src/components/BusinessCard.jsx` | +79 / -?
- `projojo_frontend/src/components/OverviewMap.jsx` | +4 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +4 / -?
- `projojo_frontend/src/components/Task.jsx` | +87 / -?
- `projojo_frontend/src/index.css` | +98 / -?

---

### #77 `4cb824ea` — feat: Enhance LocationMap and OverviewMap with expandable functionality

- **Hash**: `4cb824eaf047cd16c14db76fb746201570d25336`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 15:43:30 +0100
- **Type**: feat

> - Added expandable height feature to LocationMap and OverviewMap.
> - Implemented resize handler for expansion/collapse.
> - Updated component props for expandable functionality.
> - Introduced scroll behavior for expanded maps.

**Files changed (4)**:
- `projojo_frontend/src/components/LocationMap.jsx` | +74 / -?
- `projojo_frontend/src/components/OverviewMap.jsx` | +82 / -?
- `projojo_frontend/src/pages/BusinessPage.jsx` | -16
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +237 / -?

---

### #78 `edf24ecf` — feat: Update OverviewMap and LandingPage for improved navigation

- **Hash**: `edf24ecff564ddc507e6c4db7b67a9422bfb0713`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 16:21:52 +0100
- **Type**: feat

> - Enhanced OverviewMap with dynamic link property.
> - Modified LandingPage for improved text visibility and responsiveness.

**Files changed (3)**:
- `projojo_frontend/src/components/OverviewMap.jsx` | +2 / -1
- `projojo_frontend/src/pages/LandingPage.jsx` | +5 / -2
- `projojo_frontend/src/pages/PublicDiscoveryPage.jsx` | +27 / -?

---

### #79 `4529305d` — feat: Integrate StudentWorkContext for enhanced work registration management

- **Hash**: `4529305df17491d48007b3d6cb7026d3026f2d2b`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 16:41:02 +0100
- **Type**: feat

> - Added StudentWorkProvider for managing work registrations across the app.
> - Updated components to utilize new context for work status and filtering.
> - Implemented badges for active and pending work registrations.
> - Enhanced filtering to show only work-related businesses.

**Files changed (7)**:
- `projojo_frontend/src/App.jsx` | +3
- `projojo_frontend/src/components/BusinessCard.jsx` | +22 / -?
- `projojo_frontend/src/components/Filter.jsx` | +40 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +18
- `projojo_frontend/src/components/Task.jsx` | +18
- `projojo_frontend/src/context/StudentWorkContext.jsx` | +171
- `projojo_frontend/src/pages/OverviewPage.jsx` | +14 / -?

---

### #80 `8759f8b7` — feat: Enhance notification system with progress bar and success messages

- **Hash**: `8759f8b72d64365ad3e50384646073132e161d8f`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-05 16:53:22 +0100
- **Type**: feat

> - Integrated progress bar in Notification component.
> - Updated notification styles with icons and titles for different types.
> - Added success message in Task component upon registration.
> - Centralized notification duration constant.
> - Updated LandingPage footer text.

**Files changed (4)**:
- `projojo_frontend/src/components/Task.jsx` | +2
- `projojo_frontend/src/components/notifications/Notification.jsx` | +161 / -?
- `projojo_frontend/src/components/notifications/NotifySystem.jsx` | +2 / -1
- `projojo_frontend/src/pages/LandingPage.jsx` | +2 / -1

---

### #81 `78e1ded8` — feat: Add City Deal initiative data to seed file

- **Hash**: `78e1ded8c40d3e0ea66654edf2e1ccc08da9878f`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-06 10:31:46 +0100
- **Type**: feat

> - Introduced comprehensive dataset for City Deal initiative.
> - Defined relationships between business, projects, and tasks.
> - Enhanced seed file with detailed descriptions, timelines, and requirements.

**Files changed (1)**:
- `projojo_backend/db/seed.tql` | +311

---

### #82 `44bb8ae7` — feat: Add Breadcrumb component and integrate into Business and Project Details pages

- **Hash**: `44bb8ae72682c56dcb78ef3d585c5da02ee0f6af`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-09 12:14:57 +0100
- **Type**: feat

> - Introduced Breadcrumb component for improved navigation.
> - Integrated into BusinessPage and ProjectDetailsPage.
> - Updated Navbar with project discovery options for students/teachers.
> - Added Skeleton components for loading states.
> - Implemented useBookmarks hook.

**Files changed (12)**:
- `projojo_frontend/src/components/Breadcrumb.jsx` | +52
- `projojo_frontend/src/components/Navbar.jsx` | +4 / -?
- `projojo_frontend/src/components/ProjectDetails.jsx` | +52 / -?
- `projojo_frontend/src/components/SkeletonCard.jsx` | +59
- `projojo_frontend/src/components/SkeletonList.jsx` | +24
- `projojo_frontend/src/components/SkeletonOverview.jsx` | +51
- `projojo_frontend/src/hooks/useBookmarks.js` | +53
- `projojo_frontend/src/pages/BusinessPage.jsx` | +7
- `projojo_frontend/src/pages/OverviewPage.jsx` | +5 / -?
- `projojo_frontend/src/pages/ProjectDetailsPage.jsx` | +8
- `projojo_frontend/src/pages/StudentDashboard.jsx` | +253 / -?
- `projojo_frontend/src/pages/TeacherPage.jsx` | +3 / -?

---

### #83 `468e1e3a` — next-ui branch analysis

- **Hash**: `468e1e3a712a87e5c209f901cf0a944392f279db`
- **Author**: Stijn Appeldoorn <102795120+stijnapp@users.noreply.github.com>
- **Date**: 2026-02-12 18:57:33 +0100
- **Type**: overig

**Files changed (1)**:
- `docs/NEXT-UI-BRANCH-ANALYSIS.md` | +249

---

### #84 `730ee149` — feat: Revamp DiscoverySection and related components

- **Hash**: `730ee149999361931c5834d69e35c015cf4be6ae`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-12 20:04:46 +0100
- **Type**: feat

> - Replaced Loading with SkeletonList in DiscoverySection.
> - Enhanced DiscoverySection layout for compact design.
> - Introduced filtering by themes and status in OverviewPage.
> - Updated ProjectCard and PublicProjectCard for archived projects.
> - Refactored Filter for new filtering options.

**Files changed (9)**:
- `projojo_frontend/src/components/DiscoverySection.jsx` | +366 / -?
- `projojo_frontend/src/components/Filter.jsx` | +904 / -?
- `projojo_frontend/src/components/ProjectCard.jsx` | +23 / -?
- `projojo_frontend/src/components/ProjectDashboard.jsx` | +23 / -?
- `projojo_frontend/src/components/PublicProjectCard.jsx` | +171 / -?
- `projojo_frontend/src/pages/LandingPage.jsx` | +3 / -?
- `projojo_frontend/src/pages/OverviewPage.jsx` | +124 / -?
- `projojo_frontend/src/pages/ProjectDetailsPage.jsx` | +14 / -?
- `projojo_frontend/src/pages/PublicDiscoveryPage.jsx` | +635 / -?

---

### #85 `bca07557` — feat: Introduce UX Designer skill with comprehensive design guidance

- **Hash**: `bca075578ef3e9f48ba6840f61f7835fe2aff405`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-12 20:05:34 +0100
- **Type**: feat

> - Added ACCESSIBILITY.md, README.md, RESPONSIVE-DESIGN.md, SKILL.md for UX Designer skill.
> - Created additional AI agent skill configurations.

**Files changed (13)**:
- `.agents/skills/agenticsorg-ux-designer/ACCESSIBILITY.md` | +825
- `.agents/skills/agenticsorg-ux-designer/README.md` | +248
- `.agents/skills/agenticsorg-ux-designer/RESPONSIVE-DESIGN.md` | +599
- `.agents/skills/agenticsorg-ux-designer/SKILL.md` | +497
- `.agents/skills/anthropics-frontend-design/SKILL.md` | +42
- `.agents/skills/code-yeongyu-frontend-ui-ux/SKILL.md` | +78
- `.agents/skills/nextlevelbuilder-ui-ux-pro-max/SKILL.md` | +386
- `.agents/skills/nextlevelbuilder-ui-ux-pro-max/data` | +1
- `.agents/skills/nextlevelbuilder-ui-ux-pro-max/scripts` | +1
- `.cursor/skills/agenticsorg-ux-designer` | +1
- `.cursor/skills/anthropics-frontend-design` | +1
- `.cursor/skills/code-yeongyu-frontend-ui-ux` | +1
- `.cursor/skills/nextlevelbuilder-ui-ux-pro-max` | +1

**Totaal**: 13 files, +2.681 insertions

---

### #86 `a6ae5612` — fix: Adjust LoginPage layout for improved responsiveness

- **Hash**: `a6ae5612a30b1c7241c9c8739bfd624ccf8b0c64`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-12 20:07:08 +0100
- **Type**: fix

> Updated max width of neu-card-lg on LoginPage for larger screens.

**Files changed (1)**:
- `projojo_frontend/src/pages/LoginPage.jsx` | +1 / -1

---

### #87 `89efc9d4` — feat: Refactor TestUserSelector and LoginPage for improved user experience

- **Hash**: `89efc9d47fdfff9eda6010164f1901ff1033b247`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-12 20:16:21 +0100
- **Type**: feat

> - Simplified TestUserSelector by removing unused state variables.
> - Implemented role-based user selection with role tabs.
> - Enhanced LoginPage layout for visual hierarchy and responsiveness.
> - Updated notification messages and button labels.

**Files changed (2)**:
- `projojo_frontend/src/components/TestUserSelector.jsx` | +300 / -?
- `projojo_frontend/src/pages/LoginPage.jsx` | +61 / -?

---

### #88 `1894eb3d` — Merge branch 'next-ui' of https://github.com/HAN-AIM-CMD-WG/Projojo into next-ui

- **Hash**: `1894eb3d2ae017dae1e0ff28bc495204b8de5857`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-12 20:16:24 +0100
- **Type**: merge

**Files**: (merge commit, geen eigen wijzigingen)

---

### #89 `82ea9d5b` — fix/feat: Add project end date handling in PortfolioRepository

- **Hash**: `82ea9d5b5d81b5b68455b068824b06ff3cdde402`
- **Author**: WouterNordsiek <106081189+WouterNordsiek@users.noreply.github.com>
- **Date**: 2026-02-12 20:23:42 +0100
- **Type**: fix/feat

> - Introduced static method to check if a date is in the past.
> - Updated PortfolioRepository to include project end date in snapshot creation.
> - Refactored is_archived logic to utilize new date check.

**Files changed (1)**:
- `projojo_backend/domain/repositories/portfolio_repository.py` | +33 / -2

---

## 5. Gecorrigeerde Risico-analyse

### Correctie t.o.v. NEXT-UI-BRANCH-ANALYSIS.md

De originele analyse (commit #83) vermeldt 18 bestanden die **NIET in de daadwerkelijke diff** voorkomen. Deze zijn waarschijnlijk gewijzigd in beide branches of de vergelijking was tegen een andere staat:

| Bestand uit analyse | Status in diff |
|---------------------|---------------|
| `email_service.py` | Niet aanwezig |
| `image_service.py` | Niet aanwezig |
| `LoadingSpinner.jsx` | Niet aanwezig |
| `.prettierrc` | Niet aanwezig |
| `neumorphic-design-system.md` | Niet aanwezig |
| `permissions.py` | Niet aanwezig |
| `jwt_utils.py` | Niet aanwezig |
| `oauth_config.py` | Niet aanwezig |
| `config/settings.py` | Niet aanwezig |
| `useThemes.js` | Niet aanwezig |
| `Dockerfile` (frontend) | Niet aanwezig |
| `Dockerfile` (backend) | Niet aanwezig |
| `docker-compose.yml` | Niet aanwezig |
| `docker-compose.base.yml` | Niet aanwezig |
| `docker-compose.preview.yml` | Niet aanwezig |
| `.env.example` | Niet aanwezig |
| `invite_repository.py` | Niet aanwezig |
| `user.py` (model) | Niet aanwezig |

Dit betekent dat de Category 3 risico's (Backend/Infrastructure) **significant kleiner** zijn dan de analyse suggereert. Er zijn geen wijzigingen in auth/config, Docker, of infrastructure bestanden.

### Gecorrigeerde Category 1: Safe to Merge

| Bestand | Type | Reden |
|---------|------|-------|
| `projojo_frontend/src/index.css` | M | Puur CSS, geen backend impact |
| `projojo_frontend/src/DESIGN_SYSTEM.md` | A | Documentatie |
| `AGENTS.md` | A | AI guidelines |
| `README.md` | M | Documentatie |
| Alle `docs/*.md` bestanden (12) | A | Documentatie |
| `.agents/skills/*` (9 files) | A | AI agent skills, geen code impact |
| `.cursor/skills/*` (4 files) | A | Symlinks voor skills |
| `.gitignore` | M | Config |
| `design-planning/Gemini_Designs/businesscards.html` | A | Design reference |
| `.cursorrules` | D | Vervangen door AGENTS.md |
| `projojo_frontend/src/context/ThemeContext.jsx` | A | Dark mode, localStorage only |
| `projojo_frontend/src/components/ThemeToggle.jsx` | A | Dark mode toggle, geen API calls |
| `projojo_frontend/src/components/Alert.jsx` | M | Styling update |
| `projojo_frontend/src/components/Breadcrumb.jsx` | A | Visual navigatie |
| `projojo_frontend/src/components/DragDrop.jsx` | M | Visual refinement |
| `projojo_frontend/src/components/FilterChip.jsx` | A | Pure presentational |
| `projojo_frontend/src/components/Footer.jsx` | M | Visual update |
| `projojo_frontend/src/components/SkeletonCard.jsx` | A | Loading skeleton |
| `projojo_frontend/src/components/SkeletonList.jsx` | A | Loading skeleton |
| `projojo_frontend/src/components/SkeletonOverview.jsx` | A | Loading skeleton |
| `projojo_frontend/src/components/LocationMap.jsx` | A | Bestaande data, client-side geocoding |
| `projojo_frontend/src/components/OverviewMap.jsx` | A | Bestaande data, client-side geocoding |
| `projojo_frontend/src/utils/dates.js` | A | Pure utility functions |
| `projojo_frontend/index.html` | M | Fonts + icons CDN |
| `projojo_frontend/package.json` | M | Leaflet dependencies |
| `projojo_frontend/package-lock.json` | M | Lock file update |

### Gecorrigeerde Category 2: Needs Review

Frontend-only maar verifieer werking met bestaande backend:
- Nieuwe pages: DesignDemoPage, StudentDashboard, SupervisorDashboard, LandingPage, PublicDiscoveryPage
- Context providers: StudentSkillsContext, StudentWorkContext
- Hooks: useBookmarks
- Routing wijzigingen in App.jsx
- Alle gewijzigde components met mixed styling + logic changes

### Gecorrigeerde Category 3: Backend Changes

Daadwerkelijk aanwezige backend wijzigingen (kleiner dan origineel gesuggereerd):
- Schema: `schema.tql` (+74), `seed.tql` (+963)
- Models: `business.py`, `project.py`, `task.py`, `theme.py` (nieuw)
- Repositories: `business_repository.py`, `portfolio_repository.py` (nieuw), `project_repository.py`, `skill_repository.py`, `task_repository.py`, `theme_repository.py` (nieuw), `user_repository.py`
- Routes: `business_router.py`, `project_router.py`, `student_router.py`, `supervisor_router.py`, `task_router.py`, `theme_router.py` (nieuw)
- Services: `notification_service.py` (nieuw), `task_service.py`
- Auth: `jwt_middleware.py` (+6 regels, minimaal)

---

## 6. Aanbevolen Merge-strategie

### Doel
Merge naar **nieuwe branch `merge-fase-1` van `main`** (niet direct main).

### Phase 1: Safe (geen review nodig)
Cherry-pick ~47 bestanden die puur styling, documentatie, of visuele componenten zijn zonder backend dependencies. Zie Category 1 hierboven.

### Phase 2: Frontend review (team review)
- Nieuwe pages en hun routing
- Context providers en hooks
- Gewijzigde components met mixed changes
- Terminologie wijzigingen

### Phase 3: Backend (volledige team review)
- Schema wijzigingen (vereist database reset/migratie)
- Nieuwe en gewijzigde repositories
- Route wijzigingen
- Service toevoegingen

### Open vragen voor team
1. Is de `InvitePage` verwijdering gewenst? (niet meer in routing)
2. Is de Landing Page als default route (`/`) gewenst i.p.v. Login?
3. Moet de DesignDemoPage (`/design-demo`) in productie blijven?
4. Is de terminologie wijziging bedrijf → organisatie afgestemd met alle stakeholders?
