# User Stories: Portfolio Feature

> Eerste technische stap richting het Projojo ecosysteem.
> Zie ook: [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md)

---

## Epic: Student Portfolio

### US-001: Voltooide taken bekijken
**Als** student  
**Wil ik** mijn voltooide taken zien op mijn profiel  
**Zodat** ik mijn werkervaring kan tonen aan potentiële werkgevers

**Acceptatiecriteria:**
- [ ] Lijst van afgeronde taken met projectnaam, bedrijf, en datum
- [ ] Taken gesorteerd op datum (nieuwste eerst)
- [ ] Link naar projectdetails
- [ ] Lege state wanneer nog geen taken afgerond

---

### US-002: Bedrijfsreview ontvangen
**Als** student  
**Wil ik** een review ontvangen van het bedrijf na afronding  
**Zodat** ik feedback krijg en mijn portfolio waardevoller wordt

**Acceptatiecriteria:**
- [ ] Bedrijf kan sterren (1-5) geven
- [ ] Optionele tekstuele feedback
- [ ] Review zichtbaar op studentprofiel
- [ ] Gemiddelde score getoond

---

### US-003: Skill endorsement
**Als** supervisor  
**Wil ik** skills van een student kunnen endorsen na taakafronding  
**Zodat** de student bewijs heeft van opgedane vaardigheden

**Acceptatiecriteria:**
- [ ] Na accepteren taakafronding: popup met skill endorsement
- [ ] Supervisor selecteert welke skills bevestigd worden
- [ ] Endorsed skills krijgen "verified" badge op studentprofiel
- [ ] Alleen taak-gerelateerde skills kunnen endorsed worden

---

### US-004: Portfolio delen
**Als** student  
**Wil ik** mijn portfolio kunnen delen via een publieke link  
**Zodat** ik het kan toevoegen aan mijn CV of LinkedIn

**Acceptatiecriteria:**
- [ ] Publieke URL: `/portfolio/{student_id}`
- [ ] Geen login vereist om te bekijken
- [ ] Student kan zelf bepalen wat zichtbaar is (privacy toggle)
- [ ] Kopieer-link knop op eigen profiel

---

## Epic: Bedrijf Review Geven

### US-005: Student reviewen
**Als** supervisor  
**Wil ik** een student reviewen na taakafronding  
**Zodat** andere bedrijven weten hoe de samenwerking was

**Acceptatiecriteria:**
- [ ] Na statuswijziging naar "afgerond": review-formulier
- [ ] Sterren (1-5) + optionele tekst
- [ ] Review gekoppeld aan specifieke taak
- [ ] Review is niet later aan te passen

---

### US-006: Taak afronden
**Als** supervisor  
**Wil ik** een taak als afgerond markeren  
**Zodat** de student credits krijgt en het in hun portfolio komt

**Acceptatiecriteria:**
- [ ] Knop "Markeer als afgerond" in supervisor dashboard
- [ ] Bevestigingsdialoog
- [ ] Triggert review-flow (US-005)
- [ ] Student ontvangt notificatie

---

## Technische Vereisten

| Component | Wijziging |
|-----------|-----------|
| `Task` model | `status` veld toevoegen (`pending` / `active` / `completed`) |
| `Review` entity | Nieuwe entiteit in TypeDB schema |
| `StudentProfile` | Sectie "Voltooide Projecten" toevoegen |
| `SupervisorDashboard` | "Markeer afgerond" actie toevoegen |
| API endpoints | `POST /tasks/{id}/complete`, `POST /reviews`, `GET /portfolio/{id}` |

---

## Prioriteit

| Story | Prioriteit | Reden |
|-------|------------|-------|
| US-006 | Must Have | Basis voor alles: taak afronden |
| US-001 | Must Have | Kernfunctionaliteit portfolio |
| US-005 | Should Have | Voegt waarde toe aan portfolio |
| US-002 | Should Have | Student feedback |
| US-003 | Could Have | Extra laag verificatie |
| US-004 | Could Have | Pas relevant bij voldoende content |
