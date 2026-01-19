# Software Architecture

## Container Diagram

```mermaid
C4Container
    title Container Diagram for Projojo

    Person(student, "Student", "Browses projects, applies to tasks")
    Person(supervisor, "Supervisor", "Manages projects, reviews applications")
    Person(teacher, "Teacher", "Administers platform")

    System_Boundary(projojo, "Projojo Platform") {
        Container(frontend, "Frontend SPA", "React 19, Vite, TailwindCSS", "Serves the user interface with neumorphic design")
        Container(backend, "Backend API", "Python 3.13, FastAPI", "RESTful API handling business logic")
        ContainerDb(typedb, "TypeDB", "TypeDB 3.4", "Graph database storing entities and relationships")
        Container(static, "Static Files", "File System", "Stores images and PDFs")
    }

    System_Ext(oauth_google, "Google OAuth", "Authentication")
    System_Ext(oauth_github, "GitHub OAuth", "Authentication")
    System_Ext(oauth_microsoft, "Microsoft Entra", "Authentication")
    System_Ext(mailhog, "MailHog", "Email testing (dev)")

    Rel(student, frontend, "Uses", "HTTPS")
    Rel(supervisor, frontend, "Uses", "HTTPS")
    Rel(teacher, frontend, "Uses", "HTTPS")

    Rel(frontend, backend, "API calls", "HTTPS/JSON")
    Rel(backend, typedb, "Queries", "TypeDB Protocol")
    Rel(backend, static, "Serves/Stores", "File I/O")

    Rel(backend, oauth_google, "OAuth flow", "HTTPS")
    Rel(backend, oauth_github, "OAuth flow", "HTTPS")
    Rel(backend, oauth_microsoft, "OAuth flow", "HTTPS")
    Rel(backend, mailhog, "Sends emails", "SMTP")
```

### Containers

| Container | Kind | Technology | Purpose |
|-----------|------|------------|---------|
| Frontend SPA | Web Application | React 19, Vite, TailwindCSS 4 | Single-page application serving the user interface |
| Backend API | REST API | Python 3.13, FastAPI, Pydantic | Business logic, authentication, API endpoints |
| TypeDB | Database | TypeDB 3.4 (Graph) | Stores entities, relationships, and graph queries |
| Static Files | File Storage | File System | Profile images, project images, CV PDFs |

## Component Diagram: Backend API

```mermaid
C4Component
    title Component Diagram for Backend API

    Container_Boundary(backend, "Backend API") {
        Component(auth_router, "Auth Router", "FastAPI Router", "OAuth callbacks, token management")
        Component(user_router, "User Router", "FastAPI Router", "User profile operations")
        Component(student_router, "Student Router", "FastAPI Router", "Student-specific operations")
        Component(supervisor_router, "Supervisor Router", "FastAPI Router", "Supervisor dashboard, management")
        Component(teacher_router, "Teacher Router", "FastAPI Router", "Admin operations")
        Component(business_router, "Business Router", "FastAPI Router", "Business CRUD operations")
        Component(project_router, "Project Router", "FastAPI Router", "Project management")
        Component(task_router, "Task Router", "FastAPI Router", "Task and registration management")
        Component(skill_router, "Skill Router", "FastAPI Router", "Skills taxonomy management")
        Component(invite_router, "Invite Router", "FastAPI Router", "Invite key generation")

        Component(auth_service, "Auth Service", "Python Module", "JWT creation, OAuth handling")
        Component(image_service, "Image Service", "Python Module", "Image upload/processing")
        Component(task_service, "Task Service", "Python Module", "Task business logic")

        Component(jwt_middleware, "JWT Middleware", "Starlette Middleware", "Token validation on requests")
        Component(db_module, "Database Module", "Python Module", "TypeDB connection and queries")
    }

    ContainerDb(typedb, "TypeDB", "Graph Database")
    Container_Ext(oauth, "OAuth Providers", "Google/GitHub/Microsoft")

    Rel(auth_router, auth_service, "Uses")
    Rel(auth_router, oauth, "OAuth flow")
    Rel(jwt_middleware, auth_service, "Validates tokens")

    Rel(student_router, db_module, "Queries")
    Rel(business_router, db_module, "Queries")
    Rel(project_router, db_module, "Queries")
    Rel(task_router, db_module, "Queries")
    Rel(task_router, task_service, "Uses")
    Rel(skill_router, db_module, "Queries")

    Rel(student_router, image_service, "Uses")
    Rel(business_router, image_service, "Uses")
    Rel(project_router, image_service, "Uses")

    Rel(db_module, typedb, "TypeDB queries")
```

### Backend Components

| Component | Kind | Purpose | Key Dependencies |
|-----------|------|---------|------------------|
| Auth Router | FastAPI Router | OAuth callbacks, JWT token endpoints | Auth Service, OAuth providers |
| User Router | FastAPI Router | Get user by ID | Database Module |
| Student Router | FastAPI Router | Student profiles, skills, registrations | Database, Image Service |
| Supervisor Router | FastAPI Router | Dashboard, project management | Database Module |
| Teacher Router | FastAPI Router | Admin functions, user listing | Database Module |
| Business Router | FastAPI Router | Business CRUD, archiving | Database, Image Service |
| Project Router | FastAPI Router | Project CRUD with tasks | Database, Image Service |
| Task Router | FastAPI Router | Tasks, registrations, skills | Database, Task Service |
| Skill Router | FastAPI Router | Skill taxonomy management | Database Module |
| Invite Router | FastAPI Router | Invite key generation | Database Module |
| Auth Service | Service | JWT creation/validation, OAuth | Authlib, PyJWT |
| Image Service | Service | Image upload, resizing | File System |
| JWT Middleware | Middleware | Request authentication | Auth Service |
| Database Module | Data Access | TypeDB connection, queries | TypeDB Driver |

## Component Diagram: Frontend SPA

```mermaid
C4Component
    title Component Diagram for Frontend SPA

    Container_Boundary(frontend, "Frontend SPA") {
        Component(app, "App", "React Component", "Root component, routing, global state")
        Component(auth_provider, "AuthProvider", "React Context", "Authentication state management")
        Component(theme_provider, "ThemeProvider", "React Context", "Theme/dark mode management")
        Component(skills_provider, "StudentSkillsProvider", "React Context", "Student skills state")

        Component(pages, "Pages", "React Components", "Route-level components")
        Component(components, "Components", "React Components", "Reusable UI components")
        Component(services, "Services", "JavaScript Module", "API client functions")
    }

    Container_Ext(backend, "Backend API", "FastAPI")

    Rel(app, auth_provider, "Wraps")
    Rel(app, theme_provider, "Wraps")
    Rel(app, skills_provider, "Wraps")
    Rel(app, pages, "Routes to")
    Rel(pages, components, "Uses")
    Rel(pages, services, "Calls")
    Rel(components, services, "Calls")
    Rel(services, backend, "HTTP requests")
```

### Frontend Components

| Component | Kind | Purpose | Key Dependencies |
|-----------|------|---------|------------------|
| App | Root Component | Routing, layout, global error handling | React Router, Contexts |
| AuthProvider | Context | JWT storage, auth state, user info | services.js |
| ThemeProvider | Context | Dark/light mode, CSS variables | localStorage |
| StudentSkillsProvider | Context | Cached student skills | services.js |
| Pages | Route Components | Page-level UI (Dashboard, Profile, etc.) | Components, Services |
| Components | UI Components | Reusable UI (Navbar, Cards, Forms) | TailwindCSS, Lucide icons |
| Services | API Client | HTTP requests to backend | Fetch API |

## Key Architectural Decisions

### Graph Database (TypeDB)

**Decision**: Use TypeDB as the primary database.

**Rationale**: The domain model is highly relational with complex relationships between users, businesses, projects, tasks, and skills. A graph database naturally models these relationships and enables powerful graph queries.

**Trade-offs**:
- (+) Natural relationship modeling
- (+) Flexible schema evolution
- (+) Powerful query language (TypeQL)
- (-) Less common than SQL databases
- (-) Platform compatibility challenges (Windows)

### OAuth-Only Authentication

**Decision**: Use OAuth 2.0 exclusively (no username/password).

**Rationale**: Delegates credential management to trusted providers (Google, GitHub, Microsoft), reducing security burden and improving user experience.

**Trade-offs**:
- (+) No password storage required
- (+) Reduced attack surface
- (+) Familiar login flow for users
- (-) Requires OAuth provider setup
- (-) No offline/local-only operation

### Single-Page Application

**Decision**: React SPA with client-side routing.

**Rationale**: Modern, interactive user experience with fast navigation between views.

**Trade-offs**:
- (+) Fast, app-like experience
- (+) Rich interactivity
- (-) JavaScript required
- (-) SEO considerations (mitigated by educational context)

### Monorepo Structure

**Decision**: Frontend and backend in same repository with separate directories.

**Rationale**: Simplifies development coordination for small team, shared Docker Compose configuration.

**Trade-offs**:
- (+) Single repository to manage
- (+) Coordinated deployments
- (-) Larger clone size
- (-) Mixed language tooling
