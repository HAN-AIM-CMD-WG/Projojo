# Projojo Roadmap

> Eén overzicht van wat er is, wat we bouwen, en wat later komt.

---

## Visueel Overzicht: Alle Features per Fase

### Legenda
- ✅ Geïmplementeerd en werkend
- 🔨 Basis aanwezig, UI/flow mist nog
- ❌ Nog niet gebouwd
- 📝 Beschreven in docs, nog geen user story

---

## MVP: Basis Matching Platform ✅

*Status: Grotendeels compleet*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MVP - WAT ER NU IS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STUDENT                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Dashboard met overzicht van actieve taken en aanmeldingen               │
│  ✅ Eigen profiel beheren (foto, bio, CV uploaden)                          │
│  ✅ Skills toevoegen aan profiel met beschrijving                           │
│  ✅ Projecten zoeken en filteren (op skill, locatie, thema)                 │
│  ✅ Aanmelden voor taak met motivatie                                       │
│  ✅ Deeltaken claimen en status bijwerken                                   │
│  ✅ Zien welke medestudenten aan dezelfde taak werken                       │
│                                                                             │
│  ORGANISATIE (Supervisor)                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Dashboard met projecten en openstaande aanmeldingen                     │
│  ✅ Bedrijfsprofiel beheren (logo, beschrijving, locatie, sector)           │
│  ✅ Projecten aanmaken met taken                                            │
│  ✅ Taken definiëren met vereiste skills en aantal posities                 │
│  ✅ Deeltaken maken (WAT/WAAROM/HOE/CRITERIA structuur)                     │
│  ✅ Aanmeldingen accepteren of afwijzen met feedback                        │
│  ✅ Project publiek maken voor de discovery pagina                          │
│                                                                             │
│  DOCENT                                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Overzicht van alle projecten, organisaties en studenten                 │
│  ✅ Skills-bibliotheek beheren (nieuwe skills goedkeuren)                   │
│  ✅ Thema's beheren (aanmaken, bewerken, koppelen aan SDG's)                │
│                                                                             │
│  PUBLIEK (niet-ingelogd)                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Discovery pagina met publieke projecten                                 │
│  ✅ Interactieve kaart met projectlocaties                                  │
│  ✅ Filteren op thema, status en locatie                                    │
│  ✅ Projectdetails bekijken zonder account                                  │
│                                                                             │
│  ALGEMEEN                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Inloggen via Microsoft (eduID)                                          │
│  ✅ Uitloggen                                                               │
│  ✅ Doorklikken naar profielen (student, bedrijf)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Wat nog mist voor complete MVP:

| Feature | User Story | Waarom nodig |
|---------|-----------|--------------|
| ❌ Taak als afgerond markeren | US-006, ORG-007 | Zonder dit geen portfolio mogelijk |

---

## Fase 2: Portfolio Foundation 🎯

*Status: Dit is de volgende prioriteit*

**Waarom dit eerst?** Het portfolio is de kernwaarde van Projojo. Dit onderscheidt het platform van LinkedIn, Indeed en schoolsystemen. Studenten kunnen bewijzen wat ze GEDAAN hebben, niet alleen wat ze claimen.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 2 - PORTFOLIO & FEEDBACK                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAP 1: TAAK AFRONDEN (basis voor alles)                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Supervisor kan taak als "afgerond" markeren                             │
│  ❌ Student krijgt melding dat taak is afgerond                             │
│  ❌ Afgeronde taak verschuift naar "Voltooid" sectie                        │
│                                                                             │
│  → User Stories: US-006, ORG-007                                            │
│                                                                             │
│  STAP 2: PORTFOLIO ZICHTBAAR                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🔨 Voltooide taken tonen op studentprofiel                                 │
│     (Schema bestaat, UI moet gebouwd worden)                                │
│  ❌ Per taak: projectnaam, bedrijf, periode, beschrijving                   │
│  ❌ Taken gesorteerd op datum (nieuwste eerst)                              │
│                                                                             │
│  → User Stories: US-001, STU-004                                            │
│                                                                             │
│  STAP 3: REVIEW SYSTEEM                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Supervisor geeft review na taakafronding (1-5 sterren + tekst)          │
│  ❌ Review zichtbaar op studentprofiel                                      │
│  ❌ Gemiddelde score getoond                                                │
│                                                                             │
│  → User Stories: US-002, US-005, STU-005, ORG-006                           │
│                                                                             │
│  STAP 4: PORTFOLIO DELEN                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Publieke portfolio URL: /portfolio/{student_id}                         │
│  ❌ Geen login nodig om te bekijken                                         │
│  ❌ Student bepaalt zelf wat zichtbaar is (privacy toggle)                  │
│  ❌ "Kopieer link" knop op eigen profiel                                    │
│                                                                             │
│  → User Stories: US-004, STU-006                                            │
│                                                                             │
│  STAP 5: SKILL ENDORSEMENT (kan later in Fase 2)                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Supervisor kan skills van student "endorsen" na afronding               │
│  ❌ Endorsed skills krijgen "✓ Geverifieerd" badge                          │
│  ❌ Alleen taak-gerelateerde skills kunnen endorsed worden                  │
│                                                                             │
│  → User Stories: US-003, ORG-008                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase 2: Praktische Verbeteringen

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 2 - PRAKTISCHE VERBETERINGEN                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ORGANISATIE                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Meerdere supervisors per bedrijf                                        │
│     "Mijn collega moet ook projecten kunnen beheren"                        │
│     → User Story: ORG-004                                                   │
│                                                                             │
│  DOCENT                                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Eigen profielpagina (foto, expertise, contactinfo)                      │
│     → User Stories: DOC-001, DOC-002                                        │
│                                                                             │
│  ❌ Project "adopteren" voor curriculum                                     │
│     "Dit project is geschikt voor mijn vak, studenten krijgen punten"       │
│     → User Story: DOC-004                                                   │
│                                                                             │
│  STUDENT                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ "Beschikbaar voor betaald werk" toggle op profiel                       │
│     → User Story: STU-007                                                   │
│                                                                             │
│  PLATFORM                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Notificaties (nieuwe match, aanmelding geaccepteerd, etc.)              │
│     → Nog geen user story, moet geschreven worden                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 3: Betere Matching & Curriculum

*Status: Uitgebreid beschreven in GEBRUIKERSSCENARIOS_V2.md, user stories moeten nog geschreven worden*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 3 - SLIMMERE MATCHING                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FUNNEL: ORGANISATIE (wizard bij project aanmaken)                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Stap 1: "Wat voor hulp zoek je?"                                        │
│     □ Onderzoek & Analyse                                                   │
│     □ Ontwikkeling & Bouwen                                                 │
│     □ Advies & Strategie                                                    │
│     □ Uitvoering & Hands-on                                                 │
│                                                                             │
│  📝 Stap 2: "Welke omvang?"                                                 │
│     □ Korte klus (< 40 uur)                                                 │
│     □ Klein project (40-80 uur)                                             │
│     □ Groot project (80-160 uur)                                            │
│     □ Stage/Afstuderen (> 160 uur)                                          │
│                                                                             │
│  📝 Stap 3: "Wanneer en waar?"                                              │
│  📝 Stap 4: "Wie zoek je?" (aantal, niveau, skills)                         │
│                                                                             │
│  → Geen user stories, moet nog geschreven worden                            │
│                                                                             │
│  FUNNEL: STUDENT (wizard bij onboarding/zoeken)                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Stap 1: "Wat zoek je?"                                                  │
│     □ Stage (verplicht voor opleiding)                                      │
│     □ Afstudeeropdracht                                                     │
│     □ Extra ervaring (vrijwillig)                                           │
│     □ Betaald werk                                                          │
│                                                                             │
│  📝 Stap 2: "Hoeveel tijd heb je?" (uren/week, periode)                     │
│  📝 Stap 3: "Waar kun je werken?" (locatie, remote voorkeur)                │
│                                                                             │
│  → Geen user stories, moet nog geschreven worden                            │
│                                                                             │
│  OPDRACHT CLASSIFICATIE                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Type: Stage / Minor / Afstuderen / Losse klus / Betaald                 │
│  📝 Samenstelling: Individueel / Duo / Groep (3-5) / Team (6+)              │
│  📝 Werkvorm: Op locatie / Remote / Hybride                                 │
│  📝 Niveau: MBO / HBO / WO                                                  │
│  📝 Studiejaar: Jaar 1 / 2 / 3 / 4 / Master                                 │
│                                                                             │
│  → Geen user stories, moet nog geschreven worden                            │
│                                                                             │
│  DOCENT UITBREIDING                                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ "Opdrachtvraag" plaatsen                                                │
│     Docent zoekt projecten voor zijn minor, organisaties reageren           │
│     → User Story: DOC-005                                                   │
│                                                                             │
│  📝 "Onderzoeksvraag" plaatsen                                              │
│     Docent heeft onderzoeksidee, zoekt organisatie als case                 │
│     → Geen user story, moet nog geschreven worden                           │
│                                                                             │
│  ❌ Studiepunten koppelen aan projecten                                     │
│     → Deels in DOC-004, moet uitgebreid worden                              │
│                                                                             │
│  TEAM FEATURES                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Team-aanmeldingen (groep studenten solliciteert samen)                  │
│     → Geen user story, moet nog geschreven worden                           │
│                                                                             │
│  📝 Matching algoritme (automatische suggesties)                            │
│     → Geen user story, moet nog geschreven worden                           │
│                                                                             │
│  EXTERNE INTEGRATIE                                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 edubadges koppeling (handmatig via SURF)                                │
│     → Beschreven in ECOSYSTEEM_STRATEGIE.md                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 4+: Ecosysteem Groei (Toekomst)

*Status: Visie-documentatie in ECOSYSTEEM_STRATEGIE.md, wordt pas relevant als Fase 2-3 af zijn*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 4+ - TOEKOMSTVISIE                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NIEUWE ROLLEN                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Burger / Ervaringsdeskundige                                            │
│     Niet-student die expertise inbrengt (bijv. iemand met visuele           │
│     beperking helpt bij accessibility project)                              │
│     → User Stories: DIS-005, DIS-006                                        │
│                                                                             │
│  📝 Hub / Holding / Netwerk                                                 │
│     Overkoepelende organisatie die meerdere bedrijven beheert               │
│     → User Story: ORG-010                                                   │
│                                                                             │
│  📝 Admin (apart van Docent)                                                │
│     Platform-breed beheer, analytics, audit logging                         │
│     → User Stories: PLT-001, PLT-002                                        │
│                                                                             │
│  GEAVANCEERDE SAMENWERKING                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Cross-company projecten                                                 │
│     Meerdere bedrijven werken samen aan één project                         │
│     → User Story: ORG-009                                                   │
│                                                                             │
│  📝 Kennisclusters per sector                                               │
│     Bedrijven delen vraagstukken, studenten doen onderzoek                  │
│     → Beschreven in ECOSYSTEEM_STRATEGIE.md                                 │
│                                                                             │
│  📝 Interdisciplinaire teams                                                │
│     ICT + Zorg + Design studenten in één project                            │
│     → Beschreven in ECOSYSTEEM_STRATEGIE.md                                 │
│                                                                             │
│  📝 HBO-WO samenwerking                                                     │
│     → Beschreven in ECOSYSTEEM_STRATEGIE.md                                 │
│                                                                             │
│  STUDENT-INITIATIEF                                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Student start eigen project                                             │
│     Student heeft idee, zoekt teamleden en begeleiding                      │
│     → Beschreven in ECOSYSTEEM_STRATEGIE.md                                 │
│                                                                             │
│  EXTERNE INTEGRATIES                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 edubadges API (automatische badge-uitgifte)                             │
│  📝 LMS integratie (studiepunten automatisch)                               │
│  📝 LinkedIn export                                                         │
│  📝 Gemeente partnerships                                                   │
│     → Alles beschreven in ECOSYSTEEM_STRATEGIE.md                           │
│                                                                             │
│  ORGANISATIE                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📝 Coöperatie rechtsvorm voor Projojo                                      │
│  📝 Financieringsmodel (lidmaatschap + subsidies)                           │
│     → Beschreven in ECOSYSTEEM_STRATEGIE.md                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Actie Checklist

### Nu te doen (MVP afronden)

- [ ] **Bouw: Taak afronden flow** (US-006, ORG-007)
  - Knop "Markeer als afgerond" in supervisor dashboard
  - Bevestigingsdialoog
  - Student krijgt notificatie

### Daarna (Fase 2 Portfolio)

- [ ] **Bouw: Voltooide taken op profiel** (US-001, STU-004)
- [ ] **Bouw: Review systeem** (US-002, US-005)
- [ ] **Bouw: Portfolio delen** (US-004, STU-006)
- [ ] **Bouw: Skill endorsement** (US-003, ORG-008)

### Later (Fase 2 Praktisch)

- [ ] **Bouw: Multi-supervisor** (ORG-004)
- [ ] **Bouw: Docent profiel** (DOC-001, DOC-002)
- [ ] **Bouw: Project adopteren** (DOC-004)
- [ ] **Schrijf: User stories voor notificaties**

### Nog later (Fase 3)

- [ ] **Schrijf: User stories voor funnels** (org + student)
- [ ] **Schrijf: User stories voor opdracht classificatie**
- [ ] **Schrijf: User stories voor team-aanmeldingen**
- [ ] **Bouw: Docent opdrachtvraag** (DOC-005)

---

## Gerelateerde Documentatie

| Document | Bevat |
|----------|-------|
| [USER_STORIES_STUDENT.md](./USER_STORIES_STUDENT.md) | STU-001 t/m STU-008 |
| [USER_STORIES_ORGANISATIE.md](./USER_STORIES_ORGANISATIE.md) | ORG-001 t/m ORG-011 |
| [USER_STORIES_DOCENT.md](./USER_STORIES_DOCENT.md) | DOC-001 t/m DOC-009 |
| [USER_STORIES_DISCOVERY.md](./USER_STORIES_DISCOVERY.md) | DIS-001 t/m DIS-008 |
| [USER_STORIES_PORTFOLIO.md](./USER_STORIES_PORTFOLIO.md) | US-001 t/m US-006 |
| [USER_STORIES_PLATFORM.md](./USER_STORIES_PLATFORM.md) | PLT-001 t/m PLT-006 |
| [GEBRUIKERSSCENARIOS_V2.md](./GEBRUIKERSSCENARIOS_V2.md) | Scenario's en funnels (Fase 3) |
| [ECOSYSTEEM_STRATEGIE.md](./ECOSYSTEEM_STRATEGIE.md) | Lange termijn visie (Fase 4+) |

---

*Laatst bijgewerkt: februari 2026*
