# Functional Overview

## Core Features

### 1. User Authentication and Authorization

OAuth-based authentication with role-based access control:

- **Login Flow**: Users authenticate via Google, GitHub, or Microsoft
- **JWT Tokens**: Stateless authentication using JWT stored in localStorage
- **Role Detection**: User type (student, supervisor, teacher) determined at login
- **Invite System**: Supervisors and teachers join via invite keys

### 2. Project Discovery

Students can discover projects through multiple views:

- **Overview Page** (`/ontdek`): Browse all businesses with their projects
- **Business Page**: View specific business details and all its projects
- **Project Details**: View project description, tasks, and skill requirements
- **Location Map**: Visual map showing business locations (Leaflet integration)

### 3. Skills Management

A comprehensive skill taxonomy system:

- **Student Skills**: Students add skills to their profile with descriptions
- **Task Requirements**: Tasks specify required skills
- **Skill Matching**: Visual indicators show skill overlap between students and tasks
- **Pending Skills**: New skills require teacher approval
- **Skill Administration**: Teachers can approve, rename, or decline skills

### 4. Task Registration

The core workflow connecting students to projects:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Student   │───>│   Register   │───>│  Supervisor │───>│   Accept/    │
│ finds task  │    │ with reason  │    │   reviews   │    │   Reject     │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

- Students apply to tasks with a motivation text
- Supervisors see pending registrations on their dashboard
- Supervisors can accept or reject with a response message
- Students can cancel pending registrations

### 5. Dashboard Views

Role-specific dashboards provide personalized overviews:

#### Student Dashboard

- Active projects (grouped by business)
- Pending applications with status
- Recommended projects based on skill matching
- Profile summary with stats

#### Supervisor Dashboard

- Business projects overview
- Pending registrations requiring action
- Active students on tasks
- Quick stats (total projects, tasks, registrations)

### 6. Profile Management

Users can manage their profiles:

- **Students**: Description, profile picture, CV (PDF), skills with descriptions
- **Businesses**: Name, description, location, logo image
- **Image Uploads**: Profile pictures and project images stored on server

### 7. Business Administration

Teachers have administrative controls:

- Create new businesses (optionally as draft/archived)
- Generate supervisor invite keys for businesses
- Archive/restore businesses (hidden from students when archived)
- Generate teacher invite keys

## User Journeys

### Student: Finding and Applying to a Project

1. Log in via OAuth provider
2. Navigate to "Ontdek" (Discover) page
3. Browse businesses and their projects
4. Click on a project to view details
5. Review tasks and their skill requirements
6. Click "Aanmelden" (Apply) on a matching task
7. Provide motivation text
8. Track application status on dashboard

### Supervisor: Managing Project Applications

1. Log in via OAuth provider
2. View dashboard with pending registrations
3. Click on a registration to review
4. View student profile and skills
5. Accept or reject with feedback message
6. Create new projects/tasks as needed

### Teacher: Administering the Platform

1. Log in via OAuth provider
2. Manage skills (approve pending, rename)
3. Create invite keys for new supervisors
4. Archive inactive businesses
5. View all users in system

## Feature Status

Based on the [Feature Roadmap](../../design-planning/FEATURE_ROADMAP.md):

| Feature | Status |
|---------|--------|
| Student Dashboard (V9) | Completed |
| Supervisor Dashboard | Completed |
| Neumorphic Design System | Completed |
| Skills Management | Completed |
| Task Registration | Completed |
| Business Dashboard | In Progress |
| Role Switching | Planned |
| LLM Smart Matching | Planned |
| Real-time Collaboration | Planned |
