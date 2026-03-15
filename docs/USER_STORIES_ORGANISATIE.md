# User Stories: Organisatie (Supervisor)

> User stories voor organisaties/opdrachtgevers: dashboard, projectbeheer, teambeheer, en geavanceerde samenwerkingsvormen.

---

## Epic: Dashboard & Navigatie

### ORG-001: Supervisor dashboard
**Als** Supervisor  
**Wil ik** een dashboard pagina  
**Zodat** ik snel mijn projecten kan bewaken

**Acceptatiecriteria:**
- [x] Overzicht van alle projecten van mijn bedrijf
- [x] Openstaande aanmeldingen met accept/reject
- [x] Actieve studenten overzicht
- [x] Statistieken (projecten, taken, aanmeldingen)
- [x] Snelle acties (nieuw project, etc.)

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `SupervisorDashboard.jsx` - volledige implementatie

---

### ORG-002: Projectenlijst op landing page
**Als** opdrachtgever  
**Wil ik** op de landing-page een lijst van mijn projecten zien  
**Zodat** ik naar de projectpagina's kan navigeren

**Acceptatiecriteria:**
- [x] Lijst met projectkaarten
- [x] Directe link naar projectdetails
- [x] Aantal taken en openstaande posities zichtbaar
- [x] Pending aanmeldingen indicator

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `SupervisorDashboard.jsx` - ProjectCard component

---

### ORG-003: Profiel aanpassen
**Als** Supervisor  
**Wil ik** de info op mijn profiel/bedrijfspagina kunnen aanpassen  
**Zodat** we aantrekkelijk zijn voor studenten

**Acceptatiecriteria:**
- [x] Bedrijfsnaam, beschrijving, logo bewerken
- [x] Locatie aanpassen
- [x] Sector en bedrijfsgrootte instellen
- [x] Website URL toevoegen

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `UpdateBusinessPage.jsx` - bedrijfsprofiel bewerken
- `BusinessPage.jsx` - profiel weergeven

---

## Epic: Teambeheer & Multi-Supervisor

### ORG-004: Meerdere supervisors per bedrijf
**Als** supervisor  
**Wil ik** dat collega's ook supervisor van mijn bedrijf kunnen zijn  
**Zodat** ik het niet allemaal alleen hoef te doen

**Acceptatiecriteria:**
- [ ] Collega's uitnodigen via email
- [ ] Meerdere supervisors kunnen projecten beheren
- [ ] Rechten per supervisor instelbaar (admin vs editor)
- [ ] Overzicht van alle supervisors van het bedrijf

**Status:** Niet geïmplementeerd (schema beperking)  
**Prioriteit:** Fase 2

**Technische blocker:**
```tql
# Huidige schema - 1:1 relatie
relation manages,
    relates supervisor @card(1),
    relates business @card(1),
```
Moet worden: `@card(1..)` voor meerdere supervisors

---

### ORG-005: MT-lid aanvragen goedkeuren
**Als** MT-lid (management team)  
**Wil ik** aanvragen van gebruikers om ook MT-lid in mijn bedrijf te worden kunnen zien en goed/afkeuren  
**Zodat** we controle houden over wie toegang heeft

**Acceptatiecriteria:**
- [ ] "Aanvragen" sectie in dashboard
- [ ] Aanvrager info en motivatie zichtbaar
- [ ] Goedkeuren/afwijzen met optionele boodschap
- [ ] Notificatie naar aanvrager

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

**Afhankelijkheid:** ORG-004 (multi-supervisor) moet eerst

---

## Epic: Reviews & Feedback (zie ook USER_STORIES_PORTFOLIO.md)

### ORG-006: Student reviewen (US-005)
**Als** supervisor  
**Wil ik** een student reviewen na taakafronding  
**Zodat** andere bedrijven weten hoe de samenwerking was

**Acceptatiecriteria:**
- [ ] Na statuswijziging naar "afgerond": review-formulier
- [ ] Sterren (1-5) + optionele tekst
- [ ] Review gekoppeld aan specifieke taak
- [ ] Review is niet later aan te passen

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

---

### ORG-007: Taak afronden (US-006)
**Als** supervisor  
**Wil ik** een taak als afgerond markeren  
**Zodat** de student credits krijgt en het in hun portfolio komt

**Acceptatiecriteria:**
- [ ] Knop "Markeer als afgerond" in taakdetails
- [ ] Bevestigingsdialoog
- [ ] Triggert review-flow (ORG-006)
- [ ] Student ontvangt notificatie

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

---

### ORG-008: Skill endorsement (US-003)
**Als** supervisor  
**Wil ik** skills van een student kunnen endorsen na taakafronding  
**Zodat** de student bewijs heeft van opgedane vaardigheden

**Acceptatiecriteria:**
- [ ] Na accepteren taakafronding: popup met skill endorsement
- [ ] Supervisor selecteert welke skills bevestigd worden
- [ ] Endorsed skills krijgen "verified" badge op studentprofiel
- [ ] Alleen taak-gerelateerde skills kunnen endorsed worden

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

---

## Epic: Geavanceerde Samenwerking

### ORG-009: Cross-company projecten
**Als** bedrijf  
**Wil ik** een project kunnen starten met studenten en medewerkers van andere bedrijven  
**Zodat** we in een complexe omgeving oplossingen kunnen onderzoeken vanuit verschillende thema's

**Acceptatiecriteria:**
- [ ] Project kan meerdere organisaties als "partner" hebben
- [ ] Elke partner kan eigen taken/supervisors toevoegen
- [ ] Gedeeld overzicht van alle partners
- [ ] Duidelijke verantwoordelijkheden per partner

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

**Technische implicaties:**
- Nieuwe relatie: `hasPartner (project, business)`
- Complexere autorisatie
- Multi-business dashboard view

---

### ORG-010: Hub/Holding projecten beheren
**Als** HUB/Holding/netwerk  
**Wil ik** een of meerdere projecten opstarten en beheren (in samenwerking met andere bedrijven/medewerkers)  
**Zodat** ik studenten kan werven met de juiste expertises

**Acceptatiecriteria:**
- [ ] "Holding" organisatietype met speciale rechten
- [ ] Kan projecten aanmaken namens dochterorganisaties
- [ ] Overzicht van alle onderliggende organisaties
- [ ] Gecombineerde statistieken

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

**Technische implicaties:**
- Nieuwe entity: `holding` of `network`
- Relatie: `parentOf (holding, business)`
- Hiërarchische autorisatie

---

### ORG-011: NGI Zero vraagstukken inbrengen
**Als** NGI Zero Project  
**Wil ik** eigen vraagstukken kunnen inbrengen  
**Zodat** anderen hieraan kunnen bijdragen

**Acceptatiecriteria:**
- [ ] Organisatie kan "open vraagstukken" plaatsen
- [ ] Vraagstuk is breder dan specifiek project
- [ ] Studenten/organisaties kunnen interest tonen
- [ ] Matchmaking naar concrete projecten

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

---

## Technische Vereisten

| Component | Wijziging | Prioriteit |
|-----------|-----------|------------|
| Schema | `manages` relatie naar `@card(1..)` | Fase 2 |
| Schema | `Review` entity toevoegen | Fase 2 |
| Schema | `hasPartner` relatie voor cross-company | Fase 3 |
| Schema | `Holding` entity + `parentOf` relatie | Fase 3 |
| `Task` model | `status` veld: pending/active/completed | Fase 2 |
| API | `POST /tasks/{id}/complete` | Fase 2 |
| API | `POST /reviews` | Fase 2 |
| UI | Multi-supervisor invite flow | Fase 2 |

---

## Prioriteit Overzicht

| Story | Prioriteit | Status |
|-------|------------|--------|
| ORG-001 | MVP | Geïmplementeerd |
| ORG-002 | MVP | Geïmplementeerd |
| ORG-003 | MVP | Geïmplementeerd |
| ORG-004 | Fase 2 | Niet geïmplementeerd |
| ORG-005 | Fase 2 | Niet geïmplementeerd |
| ORG-006 | Fase 2 | Niet geïmplementeerd |
| ORG-007 | Fase 2 | Niet geïmplementeerd |
| ORG-008 | Fase 2 | Niet geïmplementeerd |
| ORG-009 | Fase 3 | Niet geïmplementeerd |
| ORG-010 | Fase 3 | Niet geïmplementeerd |
| ORG-011 | Fase 3 | Niet geïmplementeerd |

---

## Gerelateerde Documentatie

- [User Stories Portfolio](./USER_STORIES_PORTFOLIO.md) - Review stories
- [Gebruikersscenario's v2](./GEBRUIKERSSCENARIOS_V2.md)
- [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md)
