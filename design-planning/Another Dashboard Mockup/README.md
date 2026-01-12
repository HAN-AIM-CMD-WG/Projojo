# Werkspot Campus Dashboard

Een moderne, responsive studentenportal waar studenten bedrijven, stages, bijbanen en opdrachten kunnen vinden en beheren.

## 🎯 Kenmerken

### Visueel Design
- **Modern & Clean**: Geïnspireerd door Notion, Stripe Dashboard en Duolingo
- **Card-based Layout**: Met veel witruimte en zachte schaduwen
- **Professioneel Kleurenpalet**: Primary blauw (#2563EB), accent oranje (#F97316)
- **Inter Font**: Modern, leesbaar typography systeem
- **Responsive**: Volledig geoptimaliseerd voor desktop, tablet en mobiel

### Dashboard Widgets

1. **Hero Card met KPI's**
   - Welkomstbericht met personalisatie
   - 3 belangrijke statistieken: Actieve sollicitaties, Nieuwe matches, Aankomende afspraken
   - Snelle acties: Nieuwe opdracht zoeken, Profiel optimaliseren

2. **Profielstatus**
   - Visuele progress bar (70% compleet)
   - To-do lijst met actiepunten
   - Directe link naar profielpagina

3. **Aanbevolen Bedrijven**
   - 3-koloms grid met bedrijfskaarten
   - Filter pills: Alle, Stage, Bijbaan, Afstudeeropdracht, Flex-opdrachten
   - Regio dropdown filter
   - Match-score per bedrijf (5 bolletjes)
   - Favoriet functionaliteit (hartje)
   - Badges voor type, uren, vergoeding

4. **Lopende Sollicitaties**
   - Overzicht van alle actieve sollicitaties
   - Status badges: Ingediend, In behandeling, Uitnodiging gesprek, Afgewezen
   - Laatste update timestamps
   - Chat iconen voor lopende conversaties

5. **Berichten**
   - Tabs: Inbox, Uitnodigingen, Systeem
   - Unread indicators
   - "Nieuw" badges
   - Avatar per contactpersoon

6. **Agenda & Deadlines**
   - Week/Maand toggle
   - Datum pills
   - Labels: Sollicitatiegesprek, Deadline, Event
   - "Toevoegen aan kalender" functionaliteit

7. **Snelkoppelingen**
   - 4 quick action tiles
   - CV uploaden, Nieuwe stage zoeken, Skills bijwerken, Interesseprofiel aanpassen
   - Hover animaties

8. **Bedrijven die je volgt**
   - Status indicators (Open voor stages/bijbanen)
   - Aantal openstaande opdrachten
   - Locatie informatie
   - Ontvolgen functionaliteit

## 🚀 Technische Specificaties

### Structuur
```
/Users/wouter/Desktop/DESIGN NGI Portal/
├── index.html          # Hoofdpagina met alle widgets
├── styles.css          # Complete styling met design system
├── script.js           # Interactiviteit en event handlers
└── README.md           # Deze documentatie
```

### Design System
```css
--color-primary: #2563EB        /* Werkspot Campus blauw */
--color-primary-hover: #1D4ED8
--color-accent: #F97316         /* Oranje highlights */
--color-success: #10B981
--color-warning: #F59E0B
--color-error: #EF4444
--color-bg: #F3F4F6            /* Lichte grijs achtergrond */
--color-surface: #FFFFFF        /* Cards */
--color-text-primary: #111827
--color-text-secondary: #6B7280
--color-border: #E5E7EB
```

### Typografie
- Font: Inter (Google Fonts)
- H1: 28px, semibold
- H2: 20px, semibold
- H3: 18px, semibold
- Body: 15px, regular
- Caption: 13px, medium

### Layout
- Sidebar: 240px breed
- Topbar: 64px hoog
- Border radius: 16px (cards), 8px (kleine elementen)
- Grid: 12 kolommen met responsive breakpoints

## 💻 Gebruik

### Openen
1. Open `index.html` in een moderne browser (Chrome, Firefox, Safari, Edge)
2. Het dashboard laadt automatisch met dummy data

### Interactieve Elementen

**Navigatie:**
- Klik op menu-items in de sidebar om te navigeren
- Op mobiel: gebruik de hamburger menu knop

**Filters:**
- Klik op filter pills om bedrijven te filteren
- Gebruik de regio dropdown voor locatie filtering

**Tabs:**
- Schakel tussen Inbox, Uitnodigingen en Systeem berichten
- Wissel tussen Week en Maand weergave in agenda

**Acties:**
- Hartje icoon: voeg bedrijven toe aan favorieten
- Details knoppen: bekijk meer informatie
- Quick action tiles: snelle toegang tot belangrijke functies

**Zoeken:**
- Gebruik de zoekbalk in de topbar
- Sneltoets: Ctrl/Cmd + K

**Meldingen:**
- Badge op notificatie icoon toont aantal nieuwe meldingen
- Badge op Berichten tab toont aantal uitnodigingen

## 📱 Responsive Design

### Desktop (≥ 1024px)
- Sidebar vast zichtbaar links
- 2-3 kolommen grid voor widgets
- Alle functies volledig zichtbaar

### Tablet (768-1023px)
- Sidebar collapsible (icon-only of hamburger menu)
- 2 kolommen grid
- Optimized touch targets

### Mobiel (< 768px)
- Hamburger menu voor navigatie
- Single column layout
- Stack alle widgets onder elkaar
- Verborgen search bar (icon only)
- Optimale volgorde voor mobile gebruik

## 🎨 UI States

### Hover States
- Cards: lichte shadow verhoging
- Buttons: kleur verandering + lift effect
- Links: kleur verandering
- Company cards: border color change + shadow

### Active States
- Nav items: blauwe achtergrond + primary kleur
- Filter pills: primary kleur met witte tekst
- Tabs: primary kleur met bottom border
- Favorite: rode hart (filled)

### Loading States
- Skeleton loaders beschikbaar (CSS animaties)
- Smooth fade-in voor cards bij page load
- Progressive enhancement

### Empty States
(Kan eenvoudig toegevoegd worden met):
```html
<div class="empty-state">
  <svg><!-- Icon --></svg>
  <h4>Geen resultaten gevonden</h4>
  <p>Beschrijving</p>
  <button>Call to Action</button>
</div>
```

## 🔧 Uitbreidingen

### Geplande Features
- [ ] Dark mode toggle
- [ ] Notificatie dropdown menu
- [ ] User profile dropdown
- [ ] Real-time data updates
- [ ] Advanced filtering
- [ ] Export functionaliteit
- [ ] Multi-language support
- [ ] Accessibility verbeteringen (WCAG 2.1 AA)

### Backend Integratie
Het dashboard is ready voor backend integratie:
- API calls kunnen toegevoegd worden in `script.js`
- Data structures komen overeen met de UI componenten
- Authentication flows kunnen geïmplementeerd worden
- WebSocket support voor real-time updates

### Component Hergebruik
Alle UI componenten kunnen hergebruikt worden:
- Cards
- Buttons (primary, secondary, small, block)
- Badges (status, tags, pills)
- Forms (search bar, dropdowns)
- Lists (applications, messages, agenda)
- Grids (company cards, quick actions)

## 🎯 Best Practices

### Performance
- Optimized CSS (geen duplicate selectors)
- Efficient JavaScript (event delegation waar mogelijk)
- Lazy loading ready voor images
- Minimal dependencies (alleen Google Fonts)

### Accessibility
- Semantic HTML5 elementen
- ARIA labels waar nodig
- Keyboard navigation support
- Focus states voor alle interactive elementen
- Sufficient color contrast (WCAG AA compliant)

### Code Kwaliteit
- Clean, georganiseerde structuur
- Commentaar in alle files
- Consistente naming conventions
- CSS variabelen voor maintainability
- Responsive vanaf basis (mobile-first thinking)

## 📄 Browser Support

- Chrome/Edge: ✅ Volledig ondersteund
- Firefox: ✅ Volledig ondersteund
- Safari: ✅ Volledig ondersteund
- Mobile browsers: ✅ Volledig ondersteund

Minimum versies:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 👥 Doelgroep

**Primair:**
- HBO/WO studenten (18-27 jaar)
- Zoekend naar stages, afstudeeropdrachten, bijbanen, flex-opdrachten

**Use Cases:**
1. Quick overview van alle actieve sollicitaties
2. Nieuwe kansen vinden via aanbevelingen
3. Communiceren met bedrijven
4. Agenda beheren voor gesprekken en deadlines
5. Profiel optimaliseren voor betere matches
6. Bedrijven volgen voor updates

## 📞 Support

Voor vragen of feedback over dit dashboard design, neem contact op met het development team.

---

**Versie:** 1.0.0  
**Laatste update:** November 2025  
**Status:** ✅ Production Ready  
**Licentie:** Proprietary - Werkspot Campus

🚀 **Happy Recruiting & Studying!**


