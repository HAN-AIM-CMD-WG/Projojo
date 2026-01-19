# Constraints

## Technical Constraints

### Runtime Requirements

| Component | Constraint | Reason |
|-----------|-----------|--------|
| Python | >= 3.13 | TypeDB driver requires Python 3.13 |
| Node.js | Modern (latest LTS) | React 19 and Vite 6 requirements |
| Docker | Required for TypeDB | TypeDB native binaries not available on all platforms |

### Platform Compatibility

**Windows Limitation**: The TypeDB driver has compatibility issues on Windows due to missing native binaries for Python 3.13. Windows users must use:

- Docker for development (recommended)
- WSL2 (Windows Subsystem for Linux)

### Database Technology

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Database | TypeDB 3.4 | Graph database chosen for relationship-heavy data model |
| Platform | linux/amd64 | TypeDB Docker image platform |

### Authentication

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| OAuth Required | Yes | No username/password authentication |
| Providers | Google, GitHub, Microsoft | Industry-standard OAuth 2.0 providers |
| Token Storage | localStorage | Client-side JWT storage |

## Organizational Constraints

### Timeline

- **Project Period**: September - December 2024
- **Focus**: MVP features prioritized over advanced functionality

### Development Team

- Active development team requires coordination
- Multiple developers contributing to same codebase

### Educational Context

- Platform developed for HAN University (Hogeschool van Arnhem en Nijmegen)
- Users are students, faculty, and partner businesses
- Primary language is Dutch

## Deployment Constraints

### Hosting

| Constraint | Value |
|-----------|-------|
| Platform | Dokploy |
| Demo URL | https://projojo.dp.demopreview.nl/ |
| Container Runtime | Docker Compose |

### Port Allocation

Development ports use 10100+ range to avoid conflicts:

| Service | Default Port |
|---------|-------------|
| TypeDB | 10101 |
| TypeDB Studio | 10102 |
| Backend API | 10103 |
| Frontend | 10104 |
| MailHog SMTP | 10105 |
| MailHog Web | 10106 |

### Network

- Services communicate via Docker bridge network (`projojo-network`)
- Traefik reverse proxy in production (ProxyHeadersMiddleware configured)

## Licensing Constraints

- Open source project (repository visibility TBD)
- Third-party dependencies follow their respective licenses

## Browser Constraints

| Constraint | Value |
|-----------|-------|
| Minimum | Last 2 versions of major browsers |
| IE | Not supported |
| JavaScript | Required (no server-side rendering) |

## API Constraints

### CORS

Currently configured permissively for development:

```python
allow_origins=["*"]
allow_methods=["*"]
allow_headers=["*"]
```

**TODO**: Restrict CORS in production.

### Rate Limiting

- Not yet implemented
- Planned for production deployment

## Data Constraints

### File Storage

| Type | Location | Size Limit |
|------|----------|------------|
| Profile Images | `static/images/` | TODO |
| CV PDFs | `static/pdf/` | TODO |
| Project Images | `static/images/` | TODO |

### Data Retention

- No formal data retention policy defined
- Database persisted via Docker volume
