# External Interfaces

## REST API

The backend exposes a RESTful API documented via OpenAPI (Swagger).

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/login/{provider}` | Initiate OAuth flow (google/github/microsoft) |
| GET | `/auth/callback/{provider}` | OAuth callback handler |
| GET | `/auth/logout` | Clear session |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (teacher only) |
| GET | `/users/{userId}` | Get user details |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all students |
| GET | `/students/{studentId}/skills` | Get student's skills with descriptions |
| PUT | `/students/{studentId}/skills` | Update student's skill list |
| PATCH | `/students/{studentId}/skills/{skillId}` | Update skill description |
| PUT | `/students/{email}` | Update student profile (FormData) |
| GET | `/students/registrations` | Get current student's task registrations |

### Supervisor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/supervisors` | List all supervisors |
| GET | `/supervisors/dashboard` | Get supervisor dashboard data |

### Teacher Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teachers` | List all teachers |

### Business Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/businesses/basic` | List businesses (basic info) |
| GET | `/businesses/complete` | List businesses with projects |
| GET | `/businesses/archived` | List archived businesses (teacher) |
| GET | `/businesses/{businessId}` | Get business details |
| GET | `/businesses/{businessId}/projects` | Get business projects |
| POST | `/businesses/` | Create new business |
| PUT | `/businesses/{businessId}` | Update business (FormData) |
| PATCH | `/businesses/{businessId}/archive` | Archive business (teacher) |
| PATCH | `/businesses/{businessId}/restore` | Restore business (teacher) |

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| GET | `/projects/{projectId}/complete` | Get project with tasks |
| GET | `/projects/{projectId}/tasks` | Get project tasks |
| POST | `/projects` | Create project (FormData) |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/{taskId}` | Get task details |
| GET | `/tasks/{taskId}/skills` | Get task skill requirements |
| GET | `/tasks/{taskId}/registrations` | Get task registrations (supervisor) |
| POST | `/tasks/{projectId}` | Create task in project |
| POST | `/tasks/{taskId}/registrations` | Register for task (student) |
| PUT | `/tasks/{taskId}/registrations/{userId}` | Update registration (supervisor) |
| DELETE | `/tasks/{taskId}/registrations` | Cancel registration (student) |
| PUT | `/tasks/{taskId}/skills` | Update task skills |
| GET | `/tasks/{taskId}/student-emails` | Get student emails by status |
| GET | `/tasks/{taskId}/emails/colleagues` | Get colleague emails |

### Skill Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/skills/` | List all skills |
| GET | `/skills/{skillId}` | Get skill details |
| POST | `/skills/` | Create new skill |
| PATCH | `/skills/{skillId}/acceptance` | Approve/decline skill (teacher) |
| PATCH | `/skills/{skillId}/name` | Rename skill (teacher) |

### Invite Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invites/supervisor/{businessId}` | Create supervisor invite |
| POST | `/invites/teacher` | Create teacher invite |

### Static Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/image/{filename}` | Serve image file |
| GET | `/pdf/{filename}` | Serve PDF file |

## OAuth Integrations

### Google OAuth

- **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **Callback**: `/auth/callback/google`
- **Scopes**: `openid email profile`

### GitHub OAuth

- **Authorization URL**: `https://github.com/login/oauth/authorize`
- **Token URL**: `https://github.com/login/oauth/access_token`
- **Callback**: `/auth/callback/github`
- **Scopes**: `user:email`

### Microsoft OAuth

- **Authorization URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- **Callback**: `/auth/callback/microsoft`
- **Scopes**: `openid email profile`

## Request/Response Formats

### Authentication

Requests include JWT in Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Content Types

| Operation | Content-Type |
|-----------|-------------|
| JSON data | `application/json` |
| File uploads | `multipart/form-data` |

### Error Responses

```json
{
  "detail": "Error message in Dutch"
}
```

Standard HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Email Integration

### Development (MailHog)

- **SMTP Port**: 10105 (configurable via `EMAIL_SMTP_PORT`)
- **Web UI**: http://localhost:10106
- **Purpose**: Email testing without sending real emails

### Production

TODO: Configure production SMTP provider.
