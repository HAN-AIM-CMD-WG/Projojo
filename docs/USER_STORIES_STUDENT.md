# User Stories: Student

> User stories voor studenten: dashboard, projecten zoeken, skills, portfolio, en betaald werk.

---

## Epic: Student Dashboard & Navigatie

### STU-001: Dashboard met project/taak status
**Als** student  
**Wil ik** een dashboard/home pagina  
**Zodat** ik meteen na het inloggen de status zie van projecten/taken waar ik bij betrokken ben

**Acceptatiecriteria:**
- [x] Overzicht actieve taken (geaccepteerd, niet voltooid)
- [x] Pending aanmeldingen met status
- [x] Snelle statistieken (actief, voltooid, etc.)
- [x] Links naar profiel en ontdekken
- [ ] Notificaties van nieuwe berichten/updates

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `StudentDashboard.jsx` - volledige implementatie

---

### STU-002: Taak vinden bij expertise/interesse
**Als** student  
**Wil ik** een taak kunnen vinden die bij mijn expertise of interesse past  
**Zodat** ik relevante praktijkervaring kan opdoen

**Acceptatiecriteria:**
- [x] Filteren op skills
- [x] Filteren op locatie
- [x] Filteren op thema/interesse
- [x] Match-indicator (hoeveel skills matchen)
- [x] Zoeken op naam/beschrijving

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `OverviewPage.jsx` - filtering en zoeken
- `ProjectCard.jsx` - match indicators

---

### STU-003: Competenties zichtbaar maken/delen
**Als** student  
**Wil ik** mijn competenties zichtbaar maken en delen  
**Zodat** ik aannemelijk kan maken een goede match te zijn met geschikt project

**Acceptatiecriteria:**
- [x] Skills toevoegen aan profiel
- [x] Beschrijving per skill
- [x] Skills zichtbaar op profielpagina
- [x] Matching met projectvereisten
- [ ] Verified/endorsed badge bij skills

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `ProfilePage.jsx` - skills weergave
- `SkillsEditor.jsx` - skills beheren

---

## Epic: Portfolio (zie ook USER_STORIES_PORTFOLIO.md)

### STU-004: Voltooide taken bekijken (US-001)
**Als** student  
**Wil ik** mijn voltooide taken zien op mijn profiel  
**Zodat** ik mijn werkervaring kan tonen aan potentiële werkgevers

**Acceptatiecriteria:**
- [ ] Lijst van afgeronde taken met projectnaam, bedrijf, en datum
- [ ] Taken gesorteerd op datum (nieuwste eerst)
- [ ] Link naar projectdetails
- [ ] Lege state wanneer nog geen taken afgerond

**Status:** Schema aanwezig, UI nog niet  
**Prioriteit:** Fase 2

---

### STU-005: Review ontvangen van organisatie (US-002)
**Als** student  
**Wil ik** een review ontvangen van het bedrijf na afronding  
**Zodat** ik feedback krijg en mijn portfolio waardevoller wordt

**Acceptatiecriteria:**
- [ ] Bedrijf kan sterren (1-5) geven
- [ ] Optionele tekstuele feedback
- [ ] Review zichtbaar op studentprofiel
- [ ] Gemiddelde score getoond

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

---

### STU-006: Portfolio delen (US-004)
**Als** student  
**Wil ik** mijn portfolio kunnen delen via een publieke link  
**Zodat** ik het kan toevoegen aan mijn CV of LinkedIn

**Acceptatiecriteria:**
- [ ] Publieke URL: `/portfolio/{student_id}`
- [ ] Geen login vereist om te bekijken
- [ ] Student kan zelf bepalen wat zichtbaar is (privacy toggle)
- [ ] Kopieer-link knop op eigen profiel

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

---

## Epic: Betaald Werk & Werkstudent

### STU-007: Expertise aanbieden als werkstudent
**Als** student  
**Wil ik** mijn expertise in studierichting kunnen aanbieden als werkstudent  
**Zodat** ik kan bijverdienen met geld of studiepunten en leerervaring opdoen

**Acceptatiecriteria:**
- [ ] "Beschikbaar voor betaald werk" toggle op profiel
- [ ] Uurtarief indicatie kunnen aangeven
- [ ] Beschikbaarheid (uren per week) instellen
- [ ] Projecten kunnen filteren op "betaald"
- [ ] Betalingsafspraken vastleggen bij acceptatie

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

**Technische implicaties:**
- Nieuw veld: `availableForPaidWork` op student entity
- Nieuw veld: `hourlyRate` (optioneel)
- Nieuw veld: `isPaid` op task/project entity
- Betalingsflow (buiten scope platform?)

---

## Epic: Internationaal

### STU-008: Internationale studenten ondersteunen
**Als** student uit Spanje of Brazilië  
**Wil ik** ook kunnen deelnemen aan projecten  
**Zodat** het platform niet beperkt is tot Nederlandse studenten

**Acceptatiecriteria:**
- [ ] Geen HAN-only restrictie in authenticatie
- [ ] Meertalige interface (NL/EN)
- [ ] Locatie-filter werkt internationaal
- [ ] Remote werk optie duidelijk zichtbaar

**Status:** Niet geblokkeerd (geen restrictie), interface alleen NL  
**Prioriteit:** Fase 2

**Huidige situatie:**
- Authenticatie via Microsoft eduID (werkt internationaal)
- Interface is alleen Nederlands
- Locaties zijn nu NL-provincies

---

## Technische Vereisten

| Component | Wijziging | Prioriteit |
|-----------|-----------|------------|
| `Student` model | `availableForPaidWork`, `hourlyRate` velden | Fase 2 |
| `Task` model | `isPaid`, `compensation` velden | Fase 2 |
| `Review` entity | Nieuwe entiteit in TypeDB schema | Fase 2 |
| `PortfolioPage` | Publieke portfolio pagina | Fase 2 |
| i18n | Meertalige ondersteuning | Fase 2 |

---

## Prioriteit Overzicht

| Story | Prioriteit | Status |
|-------|------------|--------|
| STU-001 | MVP | Geïmplementeerd |
| STU-002 | MVP | Geïmplementeerd |
| STU-003 | MVP | Geïmplementeerd |
| STU-004 | Fase 2 | Schema aanwezig |
| STU-005 | Fase 2 | Niet geïmplementeerd |
| STU-006 | Fase 2 | Niet geïmplementeerd |
| STU-007 | Fase 2 | Niet geïmplementeerd |
| STU-008 | Fase 2 | Deels |

---

## Gerelateerde Documentatie

- [User Stories Portfolio](./USER_STORIES_PORTFOLIO.md) - Originele portfolio stories
- [Gebruikersscenario's v2](./GEBRUIKERSSCENARIOS_V2.md)
- [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md)
