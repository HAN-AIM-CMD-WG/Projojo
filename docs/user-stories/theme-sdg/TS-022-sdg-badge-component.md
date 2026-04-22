# TS-022 — SDG Badge Component with Official UN Colors

**Phase**: 3 — Enhancements  
**Priority**: 🟡 Medium  
**Type**: Functional Story  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2I](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §3.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None (standalone component)  

---

## User Story

As any **user** (student, supervisor, teacher, or public visitor),  
I want to see SDG badges with official UN colors on themes,  
so that I understand the connection between project themes and the UN Sustainable Development Goals.

---

## Acceptance Criteria

### AC-1: SDG badge renders with correct UN color

**Given** a theme with `sdg_code = "SDG12"`  
**When** the SdgBadge component renders  
**Then** a badge is shown with the number "12"  
**And** the badge uses the official UN SDG 12 color (`#BF8B2E`)

### AC-2: All 17 UN SDG colors supported

**Given** SDG codes 1 through 17  
**When** each is rendered as an SdgBadge  
**Then** each displays the correct official UN color:

| SDG | Color |
|-----|-------|
| 1 | `#E5243B` |
| 2 | `#DDA63A` |
| 3 | `#4C9F38` |
| 4 | `#C5192D` |
| 5 | `#FF3A21` |
| 6 | `#26BDE2` |
| 7 | `#FCC30B` |
| 8 | `#A21942` |
| 9 | `#FD6925` |
| 10 | `#DD1367` |
| 11 | `#FD9D24` |
| 12 | `#BF8B2E` |
| 13 | `#3F7E44` |
| 14 | `#0A97D9` |
| 15 | `#56C02B` |
| 16 | `#00689D` |
| 17 | `#19486A` |

### AC-3: Tooltip shows Dutch SDG name

**Given** a badge for SDG 12  
**When** the user hovers over the badge  
**Then** a tooltip shows "Verantwoorde consumptie en productie"

### AC-4: Click opens UN SDG page

**Given** a badge for SDG 12  
**When** the user clicks it  
**Then** a new browser tab opens to `https://sdgs.un.org/goals/goal12`

### AC-5: Compound SDG codes render multiple badges

**Given** a theme with `sdg_code = "SDG2,SDG12"`  
**When** the SdgBadge component receives this compound code  
**Then** two separate badges are rendered: one for SDG 2 and one for SDG 12  
**And** each has its own correct color, tooltip, and link

### AC-6: Null SDG code renders nothing

**Given** a theme with `sdg_code = null`  
**When** the SdgBadge component receives null  
**Then** no badge is rendered  
**And** no error is thrown

### AC-7: Badge text is legible

**Given** any SDG badge with a dark background (e.g. SDG 17: `#19486A`)  
**When** rendered  
**Then** the number text is white for contrast  

**Given** any SDG badge with a light background (e.g. SDG 7: `#FCC30B`)  
**When** rendered  
**Then** the number text is dark for contrast

### AC-8: Accessible

**Given** an SdgBadge  
**When** a screen reader encounters it  
**Then** it announces the full SDG name (e.g. "SDG 12: Verantwoorde consumptie en productie")  
**And** the link is keyboard-focusable with a visible focus indicator

---

## Technical Notes

- **New component**: `projojo_frontend/src/components/SdgBadge.jsx`
- **Props API**:
  ```jsx
  <SdgBadge sdgCode="SDG12" />           // single badge
  <SdgBadge sdgCode="SDG2,SDG12" />      // compound → renders multiple
  <SdgBadge sdgCode={null} />             // renders nothing
  ```
- **SDG data**: Store the 17 SDG colors and Dutch names as a constant map within the component
- **Dutch SDG names** (full list in [THEME_SDG_IMPLEMENTATION_PLAN.md §3.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)):
  - SDG1: Geen armoede, SDG2: Geen honger, SDG3: Goede gezondheid en welzijn, SDG4: Kwaliteitsonderwijs, SDG5: Gendergelijkheid, SDG6: Schoon water en sanitair, SDG7: Betaalbare en duurzame energie, SDG8: Waardig werk en economische groei, SDG9: Industrie, innovatie en infrastructuur, SDG10: Ongelijkheid verminderen, SDG11: Duurzame steden en gemeenschappen, SDG12: Verantwoorde consumptie en productie, SDG13: Klimaatactie, SDG14: Leven in het water, SDG15: Leven op het land, SDG16: Vrede, justitie en sterke instellingen, SDG17: Partnerschap om doelstellingen te bereiken
- **Contrast**: Use a simple luminance check (`(r*0.299 + g*0.587 + b*0.114) > 186 ? dark : white`) for text color
- **Accessibility**: `aria-label` with full SDG name, `role="link"`, keyboard focusable
