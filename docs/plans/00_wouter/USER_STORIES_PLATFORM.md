# User Stories: Platform & Algemeen

> User stories voor platform-brede functionaliteit, admin features, en algemene gebruikerservaring.

---

## Epic: Platform Beheer (Admin)

### PLT-001: Platform activiteit inzicht
**Als** admin  
**Wil ik** inzicht hebben in activiteit op het projectplatform  
**Zodat** ik kan monitoren of het platform goed loopt

**Acceptatiecriteria:**
- [ ] Dashboard met actieve gebruikers (dag/week/maand)
- [ ] Overzicht van nieuwe projecten en aanmeldingen
- [ ] Statistieken: voltooide taken, actieve studenten, etc.
- [ ] Alerts bij ongebruikelijke activiteit

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

---

### PLT-002: Gebruikersrollen toewijzen
**Als** admin  
**Wil ik** een andere gebruiker de status "Opdrachtgever", "Deelnemer" of "Admin" kunnen geven  
**Zodat** er gebruikers kunnen zijn die projecten en klussen kunnen maken

**Acceptatiecriteria:**
- [ ] Gebruikerslijst met huidige rollen
- [ ] Dropdown om rol te wijzigen
- [ ] Bevestigingsmail naar gebruiker bij rolwijziging
- [ ] Audit log van rolwijzigingen

**Status:** Deels geïmplementeerd (Teacher kan supervisors uitnodigen)  
**Prioriteit:** Fase 2

**Huidige situatie:**
- Teachers kunnen invite keys genereren voor nieuwe supervisors
- Geen aparte admin rol; teachers fungeren als admins

---

## Epic: Algemene Gebruikerservaring

### PLT-003: Doorklikken naar profielen
**Als** ingelogde gebruiker  
**Wil ik** overal in de site waar een andere gebruiker ter sprake komt, kunnen doorklikken naar de profielpagina van die ander  
**Zodat** ik meer kan leren over mensen waarmee ik samenwerk

**Acceptatiecriteria:**
- [x] Studentnamen linken naar `/student/{id}`
- [x] Bedrijfsnamen linken naar `/business/{id}`
- [x] Consistente navigatie door hele applicatie
- [ ] Docent profielen linkbaar maken

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `SupervisorDashboard.jsx` - registration cards, active students
- `Task.jsx` - registration lists
- `Navbar.jsx` - avatar links

---

### PLT-004: Popover met basis details
**Als** ingelogde gebruiker  
**Wil ik** met een popover of tooltip snel wat basis details van een persoon kunnen inzien  
**Zodat** ik niet steeds naar profielpagina's hoef te navigeren

**Acceptatiecriteria:**
- [ ] Hover over gebruikersnaam toont popover
- [ ] Popover bevat: foto, naam, rol, top 3 skills
- [ ] Link naar volledig profiel in popover
- [ ] Snelle laadtijd (< 200ms)

**Status:** Niet geïmplementeerd  
**Prioriteit:** Nice-to-have

---

### PLT-005: Uitloggen
**Als** gebruiker  
**Wil ik** kunnen uitloggen  
**Zodat** de site niet gebruikt kan worden door anderen via mijn computer

**Acceptatiecriteria:**
- [x] Uitlog knop in navigatie
- [x] Token wordt verwijderd bij uitloggen
- [x] Redirect naar homepage na uitloggen
- [x] Sessie data wordt gewist

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `Navbar.jsx` - logout button
- `AuthProvider.jsx` - `handleLogout()` function

---

### PLT-006: Opdrachtgever-status aanvragen
**Als** gebruiker  
**Wil ik** opdrachtgever-status kunnen aanvragen  
**Zodat** ik projecten kan aanmaken voor mijn organisatie

**Acceptatiecriteria:**
- [ ] "Word opdrachtgever" knop zichtbaar voor ingelogde gebruikers
- [ ] Aanvraagformulier met organisatiegegevens
- [ ] Aanvraag komt bij admin/teacher ter goedkeuring
- [ ] Notificatie bij goed/afkeuring

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

**Huidige situatie:**
- Supervisors worden uitgenodigd via invite key van teacher
- Geen self-service aanvraag mogelijkheid

---

## Technische Vereisten

| Component | Wijziging | Prioriteit |
|-----------|-----------|------------|
| Schema | `admin` entity toevoegen (optioneel) | Fase 3 |
| `AdminDashboard` | Nieuwe pagina voor platform statistieken | Fase 3 |
| `UserPopover` | Nieuwe component voor hover details | Nice-to-have |
| API endpoint | `POST /users/request-supervisor` | Fase 2 |
| API endpoint | `GET /admin/statistics` | Fase 3 |

---

## Prioriteit Overzicht

| Story | Prioriteit | Status |
|-------|------------|--------|
| PLT-005 | MVP | Geïmplementeerd |
| PLT-003 | MVP | Geïmplementeerd |
| PLT-006 | Fase 2 | Niet geïmplementeerd |
| PLT-002 | Fase 2 | Deels |
| PLT-001 | Fase 3 | Niet geïmplementeerd |
| PLT-004 | Nice-to-have | Niet geïmplementeerd |

---

## Gerelateerde Documentatie

- [Gebruikersscenario's v2](./GEBRUIKERSSCENARIOS_V2.md)
- [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md)
