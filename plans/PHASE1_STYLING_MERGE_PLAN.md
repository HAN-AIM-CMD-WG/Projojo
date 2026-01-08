# Phase 1: Styling Merge Plan

**Target Branch**: `updating-deployment-with-new-styling`  
**Source Branch**: `next-ui`  
**Goal**: Merge neumorphic styling from next-ui without breaking existing functionality

---

## Overview

| Current State (main) | Target State (next-ui styling) |
|----------------------|-------------------------------|
| Primary color: #e50056 (HAN Pink) | Primary color: #FF7F50 (Coral) |
| Basic button styles (.btn-*) | Neumorphic button styles (.neu-btn-*) |
| No custom fonts | Nunito font + Material Symbols |
| No neumorphic shadows | Full neumorphic design system |
| 171 lines in index.css | ~600 lines in index.css |

---

## Step-by-Step Plan

### Step 1: Create Backup Branch

**Action**: Create a safety backup of current state

```bash
git checkout updating-deployment-with-new-styling
git checkout -b backup/pre-styling-merge
git checkout updating-deployment-with-new-styling
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Forgetting to create backup | Low | High | Do this first, verify with `git branch -a` |

**Verification**: `git branch -a | grep backup` should show the backup branch

---

### Step 2: Update index.html with Fonts and CDN Links

**Action**: Add external resources to `projojo_frontend/index.html`

**Current state** (minimal):
```html
<!doctype html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Opdrachtenbox</title>
</head>
```

**Target state** (add before `</head>`):
```html
  <!-- Google Fonts - Nunito -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Material Symbols Icons -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  
  <!-- Leaflet CSS (for maps) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
        crossorigin="" />
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CDN downtime | Very Low | Medium | Google Fonts/unpkg are highly reliable; fallback fonts will render |
| Font flash (FOUT) | Low | Low | `display=swap` already included |
| Leaflet CSS not needed yet | None | None | Loading unused CSS is harmless; prepares for future map integration |
| Material Symbols not used immediately | None | None | Icons will be available when components are updated |

**Verification**: 
- Run `npm run dev`
- Open browser DevTools > Network tab
- Confirm fonts are loading (200 status)

---

### Step 3: Change Primary Color in CSS Variables

**Action**: Update color theme from Pink to Coral in `projojo_frontend/src/index.css`

**Changes** (search and replace):

| Location | Current | Target |
|----------|---------|--------|
| Line 8 | `--color-primary: #e50056;` | `--color-primary: #FF7F50;` |
| Line 9 | `--color-dark-primary: #cf004e;` | `--color-dark-primary: #FF6347;` |
| Line 101 | `--primary: #e50056;` | `--primary: #FF7F50;` |

Also update focus ring color references:

| Location | Current | Target |
|----------|---------|--------|
| Line 39 | `focus:ring-pink-300` | `focus:ring-orange-300` |
| Line 43 | `focus:ring-pink-300` | `focus:ring-orange-300` |

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Miss some pink references | Medium | Low | Global search for "pink" after changes |
| Insufficient contrast on coral | Low | Medium | Coral (#FF7F50) has good contrast; test visually |
| User preference for old color | N/A | N/A | Business decision, not technical risk |

**Verification**:
- `grep -r "pink\|e50056\|cf004e" projojo_frontend/src/` should return minimal results
- Visual check that buttons are now coral/orange

---

### Step 4: Add Neumorphic Color Variables

**Action**: Add neumorphic theme variables to the first `@theme` block (after line 17)

**Add this block**:
```css
@theme {
    /* Existing colors... */
    
    /* Neumorphic Colors */
    --color-neu-bg: #EFEEEE;
    --color-neu-light: #FFFFFF;
    --color-neu-dark: #D1D9E6;
    
    /* Text Colors - Gemini Design */
    --color-text-primary: #2D3748;
    --color-text-secondary: #4A5568;
    --color-text-muted: #718096;
    --color-text-light: #A0AEC0;
    
    /* Coral Primary Variants */
    --color-light-primary: #FFA07A;
    --color-primary-dark: #E06A3D;
    
    /* Gray Scale */
    --color-gray-200: #E5E7EB;
    --color-gray-300: #D1D5DB;
    --color-gray-400: #9CA3AF;
    --color-gray-500: #6B7280;
    --color-gray-600: #4B5563;
    --color-gray-700: #374151;
    --color-gray-800: #1F2937;
}
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Variable name conflicts | Low | Low | Prefix all new vars with `neu-` or use unique names |
| CSS parsing errors | Low | High | Test immediately after changes with `npm run dev` |

**Verification**:
- No CSS errors in browser console
- Variables accessible via DevTools (Elements > Computed > show all)

---

### Step 5: Add Neumorphic Component Classes

**Action**: Add the neumorphic design system classes to `@layer components` section

**Add this after the existing `.btn-secondary` class** (large block, ~350 lines):

```css
    /* ===========================================
       NEUMORPHIC DESIGN SYSTEM - Coral Theme
       =========================================== */

    /* --- Base: Elevated Card (Level 1) --- */
    .neu-flat {
        @apply bg-neu-bg;
        border-radius: 1.5rem;
        box-shadow: 6px 6px 12px #D1D9E6, -6px -6px 12px #FFFFFF;
        border: 1px solid rgba(255,255,255,0.4);
    }

    /* Large card variant */
    .neu-flat-xl {
        @apply bg-neu-bg;
        border-radius: 2rem;
        box-shadow: 6px 6px 12px #D1D9E6, -6px -6px 12px #FFFFFF;
        border: 1px solid rgba(255,255,255,0.4);
    }

    /* Interactive hover effect */
    .neu-flat-interactive {
        @apply bg-neu-bg;
        border-radius: 1.5rem;
        box-shadow: 6px 6px 12px #D1D9E6, -6px -6px 12px #FFFFFF;
        border: 1px solid rgba(255,255,255,0.4);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.3s ease;
    }

    .neu-flat-interactive:hover {
        transform: translateY(-6px);
        box-shadow: 10px 10px 24px #D1D9E6, -10px -10px 24px #FFFFFF;
        border-color: rgba(255, 127, 80, 0.2);
    }

    /* --- Pressed/Inset (for inputs & containers) --- */
    .neu-pressed {
        @apply bg-neu-bg;
        border-radius: 1rem;
        box-shadow: inset 4px 4px 8px #D1D9E6, inset -4px -4px 8px #FFFFFF;
    }

    /* --- Interactive Buttons --- */
    .neu-btn {
        @apply bg-neu-bg font-bold transition-all duration-200 cursor-pointer inline-flex items-center justify-center;
        color: #4A5568;
        border-radius: 0.75rem;
        padding: 0.625rem 1.25rem;
        box-shadow: 5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF;
    }

    .neu-btn:hover {
        color: #FF7F50;
        transform: translateY(-2px);
        box-shadow: 6px 6px 14px #D1D9E6, -6px -6px 14px #FFFFFF;
    }

    .neu-btn:active {
        transform: translateY(0);
        box-shadow: inset 3px 3px 6px #D1D9E6, inset -3px -3px 6px #FFFFFF;
    }

    /* --- Primary Button --- */
    .neu-btn-primary {
        @apply font-bold transition-all duration-200 cursor-pointer inline-flex items-center justify-center;
        background: #FF7F50;
        color: white;
        border-radius: 0.75rem;
        padding: 0.625rem 1.25rem;
        box-shadow: 5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF;
    }

    .neu-btn-primary:hover {
        background: #FF6347;
        transform: translateY(-2px);
    }

    .neu-btn-primary:active {
        transform: translateY(0);
        box-shadow: inset 3px 3px 6px rgba(0,0,0,0.2);
    }

    /* --- Outline Button --- */
    .neu-btn-outline {
        @apply font-bold transition-all duration-200 cursor-pointer inline-flex items-center justify-center;
        background: #EFEEEE;
        color: #FF7F50;
        border: 2px solid #FF7F50;
        border-radius: 0.75rem;
        padding: 0.5rem 1.125rem;
        box-shadow: 4px 4px 8px #D1D9E6, -4px -4px 8px #FFFFFF;
    }

    .neu-btn-outline:hover {
        background: rgba(255, 127, 80, 0.08);
        transform: translateY(-2px);
    }

    /* --- Input Fields --- */
    .neu-input {
        @apply bg-neu-bg outline-none transition-all duration-200;
        color: #4A5568;
        font-weight: 600;
        border-radius: 1rem;
        padding: 1rem 1.5rem;
        box-shadow: inset 4px 4px 8px #D1D9E6, inset -4px -4px 8px #FFFFFF;
    }

    .neu-input::placeholder {
        color: #A0AEC0;
    }

    .neu-input:focus {
        box-shadow: inset 4px 4px 8px #D1D9E6, inset -4px -4px 8px #FFFFFF, 0 0 0 2px rgba(255, 127, 80, 0.2);
    }

    /* --- Card Variants --- */
    .neu-card-lg {
        @apply bg-neu-bg transition-all duration-200;
        border-radius: 2rem;
        padding: 1.5rem;
        box-shadow: 6px 6px 12px #D1D9E6, -6px -6px 12px #FFFFFF;
        border: 1px solid rgba(255,255,255,0.4);
    }

    /* --- Skill Badges --- */
    .skill-badge {
        @apply inline-flex items-center px-4 py-2 text-xs font-bold rounded-full cursor-default;
        @apply bg-white/50 text-gray-600 border border-gray-300;
    }

    .skill-badge-own {
        @apply inline-flex items-center px-4 py-2 text-xs font-bold rounded-full cursor-default;
        @apply bg-primary text-white;
        box-shadow: 0 2px 4px rgba(255, 127, 80, 0.3);
    }

    /* --- Status Badges (Glassmorphism) --- */
    .neu-badge-success {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        backdrop-filter: blur(12px);
        color: #15803d;
        background: rgba(220, 252, 231, 0.9);
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .neu-badge-warning {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        backdrop-filter: blur(12px);
        color: #b45309;
        background: rgba(254, 249, 195, 0.9);
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .neu-badge-error {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        backdrop-filter: blur(12px);
        color: #dc2626;
        background: rgba(254, 226, 226, 0.9);
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .neu-badge-primary-solid {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: white;
        background: var(--color-primary);
        box-shadow: 0 2px 8px rgba(255, 127, 80, 0.3);
    }

    /* --- Progress Bar --- */
    .neu-progress {
        @apply w-full overflow-hidden;
        height: 0.625rem;
        background: #E5E7EB;
        border-radius: 9999px;
        box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
    }

    .neu-progress-bar {
        @apply h-full transition-all duration-1000;
        background: #FF7F50;
        border-radius: 9999px;
    }

    /* --- Animations --- */
    .fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
        transform: translateY(10px);
    }

    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.2s ease-out forwards;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* --- Custom Scrollbar --- */
    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: #CBD5E0;
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #A0AEC0;
    }
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CSS syntax errors | Medium | High | Validate with CSS linter; test immediately |
| Tailwind class conflicts | Low | Medium | New classes use `neu-` prefix to avoid conflicts |
| Class specificity issues | Low | Low | All classes are at component layer level |
| File becomes too large | Low | Low | 600 lines is manageable; can split later if needed |

**Verification**:
- `npm run dev` starts without errors
- Browser console shows no CSS-related errors
- DevTools shows `.neu-btn` class is defined

---

### Step 6: Add Leaflet Z-Index Fix

**Action**: Add at the end of `index.css`, outside `@layer components`:

```css
/* Leaflet map z-index fixes */
.leaflet-container {
    z-index: 0 !important;
}

.leaflet-pane,
.leaflet-control {
    z-index: 1 !important;
}
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Leaflet not used yet | None | None | Preparing for future; harmless if not used |
| Z-index conflicts | Low | Low | Only affects Leaflet containers |

**Verification**: No errors; Leaflet will work correctly when maps are added later

---

### Step 7: Create a Test Page to Verify Styling

**Action**: Create a simple test file to verify all new styles work

Create `projojo_frontend/src/pages/StyleTestPage.jsx`:
```jsx
// Temporary test page - DELETE AFTER VERIFICATION
export default function StyleTestPage() {
  return (
    <div className="min-h-screen bg-neu-bg p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Styling Test Page</h1>
      
      {/* Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="btn-primary">Old btn-primary</button>
          <button className="neu-btn">neu-btn</button>
          <button className="neu-btn-primary">neu-btn-primary</button>
          <button className="neu-btn-outline">neu-btn-outline</button>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Cards</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="neu-flat p-6 w-64">
            <h3 className="font-bold">neu-flat Card</h3>
            <p className="text-gray-600">Basic elevated card</p>
          </div>
          <div className="neu-flat-interactive p-6 w-64">
            <h3 className="font-bold">neu-flat-interactive</h3>
            <p className="text-gray-600">Hover to see effect</p>
          </div>
          <div className="neu-pressed p-6 w-64">
            <h3 className="font-bold">neu-pressed</h3>
            <p className="text-gray-600">Inset container</p>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Inputs</h2>
        <input className="neu-input w-64" placeholder="neu-input placeholder" />
      </section>

      {/* Badges */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <span className="skill-badge">skill-badge</span>
          <span className="skill-badge-own">skill-badge-own</span>
          <span className="neu-badge-success">Success</span>
          <span className="neu-badge-warning">Warning</span>
          <span className="neu-badge-error">Error</span>
          <span className="neu-badge-primary-solid">Primary</span>
        </div>
      </section>

      {/* Progress */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Progress</h2>
        <div className="neu-progress w-64">
          <div className="neu-progress-bar" style={{width: '60%'}}></div>
        </div>
      </section>

      {/* Animation */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Animation (refresh to see)</h2>
        <div className="neu-flat p-6 w-64 fade-in-up">
          <p>This fades in and up</p>
        </div>
      </section>
    </div>
  );
}
```

**Add temporary route in App.jsx** (add before `<Route path="*" ...>`):
```jsx
<Route path="/style-test" element={<StyleTestPage />} />
```

And add import at top:
```jsx
import StyleTestPage from './pages/StyleTestPage';
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Forgetting to remove test page | Medium | Low | Add TODO comment; remove after verification |
| Test page route conflicts | None | None | `/style-test` is unique |

**Verification**:
- Navigate to `http://localhost:5173/style-test`
- All elements should render with new styling
- No CSS errors in console

---

### Step 8: Visual Testing & Regression Check

**Action**: Test existing pages still work correctly

**Test checklist**:
- [ ] Login page renders correctly
- [ ] Home page (OverviewPage) renders correctly
- [ ] Profile page renders correctly
- [ ] Business page renders correctly
- [ ] Project details page renders correctly
- [ ] All existing buttons still work
- [ ] Colors are consistent (coral, not pink)
- [ ] No visual regressions

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Old `.btn-primary` looks different | Expected | Low | Old styles still work; can migrate later |
| Background color mismatch | Low | Medium | May need to add `bg-neu-bg` to some containers |
| Hover states look inconsistent | Medium | Low | Mix of old and new styles; expected during transition |

**Verification**: Manual visual testing of all main pages

---

### Step 9: Clean Up Test Artifacts

**Action**: Remove test page and route after verification

1. Delete `projojo_frontend/src/pages/StyleTestPage.jsx`
2. Remove route from `App.jsx`
3. Remove import from `App.jsx`

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Accidentally breaking App.jsx | Low | High | Remove only test-related lines; verify app starts |

**Verification**: App runs without errors after cleanup

---

### Step 10: Commit and Push

**Action**: Commit all changes with descriptive message

```bash
git add projojo_frontend/index.html projojo_frontend/src/index.css
git commit -m "feat(styling): Add neumorphic design system from next-ui

- Add Coral color scheme (#FF7F50) replacing HAN Pink
- Add neumorphic CSS classes (neu-flat, neu-btn, neu-pressed, etc.)
- Add glassmorphism badge styles
- Add Nunito font and Material Symbols icons
- Add Leaflet CSS CDN for future map support
- Add custom scrollbar styling
- Add fade animations

This is Phase 1 of the next-ui merge - styling only, no functional changes."

git push origin updating-deployment-with-new-styling
```

**Risks**:
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Push fails (protected branch) | Low | Low | Verify branch permissions |
| Merge conflict on push | Low | Medium | Pull first if needed |

---

## Summary Checklist

| Step | Description | Risk Level |
|------|-------------|------------|
| 1 | Create backup branch | Low |
| 2 | Update index.html with fonts | Low |
| 3 | Change primary color | Low |
| 4 | Add neumorphic variables | Low |
| 5 | Add neumorphic classes | Medium |
| 6 | Add Leaflet z-index fix | None |
| 7 | Create test page | Low |
| 8 | Visual testing | Low |
| 9 | Clean up test artifacts | Low |
| 10 | Commit and push | Low |

**Total estimated time**: 2-3 hours

---

## What This Phase Does NOT Include

To keep Phase 1 focused on styling only, we are NOT doing:

- ❌ Changing App.jsx routing structure
- ❌ Adding new pages (LandingPage, Dashboards, etc.)
- ❌ Adding new components (LocationMap, etc.)
- ❌ Adding StudentSkillsContext
- ❌ Changing component logic
- ❌ Backend changes
- ❌ Package.json changes (Leaflet JS library - CSS only via CDN)

These will be addressed in Phase 2 and beyond.
