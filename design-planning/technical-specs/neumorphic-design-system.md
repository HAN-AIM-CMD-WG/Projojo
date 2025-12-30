# Neumorphic Design System Specification

## 🎨 Design Philosophy

Het nieuwe Projojo design system implementeert **toegankelijke neumorphism** - een moderne designtrend die zachte, verheven oppervlakken creëert door gebruik van subtiele schaduwen en highlights. De focus ligt op functionaliteit, toegankelijkheid en gebruikerservaring.

## 🎯 Design Principles

1. **Accessibility First**: Hoge contrast, keyboard navigatie, screen reader support
2. **Functional Beauty**: Esthetiek ondersteunt functionaliteit, niet andersom
3. **Consistent Interaction**: Voorspelbare hover/focus/active states
4. **Responsive Design**: Mobile-first approach met adaptive layouts
5. **Performance**: Minimal CSS, optimized animations

## 🎨 Color Palette

### Primary Colors
```css
:root {
  --primary: #e50056;           /* Brand primary (existing) */
  --primary-dark: #cf004e;      /* Darker variant for hover */
  --primary-light: #ff1a70;     /* Lighter variant for accents */
}
```

### Neumorphic Background System
```css
:root {
  --neuro-bg: #f0f0f3;         /* Main background */
  --neuro-light: #ffffff;      /* Light shadow/highlight */
  --neuro-dark: #d0d0d3;       /* Dark shadow */
  --neuro-darker: #a0a0a3;     /* Progress bars, disabled states */
}
```

### Semantic Colors
```css
:root {
  --success: #22bb33;          /* Success states, completed items */
  --warning: #f0ad4e;          /* Warning states, pending items */
  --error: #bb2124;            /* Error states, failed items */
  --info: #4c79ff;             /* Info states, new items */
}
```

### Text Colors (High Contrast)
```css
:root {
  --text-primary: #2d3748;     /* Primary text - high contrast */
  --text-secondary: #4a5568;   /* Secondary text */
  --text-muted: #718096;       /* Muted text, descriptions */
  --text-inverse: #ffffff;     /* Text on colored backgrounds */
}
```

## 🧱 Core Components

### 1. Neumorphic Card (.neuro-card)
```css
.neuro-card {
  background: var(--neuro-bg);
  box-shadow: 
    20px 20px 60px var(--neuro-dark), 
    -20px -20px 60px var(--neuro-light);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.neuro-card:hover {
  box-shadow: 
    25px 25px 75px var(--neuro-dark), 
    -25px -25px 75px var(--neuro-light);
  transform: translateY(-2px);
}
```

### 2. Neumorphic Button (.neuro-button)
```css
.neuro-button {
  background: var(--neuro-bg);
  box-shadow: 
    8px 8px 16px var(--neuro-dark), 
    -8px -8px 16px var(--neuro-light);
  border: none;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.neuro-button:hover {
  box-shadow: 
    12px 12px 24px var(--neuro-dark), 
    -12px -12px 24px var(--neuro-light);
}

.neuro-button:active {
  box-shadow: 
    inset 8px 8px 16px var(--neuro-dark), 
    inset -8px -8px 16px var(--neuro-light);
}

.neuro-button:focus {
  outline: none;
  box-shadow: 
    8px 8px 16px var(--neuro-dark), 
    -8px -8px 16px var(--neuro-light),
    0 0 0 3px rgba(229, 0, 86, 0.3);
}
```

### 3. Neumorphic Input (.neuro-input)
```css
.neuro-input {
  background: var(--neuro-bg);
  box-shadow: 
    inset 8px 8px 16px var(--neuro-dark), 
    inset -8px -8px 16px var(--neuro-light);
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.neuro-input:focus {
  outline: none;
  box-shadow: 
    inset 8px 8px 16px var(--neuro-dark), 
    inset -8px -8px 16px var(--neuro-light),
    0 0 0 3px rgba(229, 0, 86, 0.3);
}

.neuro-input::placeholder {
  color: var(--text-muted);
}
```

### 4. Progress Bar (.neuro-progress)
```css
.neuro-progress {
  background: var(--neuro-darker);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 
    inset 4px 4px 8px var(--neuro-dark), 
    inset -4px -4px 8px var(--neuro-light);
}

.neuro-progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.neuro-progress-bar.primary {
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

.neuro-progress-bar.success {
  background: linear-gradient(90deg, var(--success), #39db4b);
}
```

### 5. Skill Badge (.skill-badge)
```css
.skill-badge {
  background: linear-gradient(145deg, var(--primary), var(--primary-dark));
  color: var(--text-inverse);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 
    6px 6px 12px var(--neuro-dark), 
    -6px -6px 12px var(--neuro-light);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.skill-badge:hover {
  transform: translateY(-1px);
  box-shadow: 
    8px 8px 16px var(--neuro-dark), 
    -8px -8px 16px var(--neuro-light);
}
```

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}

/* Responsive Padding */
.container-responsive {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container-responsive {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container-responsive {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
```

## ♿ Accessibility Features

### Focus Management
```css
.neuro-focusable:focus {
  outline: none;
  box-shadow: 
    /* Existing shadows */
    var(--existing-shadow),
    /* Focus ring */
    0 0 0 3px rgba(229, 0, 86, 0.3);
}

.neuro-focusable:focus-visible {
  /* Enhanced focus for keyboard navigation */
  box-shadow: 
    var(--existing-shadow),
    0 0 0 3px rgba(229, 0, 86, 0.5),
    0 0 0 6px rgba(229, 0, 86, 0.2);
}
```

### High Contrast Mode Support
```css
@media (prefers-contrast: high) {
  :root {
    --neuro-dark: #999999;
    --text-primary: #000000;
    --text-secondary: #333333;
  }
  
  .neuro-card {
    border: 1px solid var(--neuro-dark);
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .neuro-card:hover {
    transform: none;
  }
}
```

## 🎭 Animation System

### Micro-interactions
```css
@keyframes neuro-press {
  0% {
    box-shadow: 
      8px 8px 16px var(--neuro-dark), 
      -8px -8px 16px var(--neuro-light);
  }
  50% {
    box-shadow: 
      inset 4px 4px 8px var(--neuro-dark), 
      inset -4px -4px 8px var(--neuro-light);
  }
  100% {
    box-shadow: 
      8px 8px 16px var(--neuro-dark), 
      -8px -8px 16px var(--neuro-light);
  }
}

.neuro-button:active {
  animation: neuro-press 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Loading States
```css
@keyframes neuro-pulse {
  0%, 100% {
    box-shadow: 
      20px 20px 60px var(--neuro-dark), 
      -20px -20px 60px var(--neuro-light);
  }
  50% {
    box-shadow: 
      15px 15px 45px var(--neuro-dark), 
      -15px -15px 45px var(--neuro-light);
  }
}

.neuro-loading {
  animation: neuro-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
```

## 🚀 Implementation Strategy

### Phase 1: Core Components
1. Create base neumorphic utility classes
2. Implement card, button, input components
3. Add focus and accessibility features

### Phase 2: Complex Components
1. Navigation components
2. Dashboard widgets
3. Form components
4. Modal and overlay systems

### Phase 3: Interactions
1. Hover and focus animations
2. Loading states
3. Micro-interactions
4. Responsive behaviors

## 🧪 Testing Checklist

### Accessibility
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators are clearly visible
- [ ] Screen reader compatibility tested
- [ ] High contrast mode supported
- [ ] Reduced motion preferences respected

### Browser Compatibility
- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile browsers (iOS Safari, Android Chrome)

### Performance
- [ ] CSS bundle size optimized
- [ ] Animation performance (60fps)
- [ ] No layout shifts during interactions
- [ ] Efficient shadow rendering

---

*This specification serves as the foundation for implementing the new neumorphic design system in Projojo.*



