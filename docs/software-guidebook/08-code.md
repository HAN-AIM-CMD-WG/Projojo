# Code

## Repository Structure

```
Projojo/
├── projojo_frontend/          # React frontend application
├── projojo_backend/           # FastAPI backend application
├── design-planning/           # Design specs and mockups
├── docs/                      # Documentation (including this guidebook)
├── .claude/                   # Claude Code skills
├── docker-compose.yml         # Development Docker configuration
├── docker-compose.base.yml    # Shared Docker configuration
├── docker-compose.preview.yml # Preview/production configuration
└── .env.example              # Environment variable template
```

## Frontend Structure

```
projojo_frontend/
├── src/
│   ├── main.jsx              # Application entry point
│   ├── App.jsx               # Root component with routing
│   ├── index.css             # Global styles and CSS variables
│   ├── services.js           # API client functions
│   ├── useFetch.js           # Custom fetch hook
│   │
│   ├── auth/                 # Authentication
│   │   ├── AuthProvider.jsx  # Auth context and state
│   │   └── AuthCallback.jsx  # OAuth callback handler
│   │
│   ├── context/              # React contexts
│   │   ├── ThemeContext.jsx  # Dark/light mode
│   │   └── StudentSkillsContext.jsx
│   │
│   ├── pages/                # Route-level components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── SupervisorDashboard.jsx
│   │   ├── OverviewPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── BusinessPage.jsx
│   │   ├── ProjectDetailsPage.jsx
│   │   ├── TeacherPage.jsx
│   │   └── ...
│   │
│   ├── components/           # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Filter.jsx
│   │   ├── SkillBadge.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── TaskCard.jsx
│   │   ├── RichTextEditor.jsx
│   │   ├── LocationMap.jsx
│   │   ├── notifications/
│   │   │   ├── Notification.jsx
│   │   │   └── NotifySystem.jsx
│   │   └── ...
│   │
│   ├── lib/                  # Utility libraries
│   │   └── utils.ts          # shadcn/ui utilities (cn function)
│   │
│   ├── utils/                # Helper functions
│   │   └── skills.js
│   │
│   └── tests/                # Storybook stories
│       ├── *.stories.jsx
│       └── ...
│
├── public/                   # Static assets
├── components.json           # shadcn/ui configuration
├── tailwind.config.js        # TailwindCSS configuration (v4)
├── vite.config.ts            # Vite configuration
├── eslint.config.js          # ESLint configuration
└── package.json
```

## Backend Structure

```
projojo_backend/
├── main.py                   # Application entry point
├── pyproject.toml           # Dependencies and project config
├── uv.lock                  # Dependency lock file
├── Dockerfile               # Multi-stage Docker build
│
├── routes/                  # API endpoint handlers
│   ├── auth_router.py
│   ├── business_router.py
│   ├── invite_router.py
│   ├── project_router.py
│   ├── skill_router.py
│   ├── student_router.py
│   ├── supervisor_router.py
│   ├── task_router.py
│   ├── teacher_router.py
│   └── user_router.py
│
├── service/                 # Business logic
│   ├── auth_service.py      # JWT and OAuth handling
│   ├── image_service.py     # Image upload/processing
│   ├── task_service.py      # Task business logic
│   └── uuid_service.py      # UUID generation
│
├── domain/                  # Domain models
│
├── auth/                    # Authentication
│   ├── jwt_middleware.py    # JWT validation middleware
│   └── README.md           # OAuth setup guide
│
├── config/                  # Configuration
│   └── settings.py         # Environment variables
│
├── exceptions/              # Custom exceptions
│   ├── exceptions.py
│   └── global_exception_handler.py
│
├── db/                      # Database
│   ├── initDatabase.py     # TypeDB connection
│   ├── schema.tql          # TypeDB schema
│   ├── seed.tql            # Seed data
│   └── tql2py/             # TypeQL to Python utilities
│
├── static/                  # Static file storage
│   ├── images/             # Uploaded images
│   └── pdf/                # Uploaded PDFs
│
└── tests/                   # pytest tests
```

## Key Patterns

### Frontend: Service Layer

All API calls go through `services.js`:

```javascript
// services.js
export function getProjects() {
    return fetchWithError(`${API_BASE_URL}projects`);
}

export function createProject(project_data) {
    const formData = new FormData();
    formData.append("name", project_data.name);
    // ...
    return fetchWithError(`${API_BASE_URL}projects`, {
        method: "POST",
        body: formData,
    });
}
```

### Frontend: Context Providers

Global state managed via React Context:

```jsx
// main.jsx
<AuthProvider>
  <NotifySystem>
    <App />
  </NotifySystem>
</AuthProvider>

// App.jsx
<ThemeProvider>
  <StudentSkillsProvider>
    {/* routes */}
  </StudentSkillsProvider>
</ThemeProvider>
```

### Backend: Router Pattern

Each domain has a dedicated router:

```python
# routes/project_router.py
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("")
async def get_projects():
    # ...

@router.post("")
async def create_project(project: ProjectCreate):
    # ...
```

### Backend: Middleware Stack

```python
# main.py - Order matters!
app.add_middleware(CORSMiddleware, ...)
app.add_middleware(JWTMiddleware)
app.add_middleware(SessionMiddleware, ...)
app.add_middleware(ProxyHeadersMiddleware, ...)
```

### Backend: Database Access

TypeDB queries in `initDatabase.py`:

```python
def get_database():
    # Returns singleton database connection
    pass

# Usage in routes
@router.get("/")
async def get_items(db=Depends(get_db)):
    # Use db to query TypeDB
```

## Naming Conventions

### Frontend

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ProjectCard.jsx` |
| Pages | PascalCase + Page suffix | `ProfilePage.jsx` |
| Hooks | camelCase with use prefix | `useFetch.js` |
| Services | camelCase | `getProjects()` |
| CSS Classes | kebab-case | `neuro-card` |

### Backend

| Type | Convention | Example |
|------|-----------|---------|
| Routers | snake_case + _router suffix | `project_router.py` |
| Services | snake_case + _service suffix | `auth_service.py` |
| Functions | snake_case | `get_projects()` |
| Classes | PascalCase | `ItemRetrievalException` |

## Code Quality Tools

### Frontend

- **ESLint**: JavaScript/React linting
- **Prettier**: Code formatting
- **Storybook**: Component development and testing

```bash
npm run lint          # Run ESLint
npm run storybook     # Start Storybook
npm run test-storybook # Run Storybook tests
```

### Backend

- **pytest**: Unit testing

```bash
uv run pytest         # Run tests
uv run pytest -v      # Verbose output
```

## Import Conventions

### Frontend

```javascript
// React and libraries first
import { useEffect } from "react";
import { Route, Routes } from 'react-router-dom';

// Local imports
import { useAuth } from './auth/AuthProvider';
import Navbar from './components/Navbar';
import { getProjects } from './services';
```

### Backend

```python
# Standard library
from contextlib import asynccontextmanager

# Third-party
from fastapi import FastAPI, Depends
from pydantic import BaseModel

# Local
from config.settings import SESSIONS_SECRET_KEY
from routes.auth_router import router as auth_router
```
