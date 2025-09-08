# Projojo Design & Feature Planning

## 📋 Project Context

**Repository**: [HAN-AIM-CMD-WG/Projojo](https://github.com/HAN-AIM-CMD-WG/Projojo)  
**Demo**: https://projojo.dp.demopreview.nl/  
**Timeline**: September - December 2024  
**Goal**: Werkende demo voor december presentatie  

## 🎯 Project Vision

Projojo is een educatief project management platform dat bedrijven, studenten, supervisors en docenten verbindt. Het doel is een autonoom ecosysteem te creëren waarbij:

- Bedrijven projecten kunnen indienen via vragenlijst
- Supervisors projecten goedkeuren en aanpassen  
- Docenten inhoudelijke koppeling maken met onderwijscompetenties
- Studenten zelfstandig taken en competenties kunnen zoeken
- Goedkeuringsprocessen geautomatiseerd verlopen

## 💭 User Insights & Requirements

### Design Preferences
- **Neumorphism** styling (toegankelijk, functie niet hinderen)
- Modern, overzichtelijk dashboard
- Mobile-first responsive design

### Key Features Needed
1. **Enhanced Homepage/Dashboard**
   - Overzicht lopende klussen waar student zich voor aangemeld heeft
   - Voorgestelde klussen/projecten op basis van skills
   - Gepersonaliseerde content per gebruikersrol

2. **Competentie Management**
   - Student kan klus indienen als competentie
   - Docent moet competenties kunnen beoordelen
   - Docent kan projecten splitsen in deelopdrachten met onderwijscompetenties

3. **Workflow Automation**
   - Bedrijf submission met vragenlijst
   - Multi-stakeholder approval chains
   - LLM integratie voor content analyse en matching

## 🚧 Development Constraints

- **Actief dev team**: Vermijd conflicten met bestaande development
- **Korte timeline**: Focus op MVP features voor december
- **LLM integration**: Samenwerking met AI systemen gepland

## 📅 Roadmap

### 🚀 Fase 1 (September): Core Features Foundation
- Competentie-tracking systeem
- Workflow engine voor goedkeuringsprocessen  
- LLM API integration layer
- Enhanced filtering/recommendation engine

### 🎨 Fase 2 (Oktober): Design System + Dashboard
- Neumorphism component library
- Gepersonaliseerde student dashboard
- "Mijn Lopende Klussen" sectie
- Skill-based recommendations

### ⚡ Fase 3 (November): Workflow Automation
- Bedrijf submission workflow
- Supervisor approval & editing interface
- Docent content koppeling systeem
- Student self-service matching

### 🎁 Fase 4 (December): Polish & Demo Prep
- Performance optimizations
- Mobile responsiveness
- Demo scenario's

## 📁 Directory Structure

```
design-planning/
├── README.md                 # This file - project overview
├── user-research/           # User insights and requirements
├── mockups/                 # UI/UX designs and prototypes
├── technical-specs/         # Feature specifications
├── meeting-notes/          # Session notes and decisions
└── assets/                 # Design assets, images, etc.
```

## 🎨 Design System Direction

### Color Palette (Neumorphic)
- **Primary**: #e50056 (existing brand color)
- **Background**: #f0f0f3 (soft neutral for neumorphism)
- **Shadows**: Light/dark variants for depth
- **Text**: High contrast for accessibility

### Typography
- Modern, readable font stack
- Consistent scale and spacing
- Accessible contrast ratios

### Components
- Soft, elevated surfaces
- Subtle depth and lighting
- Interactive feedback states
- Keyboard navigation support

---

*Last updated: $(date)*



