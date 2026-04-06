# Build Spec — Linear Clone (namuh-linear)

> **Status**: PARTIAL — docs extracted, site mapped, issues list + detail inspected

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

## Design System (PARTIAL — updated from UI inspection)

### Colors
- **Dark mode** (default):
  - Sidebar background: #090909
  - Content area background: #0f0f11
  - Border color: #1c1e21
  - Text primary: #ffffff
  - Text secondary: #6b6f76
- **Light mode**:
  - Sidebar background: #f5f5f5
  - Content area background: #fcfcfd
  - Border color: #e0e0e0
  - Text primary: #23252a
  - Text secondary: #b0b5c0
- **Accent**: #7180ff (blue-purple) — links, selections, active states

### Typography
- Font: Inter Variable (preloaded woff2)
- Dense, compact text — small font sizes throughout
- Issue titles: ~14px, semibold
- Secondary text (dates, labels): ~12px
- Sidebar items: ~13px

### Layout
- Sidebar: 244px fixed width, collapsible
- Content area: Fills remaining space, 12px border-radius container
- 8px margin around content area (between sidebar and window edge)
- Board columns: Equal-width, scrollable individually
- Issue list rows: Compact, ~40px height

### Components (observed from UI)
- **Issue card** (board view): White/dark card with title, identifier, priority icon, labels as colored dots, assignee avatar, project chip
- **Issue row** (list view): Single-line with identifier, title, assignee avatar, priority icon, labels, project, dates
- **Priority icons**: Urgent (red !), High (orange ↑), Medium (yellow =), Low (blue ↓), None (gray —)
- **Status indicators**: Circle icons — empty (backlog), half (in progress), checkmark (done), X (canceled)
- **Labels**: Colored dots with text, inline in cards/rows
- **Avatars**: Small circular (20px), with initials fallback
- **Buttons**: Minimal, icon-heavy, subtle borders
- **Modals**: Centered, with backdrop, clean header with close button
- **Sidebar items**: Icon + text, hover highlight, active indicator

### Issue Creation Modal
- Team selector (top-left, shows team key like "ENG")
- Title field (contenteditable, large text)
- Description field (contenteditable, rich text editor)
- Bottom toolbar: Status, Priority, Assignee, Project, Labels buttons (all combobox dropdowns)
- "More actions" overflow button
- File attachment button
- "Create more" checkbox toggle
- "Create issue" submit button
- Expand button (to make modal fullscreen)

### Display Options Panel (sidebar panel)
- **Layout toggle**: List / Board tabs
- **Columns**: Dropdown (e.g., Status)
- **Rows**: Dropdown (e.g., No grouping)
- **Ordering**: Dropdown (e.g., Priority)
- **Toggles**: Order completed by recency, Show sub-issues, Show triage issues, Show empty columns
- **Completed issues**: Dropdown (All / Recent / None)
- **Display properties**: Toggle chips — ID, Status, Assignee, Priority, Project, Due date, Milestone, Labels, Links, Time in status, Created, Updated, Pull requests
- Reset and "Set default for everyone" buttons

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
