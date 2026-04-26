---
version: alpha
name: Projojo
description: Implementation-first design system for the shipped Projojo frontend.
colors:
  primary: "#FF7F50"
  primary-hover: "#FF6347"
  primary-light: "#FFA07A"
  primary-dark: "#E06A3D"
  surface: "#EFEEEE"
  text-primary: "#2D3748"
  text-secondary: "#4A5568"
  text-muted: "#718096"
  success: "#22C55E"
  warning: "#F59E0B"
  error: "#EF4444"
  dark-surface: "#1A1512"
  dark-text-primary: "#F5F0EB"
  dark-text-secondary: "#C9B8A8"
  high-contrast-primary: "#C65030"
typography:
  display-hero:
    fontFamily: Nunito
    fontSize: 48px
    fontWeight: 900
    lineHeight: 1.1
  page-title:
    fontFamily: Nunito
    fontSize: 30px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.02em
  card-title:
    fontFamily: Nunito
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.2
  body-md:
    fontFamily: Nunito
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: Nunito
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
rounded:
  button: 12px
  input: 16px
  surface: 24px
  surface-xl: 32px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

# Design System

## Overview

Projojo is a Dutch educational platform that connects students, businesses, supervisors, and teachers around real projects. Students use it to find relevant real-world experience and build credible portfolio evidence. Businesses and supervisors use it to frame meaningful practice-based work and connect that work to suitable students. Teachers use it to maintain oversight, educational quality, and alignment with learning goals. The interface should help these roles move through matching, discovery, project coordination, and portfolio-building with as little friction as possible.

The shipped interface is warm, academic, and encouraging rather than corporate-cold or playful. The primary emotional goal is **welcoming**: the product should feel structured, supportive, and trustworthy from the first screen onward. The voice should feel clear, supportive, and credible rather than sales-driven or trendy. The default UI language is accessible coral neumorphism: soft raised surfaces, inset trays, rounded shapes, high text clarity, and restrained interaction feedback.

This document is implementation-first. The primary source of truth is the shipped frontend in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css), then [`CLAUDE.md`](CLAUDE.md), then [`design-planning/technical-specs/neumorphic-design-system.md`](design-planning/technical-specs/neumorphic-design-system.md), then [`projojo_frontend/src/DESIGN_SYSTEM.md`](projojo_frontend/src/DESIGN_SYSTEM.md). If this document disagrees with shipped code, shipped code wins and this file should be updated.

The YAML front matter captures stable light-mode tokens only. Dark mode, high-contrast mode, and component state variants are normative in the markdown body because the implementation relies heavily on CSS variables and mode-specific overrides in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:140).

Two visual modes coexist in the product:

- **Application shell**: the default language. This is the neumorphic system built from [`.neu-flat`](projojo_frontend/src/index.css:402), [`.neu-pressed`](projojo_frontend/src/index.css:441), [`.neu-btn`](projojo_frontend/src/index.css:455), and [`.neu-input`](projojo_frontend/src/index.css:576).
- **Public marketing / discovery accents**: selective gradients, blur, and hero imagery appear in [`LandingPage`](projojo_frontend/src/pages/LandingPage.jsx:75) and public project detail views in [`PublicDiscoveryPage`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:499). These are accents, not the baseline for the rest of the app.

## Colors

The shipped default palette is coral, not HAN pink. The older HAN-pink spec remains a historical design direction, and the alternate themes in [`DesignDemoPage`](projojo_frontend/src/pages/DesignDemoPage.jsx:10) are exploratory. The actual product default is defined by [`--primary`](projojo_frontend/src/index.css:112), [`--primary-color`](projojo_frontend/src/index.css:271), and the supporting neutrals in [`:root`](projojo_frontend/src/index.css:256).

### Core palette

- **Primary coral**: `#FF7F50`. Use for the main call to action, focus emphasis, active states, key icons, and important inline highlights.
- **Primary hover**: `#FF6347`. Use for hover and pressed refinement on the primary action layer.
- **Surface**: `#EFEEEE`. This is the default page and component base for the neumorphic system.
- **Text primary**: `#2D3748`. Use for page titles, card titles, and high-priority content.
- **Text secondary**: `#4A5568`. Use for standard UI copy and supportive content.
- **Text muted**: `#718096`. Use for metadata, labels, helper copy, and lower-priority information.

### Semantic colors

Semantic states exist, but they are not allowed to overwhelm the coral-led system.

- Success uses green in [`.neu-badge-success`](projojo_frontend/src/index.css:735) and [`.neu-badge-success-solid`](projojo_frontend/src/index.css:831).
- Warning uses amber in [`.neu-badge-warning`](projojo_frontend/src/index.css:754) and [`.neu-badge-warning-solid`](projojo_frontend/src/index.css:843).
- Error uses red in [`.neu-badge-error`](projojo_frontend/src/index.css:773) and [`.neu-badge-error-solid`](projojo_frontend/src/index.css:855).
- Info uses blue in [`.neu-badge-info`](projojo_frontend/src/index.css:792).

Use semantic colors for status, alerts, inline feedback, and progress context. Do not let them replace coral as the primary product identity.

### Color usage rules

- Use the primary color for the single most important action in a local area.
- Keep most surfaces neutral. Coral should read as emphasis, not wallpaper.
- Use text colors by hierarchy, not by personal taste.
- Use gradients sparingly. In the shipped UI they mostly appear in public-facing hero and CTA areas, not in the app shell.
- Do not reintroduce cold institutional blues or neon startup accents as defaults.

### Documented divergence

[`design-planning/technical-specs/neumorphic-design-system.md`](design-planning/technical-specs/neumorphic-design-system.md) defines HAN pink as primary. That is not the shipped default. The current implementation is coral-first and this document treats coral as canonical.

## Typography

Typography is defined by usage more than by a formal token scale. The product loads **Nunito** globally in [`projojo_frontend/index.html`](projojo_frontend/index.html:12) and uses **Material Symbols Outlined** for icons in [`projojo_frontend/index.html`](projojo_frontend/index.html:14). The overall voice is soft, friendly, and legible, but the hierarchy is assertive. Titles are usually bold or black; body text remains readable and informal.

### Type roles

- **Hero display**: large, black-weight headlines such as the landing hero in [`LandingPage`](projojo_frontend/src/pages/LandingPage.jsx:166). Use this only for public-facing hero moments.
- **Page title**: strong, practical headings such as [`PageHeader`](projojo_frontend/src/components/PageHeader.jsx:4). This is the standard app-level title pattern.
- **Card title**: compact but emphatic, usually `text-lg` with `font-extrabold`, as seen in [`TaskCard`](projojo_frontend/src/components/TaskCard.jsx:69).
- **Body copy**: default Tailwind body sizing with muted or secondary text colors. Public-facing marketing copy may scale larger, but app copy should remain compact and scan-friendly.
- **Labels / metadata**: uppercase micro-labels in [`.neu-label`](projojo_frontend/src/index.css:1027) and [`.neu-label-sm`](projojo_frontend/src/index.css:1035).

### Typography rules

- Use bold weight to establish hierarchy before increasing color intensity.
- Keep page titles and card titles short and direct.
- Use muted text for supportive context, never for critical information.
- Use uppercase labels only for metadata, sections, tabs, and status framing.
- Do not mix decorative font stacks. Nunito is the shipped system font and remains the default until code changes.

## Layout

The layout system is mobile-first and pragmatic. It relies on familiar max-width containers, standard Tailwind breakpoints, and a small set of repeatable grid patterns rather than a bespoke grid engine.

### Containment

- The authenticated app shell uses a `max-w-7xl` container with horizontal padding in [`App`](projojo_frontend/src/App.jsx:231) and [`Navbar`](projojo_frontend/src/components/Navbar.jsx:110).
- Public discovery detail uses a narrower `max-w-4xl` content column in [`PublicDiscoveryPage`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:547).
- Marketing landing sections also use `max-w-7xl` containment in [`LandingPage`](projojo_frontend/src/pages/LandingPage.jsx:83) and [`LandingPage`](projojo_frontend/src/pages/LandingPage.jsx:154).

### Grid patterns

Common patterns in the shipped UI:

- `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` for business and project card collections in [`PublicDiscoveryPage`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:407) and dashboard pages.
- `grid-cols-1 lg:grid-cols-3` for dashboard summaries and mixed content columns.
- `grid-cols-2 md:grid-cols-4` for compact metrics in public detail views in [`PublicDiscoveryPage`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:549).

### Spacing rules

- `gap-4` and `gap-6` are the dominant layout rhythms.
- Card interiors generally use `p-4`, `p-5`, or `p-6`.
- Public CTA and hero sections expand toward `p-8` and above.
- Maintain a clear separation between stacked sections with `space-y-5`, `space-y-6`, or `space-y-8` rather than ad hoc margins.

### Layout rules

- Keep the app shell orderly and predictable.
- Use more expressive asymmetric composition only in public-facing marketing sections.
- Do not nest raised cards inside raised cards without a clear semantic reason.
- Prefer grid layouts over percentage-based flex hacks.

## Elevation & Depth

Projojo uses a layered surface model. Depth is meaningful. It indicates grouping, emphasis, and affordance.

### Surface model

- **Raised surface**: [`.neu-flat`](projojo_frontend/src/index.css:402). This is the standard card surface.
- **Large raised surface**: [`.neu-flat-xl`](projojo_frontend/src/index.css:410). Use for prominent grouped blocks or CTA sections.
- **Interactive raised surface**: [`.neu-flat-interactive`](projojo_frontend/src/index.css:418). Use where hover lift is part of the interaction contract.
- **Inset surface**: [`.neu-pressed`](projojo_frontend/src/index.css:441). Use for trays, selection groups, tab wells, compact panels, and visually recessed content.
- **Deep inset surface**: [`.neu-pressed-deep`](projojo_frontend/src/index.css:448). Use only when a stronger recessed effect is necessary.
- **Utility glass-lite surface**: [`.neu-task-box`](projojo_frontend/src/index.css:1100) and the badge family. These are lighter-weight overlays, not primary structural surfaces.

### Depth rules

- Raised surfaces communicate grouping and objecthood.
- Inset surfaces communicate containment, state wells, and substructure.
- Hover lift is reserved for surfaces that can be acted on.
- Inset and raised surfaces can coexist, but the relationship must be obvious.
- Shadows are soft and wide in light mode, warmer and darker in dark mode.
- High contrast mode removes most neumorphic shadows and replaces them with clear borders in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:1211).

### Marketing exceptions

The landing page and some public surfaces layer blur, gradients, and strong hero imagery on top of the core system in [`LandingPage`](projojo_frontend/src/pages/LandingPage.jsx:76) and [`PublicDiscoveryPage`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:502). Treat these as accent treatments for acquisition and discovery. Do not spread them across the whole authenticated product.

## Shapes

The shape language is rounded, soft, and consistent.

- Standard action buttons use `12px` radii in [`.neu-btn`](projojo_frontend/src/index.css:459), [`.neu-btn-primary`](projojo_frontend/src/index.css:480), and [`.neu-btn-text`](projojo_frontend/src/index.css:522).
- Inset surfaces generally use `16px` radii in [`.neu-pressed`](projojo_frontend/src/index.css:443) and [`.neu-input`](projojo_frontend/src/index.css:581).
- Raised cards usually use `24px` radii in [`.neu-flat`](projojo_frontend/src/index.css:404) and `32px` radii in [`.neu-flat-xl`](projojo_frontend/src/index.css:412).
- Pills and badges use full radii in the skill badge and badge families, for example [`.skill-badge`](projojo_frontend/src/index.css:641) and [`.neu-badge-success`](projojo_frontend/src/index.css:735).
- Avatars are circular. Icon containers are rounded rectangles. This contrast is intentional.

Do not mix sharp corners into core UI flows. Public hero images can use larger radii, but the family resemblance must remain obvious.

## Components

### Buttons

The shipped button hierarchy is real and should be preserved.

- **Primary**: [`.neu-btn-primary`](projojo_frontend/src/index.css:476). Use for the primary screen action or a single local CTA.
- **Secondary**: [`.neu-btn`](projojo_frontend/src/index.css:455). Use for supportive actions, navigation, toggles, and low-risk actions.
- **Outline**: [`.neu-btn-outline`](projojo_frontend/src/index.css:496). Use when you need stronger emphasis than text-only but do not want to compete with the primary action.
- **Text**: [`.neu-btn-text`](projojo_frontend/src/index.css:518). Use for low-friction supporting actions.
- **Icon-only**: [`.neu-icon-btn`](projojo_frontend/src/index.css:536). This is a 44×44 circular control and should remain the baseline for theme toggles and compact icon actions.

Button interaction rules:

- Hover uses lift or color shift, not dramatic transformation.
- Pressed state uses inset feedback or a small scale reduction.
- In dark mode, primary buttons switch to dark text on coral for contrast in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:1264).
- In high-contrast mode, border clarity beats shadow styling in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:1231).

Use one clearly dominant primary action per local surface. Do not fill a page with coral buttons.

### Forms

The standard form primitive is [`FormInput`](projojo_frontend/src/components/FormInput.jsx).

- Labels sit above text inputs and textareas in [`FormInput`](projojo_frontend/src/components/FormInput.jsx:98).
- Required fields add a coral asterisk in [`FormInput`](projojo_frontend/src/components/FormInput.jsx:99).
- Text and textarea controls use [`.neu-input`](projojo_frontend/src/index.css:576).
- Errors appear directly below the field in red text in [`FormInput`](projojo_frontend/src/components/FormInput.jsx:135).
- Checkbox and radio controls use native form controls with coral accent in [`FormInput`](projojo_frontend/src/components/FormInput.jsx:95).

Form rules:

- Keep labels explicit.
- Preserve the label-above-input pattern.
- Keep helper and error text close to the field.
- Do not invent floating-label or underline-only variants unless the codebase adopts them.

### Cards and task surfaces

Task and summary cards are core to the product and make the surface model obvious.

- Full task cards use [`.neu-flat`](projojo_frontend/src/components/TaskCard.jsx:60).
- Compact task rows use [`.neu-task-box`](projojo_frontend/src/components/TaskCard.jsx:22).
- Progress bars use [`.neu-progress`](projojo_frontend/src/index.css:625) and [`.neu-progress-bar`](projojo_frontend/src/index.css:633).
- Page headers use [`PageHeader`](projojo_frontend/src/components/PageHeader.jsx).

Cards should feel tactile but not heavy. Use the raised card surface for independent objects. Use inset trays for grouped content inside a card.

### Skill badges and status badges

Skill badges are one of the most important documented divergences from earlier docs. The shipped implementation is **not** a solid coral pill by default.

- Default skill badges use [`.skill-badge`](projojo_frontend/src/index.css:641): neutral background, neutral text, subtle border.
- Matching / own skill badges use [`.skill-badge-own`](projojo_frontend/src/index.css:655): soft coral tint with coral border.
- Pending skill badges use [`.skill-badge-pending`](projojo_frontend/src/index.css:669): dashed coral border.
- The component logic lives in [`SkillBadge`](projojo_frontend/src/components/SkillBadge.jsx:14).

Rules:

- Treat default skill badges as quiet metadata, not as mini buttons.
- Most skill badges are passive.
- If a badge becomes interactive, wrap it in a button and keep the interaction subtle, as in [`SkillBadge`](projojo_frontend/src/components/SkillBadge.jsx:32).
- Preserve the visual distinction between skill badges and action buttons.

Status badges are a separate family.

- Glass-like inline badges: [`.neu-badge-success`](projojo_frontend/src/index.css:735), [`.neu-badge-warning`](projojo_frontend/src/index.css:754), [`.neu-badge-error`](projojo_frontend/src/index.css:773), [`.neu-badge-info`](projojo_frontend/src/index.css:792), [`.neu-badge-gray`](projojo_frontend/src/index.css:811).
- Solid emphasis badges: [`.neu-badge-success-solid`](projojo_frontend/src/index.css:831), [`.neu-badge-warning-solid`](projojo_frontend/src/index.css:843), [`.neu-badge-error-solid`](projojo_frontend/src/index.css:855), [`.neu-badge-primary-solid`](projojo_frontend/src/index.css:867).

Use glass / translucent badges for inline status. Use solid badges when a stronger state callout is needed.

### Navigation

The authenticated navigation pattern is a fixed top bar in [`Navbar`](projojo_frontend/src/components/Navbar.jsx:109).

- Use the fixed top navigation as the default authenticated shell.
- Keep branding compact: icon, wordmark, micro-label.
- Active navigation uses color and inset emphasis rather than oversized highlights.
- Business and teacher indicators use inset pills and expanding labels in [`Navbar`](projojo_frontend/src/components/Navbar.jsx:182).
- Theme controls live in the navbar via [`ThemeToggle`](projojo_frontend/src/components/Navbar.jsx:163).

The public landing page has its own expressive navbar in [`LandingPage`](projojo_frontend/src/pages/LandingPage.jsx:77). Treat that as a marketing pattern, not the authenticated default.

### Modals and overlays

The modal system in [`Modal`](projojo_frontend/src/components/Modal.jsx) is modal-first, accessible, and visually softer than the core cards.

- Use a dark scrim with blur for isolation.
- Use a rounded-3xl container with subtle border.
- Keep the header visually distinct with a faint coral gradient accent.
- Preserve escape handling, focus trap, and focus restoration in [`Modal`](projojo_frontend/src/components/Modal.jsx:23).

Do not build alternative modal patterns unless there is a clear reason.

### Empty, loading, error, and feedback states

The shipped system mixes neumorphic structural states with flatter semantic feedback layers.

- Skeletons are preferred for list and card loading in [`SkeletonCard`](projojo_frontend/src/components/SkeletonCard.jsx) and [`SkeletonList`](projojo_frontend/src/components/SkeletonList.jsx:11).
- Full-page or isolated loads may use the spinner in [`Loading`](projojo_frontend/src/components/Loading.jsx).
- Empty and no-results states are centered, concise, and action-oriented, as in [`PublicDiscoveryPage`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:350) and [`PortfolioList`](projojo_frontend/src/components/PortfolioList.jsx:196).
- Inline alerts use [`Alert`](projojo_frontend/src/components/Alert.jsx:27): raised surface, inset icon well, clear dismiss affordance.
- Toast notifications intentionally use a flatter semantic style in [`Notification`](projojo_frontend/src/components/notifications/Notification.jsx:95). Do not force everything into neumorphism if semantic clarity gets worse.

Rules:

- Empty states should explain what happened and what the user can do next.
- Loading states should match the structure they are standing in for.
- Errors should be specific and close to the affected feature.

## Theming

Theme state is implemented in [`ThemeContext`](projojo_frontend/src/context/ThemeContext.jsx).

### Modes

- **Light mode** is the default base system.
- **Dark mode** uses an espresso / coffee palette, not neutral black or blue-gray, in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:290).
- **High contrast mode** removes most shadows, strengthens borders, and uses harder value separation in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:324).
- **Dark + high contrast** is explicitly supported in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:354).

### Theme behavior

- Theme preference persists in local storage in [`ThemeContext`](projojo_frontend/src/context/ThemeContext.jsx:22).
- System dark mode and high-contrast preferences are respected in [`ThemeContext`](projojo_frontend/src/context/ThemeContext.jsx:26).
- The active theme updates the document root classes in [`ThemeContext`](projojo_frontend/src/context/ThemeContext.jsx:82).
- Mobile browser theme color is updated in [`ThemeContext`](projojo_frontend/src/context/ThemeContext.jsx:99).

Theme rules:

- Any new component must work in light, dark, and high-contrast modes.
- Do not hardcode light-only grays inside structural components.
- If text sits on coral in dark mode, verify contrast. The codebase already ships overrides because white-on-coral failed contrast in dark mode in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:1257).

## Accessibility

Accessibility is a product requirement, not a cleanup step.

### Expectations

- Keyboard access is required for interactive UI.
- Focus treatment must stay visible.
- High contrast mode must remain usable without shadows.
- Reduced motion must be respected.
- Screen reader announcements should be preserved for theme changes in [`ThemeContext`](projojo_frontend/src/context/ThemeContext.jsx:205).
- Modal focus trapping and focus restoration must not regress in [`Modal`](projojo_frontend/src/components/Modal.jsx:29).

### Current implementation patterns

- Standard focus rings commonly use `focus:ring-2 focus:ring-primary/50` in components such as [`ThemeToggle`](projojo_frontend/src/components/ThemeToggle.jsx:63) and [`Alert`](projojo_frontend/src/components/Alert.jsx:36).
- High-contrast mode uses explicit outlines in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:1308).
- List loading states expose status text and labels in [`SkeletonList`](projojo_frontend/src/components/SkeletonList.jsx:17) and [`SkeletonOverview`](projojo_frontend/src/components/SkeletonOverview.jsx:10).
- The app shell provides a focusable main content target in [`App`](projojo_frontend/src/App.jsx:231).

### Accessibility rules

- Maintain at least WCAG AA contrast. High contrast mode should exceed that where practical.
- Prefer semantic labels and real button elements over div-based click targets.
- Keep icon-only controls labeled.
- Avoid hiding key functionality on smaller screens.

## Motion

The shipped motion language is restrained and functional.

### Common motion patterns

- Button hover lift: `translateY(-2px)` in [`.neu-btn:hover`](projojo_frontend/src/index.css:464).
- Interactive card lift: stronger hover translation in [`.neu-flat-interactive:hover`](projojo_frontend/src/index.css:429).
- Icon button scale feedback in [`.neu-icon-btn:hover`](projojo_frontend/src/index.css:546) and [`.neu-icon-btn:active`](projojo_frontend/src/index.css:551).
- Fade / entrance helpers in [`.fade-in-up`](projojo_frontend/src/index.css:1062) and [`.animate-fade-in`](projojo_frontend/src/index.css:1082).
- Motion-safe skeleton pulse in [`SkeletonCard`](projojo_frontend/src/components/SkeletonCard.jsx:9).

### Motion rules

- Keep most interaction motion between `0.2s` and `0.3s`.
- Use transform and opacity before layout animation.
- Use animation to clarify state, not to decorate empty moments.
- Avoid long ambient animation loops inside the authenticated app.

### Reduced motion

Reduced motion is enforced globally in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css:1434).

- Transitions collapse to near-instant.
- Fade helpers stop animating.
- Scroll behavior is reset to auto.

Any new animation must remain readable when this rule set is active.

## Content tone

The product voice is Dutch, professional, supportive, and practical. The public side is more aspirational, but still grounded. The app should feel like an educational platform with real stakes, not a toy, a startup growth dashboard, or a generic admin template. The emotional target is welcoming confidence: users should feel invited in, not intimidated, and guided, not marketed at.

Tone rules:

- Prefer direct, helpful copy.
- Keep the tone clear, supportive, and credible.
- Use encouragement without sounding childish.
- Use academic or professional plain language over hype.
- Keep CTA language concrete.

Avoid clinical coldness, loud visual-sales copy, and gamified microcopy.

## Do’s and Don’ts

### Do

- Use the coral neumorphic system as the default product language.
- Reuse existing primitives such as [`.neu-flat`](projojo_frontend/src/index.css:402), [`.neu-pressed`](projojo_frontend/src/index.css:441), [`.neu-btn`](projojo_frontend/src/index.css:455), [`.neu-btn-primary`](projojo_frontend/src/index.css:476), and [`.neu-input`](projojo_frontend/src/index.css:576).
- Keep skill badges quiet and clearly separate from action buttons.
- Design for light, dark, and high-contrast modes at the same time.
- Use soft depth to clarify hierarchy, not to show off.
- Use strong labels, titles, and clear next actions.

### Don’t

- Do not revert the system back to HAN-pink as the default without changing the codebase.
- Do not treat the landing page’s gradients and glass blur as the default style for the app shell.
- Do not make every action primary.
- Do not use generic flat chips where the existing badge system already solves the problem.
- Do not rely on white text on coral in dark mode.
- Do not add flashy animation, neon accents, or playful education-app styling.

## Practical implementation guidance

- Edit tokens, shadows, and shared component classes in [`projojo_frontend/src/index.css`](projojo_frontend/src/index.css).
- Edit theme state and mode behavior in [`projojo_frontend/src/context/ThemeContext.jsx`](projojo_frontend/src/context/ThemeContext.jsx).
- Reuse form structure from [`FormInput`](projojo_frontend/src/components/FormInput.jsx).
- Reuse modal behavior from [`Modal`](projojo_frontend/src/components/Modal.jsx).
- Reuse page-level title structure from [`PageHeader`](projojo_frontend/src/components/PageHeader.jsx).
- Reuse feedback patterns from [`Alert`](projojo_frontend/src/components/Alert.jsx), [`Loading`](projojo_frontend/src/components/Loading.jsx), and [`Notification`](projojo_frontend/src/components/notifications/Notification.jsx).
- When documenting or extending the design system, always verify against shipped components before copying older docs.

## Documented divergences from older design references

1. The shipped default primary is coral, not HAN pink.
2. Default skill badges are neutral / subtle, not solid coral.
3. Core card radii are generally larger than the older 16px guidance.
4. Dark mode is warm espresso-based, not a neutral gray dark theme.
5. High contrast mode is explicit and removes most neumorphic shadows.
6. Public landing and discovery surfaces use more gradient and glass accents than the core app shell.

These are not edge cases. They are current product reality and should guide day-to-day frontend work.
