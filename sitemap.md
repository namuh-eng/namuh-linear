# Linear Site Map

> Workspace slug: `foreverbrowsing`
> Base URL: `https://linear.app/{workspace}`

## Overall Layout
- **Sidebar** (244px, left) — persistent navigation
- **Content area** (right) — main content with 12px border-radius container
- **Ask Linear** — floating AI chat button (bottom-right)
- **Command palette** — Cmd+K overlay

## Sidebar Navigation

### Top Bar
- Workspace switcher (top-left) — workspace name + menu
- Search button — opens search/command palette
- Create issue button (+)

### Personal Section
| Page | URL | Type |
|------|-----|------|
| Inbox | `/inbox` | Notification list |
| My Issues | `/my-issues` | Filtered issue list |

### Workspace Section
| Page | URL | Type |
|------|-----|------|
| Projects | `/projects` | Project list |
| Views | `/views` | Custom views list |

### "More" Menu (collapsed by default)
| Page | URL | Type |
|------|-----|------|
| Agent | TBD | AI agent interface |
| Members | `/members` | Member list |
| Teams | `/teams` | Team list |
| Customize sidebar | Modal | Sidebar config |

### Per-Team Section (e.g., Engineering = ENG)
| Page | URL | Type |
|------|-----|------|
| Triage | `/team/ENG/triage` | Triage queue (68 items) |
| Issues | `/team/ENG/all` | Issue list with tabs |
| Projects | `/team/ENG/projects` | Team projects |
| Views | `/team/ENG/views` | Team custom views |

### Other Sidebar Items
| Page | URL | Type |
|------|-----|------|
| Initiatives | `/initiatives` | Initiative list |
| Cycles | `/team/ENG/cycles` | Cycle list |

### Bottom Bar
- Help menu button

## Team Issues Sub-Navigation (tabs within `/team/ENG/`)
| Tab | URL | Description |
|-----|-----|-------------|
| All issues | `/team/ENG/all` | All issues regardless of state |
| Active | `/team/ENG/active` | In-progress issues |
| Backlog | `/team/ENG/backlog` | Backlog issues |
| Board | `/team/ENG/board` | Kanban board view |

## Issue Detail Page
- URL: `/team/ENG/issue/ENG-{number}`
- Content: Title, description (rich text), properties sidebar
- Properties: Status, Priority, Assignee, Labels, Due date, Estimate, Project, Cycle, Parent issue
- Actions: Comment, React, Edit, Archive, Delete
- Sub-issues list
- Activity/history feed
- Relations (blocking, blocked by, duplicate, related)

## Settings Pages

### Account Settings (Personal)
| Page | URL |
|------|-----|
| Preferences | `/settings/account/preferences` |
| Profile | `/settings/account/profile` |
| Notifications | `/settings/account/notifications` |
| Security & access | `/settings/account/security` |
| Connected accounts | `/settings/account/connections` |
| Agent personalization | `/settings/account/agents` |

### Issues Settings
| Page | URL |
|------|-----|
| Labels | `/settings/issue-labels` |
| Templates | `/settings/issue-templates` |
| SLAs | `/settings/sla` |

### Projects Settings
| Page | URL |
|------|-----|
| Labels | `/settings/project-labels` |
| Templates | `/settings/project-templates` |
| Statuses | `/settings/project-statuses` |
| Updates | `/settings/project-updates` |

### Features Settings
| Page | URL |
|------|-----|
| AI & Agents | `/settings/ai` |
| Initiatives | `/settings/initiatives` |
| Documents | `/settings/documents` |
| Customer requests | `/settings/customer-requests` |
| Pulse | `/settings/pulse` |
| Asks | `/settings/asks` |
| Emojis | `/settings/emojis` |
| Integrations | `/settings/integrations` |

### Administration Settings
| Page | URL |
|------|-----|
| Workspace | `/settings/workspace` |
| Teams | `/settings/teams` |
| Members | `/settings/members` |
| Security | `/settings/security` |
| API & webhooks | `/settings/api` |
| Import & export | `/settings/import-export` |

### Per-Team Settings
| Page | URL |
|------|-----|
| Team general | `/settings/teams/ENG` |
| (Workflow, Labels, etc. as sub-pages) | |

## Preferences Page (Default landing for settings)
- **General**: Default home view, Display names, First day of week, Emoticons, Send comment shortcut
- **Interface & Theme**: Sidebar customization, Font size, Pointer cursors, Theme (System/Light/Dark)
- **Desktop App**: Open in desktop setting
- **Coding Tools**: Configure coding tool integrations
- **Automations**: Auto-assign, Git branch format, Status transitions

## Key Interaction Patterns
1. **Command Palette (Cmd+K)** — Search issues, create issues, navigate, run actions
2. **Create Issue (+)** — Quick issue creation from anywhere
3. **Peek Preview** — Click issue in list → side panel preview
4. **Drag & Drop** — Reorder issues, move between columns on board
5. **Keyboard Shortcuts** — Extensive keyboard navigation (vim-style)
6. **Ask Linear** — AI chat assistant floating button
7. **Filters** — Advanced filter bar on all list views
8. **Display Options** — Grouping, sorting, field visibility
9. **Real-time Sync** — Live updates across all connected clients

## Pages NOT Yet Inspected (need deep dive)
- [ ] Inbox (notification detail)
- [ ] My Issues (layout, filters, grouping)
- [ ] Issue detail page (full properties, comments, activity)
- [ ] Issue creation modal
- [ ] Board view (kanban columns, drag & drop)
- [ ] Projects detail page (milestones, progress)
- [ ] Cycles detail page (burndown, scope)
- [ ] Initiatives detail page
- [ ] Custom views (create/edit)
- [ ] Timeline view
- [ ] Search results page
- [ ] Settings sub-pages
- [ ] Team settings
- [ ] Member profiles
