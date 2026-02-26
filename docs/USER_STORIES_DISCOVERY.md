# User Stories: Discovery (Publiek/Visitor)

> User stories voor publieke bezoekers en discovery functionaliteit: kaartweergave, filteren, en toekomstige burger/expert rollen.

---

## Epic: Kaart & Geo-visualisatie

### DIS-001: Kaart met projecten in de buurt
**Als** visitor  
**Wil ik** op een kaart zien welke projecten er (in mijn buurt) lopen  
**Zodat** ik me kan informeren of een bijdrage kan leveren

**Acceptatiecriteria:**
- [x] Interactieve kaart met projectlocaties
- [x] Markers tonen projecten
- [x] Klikken op marker toont project info
- [x] Clustering bij veel markers
- [x] Dark/light mode ondersteuning

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `OverviewMap.jsx` - multi-locatie kaart met clustering
- `LocationMap.jsx` - enkele locatie weergave

---

### DIS-002: Geo-verkenning (plattegrond)
**Als** functie 'visitor'  
**Wil ik** via een plattegrond/kaart kunnen verkennen op projecten in de regio maar ook daarbuiten  
**Zodat** ik kan zien wat er speelt

**Acceptatiecriteria:**
- [x] Volledig scherm kaartweergave
- [x] Pan en zoom functionaliteit
- [x] Projecten, bedrijven zichtbaar op kaart
- [ ] Personen/werkgroepen met geodata (optioneel)
- [x] Locatie-gebaseerd filteren

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `OverviewMap.jsx` - met OpenStreetMap integratie
- Geocoding via Nominatim

---

## Epic: Filteren & Zoeken

### DIS-003: Filteren op thema, skill, sector
**Als** persoon/visitor  
**Wil ik** projecten kunnen filteren op thema, skill, sector, zwaartepunt, etc.  
**Zodat** ik relevante projecten kan vinden

**Acceptatiecriteria:**
- [x] Filter op thema (Duurzaamheid, Klimaat, etc.)
- [x] Filter op status (Lopend/Afgerond)
- [x] Filter op locatie (provincie)
- [x] Zoeken op naam/beschrijving
- [ ] Filter op sector
- [ ] Filter op vereiste skills
- [ ] Combineren van meerdere filters

**Status:** Geïmplementeerd (basis)  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `PublicDiscoveryPage.jsx` - publieke discovery
- `OverviewPage.jsx` - ingelogde discovery

---

### DIS-004: Zoeken als niet-ingelogde bezoeker
**Als** publieke bezoeker  
**Wil ik** projecten kunnen zoeken zonder account  
**Zodat** ik kan ontdekken wat er speelt voordat ik me aanmeld

**Acceptatiecriteria:**
- [x] Publieke discovery pagina (`/publiek`)
- [x] Geen login vereist
- [x] Basis filtering beschikbaar
- [x] Projectdetails bekijken
- [x] Call-to-action voor aanmelden

**Status:** Geïmplementeerd  
**Prioriteit:** MVP

**Geïmplementeerd in:**
- `PublicDiscoveryPage.jsx`
- `PublicProjectCard.jsx`
- `/projects/public` API endpoint

---

## Epic: Burger/Expert Rol (Toekomst)

### DIS-005: Burger/Expert rol in project
**Als** functie 'burger'  
**Wil ik** de rol van 'ervaringsdeskundige/expert' vervullen binnen een project  
**Zodat** ik vanuit mijn ervaring kan bijdragen (bijv. met label visuele beperking)

**Acceptatiecriteria:**
- [ ] Registratie als "burger" (niet-student, niet-professional)
- [ ] Expertise/ervaring gebieden kunnen aangeven
- [ ] Projecten kunnen zoeken die passen bij expertise
- [ ] Solliciteren als expert/ervaringsdeskundige
- [ ] Profiel met ervaringsbeschrijving
- [ ] Labels/tags voor specifieke expertise (bijv. "visuele beperking")

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

**Use case voorbeeld:**
> Iemand met een visuele beperking wil bijdragen aan een accessibility project 
> door hun ervaringskennis te delen met het development team.

**Technische implicaties:**
- Nieuwe entity: `citizen` of `expert`
- Nieuwe rol in authenticatie systeem
- Relatie: `contributesTo (citizen, project, expertiseArea)`

---

### DIS-006: Expert matching
**Als** organisatie  
**Wil ik** ervaringsdeskundigen kunnen zoeken voor mijn project  
**Zodat** we input krijgen van mensen met relevante levenserfaring

**Acceptatiecriteria:**
- [ ] Filter op "experts beschikbaar"
- [ ] Zoeken op expertise gebied
- [ ] Expert profielen bekijken
- [ ] Uitnodiging sturen naar expert
- [ ] Expert kan accepteren/afwijzen

**Status:** Niet geïmplementeerd  
**Prioriteit:** Fase 3

---

## Epic: Impact & Showcase

### DIS-007: Impact verhalen bekijken
**Als** publieke bezoeker  
**Wil ik** succesverhalen en impact van afgeronde projecten zien  
**Zodat** ik geïnspireerd raak

**Acceptatiecriteria:**
- [x] Afgeronde projecten tonen impact samenvatting
- [x] Filter op "Afgerond" status
- [ ] Speciale "Impact Showcase" sectie op homepage
- [ ] Statistieken (aantal studenten, projecten, etc.)

**Status:** Deels geïmplementeerd  
**Prioriteit:** MVP (basis), Fase 2 (showcase)

**Geïmplementeerd:**
- Impact summary veld bij projecten
- Filter op status

**Nog niet geïmplementeerd:**
- Dedicated showcase pagina
- Platform-brede statistieken

---

### DIS-008: Organisatie profielen bekijken
**Als** publieke bezoeker  
**Wil ik** informatie over organisaties kunnen bekijken  
**Zodat** ik weet wie er achter projecten zit

**Acceptatiecriteria:**
- [x] Organisatie naam en beschrijving bij projecten
- [ ] Publieke organisatie profielpagina
- [ ] Overzicht van alle publieke projecten van organisatie
- [ ] Contact mogelijkheid (optioneel)

**Status:** Deels geïmplementeerd  
**Prioriteit:** Fase 2

**Huidige situatie:**
- Organisatie info zichtbaar bij projecten
- Geen standalone publieke organisatie pagina

---

## Technische Vereisten

| Component | Wijziging | Prioriteit |
|-----------|-----------|------------|
| Schema | `citizen`/`expert` entity | Fase 3 |
| Schema | `expertiseArea` entity | Fase 3 |
| `CitizenRegistration` | Registratie flow voor burgers | Fase 3 |
| `ExpertProfile` | Profiel pagina voor experts | Fase 3 |
| `ImpactShowcase` | Speciale showcase sectie | Fase 2 |
| `PublicBusinessPage` | Publieke organisatie pagina | Fase 2 |
| API | `GET /experts` | Fase 3 |
| API | `POST /experts/register` | Fase 3 |

---

## Prioriteit Overzicht

| Story | Prioriteit | Status |
|-------|------------|--------|
| DIS-001 | MVP | Geïmplementeerd |
| DIS-002 | MVP | Geïmplementeerd |
| DIS-003 | MVP | Geïmplementeerd (basis) |
| DIS-004 | MVP | Geïmplementeerd |
| DIS-007 | MVP/Fase 2 | Deels |
| DIS-008 | Fase 2 | Deels |
| DIS-005 | Fase 3 | Niet geïmplementeerd |
| DIS-006 | Fase 3 | Niet geïmplementeerd |

---

## Gerelateerde Documentatie

- [Gebruikersscenario's v2](./GEBRUIKERSSCENARIOS_V2.md) - Publiek perspectief
- [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md)
