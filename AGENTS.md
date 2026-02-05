# Projojo - AI Coding Guidelines

## Project Context

Projojo is een educatief projectmanagement platform dat bedrijven, studenten, begeleiders en docenten verbindt.

## Tech Stack

- **Frontend**: React + Tailwind CSS v4
- **Backend**: FastAPI (Python)
- **Database**: TypeDB

## Design System

### Neumorphic Principles

- **Accessibility First**: Hoog contrast, keyboard navigatie, screen reader support
- **Functional Beauty**: Aesthetiek ondersteunt functionaliteit
- **Consistent Interactions**: Voorspelbare hover/focus/active states
- **Professional Appearance**: Geschikt voor educatie/business

### Colors and Styling

Zie `projojo_frontend/src/index.css` voor volledige definities:

- **Primary**: `#FF7F50` (Coral)
- **Background**: `#EFEEEE` (Neumorphic)
- **Shadows**: `#D1D9E6` / `#FFFFFF`

### CSS Classes

- `.neu-flat` - Elevated cards
- `.neu-pressed` - Inset elements
- `.neu-btn` / `.neu-btn-primary` - Buttons

## Accessibility Requirements

**NON-NEGOTIABLE**

- WCAG 2.1 AA compliance minimum
- Keyboard navigatie voor alle interactieve elementen
- Screen reader compatibility
- `prefers-reduced-motion` respecteren
- Focus indicators (3px primary color rings)

## Animation Guidelines

### Allowed

- Subtle hover elevations (2px translateY)
- Soft pulse effects (scale 1.0-1.1)
- Gentle fade transitions
- Activity indicators (max 2-4s cycles)

### Constraints

- **Duration**: 0.2s interacties, 2-4s ambient
- **Performance**: Alleen `transform` en `opacity`
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

## Backend Guidelines

### Database Schema - Be Cautious

Extra velden is OK, maar let op impact op business rules.

**Safe Changes** (geen overleg nodig):
- Display-only velden
- Optionele velden: `@card(0..1)`
- Geen dependencies op andere entiteiten

Voorbeeld veilige toevoeging:

```tql
entity business,
    owns sector @card(0..1),      # Optioneel, alleen display
    owns companySize @card(0..1), # Optioneel, alleen display
    owns website @card(0..1);     # Optioneel, alleen display
```

### Risky Schema Changes (Document Required)

Wijzigingen die impact hebben op:
- Filtering/zoeken (als veld in queries gebruikt wordt)
- Matching logica (student-project matching)
- Validaties (verplichte velden, constraints)
- Relaties (nieuwe relations tussen entiteiten)
- Autorisatie (wie mag wat zien/doen)

Bij risicovolle wijzigingen, documenteer:
1. Welke bestaande logica moet worden aangepast
2. Welke nieuwe validaties nodig zijn
3. Backward compatibility overwegingen
4. Impact op bestaande data
5. Migratie strategie indien nodig

### TypeDB Specifics

```python
# Optionele velden komen als arrays terug
sector_list = result.get("sector", [])
sector = sector_list[0] if sector_list else None
```

### Database Reset

```bash
docker-compose down && docker-compose up -d --build
```

### API/Backend Changes

- Coördineer met backend team
- Minimale changes - voeg toe, wijzig niet
- Backward compatible houden
- Test lokaal voor commit

## Code Organization

- **Frontend**: `projojo_frontend/src/components/`
- **Backend**: `projojo_backend/` (domain-driven design)
- **Naming**: PascalCase components, camelCase utilities

## Do's and Don'ts

### Never Do

- Neumorphic design consistency breken
- Flashy/onprofessionele animaties
- Accessibility negeren
- Backend logica wijzigen zonder overleg
- Database relaties aanpassen zonder documentatie

### Always Do

- Bestaande design patterns volgen
- Responsive gedrag testen
- Accessibility valideren
- Coördineren bij backend changes
- Optionele velden voor nieuwe data (`@card(0..1)`)
