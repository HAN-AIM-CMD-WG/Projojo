# Projojo Gebruikersscenario's & Behoeften

> Een compleet overzicht van alle gebruikersbehoeften per rol: publieke bezoeker, student, organisatie en docent.

---

## 🌐 Perspectief 1: Publieke Bezoeker (Niet-ingelogd)

### Persona: "Marieke" - Nieuwsgierige bezoeker
*Marieke is een beleidsmedewerker bij de gemeente die wil weten wat er in de regio gebeurt op het gebied van duurzaamheid en innovatie.*

### Scenario: Ontdekken wat er speelt

```
Marieke komt op de Projojo homepage en ziet direct:

1. LANDINGSPAGINA
   - Wat is Projojo? (uitleg ecosysteem)
   - "Ontdek Projecten" knop in navigatie
   - Discovery sectie met uitgelichte projecten

2. PUBLIEKE DISCOVERY (/publiek)
   - Alle publieke projecten browsen
   - Filteren op:
     ├── Status: Lopend / Afgerond
     ├── Thema's: Duurzaamheid, Klimaat, Innovatie, etc.
     └── Locatie: Gelderland, Zuid-Holland, etc.
   - Zoeken op naam/beschrijving
   
3. PROJECTDETAILS BEKIJKEN
   - Organisatie die het project aanbiedt
   - Welke skills worden gezocht
   - Hoeveel posities open zijn
   - Thema-badges (SDG-gekoppeld)
   - Locatie op kaart
   - Bij afgeronde projecten: Impact beschrijving

4. INSPIRATIE OPDOEN
   - "Impact Showcase" sectie met succesverhalen
   - Zien welke organisaties actief zijn
   - Begrijpen welke thema's relevant zijn
```

### Behoeften Publieke Bezoeker

| Behoefte | Huidige Status | Beschrijving |
|----------|----------------|--------------|
| ✅ Projecten browsen | Geïmplementeerd | Via `/publiek` pagina |
| ✅ Filteren op thema | Geïmplementeerd | 6 thema's beschikbaar |
| ✅ Filteren op status | Geïmplementeerd | Lopend/Afgerond |
| ✅ Filteren op locatie | Geïmplementeerd | Provincie-niveau |
| ✅ Impact verhalen zien | Geïmplementeerd | Bij afgeronde projecten |
| ⏳ Publiek portfolio student | Nog niet | Toekomstige feature |
| ⏳ Organisatie-profielen | Beperkt | Alleen via projecten |

---

## 🎓 Perspectief 2: Student

### Persona: "Emma" - Ambitieuze student
*Emma studeert Landbouwtechnologie en wil praktijkervaring opdoen die ze kan tonen aan toekomstige werkgevers.*

### Scenario: Van aanmelding tot portfolio

```
FASE 1: ORIËNTATIE
┌─────────────────────────────────────────────────────────────┐
│ Emma logt in via Microsoft (eduID) en komt op haar dashboard│
│                                                             │
│ Dashboard toont:                                            │
│ ├── Haar profiel (foto, bio, CV)                           │
│ ├── Haar skills (met beschrijving per skill)               │
│ ├── Actieve taken (waar ze aan werkt)                      │
│ ├── Aanmeldingen (pending/accepted/rejected)               │
│ └── Aanbevolen projecten (gebaseerd op skills)             │
└─────────────────────────────────────────────────────────────┘

FASE 2: ZOEKEN & MATCHEN
┌─────────────────────────────────────────────────────────────┐
│ Emma gaat naar "Overzicht" om projecten te zoeken          │
│                                                             │
│ Ze kan filteren op:                                         │
│ ├── Skills die ze heeft                                    │
│ ├── Locatie (waar ze kan werken)                           │
│ ├── Organisatie                                            │
│ └── Zoekterm                                               │
│                                                             │
│ Bij elk project ziet ze:                                    │
│ ├── Match-indicator (hoeveel skills ze heeft)              │
│ ├── Open posities per taak                                 │
│ ├── Tijdslijn (start/einddatum)                            │
│ └── Vereiste skills (met highlight van haar skills)        │
└─────────────────────────────────────────────────────────────┘

FASE 3: AANMELDEN
┌─────────────────────────────────────────────────────────────┐
│ Emma vindt een interessant project en klikt door           │
│                                                             │
│ Project Details toont:                                      │
│ ├── Organisatie info + locatie op kaart                    │
│ ├── Projectbeschrijving                                    │
│ ├── Alle taken met:                                        │
│     ├── Taaknaam en beschrijving                           │
│     ├── Vereiste skills (highlighted als ze die heeft)     │
│     ├── Aantal posities (vervuld/totaal)                   │
│     ├── Deeltaken preview                                  │
│     └── "Aanmelden" knop                                   │
│                                                             │
│ Bij aanmelden schrijft Emma een motivatie                  │
└─────────────────────────────────────────────────────────────┘

FASE 4: WERKEN AAN TAAK
┌─────────────────────────────────────────────────────────────┐
│ Na acceptatie ziet Emma de taak in haar dashboard          │
│                                                             │
│ Taakdetails tonen:                                          │
│ ├── Beschrijving en vereisten                              │
│ ├── Tijdslijn                                              │
│ ├── Teamleden (andere studenten op deze taak)              │
│ ├── Deeltaken:                                             │
│     ├── Wat moet er gebeuren?                              │
│     ├── Waarom?                                            │
│     ├── Hoe (stappenplan)?                                 │
│     ├── Acceptatiecriteria                                 │
│     └── Status (open/in_progress/done)                     │
│ └── Zij kan deeltaken claimen                              │
└─────────────────────────────────────────────────────────────┘

FASE 5: PORTFOLIO OPBOUWEN (Toekomst)
┌─────────────────────────────────────────────────────────────┐
│ Na afronding:                                               │
│ ├── Taak verschijnt in "Voltooide Taken"                   │
│ ├── Organisatie geeft review (sterren + tekst)             │
│ ├── Skills worden "verified/endorsed"                       │
│ ├── Portfolio-item wordt aangemaakt                        │
│ └── Deelbaar via publieke link                             │
└─────────────────────────────────────────────────────────────┘
```

### Behoeften Student

| Behoefte | Huidige Status | Beschrijving |
|----------|----------------|--------------|
| ✅ Profiel beheren | Geïmplementeerd | Bio, foto, CV uploaden |
| ✅ Skills toevoegen | Geïmplementeerd | Met beschrijving per skill |
| ✅ Projecten zoeken | Geïmplementeerd | Met filters |
| ✅ Skill-matching zien | Geïmplementeerd | Highlighting van matching skills |
| ✅ Aanmelden voor taken | Geïmplementeerd | Met motivatie |
| ✅ Deeltaken claimen | Geïmplementeerd | Subtask systeem |
| ✅ Team zien | Geïmplementeerd | Andere studenten op taak |
| ⏳ Reviews ontvangen | Schema aanwezig | Nog niet in UI |
| ⏳ Verified skills | Concept klaar | Endorsement systeem |
| ⏳ Publiek portfolio | Schema aanwezig | PortfolioItem entity bestaat |
| ⏳ Gantt/tijdlijn | Deels | Via taakdetails |

---

## 🏢 Perspectief 3: Organisatie (Supervisor)

### Persona: "Jan" - Projectleider bij SmartFarm Solutions
*Jan wil studenten betrekken bij innovatieprojecten en talent scouten voor toekomstige vacatures.*

### Scenario: Van project aanmaken tot talent vinden

```
FASE 1: ONBOARDING
┌─────────────────────────────────────────────────────────────┐
│ Jan wordt uitgenodigd via invite-link                       │
│                                                             │
│ Bij eerste login:                                           │
│ ├── Koppeling aan bestaand bedrijf OF                      │
│ ├── Nieuw bedrijf aanmaken:                                │
│     ├── Naam, beschrijving, logo                           │
│     ├── Locatie, sector, bedrijfsgrootte                   │
│     └── Website                                            │
└─────────────────────────────────────────────────────────────┘

FASE 2: PROJECT AANMAKEN
┌─────────────────────────────────────────────────────────────┐
│ Jan maakt een nieuw project aan                             │
│                                                             │
│ Project bevat:                                              │
│ ├── Naam en beschrijving                                   │
│ ├── Afbeelding                                             │
│ ├── Start- en einddatum                                    │
│ ├── Locatie (optioneel, anders van bedrijf)               │
│ └── Publiek/Privé toggle                                   │
│                                                             │
│ Daarna: Taken toevoegen                                     │
│ ├── Taaknaam en beschrijving                               │
│ ├── Aantal posities nodig                                  │
│ ├── Vereiste skills (uit bestaande lijst of nieuw)         │
│ └── Start/einddatum                                        │
└─────────────────────────────────────────────────────────────┘

FASE 3: DEELTAKEN DEFINIËREN
┌─────────────────────────────────────────────────────────────┐
│ Voor gestructureerd werken kan Jan deeltaken toevoegen      │
│                                                             │
│ Per deeltaak:                                               │
│ ├── WAT: Wat moet er gebeuren?                             │
│ ├── WAAROM: Context en reden                               │
│ ├── HOE: Stappenplan/aanpak                                │
│ └── CRITERIA: Wanneer is het af?                           │
│                                                             │
│ Jan kan ook templates maken voor hergebruik                 │
│ (bijv. "Bug Fix", "Feature Implementatie", "Documentatie") │
└─────────────────────────────────────────────────────────────┘

FASE 4: AANMELDINGEN BEHEREN
┌─────────────────────────────────────────────────────────────┐
│ Op het Supervisor Dashboard ziet Jan:                       │
│                                                             │
│ ├── Alle projecten van zijn bedrijf                        │
│ ├── Openstaande aanmeldingen:                              │
│     ├── Student profiel bekijken                           │
│     ├── Skills vergelijken met vereisten                   │
│     └── Accepteren/Afwijzen met feedback                   │
│                                                             │
│ Na acceptatie:                                              │
│ ├── Student verschijnt bij teamleden                       │
│ └── Student kan deeltaken claimen                          │
└─────────────────────────────────────────────────────────────┘

FASE 5: VOORTGANG MONITOREN
┌─────────────────────────────────────────────────────────────┐
│ Jan kan per project/taak zien:                              │
│                                                             │
│ ├── Welke studenten actief zijn                            │
│ ├── Status van deeltaken (open/in_progress/done)           │
│ ├── Wie werkt aan wat                                      │
│ └── Tijdlijn voortgang                                     │
└─────────────────────────────────────────────────────────────┘

FASE 6: PROJECT AFRONDEN & PUBLICEREN
┌─────────────────────────────────────────────────────────────┐
│ Bij afronding kan Jan:                                      │
│                                                             │
│ ├── Project als "Publiek" markeren                         │
│ ├── Impact samenvatting schrijven                          │
│ ├── Thema's koppelen (SDG's)                               │
│ └── (Toekomst) Reviews geven aan studenten                 │
│                                                             │
│ Het project wordt dan zichtbaar op de publieke discovery   │
└─────────────────────────────────────────────────────────────┘
```

### Behoeften Organisatie

| Behoefte | Huidige Status | Beschrijving |
|----------|----------------|--------------|
| ✅ Bedrijfsprofiel | Geïmplementeerd | Met logo, sector, locatie |
| ✅ Projecten aanmaken | Geïmplementeerd | Volledige CRUD |
| ✅ Taken definiëren | Geïmplementeerd | Met skills, posities |
| ✅ Deeltaken systeem | Geïmplementeerd | WAT/WAAROM/HOE/CRITERIA |
| ✅ Templates | Geïmplementeerd | Herbruikbare deeltaken |
| ✅ Aanmeldingen beheren | Geïmplementeerd | Accept/Reject met feedback |
| ✅ Team overzicht | Geïmplementeerd | Per taak |
| ✅ Publiek maken | Geïmplementeerd | isPublic toggle |
| ✅ Impact beschrijven | Geïmplementeerd | Voor afgeronde projecten |
| ✅ Thema's koppelen | Geïmplementeerd | Via API |
| ⏳ Student reviews | Schema gepland | Nog niet in UI |
| ⏳ Skill endorsement | Concept klaar | Nog niet geïmplementeerd |
| ⏳ Talent pool volgen | Toekomst | Strategisch gepland |

---

## 👨‍🏫 Perspectief 4: Docent (Teacher)

### Persona: "Henk" - Docent Landbouwtechnologie
*Henk wil zien waar zijn studenten aan werken en de kwaliteit van projecten bewaken.*

### Scenario: Overzicht en kwaliteitsbewaking

```
DOCENT DASHBOARD
┌─────────────────────────────────────────────────────────────┐
│ Henk heeft overzicht over het hele platform:                │
│                                                             │
│ ├── Alle organisaties                                      │
│ ├── Alle projecten                                         │
│ ├── Alle studenten                                         │
│ ├── Alle skills (incl. pending skills goedkeuren)          │
│ └── Thema's beheren                                        │
│                                                             │
│ Specifieke taken:                                           │
│ ├── Nieuwe skills reviewen (pending → approved)            │
│ ├── Thema's aanmaken/bewerken                              │
│ ├── Projecten monitoren                                    │
│ └── (Toekomst) Studiepunten koppelen                       │
└─────────────────────────────────────────────────────────────┘
```

### Behoeften Docent

| Behoefte | Huidige Status | Beschrijving |
|----------|----------------|--------------|
| ✅ Platform overzicht | Geïmplementeerd | Alle entiteiten zichtbaar |
| ✅ Skills beheren | Geïmplementeerd | Goedkeuren van pending skills |
| ✅ Thema's beheren | Geïmplementeerd | CRUD via API |
| ⏳ Student voortgang | Beperkt | Via projectdetails |
| ⏳ Studiepunten | Toekomst | Strategisch gepland |
| ⏳ Kwaliteitsbewaking | Toekomst | Reviews/endorsements |

---

## 📊 Samenvatting: Feature Matrix

| Feature | Publiek | Student | Organisatie | Docent |
|---------|---------|---------|-------------|--------|
| Projecten browsen | ✅ (publiek) | ✅ (alle) | ✅ (eigen) | ✅ (alle) |
| Projectdetails | ✅ (publiek) | ✅ | ✅ | ✅ |
| Filteren/zoeken | ✅ | ✅ | ✅ | ✅ |
| Aanmelden | ❌ | ✅ | ❌ | ❌ |
| Projecten maken | ❌ | ❌ | ✅ | ❌ |
| Taken beheren | ❌ | ❌ | ✅ | 👀 |
| Deeltaken | ❌ | ✅ claim | ✅ maken | 👀 |
| Skills beheren | ❌ | ✅ eigen | ❌ | ✅ alle |
| Thema's | 👀 filter | 👀 filter | ✅ koppelen | ✅ beheren |
| Publiek maken | ❌ | ❌ | ✅ | 👀 |
| Impact schrijven | ❌ | ❌ | ✅ | 👀 |

**Legenda:** ✅ = Kan uitvoeren | 👀 = Kan bekijken | ❌ = Geen toegang

---

## 🔮 Toekomstige Features (Roadmap)

### Korte termijn
- [ ] Reviews/ratings na taakafronding
- [ ] Skill endorsement door organisaties
- [ ] Publiek deelbaar studentportfolio
- [ ] Thema's koppelen via UI (nu alleen API)

### Middellange termijn
- [ ] Studiepunten integratie
- [ ] Notificaties ("Nieuw project dat bij jouw skills past")
- [ ] Team aanmeldingen
- [ ] Docent dashboard met voortgang per student

### Lange termijn
- [ ] edubadges integratie (SURF)
- [ ] Interdisciplinaire teams
- [ ] Student-geïnitieerde projecten
- [ ] Talent pools voor organisaties
- [ ] API voor externe integraties (LinkedIn, LMS)

---

## 📚 Gerelateerde Documentatie

- [Ecosysteem Strategie](./ECOSYSTEEM_STRATEGIE.md) - Visie en roadmap
- [User Stories Portfolio](./USER_STORIES_PORTFOLIO.md) - Technische user stories
