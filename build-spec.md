# Build Spec — Linear Clone (namuh-linear)

> **Status**: PARTIAL — docs extracted, UI inspection pending

## Product Overview

Linear is a keyboard-first issue tracking and project management tool for software teams. It emphasizes speed, clean design, and opinionated workflows. The core product revolves around:

1. **Issues** — The atomic unit. Issues have workflow states, priority, estimates, labels, assignees, due dates, and relations (blocking/blocked/duplicate).
2. **Teams** — Organizational unit. Each team has its own issue namespace (e.g., ENG-123), workflow states, and settings.
3. **Projects** — Time-bound deliverables that group issues across teams. Have milestones, status updates, and progress tracking.
4. **Cycles** — Automated repeating sprints with auto-rollover and burndown charts.
5. **Initiatives** — High-level strategic goals that organize multiple projects.

Key differentiators: Command palette (Cmd+K), extensive keyboard shortcuts, real-time sync, clean minimal UI with dark mode default.

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Database**: Drizzle ORM + PostgreSQL (AWS RDS)
- **Cache/Realtime**: Redis (AWS ElastiCache) — real-time sync, pub/sub for live updates
- **Storage**: AWS S3 — file attachments, avatars
- **Email**: AWS SES — magic link auth, notifications
- **Auth**: Better Auth (Google OAuth + email magic links)
- **Deployment**: AWS ECS Fargate + ALB

## Authentication (P1)

### Methods (for clone)
1. **Google OAuth** — Primary. Better Auth Google provider.
2. **Email Magic Links** — Passwordless. Better Auth email + SES.
3. No passwords — match Linear's passwordless approach.

### Flow
- Login page: "Continue with Google" + "Continue with Email"
- New users → workspace creation flow
- Existing users → redirect to last workspace
- Sessions stored in Postgres via Better Auth Drizzle adapter
- Protected routes via Next.js middleware

## Onboarding (P2-P3)

1. Sign up (Google or magic link)
2. Create workspace (name + URL slug) — auto-creates default team
3. Invite team members (skippable)
4. Import issues (skippable) — out of scope for initial clone
5. Land on dashboard with empty states

## Site Structure (PENDING — needs UI inspection)

### Known from docs:
- **Sidebar**: Inbox, My Issues, Pulse, PR Reviews, Favorites
- **Teams section**: Team list → Issues, Cycles, Projects, Views, Triage
- **Projects**: List view, detail view with milestones
- **Initiatives**: Strategic goals with sub-initiatives
- **Settings**: Workspace, Team, Account settings
- **Command Palette**: Cmd+K for everything

## Design System (PENDING — needs UI inspection)

### Known from docs + screenshots:
- Dark mode default (background: #090909 sidebar, #0f0f11 content area)
- Light mode available (#f5f5f5 sidebar, #fcfcfd content)
- Font: Inter Variable
- Compact, dense UI — lots of information in small space
- Sidebar width: 244px default
- Border radius: 4px (controls), 12px (main content area)
- Border color: dark #1c1e21, light #e0e0e0
- Accent color: #7180ff (blue-purple)

## Data Models (PARTIAL — from docs)

### Workspace
- id, name, urlSlug, createdAt, updatedAt
- Settings: login methods, security, approved email domains

### Team
- id, name, key (e.g. "ENG"), workspaceId
- Settings: workflow states, labels, estimates, cycles enabled
- Private flag

### Issue
- id, identifier (e.g. "ENG-123"), title, description (rich text)
- teamId, assigneeId, creatorId
- stateId (workflow state), priority (0-4), estimate
- labelIds[], parentIssueId, projectId, cycleId
- dueDate, slaId
- Relations: blocking, blocked by, duplicate of, related to
- sortOrder, createdAt, updatedAt, archivedAt, canceledAt

### Project
- id, name, description, status, priority
- teamIds[], leadId, membersIds[]
- startDate, targetDate
- Milestones[], documents[]
- Progress tracking (% complete based on issues)

### Cycle
- id, name, number, teamId
- startDate, endDate
- Auto-rollover settings
- Progress/burndown data

### Initiative
- id, name, description, status
- projectIds[]
- Sub-initiatives

### Label
- id, name, color
- Workspace-level or team-level

### Custom View
- id, name, filterState (JSON), layout (board/list/timeline)
- Shared or personal

### Comment
- id, body (rich text), issueId, userId
- Reactions[]

## API Architecture (PENDING — needs GraphQL schema analysis)

The clone will use REST API routes (Next.js API routes) rather than GraphQL for simplicity:
- `POST /api/auth/*` — Better Auth endpoints
- `GET/POST/PATCH/DELETE /api/issues/*`
- `GET/POST/PATCH/DELETE /api/projects/*`
- `GET/POST/PATCH/DELETE /api/teams/*`
- `GET/POST/PATCH/DELETE /api/cycles/*`
- `GET/POST/PATCH/DELETE /api/views/*`
- etc.

## Build Order (PRELIMINARY)

1. **P0 — Infrastructure**: DB schema, auth setup, project scaffolding
2. **P1 — Auth**: Google OAuth, magic links, session management, protected routes
3. **P2 — Core Layout**: App shell, sidebar, routing, navigation, Cmd+K palette
4. **P3 — Teams & Issues**: Team CRUD, issue CRUD with all properties, workflow states
5. **P4 — Views**: List view, board view, filters, search
6. **P5 — Projects**: Project CRUD, milestones, progress tracking
7. **P6 — Cycles**: Cycle management, auto-rollover, burndown
8. **P7 — Initiatives**: Initiative management, project grouping
9. **P8 — Inbox & Notifications**: Personal inbox, notification system
10. **P9 — Analytics**: Dashboards, insights, charts
11. **P10 — Polish**: Keyboard shortcuts, real-time sync, animations
12. **Last — Deployment**: Docker, ECS Fargate, ALB
