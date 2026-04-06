# Linear Onboarding Flow

## Step-by-Step Sequence

### Step 1: Sign Up
- Visit linear.app/signup
- Choose auth method (Google OAuth or Email magic link)
- Account is created

### Step 2: Create or Join Workspace
- **New workspace**: Enter workspace name + URL slug (e.g., "Acme" → acme.linear.app)
- **Join existing**: If email domain is in workspace's approved domains list, user sees available workspaces to join
- **Accept invite**: If user was invited via email, they join that workspace directly
- A default team is auto-created with the workspace name

### Step 3: Invite Team Members (Skippable)
- Prompt to invite teammates by email
- Can enter multiple emails separated by commas
- Can select role for invitees (on paid plans)
- Can select which team(s) invitees auto-join
- Skip button available

### Step 4: Import Issues (Skippable)
- Option to import from Jira, Asana, GitHub Issues, etc.
- Or start fresh with empty workspace
- Skip button available

### Step 5: Landing on Dashboard
- User lands on the main workspace view
- Sidebar shows: Inbox, My Issues, Pulse, Favorites
- Default team visible in sidebar
- Empty state for issues (no issues yet)

## Empty States (Before User Has Data)
- **Issues list**: "No issues" with prompt to create first issue
- **Projects**: Empty project list with "Create project" CTA
- **Cycles**: "No active cycle" with option to enable cycles for the team
- **Inbox**: "You're all caught up" or similar empty inbox message
- **My Issues**: "No issues assigned to you" 

## What "Done" Looks Like
- User has an account, belongs to a workspace with at least one team
- They see the main dashboard with sidebar navigation
- They can create their first issue immediately
- Command palette (Cmd+K) is available from the start

## Required vs. Skippable Steps
- **Required**: Auth (signup), workspace creation (or join)
- **Skippable**: Invite members, import issues, guided tour

## For the Clone
- Auth → Workspace creation → Dashboard (minimum path)
- Invite + Import as optional onboarding steps
- Empty states for all core features
- Cmd+K available immediately
