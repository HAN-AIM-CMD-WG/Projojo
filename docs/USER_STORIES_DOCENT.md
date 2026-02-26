# User Stories: Docent (Teacher)

> User stories voor docenten: profielbeheer, vraagstukken vinden, curriculum-koppeling, en geavanceerde rollen.

---

## Epic: Profiel & Voorstellen

### DOC-001: Profielpagina voor voorstellen
**Als** teacher  
**Wil ik** een profielpagina waarmee ik mij kan voorstellen aan anderen in het systeem  
**Zodat** studenten en organisaties weten wie ik ben

**Acceptatiecriteria:**
- [ ] Publieke profielpagina `/teacher/{id}`
- [ ] Foto, naam, functie, academie/opleiding
- [ ] Expertise gebieden
- [ ] Contactinformatie (optioneel)
- [ ] Overzicht van geadopteerde projecten

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

**Huidige situatie:**
- Teachers hebben geen publieke profielpagina
- Alleen `TeacherPage.jsx` voor beheer (niet publiek)

---

### DOC-002: Profiel aanpassen
**Als** teacher  
**Wil ik** de informatie van mijn profiel kunnen aanpassen  
**Zodat** mijn gegevens actueel blijven

**Acceptatiecriteria:**
- [ ] Bewerk pagina voor eigen profiel
- [ ] Foto uploaden
- [ ] Bio/beschrijving aanpassen
- [ ] Expertise gebieden selecteren
- [ ] Contactvoorkeuren instellen

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

---

## Epic: Vraagstukken & Onderwijs

### DOC-003: Vraagstukken vinden voor onderwijs
**Als** docent  
**Wil ik** vraagstukken kunnen vinden voor gebruik in mijn onderwijs  
**Zodat** studenten aan real life casussen kunnen werken

**Acceptatiecriteria:**
- [x] Browsen door alle projecten
- [x] Filteren op thema, locatie, status
- [x] Projectdetails bekijken
- [ ] "Geschikt voor onderwijs" markering
- [ ] Filter op curriculum-gekoppelde projecten

**Status:** Geïmplementeerd (basis browse functionaliteit)  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `TeacherPage.jsx` - overzicht alle projecten
- `OverviewPage.jsx` - filtering

---

### DOC-004: Project adopteren voor curriculum
**Als** docent  
**Wil ik** een project kunnen "adopteren" voor mijn curriculum  
**Zodat** studenten studiepunten kunnen verdienen

**Acceptatiecriteria:**
- [ ] "Adopteer voor vak X" knop bij projecten
- [ ] Koppeling aan vak/minor/opleiding
- [ ] Studiepunten toekennen
- [ ] Badge "Aanbevolen voor [Vak]" op project
- [ ] Notificatie naar organisatie

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

**Dit is Scenario C uit GEBRUIKERSSCENARIOS_V2.md**

---

### DOC-005: Opdrachtvraag plaatsen
**Als** docent  
**Wil ik** een "opdrachtvraag" kunnen plaatsen  
**Zodat** organisaties kunnen reageren met projectvoorstellen

**Acceptatiecriteria:**
- [ ] Formulier voor opdrachtvraag aanmaken
- [ ] Leerdoelen definiëren
- [ ] Eisen aan organisaties stellen
- [ ] Periode en omvang aangeven
- [ ] Organisaties kunnen reageren
- [ ] Review en goedkeuring van voorstellen

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 2

**Dit is Scenario A uit GEBRUIKERSSCENARIOS_V2.md**

---

## Epic: Rechten & Rollen

### DOC-006: Dezelfde rechten als supervisors
**Als** teacher  
**Wil ik** dezelfde rechten krijgen als Supervisors  
**Zodat** ik ook projecten kan beheren indien nodig

**Acceptatiecriteria:**
- [x] Alle projecten kunnen bekijken
- [x] Alle organisaties kunnen bekijken
- [ ] Projecten kunnen aanmaken (als supervisor)
- [ ] Taken kunnen beheren
- [ ] Aanmeldingen kunnen verwerken (voor eigen projecten)

**Status:** Deels geïmplementeerd (kan alles zien, niet beheren)  
**Prioriteit:** Fase 2

**Huidige situatie:**
- Teachers hebben read-access tot alles
- Kunnen geen projecten aanmaken voor organisaties
- Wel: organisaties aanmaken, skills beheren, thema's beheren

---

### DOC-007: Product owner rol in werkgroep
**Als** functie 'docent' van bedrijf 'HAN' van 'academie AIM'  
**Wil ik** de rol van 'product owner' vervullen binnen werkgroep 'Arnhem City Deal' in het project 'platform ontwikkeling'  
**Zodat** ik een project en team kan starten en inrichten

**Acceptatiecriteria:**
- [ ] Docent kan "werkgroep" aanmaken binnen project
- [ ] Werkgroep heeft eigen taken en teamleden
- [ ] Product owner rol met specifieke rechten
- [ ] Cross-organisatie werkgroepen mogelijk
- [ ] Rapportage per werkgroep

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

**Technische implicaties:**
- Nieuwe entity: `workgroup`
- Relaties: `hasWorkgroup (project, workgroup)`, `memberOf (user, workgroup)`
- Rollen binnen werkgroep: product owner, scrum master, team member

---

## Epic: Platform Beheer (Admin-taken)

### DOC-008: Skills beheren
**Als** teacher  
**Wil ik** de skills-bibliotheek kunnen beheren  
**Zodat** studenten relevante skills kunnen toevoegen

**Acceptatiecriteria:**
- [x] Lijst van alle skills bekijken
- [x] Nieuwe skills goedkeuren (pending → approved)
- [x] Skills bewerken (naam, beschrijving)
- [ ] Skills categoriseren
- [ ] Duplicate skills mergen

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `TeacherPage.jsx` - skills management sectie

---

### DOC-009: Thema's beheren
**Als** teacher  
**Wil ik** thema's/interesse-gebieden kunnen beheren  
**Zodat** projecten goed gecategoriseerd worden

**Acceptatiecriteria:**
- [x] Thema's aanmaken
- [x] Thema's bewerken (naam, beschrijving, SDG-code)
- [x] Thema's verwijderen
- [ ] Thema voorstellen van organisaties goedkeuren

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `TeacherPage.jsx` - themes management sectie

---

## Technische Vereisten

| Component | Wijziging | Prioriteit |
|-----------|-----------|------------|
| Schema | `teacherProfile` entity met extra velden | Fase 2 |
| Schema | `adoptedProject` relatie (teacher, project, course) | Fase 2 |
| Schema | `assignmentRequest` entity voor opdrachtvragen | Fase 2 |
| Schema | `workgroup` entity met rollen | Fase 3 |
| `TeacherProfilePage` | Nieuwe publieke profiel pagina | Fase 2 |
| `UpdateTeacherPage` | Profiel bewerk pagina | Fase 2 |
| `AdoptProjectModal` | Modal voor project adopteren | Fase 2 |
| API | `POST /projects/{id}/adopt` | Fase 2 |
| API | `POST /assignment-requests` | Fase 2 |

---

## Prioriteit Overzicht

| Story | Prioriteit | Status |
|-------|------------|--------|
| DOC-003 | MVP | Geïmplementeerd (basis) |
| DOC-008 | MVP | Geïmplementeerd |
| DOC-009 | MVP | Geïmplementeerd |
| DOC-001 | Fase 2 | Niet geïmplementeerd |
| DOC-002 | Fase 2 | Niet geïmplementeerd |
| DOC-004 | Fase 2 | Niet geïmplementeerd |
| DOC-005 | Fase 2 | Niet geïmplementeerd |
| DOC-006 | Fase 2 | Deels |
| DOC-007 | Fase 3 | Niet geïmplementeerd |

---

## Gerelateerde Documentatie

- [Gebruikersscenario's v2](./GEBRUIKERSSCENARIOS_V2.md) - Docent scenario's A, B, C
- [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md)
