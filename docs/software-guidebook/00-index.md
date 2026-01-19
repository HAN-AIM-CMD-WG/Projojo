# Software Guidebook: Projojo

> A living document describing the architecture and design of Projojo.
> Last updated: 2026-01-12

## About This Guidebook

This guidebook follows Simon Brown's Software Guidebook format from "Software Architecture for Developers Vol. 2". It serves as the primary architecture documentation for onboarding new team members and preserving architectural knowledge.

## What is Projojo?

Projojo is an educational project management platform that connects businesses, students, supervisors, and teachers in an autonomous ecosystem. It enables businesses to post projects with specific skill requirements, and students to find and apply for projects that match their capabilities.

## Sections

1. [Context](01-context.md) - What is this system and who uses it?
2. [Functional Overview](02-functional-overview.md) - What does it do?
3. [Quality Attributes](03-quality-attributes.md) - Non-functional requirements
4. [Constraints](04-constraints.md) - Limitations and boundaries
5. [Principles](05-principles.md) - Guiding design decisions
6. [Software Architecture](06-software-architecture.md) - C4 diagrams and structure
7. [External Interfaces](07-external-interfaces.md) - APIs and integrations
8. [Code](08-code.md) - Code organization and patterns
9. [Data](09-data.md) - Data models and storage
10. [Infrastructure](10-infrastructure.md) - Deployment environments
11. [Deployment](11-deployment.md) - How to deploy
12. [Operation and Support](12-operation-support.md) - Running in production
13. [Decision Log](13-decision-log.md) - Architecture decisions

## Quick Links

- [Backend README](../../projojo_backend/README.md)
- [Frontend README](../../projojo_frontend/README.md)
- [Feature Roadmap](../../design-planning/FEATURE_ROADMAP.md)
- [OAuth Setup Guide](../../projojo_backend/auth/README.md)

## Technology Stack Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS 4, React Router 7 |
| Backend | Python 3.13, FastAPI, Pydantic |
| Database | TypeDB 3.4 (Graph Database) |
| Authentication | OAuth 2.0 (Google, GitHub, Microsoft) |
| Testing | Storybook 9, pytest |
| Containerization | Docker, Docker Compose |
| Deployment | Dokploy |
