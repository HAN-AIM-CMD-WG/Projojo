# Projojo Design System

Een unified design systeem gebaseerd op Gestalt principes voor consistente UI/UX.

---

## Gestalt Principes

### 1. Proximity (Nabijheid)
Gerelateerde elementen worden gegroepeerd door witruimte.
- Cards bevatten gerelateerde informatie
- Form sections zijn visueel gescheiden
- Button groepen staan bij elkaar

### 2. Similarity (Gelijkheid)
Elementen met dezelfde functie hebben dezelfde styling.
- Alle primary actions: coral filled
- Alle secondary actions: neumorphic grijs
- Alle skill badges: consistente pill styling

### 3. Hierarchy (Hiërarchie)
Visueel gewicht bepaalt de aandachtsvolgorde.
- Primary buttons trekken meeste aandacht
- Secondary buttons zijn ondersteunend
- Tertiary buttons zijn subtiel

### 4. Continuity (Continuïteit)
Oog volgt lijnen en curves.
- Consistente border-radius (0.75rem voor buttons, full voor pills)
- Uitgelijnde elementen in grids en lijsten

### 5. Closure (Geslotenheid)
Elementen in afgesloten vormen worden als groep gezien.
- Cards met duidelijke grenzen
- Sections met visuele scheiding

---

## Button Hierarchy

### 3-Level Systeem

| Level | Class | Visueel | Gebruik | Max per scherm |
|-------|-------|---------|---------|----------------|
| **Primary** | `neu-btn-primary` | Coral filled, wit tekst | Hoofdactie | 1-2 |
| **Secondary** | `neu-btn` | Grijs neumorphic | Ondersteunende acties | Meerdere |
| **Tertiary** | `neu-btn-text` | Transparant, subtiel | Links, minder belangrijke acties | Meerdere |

### Wanneer welke button?

**Primary (`neu-btn-primary`)**
- Aanmelden voor taak
- Opslaan
- Bevestigen
- Bekijk meer (op cards)
- Inloggen

**Secondary (`neu-btn`)**
- Annuleren
- Terug
- Bewerken
- Filter opties
- Navigatie items

**Tertiary (`neu-btn-text`)**
- Website links
- "Meer info" links
- Subtiele acties
- Footer links

### Voorbeeld per pagina

| Pagina | Primary | Secondary | Tertiary |
|--------|---------|-----------|----------|
| Home (Dashboard) | - | TaskCards, Quick Actions | - |
| Ontdek | "Bekijk meer" | Filter buttons | "Website" |
| Project Details | "Aanmelden voor taak" | "Terug", "Bewerken" | Skills info |
| Profiel | "Opslaan" (edit mode) | "Bewerken" | Links |
| Login | "Inloggen" | OAuth buttons | - |

---

## Skill Badges vs Buttons - Duidelijk Onderscheid

### Visueel verschil

| Element | Vorm | Styling | Interactie |
|---------|------|---------|------------|
| **Skill Badges** | Pill (volledig rond) | Solid fill, subtiele shadow | Niet klikbaar |
| **Buttons** | Afgeronde rechthoek | Neumorphic shadows | Klikbaar met hover |

### Skill Badge Types

| Type | Class | Styling | Gebruik |
|------|-------|---------|---------|
| **Default** | `skill-badge` | Solid coral (#FF7F50), wit tekst, zachte shadow | Gevraagde skills |
| **Own** | `skill-badge-own` | Coral outline met lichte fill | Jouw eigen skills |
| **Pending** | `skill-badge-pending` | Dashed coral border | Skills in afwachting |

### Regels voor Skill Badges
- **Altijd volledig rond** (border-radius: 9999px / rounded-full)
- **Geen hover animaties** (niet klikbaar tenzij in editor)
- **Zachte shadow** voor diepte, geen neumorphic effect
- Consistent over alle pagina's
- Max 5-6 zichtbaar, daarna "+X meer"

### Regels voor Buttons
- **Afgeronde hoeken** (border-radius: 0.75rem / 12px)
- **Neumorphic shadows** (inset/outset effecten)
- **Hover effecten** (translateY, shadow changes)
- Duidelijke klikbare uitstraling

---

## Kleurenpalet

### Primary
- `--color-primary`: #FF7F50 (Coral)
- `--color-dark-primary`: #FF6347 (Donker coral)

### Neumorphic
- `--color-neu-bg`: #EFEEEE (Achtergrond)
- Shadows: #D1D9E6 (donker), #FFFFFF (licht)

### Tekst
- Primary: #2D3748
- Secondary: #4A5568
- Muted: #718096

### Status
- Success: #22C55E (groen)
- Warning: #F59E0B (amber)
- Error: #EF4444 (rood)

---

## Spacing & Sizing

### Border Radius
- Buttons: `0.75rem` (12px)
- Cards: `1rem` (16px)
- Pills/Badges: `9999px` (full)

### Padding
- Buttons: `0.625rem 1.25rem`
- Cards: `1.5rem` (24px)
- Badges: `0.375rem 0.75rem`

### Gaps
- Card content: `1rem` - `1.5rem`
- Button groups: `0.5rem`
- Badge groups: `0.5rem`

---

## Animaties

### Toegestaan
- Buttons: `translateY(-2px)` on hover
- Cards: Subtiele elevation change
- Transitions: `200ms ease`

### Niet toegestaan
- Hover effecten op niet-klikbare elementen
- Complexe animaties die afleiden
- Animaties langer dan 300ms

---

## Checklist nieuwe componenten

- [ ] Volgt button hierarchy (max 1-2 primary per scherm)
- [ ] Skill badges gebruiken juiste class
- [ ] Gerelateerde elementen gegroepeerd (proximity)
- [ ] Consistente spacing en sizing
- [ ] Geen hover op niet-klikbare elementen
- [ ] Kleurgebruik volgens palet
