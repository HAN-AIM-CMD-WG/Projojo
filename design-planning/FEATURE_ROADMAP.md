# 🚀 Projojo Feature Roadmap & Tracking

**Centrale documentatie voor alle features, versies en voortgang**

> 📋 **Development Guidelines**: See `/.cursorrules` for complete design standards, coding conventions, and workflow requirements.

---

## 📋 Project Overview

- **Repository**: [HAN-AIM-CMD-WG/Projojo](https://github.com/HAN-AIM-CMD-WG/Projojo)
- **Demo**: https://projojo.dp.demopreview.nl/
- **Timeline**: September - December 2024
- **Current Version**: Dashboard V9 (Realistische Student Dashboard - MVP)

---

## 🎯 Core Vision

Projojo is een educatief project management platform dat bedrijven, studenten, supervisors en docenten verbindt in een autonoom ecosysteem.

---

## 📊 Dashboard Evolution

### ✅ V1 (Baseline - Current Demo)
- Basic TailwindCSS components
- Standard project listings
- Simple user authentication
- Basic task management

### ✅ V2 (Neumorphic Foundation)
- Neumorphic design system implementation
- HAN branding integration
- Real asset integration (logos, images)
- Responsive grid layouts
- Accessible focus states

### ✅ V3 (Enhanced UX)
- **Advanced search popup** with overlay
- Interactive dashboard widgets
- Enhanced hover effects and animations
- Quick action buttons
- Real-time activity feed
- Mobile-optimized interactions

### ✅ V4 (Advanced Personalization)
- **Role-based personalization** (Student focus)
- **Customizable widget system**
- **Achievement & gamification** system
- **Learning path visualization**
- **Enhanced task management** with priorities
- **Fixed search popup positioning**
- **Smart recommendations** with AI matching

### ✅ V5 (Active Task Indicators)
- **Subtle activity indicators** for active tasks
- **Professional pulse animations** on working elements
- **Priority color coding** (high=red, medium=orange, low=green)
- **Real-time activity timestamps**
- **Working status badges** with consistent styling
- **Enhanced progress bars** with flow animations
- **Maintained V4 personalization** features

### ✅ V6 (Comprehensive Student Features)
- **Task Registration Hub** - Complete status tracking & management
- **Smart Project Matching** - AI-powered skill compatibility scoring
- **Progress Analytics** - Performance metrics, trends & insights
- **Achievement System** - Gamification with earned/locked badges
- **Smart Notification Center** - Prioritized alerts with actions
- **Portfolio Builder** - Automated CV/portfolio generation
- **Collaboration & Networking** - Team connections & study groups
- **Extensive Info System** - Every feature explained with tooltips
- **Crystal Clear UX** - Designed for first-time student users

### ✅ V7 (Enhanced Kanban & Collapsible Sections)
- **Full-width Kanban board** - Mobile-responsive task management
- **Drag & drop functionality** - Intuitive task organization
- **Collapsible footer widgets** - Portfolio, Analytics, Networking
- **Enhanced mobile experience** - Stacked columns on mobile devices

### ✅ V8 (Kanban Task Management)
- **Complete Kanban system** - To Do, In Progress, Review, Done columns
- **Task creation modal** - Add new tasks with priorities
- **Visual task states** - Active, pending, completed indicators
- **Mobile-optimized Kanban** - Responsive column layouts

### ✅ V9 (Realistische Student Dashboard) - CURRENT MVP
**Focus: Essentiële functionaliteit voor eerste prototype**

#### Core Features (User Story Based):
- **Lopende Projecten Overzicht** - Gegroepeerd per bedrijf met voortgang
- **Sollicitaties Tracking** - Status van uitstaande sollicitaties
- **Slimme Matches** - Projecten die passen bij student skills
- **Geïntegreerde Zoekfunctie** - Quick access naar zoekpagina
- **Profiel Samenvatting** - Stats, skills en edit functionaliteit

#### Design Principes V9:
- **Clean & Focused** - Alleen essentiële features, geen overbodige widgets
- **Modern Top Navigation** - Zoekbalk, notificaties, profiel in header
- **Neumorphic Design** - Consistent met design system
- **Mobile-First** - Responsive layout voor alle schermformaten
- **Accessibility First** - Keyboard navigatie, reduced motion support

#### UX Improvements:
- Primary action button "Zoek Projecten" prominent zichtbaar
- Match percentages voor sollicitaties en aanbevelingen
- Progress bars bij actieve projecten
- Status badges (Actief, In Review, In behandeling)
- Notificatie badges voor nieuwe items

#### What's NOT in V9 (Future Iterations):
- Kanban board (V7/V8 feature - te complex voor MVP)
- Achievement system (gamification later toevoegen)
- Analytics dashboard (nice-to-have)
- Portfolio builder (advanced feature)
- Collaboration tools (phase 2)

---

## 🔄 Current Development Status

### ✅ COMPLETED Features

#### Design & UX
- [x] Neumorphic design system
- [x] Stable search popup (no more jumping)
- [x] Student-focused dashboard personalization
- [x] Widget customization system
- [x] Achievement badges and progress tracking
- [x] Learning path visualization
- [x] Enhanced task cards with metadata

#### Search & Discovery
- [x] Advanced search popup with instant results
- [x] Skill-based filtering
- [x] Smart project recommendations
- [x] Match percentage indicators

### 🔄 IN PROGRESS Features

#### Core Dashboard
- [ ] Business dashboard variant
- [ ] Role-switching functionality
- [ ] Advanced widget drag & drop
- [ ] Custom widget creation

#### Search Enhancement
- [x] Restore V3 search features to V4
- [ ] Advanced filtering options
- [ ] Search history and saved searches
- [ ] Real-time search suggestions

### 📅 PLANNED Features

#### Role-Based Dashboards
- [ ] **Business Dashboard**
  - Project submission workflow
  - Team management interface
  - Progress tracking and analytics
  - Budget and timeline management
  
- [ ] **Supervisor Dashboard**
  - Project approval workflow
  - Student progress monitoring
  - Quality assurance tools
  - Feedback and review system
  
- [ ] **Teacher Dashboard**
  - Competency mapping
  - Educational content linking
  - Assessment and grading
  - Learning outcome tracking

#### Workflow Automation
- [ ] **Project Submission Wizard** (Business)
- [ ] **Multi-stakeholder Approval Chain**
- [ ] **Competency Assessment System**
- [ ] **LLM Integration** for content analysis
- [ ] **Smart Matching Algorithm**

#### Advanced Features
- [ ] **Real-time Collaboration**
- [ ] **Notification System**
- [ ] **Mobile App (PWA)**
- [ ] **Offline-first Functionality**
- [ ] **Analytics Dashboard**
- [ ] **API for Third-party Integration**

---

## 👥 User Stories & Acceptance Criteria

### 🎓 Student Features

#### Personal Dashboard
```
Als student wil ik mijn dashboard kunnen personaliseren
Zodat ik de informatie zie die voor mij relevant is

Acceptance Criteria:
- [ ] Widgets kunnen worden toegevoegd/verwijderd
- [ ] Layout kan worden aangepast via drag & drop
- [ ] Personalisatie wordt opgeslagen per gebruiker
- [ ] Reset naar standaard indeling mogelijk
```

#### Learning Path
```
Als student wil ik mijn leerpad visualiseren
Zodat ik mijn voortgang kan bijhouden

Acceptance Criteria:
- [x] Visuele weergave van competenties
- [x] Progress indicators per skill area
- [x] Achievement badges voor mijlpalen
- [ ] Aanbevelingen voor volgende stappen
```

#### Smart Search
```
Als student wil ik projecten kunnen zoeken die bij mijn skills passen
Zodat ik relevante kansen kan vinden

Acceptance Criteria:
- [x] Zoeken op skills, bedrijf, projecttype
- [x] Match percentage weergave
- [x] Instant search resultaten
- [ ] Geavanceerde filters (locatie, duur, niveau)
- [ ] Saved searches en alerts
```

### 💼 Business Features

#### Project Submission
```
Als bedrijf wil ik eenvoudig projecten kunnen indienen
Zodat studenten aan mijn projecten kunnen werken

Acceptance Criteria:
- [ ] Guided project submission wizard
- [ ] Template library voor project beschrijvingen
- [ ] Skill requirements matching
- [ ] Budget en timeline planning
- [ ] Attachment support voor documenten
```

#### Progress Tracking
```
Als bedrijf wil ik de voortgang van mijn projecten kunnen volgen
Zodat ik op de hoogte blijf van de status

Acceptance Criteria:
- [ ] Real-time progress dashboard
- [ ] Milestone tracking
- [ ] Student performance metrics
- [ ] Communication hub met studenten
- [ ] Deliverable management
```

---

## 🛠️ Technical Implementation

### Frontend Components
```
components/
├── dashboard/
│   ├── StudentDashboard.jsx          ✅
│   ├── BusinessDashboard.jsx         🔄
│   ├── SupervisorDashboard.jsx       📅
│   └── TeacherDashboard.jsx          📅
├── widgets/
│   ├── ProgressWidget.jsx            ✅
│   ├── LearningPathWidget.jsx        ✅
│   ├── TaskWidget.jsx                ✅
│   ├── RecommendationWidget.jsx      ✅
│   └── AchievementWidget.jsx         ✅
├── search/
│   ├── SearchPopup.jsx               ✅
│   ├── SearchFilters.jsx             🔄
│   └── SearchResults.jsx             ✅
└── common/
    ├── NeuroCard.jsx                 ✅
    ├── NeuroButton.jsx               ✅
    └── NeuroInput.jsx                ✅
```

### Backend API Endpoints
```
api/
├── /dashboard/student                ✅
├── /dashboard/business               📅
├── /search/projects                  ✅
├── /recommendations                  🔄
├── /achievements                     📅
├── /widgets/config                   📅
└── /projects/submit                  📅
```

---

## 🎨 Design System

### Color Palette
- **Primary**: #e50056 (HAN Brand)
- **Neumorphic**: #f0f0f3 background
- **Success**: #22bb33
- **Warning**: #f0ad4e
- **Error**: #bb2124

### Component Library
- [x] Neumorphic cards and buttons
- [x] Progress indicators
- [x] Skill badges
- [x] Achievement badges
- [x] Interactive widgets
- [ ] Form components
- [ ] Navigation components
- [ ] Modal systems

---

## 📈 Success Metrics

### User Engagement
- Dashboard customization usage rate
- Search query success rate
- Widget interaction frequency
- Time spent on platform

### Business Value
- Project submission completion rate
- Student-project match accuracy
- Supervisor approval efficiency
- Learning outcome achievement

---

## 🚧 Development Constraints

- **Active Dev Team**: Coordinate to avoid conflicts
- **December Deadline**: Focus on MVP features
- **Backend Integration**: Work with existing TypeDB structure
- **Mobile Responsiveness**: Maintain cross-device compatibility

---

## 📅 Next Actions

### Immediate (This Week)
1. ✅ Complete search feature restoration in V4
2. 🔄 Create Business dashboard variant
3. 📅 Design user stories for development handoff

### Short Term (2-3 Weeks)
1. Implement widget drag & drop functionality
2. Create role-switching mechanism
3. Build project submission wizard
4. Develop advanced search filters

### Medium Term (1-2 Months)
1. LLM integration for smart matching
2. Real-time collaboration features
3. Mobile PWA development
4. Analytics dashboard

---

## 🤝 Stakeholder Communication

### Development Team Handoff
- [ ] Technical specifications document
- [ ] API endpoint definitions
- [ ] Component documentation
- [ ] Testing requirements

### Design Review
- [ ] Accessibility audit
- [ ] Mobile responsiveness check
- [ ] Performance optimization
- [ ] Browser compatibility testing

---

## 🗂️ Business Archiving (Soft Delete) — V5

User Story (NL)
```
Als docent wil ik bedrijven kunnen archiveren en herstellen
Zodat bedrijven, hun projecten en taken uit het overzicht en de zoekfunctie verdwijnen en supervisors niet meer kunnen inloggen

Als supervisor wil ik mijn eigen bedrijf (en gerelateerde entiteiten) kunnen archiveren
Zodat ik het bedrijf en alle onderliggende items kan verbergen wanneer dat nodig is
```

Acceptatiecriteria
- Supervisor (SV):
  - Als het bedrijf wordt gearchiveerd, worden de supervisor-accounts van dat bedrijf ook gearchiveerd.
  - Gearchiveerde SV’s van dat bedrijf kunnen niet meer inloggen. (Huidige model is 1:1 business-supervisor; als in de toekomst multi-business SV’s bestaan, dan mag login alleen als er nog ten minste één niet-gearchiveerd bedrijf gelinkt is.)
  - Supervisor kan zijn eigen bedrijf archiveren (teacher kan dit ook); unarchive blijft teacher-only.
- Teacher:
  - In het bedrijvenoverzicht staat per bedrijf een knop om te archiveren.
  - Klik op archiveren toont een bevestigingsmodal.
  - Gearchiveerde bedrijven verschijnen onderaan in een uitklapbaar menu, enkel als er gearchiveerde bedrijven zijn.
  - Alleen teachers kunnen unarchiveren, via de teacher-pagina.
- Alle gebruikers:
  - Gearchiveerde bedrijven staan niet meer in overzichten en zijn niet vindbaar.
  - Bij archiveren worden ook projecten, taken en aanmeldingen gearchiveerd, en supervisors van het bedrijf.

Technische implementatie
- TypeDB schema: soft-delete via attributen archivedAt (datetime-tz) en archivedBy (string) op:
  - business, project, task, supervisor; relation registersForTask heeft ook archivedAt/archivedBy.
- Query default filtering:
  - Alle lijst/detaiI-leesqueries filteren standaard archived uit via:
    - not { $entity has archivedAt $ts; }
  - Teacher krijgt aparte endpoint(s) voor gearchiveerde bedrijven.
- Cascade archiveren (business → projects → tasks → supervisors → registrations) in één transactie-set, idempotent (zet alleen wanneer nog niet gezet).
- Unarchive (teacher-only) verwijdert archivedAt/archivedBy (cascade) via delete has.

Backend endpoints
- GET /businesses/basic → toont alleen actieve (default filter)
- GET /businesses/archived/basic (teacher-only) → toont gearchiveerde bedrijven
- POST /businesses/{business_id}/archive (role="supervisor", owner check; teacher mag ook)
- POST /businesses/{business_id}/unarchive (teacher-only)
- OAuth-login blokkade voor gearchiveerde supervisors: AuthService checkt archivedAt op supervisor bij callback; bij set → geen token.

Frontend (Teacher)
- services.js: getArchivedBusinessesBasic(), archiveBusiness(), unarchiveBusiness()
- TeacherPage.jsx:
  - Laadt actieve + gearchiveerde bedrijven; toont actieve normaal
  - “Gearchiveerde bedrijven” sectie is uitklapbaar, verschijnt alleen als er gearchiveerde zijn
- BusinessCard.jsx:
  - Archiveerknop (teacher of eigenaar-supervisor) met bevestigingsmodal
  - Unarchive-knop (alleen teacher) zichtbaar bij items in gearchiveerde sectie
- UX: modal verduidelijkt consequenties (SV’s kunnen niet meer inloggen).

Migratie/QA
- Geen harde migratie vereist; ontbreken van archivedAt impliceert actief.
- Verifiëren:
  - Archiveren van bedrijf verbergt bedrijf/proj/taken in alle normale lijsten/zoeken
  - SV-login geblokkeerd na archiveren
  - “Gearchiveerde bedrijven” verschijnt (teacher) en unarchive werkt
  - Legacy data blijft zichtbaar als actief (geen archivedAt aanwezig)

Openstaand/nice-to-have
- Project-/Task-niveau archive/unarchive endpoints (supervisor/teacher granulariteit).
- archivedReason (optioneel) en audit logging-relaties als later wenselijk.

*Last Updated: $(date)*
*Version: V4.0*
*Status: Active Development*
