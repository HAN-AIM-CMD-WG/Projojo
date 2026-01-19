# Decision Log

This section documents key architectural decisions made during the development of Projojo.

## ADR-001: Use TypeDB as Primary Database

**Date**: 2024 (estimated from project timeline)

**Status**: Accepted

**Context**:
The Projojo domain model has complex relationships between users, businesses, projects, tasks, and skills. Students have skills, tasks require skills, students register for tasks, supervisors manage businesses, etc.

**Decision**:
Use TypeDB 3.4, a strongly-typed graph database, as the primary data store.

**Consequences**:
- (+) Natural modeling of complex relationships
- (+) TypeQL enables expressive graph queries
- (+) Strong schema enforcement
- (-) Less common than SQL databases, steeper learning curve
- (-) Platform compatibility issues (Windows requires Docker/WSL)
- (-) Limited tooling compared to PostgreSQL/MySQL

## ADR-002: OAuth-Only Authentication

**Date**: 2024

**Status**: Accepted

**Context**:
Need secure user authentication without the burden of managing passwords and credentials.

**Decision**:
Use OAuth 2.0 exclusively with Google, GitHub, and Microsoft as identity providers. No username/password option.

**Consequences**:
- (+) No password storage required
- (+) Reduced security attack surface
- (+) Familiar login flow for users
- (+) Access to user profile info from providers
- (-) Requires OAuth provider setup for each developer
- (-) Dependency on external services
- (-) Cannot work offline or without internet

## ADR-003: React Single-Page Application

**Date**: 2024

**Status**: Accepted

**Context**:
Need a modern, interactive user interface for the educational platform.

**Decision**:
Build frontend as a React SPA with Vite as build tool and React Router for client-side routing.

**Consequences**:
- (+) Fast, app-like user experience
- (+) Rich interactivity possible
- (+) Large ecosystem and community
- (+) Hot module replacement for fast development
- (-) JavaScript required (no progressive enhancement)
- (-) Initial load may be slower than server-rendered
- (-) SEO considerations (mitigated by educational context)

## ADR-004: FastAPI for Backend

**Date**: 2024

**Status**: Accepted

**Context**:
Need a Python backend framework that supports async operations and automatic API documentation.

**Decision**:
Use FastAPI with Pydantic for the backend API.

**Consequences**:
- (+) Automatic OpenAPI/Swagger documentation
- (+) Type hints and validation via Pydantic
- (+) Async support for performance
- (+) Modern Python practices
- (-) Python may be slower than Go/Rust for CPU-bound tasks
- (-) Requires async-aware code patterns

## ADR-005: Neumorphic Design System

**Date**: 2024

**Status**: Accepted

**Context**:
The platform needed a distinctive, modern visual design that aligns with HAN branding while being accessible.

**Decision**:
Implement a neumorphic design system with accessibility-first principles.

**Consequences**:
- (+) Distinctive, modern aesthetic
- (+) Consistent visual language across app
- (+) Accessibility features built-in (high contrast, reduced motion)
- (-) More complex CSS than standard flat design
- (-) Neumorphism can be subtle on some displays
- (-) Requires careful attention to contrast ratios

## ADR-006: Docker-First Development

**Date**: 2024

**Status**: Accepted

**Context**:
TypeDB has platform-specific dependencies, and the team works across different operating systems.

**Decision**:
Use Docker and Docker Compose as the primary development environment.

**Consequences**:
- (+) Consistent environment across all developers
- (+) Solves TypeDB platform compatibility
- (+) Easy onboarding for new developers
- (+) Similar to production deployment
- (-) Docker overhead and learning curve
- (-) Can be slower than native development
- (-) Windows users need WSL2 or Docker Desktop

## ADR-007: Monorepo Structure

**Date**: 2024

**Status**: Accepted

**Context**:
Small team developing both frontend and backend, need coordinated development.

**Decision**:
Keep frontend and backend in the same repository with separate directories.

**Consequences**:
- (+) Single repository to manage
- (+) Shared Docker Compose configuration
- (+) Coordinated commits and releases
- (+) Easier cross-team visibility
- (-) Larger repository size
- (-) Mixed language tooling
- (-) Could complicate independent deployment

## ADR-008: JWT for Session Management

**Date**: 2024

**Status**: Accepted

**Context**:
Need stateless authentication that works with SPA architecture.

**Decision**:
Use JWT tokens stored in localStorage, validated by backend middleware.

**Consequences**:
- (+) Stateless - no server-side session storage needed
- (+) Works well with SPA architecture
- (+) Easy to include in API requests
- (-) Cannot invalidate tokens before expiry
- (-) localStorage vulnerable to XSS (mitigated by input sanitization)
- (-) Token size larger than simple session ID

## ADR-009: Dutch as Primary UI Language

**Date**: 2024

**Status**: Accepted

**Context**:
Platform developed for HAN University of Applied Sciences (Dutch educational institution).

**Decision**:
Use Dutch for all user-facing content, error messages, and UI labels.

**Consequences**:
- (+) Native language for primary user base
- (+) Reduces cognitive load for users
- (-) Limits international adoption
- (-) Technical documentation sometimes mixed Dutch/English
- (-) Future internationalization would require i18n framework

## Future Decisions to Consider

The following decisions are pending or under consideration:

- **Rate Limiting Strategy**: How to implement API rate limiting in production
- **Production Database Backups**: Backup strategy for TypeDB
- **Internationalization**: Whether to support multiple languages
- **Horizontal Scaling**: Architecture changes for multiple instances
- **Real-time Features**: WebSocket vs SSE vs polling for live updates
