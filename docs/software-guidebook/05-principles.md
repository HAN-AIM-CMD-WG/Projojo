# Principles

## Design Principles

### Accessibility First

Accessibility is not an afterthought but a core design principle:

- High contrast ratios for readability
- Keyboard navigation for all interactive elements
- Screen reader compatibility
- Reduced motion preferences respected
- Skip links for improved navigation

### Functional Beauty

The neumorphic design system follows the principle that aesthetics support functionality:

- Visual hierarchy guides user attention
- Consistent interaction patterns reduce cognitive load
- Subtle animations provide feedback without distraction
- Design enhances rather than hinders usability

### Mobile-First Responsive Design

UI is designed mobile-first with progressive enhancement:

```css
/* Mobile first, then enhance */
.container-responsive {
  padding: 1rem;
}

@media (min-width: 640px) {
  .container-responsive { padding: 1.5rem; }
}

@media (min-width: 1024px) {
  .container-responsive { padding: 2rem; }
}
```

## Architecture Principles

### Separation of Concerns

The system separates concerns across clear boundaries:

```
Frontend (React)     Backend (FastAPI)      Database (TypeDB)
     │                     │                      │
     ▼                     ▼                      ▼
  UI Logic            Business Logic         Data Storage
  Routing             Validation             Relationships
  State               Authentication         Schema
```

### API-First Design

- Backend exposes RESTful API endpoints
- Frontend consumes API via service layer (`services.js`)
- API documentation auto-generated (Swagger/ReDoc)
- Clear contract between frontend and backend

### Domain-Driven Organization

Backend code is organized around domain concepts:

```
projojo_backend/
├── routes/          # API endpoints by domain
│   ├── auth_router.py
│   ├── business_router.py
│   ├── project_router.py
│   └── student_router.py
├── service/         # Business logic
├── domain/          # Domain models
└── db/              # Data access
```

## Development Principles

### Docker-First Development

Docker is the primary development environment:

- Ensures consistency across developer machines
- Handles TypeDB platform dependencies
- Volume mounts for live reloading
- Same container definitions for dev and preview

### Convention over Configuration

- Standard project structures for React and FastAPI
- Environment variables for configuration
- Sensible defaults with override capability

### Dependency Management

**Python (uv)**:
```bash
uv add <package>      # Add dependency
uv sync               # Install from lock file
uv run python main.py # Run in virtual environment
```

**JavaScript (npm)**:
```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
```

## Security Principles

### Defense in Depth

Multiple layers of security:

1. OAuth 2.0 for authentication
2. JWT validation middleware
3. Role-based authorization checks
4. Input validation (Pydantic)
5. Output sanitization (DOMPurify)

### Least Privilege

- Users can only access resources they own
- Supervisor access limited to their business
- Teacher functions require teacher role
- Invite keys required for privileged roles

### Secure by Default

- Sessions use secret keys
- JWT tokens validated on every request
- HTTPS enforced in production (Traefik)

## Code Principles

### Component-Based Architecture

Frontend uses reusable React components:

- Self-contained components with clear interfaces
- Props for customization
- Context for shared state (Auth, Theme, Skills)
- Storybook for component documentation

### Explicit over Implicit

- Clear function signatures with JSDoc comments
- Explicit error handling with typed exceptions
- Environment variables documented in `.env.example`

### Dutch Language in UI

User-facing content is in Dutch:

```javascript
// Error messages
case 401:
    message = "Je moet ingelogd zijn om dit te doen.";
    break;
case 403:
    message = "Je hebt geen rechten voor deze actie.";
    break;
```

## Quality Principles

### Test Coverage

- Storybook stories for visual component testing
- pytest for backend unit tests
- TODO: Integration test coverage

### Code Review

- Pull request workflow
- Main branch protection (assumed)
- Feature branches for development

### Continuous Integration

- Docker-based builds
- Dokploy deployment pipeline
