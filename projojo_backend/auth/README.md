# OAuth Provider Setup Guide

This guide explains how to configure OAuth providers for the current Projojo backend and frontend setup.

## How Projojo OAuth works

OAuth is initiated from the frontend, but providers must redirect back to the **backend** callback route defined in [`../routes/auth_router.py`](../routes/auth_router.py).

Current backend auth routes:

- `/auth/login/{provider}`
- `/auth/callback/{provider}`

The backend then redirects the user back to the frontend `/auth/callback` route.

## Current local and preview URLs

Use these values when configuring provider apps.

### Local development

- frontend URL: `http://localhost:10101`
- backend base URL: `http://localhost:10102`
- backend callback base: `http://localhost:10102/auth/callback`

### Preview / staging

- frontend URL: `https://preview.projojo.nl`
- backend base URL: `https://backend.preview.projojo.nl`
- backend callback base: `https://backend.preview.projojo.nl/auth/callback`

The local values come from [`../../.env.example`](../../.env.example). The preview values are documented in [`../../docs/DEPLOYMENT_INFRASTRUCTURE.md`](../../docs/DEPLOYMENT_INFRASTRUCTURE.md).

## Required environment variables

Store provider credentials in the repo-root `.env` file created from [`../../.env.example`](../../.env.example):

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

After changing OAuth-related env vars, restart the relevant services from the repo root:

```bash
docker compose restart backend frontend
```

If the stack has not been started yet, use:

```bash
task docker:start
```

## Before you configure a provider

Keep these rules in mind:

1. Provider redirect URIs must point to the **backend callback URL**, not the frontend.
2. The frontend URL is still useful for fields like homepage/application URL.
3. Preview and local development often need separate callback entries.
4. If a provider makes multi-environment setup awkward, use separate provider apps for local and preview.

## Google OAuth setup

Official docs: [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### Recommended configuration

Create a **Web application** OAuth client and add these redirect URIs:

- `http://localhost:10102/auth/callback/google`
- `http://127.0.0.1:10102/auth/callback/google` (optional)
- `https://backend.preview.projojo.nl/auth/callback/google` (if you also want preview)

Suggested app details:

- app name: `Projojo`
- homepage URL: `http://localhost:10101` for local-focused setup
- preview homepage URL if needed: `https://preview.projojo.nl`

Then place the credentials in the repo-root `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## GitHub OAuth setup

Official docs: [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)

GitHub OAuth Apps are easiest to manage with **separate apps per environment**.

### Local development app

Suggested values:

- application name: `Projojo Local`
- homepage URL: `http://localhost:10101`
- authorization callback URL: `http://localhost:10102/auth/callback/github`

### Preview app

Suggested values:

- application name: `Projojo Preview`
- homepage URL: `https://preview.projojo.nl`
- authorization callback URL: `https://backend.preview.projojo.nl/auth/callback/github`

Add the credentials you want the current environment to use to the repo-root `.env` file:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

## Microsoft OAuth setup

Official docs: [Microsoft Entra Identity Platform](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)

Register a **Web** app and add these redirect URIs:

- `http://localhost:10102/auth/callback/microsoft`
- `https://backend.preview.projojo.nl/auth/callback/microsoft` (if you also want preview)

Suggested values:

- name: `Projojo`
- supported account types: choose the option appropriate for your use case; for general development, broad account support is usually easiest

Then place the credentials in the repo-root `.env` file:

```env
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

## Verifying your setup

1. Make sure the repo-root `.env` file contains the provider credentials.
2. Restart backend and frontend services.
3. Open the frontend at `http://localhost:10101`.
4. Start login from the frontend UI.
5. Confirm the provider returns to the backend callback route and then back to the frontend `/auth/callback` page.

If login fails, check backend logs from the repo root:

```bash
task docker:logs
```

or:

```bash
docker compose logs -f backend
```

## Common mistakes

- using the frontend URL as the provider redirect URI
- configuring old port `8000` while developing through Docker
- forgetting that the current Docker dev backend runs on port `10102`
- updating `.env` without restarting backend/frontend containers
- mixing local and preview credentials in the same `.env` unintentionally

## Related docs

- [`../README.md`](../README.md)
- [`../../README.md`](../../README.md)
- [`../../.env.example`](../../.env.example)
- [`../../docs/DEPLOYMENT_INFRASTRUCTURE.md`](../../docs/DEPLOYMENT_INFRASTRUCTURE.md)
