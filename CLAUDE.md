# Project: TaskForge — Personal Jira-like Project Management Tool

## Overview

TaskForge is a personal project management board inspired by Jira. It provides a drag-and-drop Kanban interface for managing tasks across customizable statuses, with priority logic, task assignment, and authentication. Built as a polished, performant single-page application.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18+
- **Component Library**: shadcn/ui (Radix primitives + Tailwind)
- **Styling**: Tailwind CSS v3 with CSS variables for theming (follows shadcn's theming convention)
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **State Management**: Zustand (lightweight, no boilerplate)
- **Database**: SQLite via `better-sqlite3` (local, zero-config)
- **ORM**: Drizzle ORM (type-safe, lightweight, works great with SQLite)
- **Auth**: Better Auth (modern, framework-agnostic, session-based auth)
- **Icons**: `lucide-react` (already bundled with shadcn)
- **Unique IDs**: `nanoid`
- **Date Handling**: `date-fns`
- **Notifications/Toasts**: shadcn's `sonner` integration (use `toast()` from sonner)

---

## Better Auth Setup

### Installation & Configuration

```bash
npm install better-auth
```

**`lib/auth.ts`** — Server-side auth instance:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24h
  },
});
```

**`lib/auth-client.ts`** — Client-side auth hooks:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**`app/api/auth/[...all]/route.ts`** — Auth API route handler:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### Auth Middleware

Create `middleware.ts` at the project root to protect the board routes. Redirect unauthenticated users to `/login`. Public routes: `/login`, `/signup`, `/api/auth/**`.

### Auth Pages

- `/login` — Email + password sign in form (use shadcn `Card`, `Input`, `Button`, `Label`)
- `/signup` — Registration form (same components)
- Both pages use `authClient.signIn.email()` and `authClient.signUp.email()` respectively
- Redirect to `/` (board) on successful auth
- Show form validation errors inline using shadcn's form pattern

### Auth-Gating All API Routes

Every API route under `/api/statuses`, `/api/tickets`, `/api/assignees` must verify the session:
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

All tickets, statuses, and assignees are scoped to the authenticated user via `user_id` foreign key.

---

## Design Direction

**Aesthetic**: Use shadcn/ui's default design system as the foundation — extend it, don't fight it. Dark mode as default. The look should feel like Linear meets Notion: clean, dense, professional. Tight spacing, no decorative fluff.

**shadcn Theme Customization** (`globals.css`):

Override shadcn's CSS variables in the `:root` / `.dark` blocks:
```css
.dark {
  --background: 0 0% 6%;
  --foreground: 0 0% 90%;
  --card: 0 0% 10%;
  --card-foreground: 0 0% 90%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 45%;
  --border: 0 0% 18%;
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --ring: 239 84% 67%;
}
```

**Priority Colors** (custom CSS variables alongside shadcn's):
```css
:root {
  --priority-urgent: 0 84% 60%;
  --priority-high: 25 95% 53%;
  --priority-medium: 48 96% 53%;
  --priority-low: 142 71% 45%;
  --priority-none: 0 0% 45%;
}
```

**Typography**: Use shadcn defaults (inherits from Tailwind's `font-sans`). Override with `JetBrains Mono` (Google Fonts) for ticket IDs, timestamps, and metadata labels only.

**Motion**: Minimal. Drag ghost with slight `scale(1.02)` and elevated shadow. Column drop targets get a soft `ring-2 ring-primary/20` glow. Card creation animates in with `opacity` + `translateY`. Prefer CSS transitions over JS animation libraries.

---

## Database Schema (Drizzle ORM)

### Schema Definition (`lib/schema.ts`)

Use Drizzle's SQLite schema builder. All tables include `userId` to scope data per user.

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Better Auth manages its own user/session tables.
// Reference the user table it creates:
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const statuses = sqliteTable("statuses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6b7280"),
  position: integer("position").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const assignees = sqliteTable("assignees", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  statusId: text("status_id").notNull().references(() => statuses.id, { onDelete: "cascade" }),
  assigneeId: text("assignee_id").references(() => assignees.id, { onDelete: "set null" }),
  priority: text("priority", { enum: ["urgent", "high", "medium", "low", "none"] }).default("none"),
  position: integer("position").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
```

### Default Seed Data

On first login (when a user has zero statuses), auto-seed these defaults for that user:
1. **Backlog** (position 0, color `#6b7280`)
2. **To Do** (position 1, color `#6366f1`)
3. **In Progress** (position 2, color `#eab308`)
4. **Done** (position 3, color `#22c55e`)

### Drizzle Config (`drizzle.config.ts`)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  },
});
```

Run migrations with `npx drizzle-kit push` during development.

---

## API Routes (Next.js Route Handlers)

All routes live under `app/api/`. Return JSON. Use proper HTTP status codes. **Every route must verify session and scope queries by `userId`.**

### Statuses

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/statuses` | List all statuses for current user, ordered by position |
| POST | `/api/statuses` | Create a new status `{ name, color? }` — auto-assign next position |
| PATCH | `/api/statuses/[id]` | Update status name, color, or position |
| DELETE | `/api/statuses/[id]` | Delete status and cascade-delete its tickets |
| PUT | `/api/statuses/reorder` | Bulk reorder `{ orderedIds: string[] }` — reassign positions |

### Tickets

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tickets` | List all tickets for current user (join status + assignee), ordered by status then position |
| POST | `/api/tickets` | Create ticket `{ title, description?, statusId, assigneeId?, priority? }` |
| PATCH | `/api/tickets/[id]` | Update any ticket field |
| DELETE | `/api/tickets/[id]` | Delete a ticket |
| PUT | `/api/tickets/move` | Move ticket `{ ticketId, targetStatusId, newPosition }` — reindex siblings |

### Assignees

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/assignees` | List all assignees for current user |
| POST | `/api/assignees` | Create assignee `{ name, email?, avatarUrl? }` |
| PATCH | `/api/assignees/[id]` | Update assignee |
| DELETE | `/api/assignees/[id]` | Delete assignee (tickets become unassigned) |

---

## Core Features — Implementation Details

### 1. Drag & Drop Tickets Between Statuses

Use `@dnd-kit/core` with `DndContext`, `DragOverlay`, and `SortableContext` per column.

**Behavior**:
- Each status column is a droppable container
- Tickets within a column are sortable (reorderable vertically)
- Dragging a ticket to another column changes its status
- On drop: call `PUT /api/tickets/move` with `{ ticketId, targetStatusId, newPosition }`
- Optimistic update in Zustand store — rollback on API failure, show error toast via `sonner`
- Drag overlay shows a slightly elevated ghost of the card using shadcn's `Card` with extra shadow
- Drop target column gets a soft `ring-2 ring-primary/20` glow

**Key implementation notes**:
- Use `closestCorners` collision detection strategy
- Track `activeId` in state for the drag overlay
- Reindex all sibling positions in the target column server-side after a move
- Debounce rapid consecutive moves

### 2. Status Creation & Management

**UI**: A "+" button (shadcn `Button` variant `outline`, size `icon`) at the end of the column row. Clicking opens a shadcn `Popover` with `Input` for name and a color picker grid.

**Behavior**:
- New status appears at the rightmost position
- Rename by double-clicking column header — inline `Input` replaces the text
- Color picker: grid of 10 preset colors using small colored circles (no custom hex input)
- Delete via context menu (shadcn `DropdownMenu` on column header) — shows `AlertDialog` confirming cascade deletion
- Columns can be reordered by dragging headers (horizontal `@dnd-kit` sortable)
- Prevent deleting the last remaining status — show toast explaining why

### 3. Assigning Tasks

**UI**: Each `TicketCard` shows an `Avatar` (shadcn component) in the bottom-right. Clicking opens a shadcn `Command` (combobox) with search for assignees.

**Behavior**:
- Manage assignees via a `Sheet` (slide-over panel) accessible from the board header
- Assignee CRUD uses shadcn `Dialog` for create/edit forms with `Input` and `Label`
- Assign: click avatar on card → `Command` dropdown → select → PATCH ticket
- Unassign: select "Unassigned" option (shown at top of list with a clear icon)
- Avatar display: shadcn `Avatar` with `AvatarImage` + `AvatarFallback` (initials, color from name hash)
- Board-level filter: `Select` in header to filter tickets by assignee

### 4. Priority Logic

**Priority levels** (ordered by severity):
1. 🔴 **Urgent** — red left-border on card (3px `border-l` with `hsl(var(--priority-urgent))`)
2. 🟠 **High** — orange left-border
3. 🟡 **Medium** — yellow left-border
4. 🟢 **Low** — green left-border
5. ⚪ **None** — muted/no colored border

**Visual treatment**: Each ticket `Card` has a 3px left border in the priority color. A small `Badge` (shadcn) with the priority label and matching dot is shown on the card.

**Sort logic within columns**: Tickets are ordered by manual position (drag order) by default. A `Toggle` in the board header enables auto-sort by priority (urgent → none) within each column — view-only, does not mutate DB positions.

**Setting priority**: Click the priority `Badge` on a card → shadcn `DropdownMenu` with 5 items, each showing colored dot + label.

### 5. Status Update of Ticket

**Multiple update methods**:
1. **Drag & drop** (primary) — drag card to a different column
2. **Ticket detail panel** — open ticket → change status via `Select` dropdown
3. **Quick context menu** — right-click card → shadcn `ContextMenu` → "Move to" submenu listing all statuses

**Ticket detail panel** (shadcn `Sheet` sliding from right):
- Title: inline-editable `Input` styled to look like plain text until hovered/focused
- Description: `Textarea` with markdown preview toggle
- Status: `Select` component with colored status indicators
- Assignee: `Command` combobox (same as card-level)
- Priority: `Select` with colored priority indicators
- Metadata: created/updated timestamps in `JetBrains Mono`, muted color
- Delete: `Button` variant `destructive` → `AlertDialog` for confirmation
- Auto-save: changes fire PATCH after 500ms debounce on blur

---

## shadcn Components to Install

Run these during project setup:
```bash
npx shadcn@latest init
npx shadcn@latest add button card input label select textarea badge avatar \
  dropdown-menu context-menu dialog alert-dialog sheet command popover \
  toggle separator skeleton tooltip sonner
```

---

## Component Architecture

```
src/
├── app/
│   ├── layout.tsx                  # Root layout, fonts, ThemeProvider, Toaster
│   ├── page.tsx                    # Main board page (auth-gated)
│   ├── login/page.tsx              # Login page
│   ├── signup/page.tsx             # Signup page
│   └── api/
│       ├── auth/[...all]/route.ts  # Better Auth handler
│       ├── statuses/
│       │   ├── route.ts            # GET, POST
│       │   ├── [id]/route.ts       # PATCH, DELETE
│       │   └── reorder/route.ts    # PUT
│       ├── tickets/
│       │   ├── route.ts            # GET, POST
│       │   ├── [id]/route.ts       # PATCH, DELETE
│       │   └── move/route.ts       # PUT
│       └── assignees/
│           ├── route.ts            # GET, POST
│           └── [id]/route.ts       # PATCH, DELETE
├── components/
│   ├── board/
│   │   ├── Board.tsx               # Main Kanban board with DndContext
│   │   ├── StatusColumn.tsx        # Single column (droppable + sortable)
│   │   ├── TicketCard.tsx          # Draggable ticket card
│   │   ├── CreateTicketForm.tsx    # Inline form at bottom of column
│   │   ├── CreateStatusPopover.tsx # Popover form for new column
│   │   └── BoardHeader.tsx         # Filters, sort toggle, settings button
│   ├── tickets/
│   │   ├── TicketDetailSheet.tsx   # Slide-over detail panel
│   │   ├── PriorityBadge.tsx       # Priority indicator + dropdown
│   │   └── StatusBadge.tsx         # Status label with color
│   ├── assignees/
│   │   ├── AssigneeAvatar.tsx      # Avatar with initials/image fallback
│   │   ├── AssigneeCommand.tsx     # Searchable assignee picker (Command)
│   │   └── AssigneeManager.tsx     # CRUD sheet for managing assignees
│   ├── auth/
│   │   ├── LoginForm.tsx           # Email/password login form
│   │   └── SignupForm.tsx          # Registration form
│   └── ui/                         # shadcn generated components (do not edit)
├── store/
│   └── useStore.ts                 # Zustand store
├── lib/
│   ├── auth.ts                     # Better Auth server config
│   ├── auth-client.ts              # Better Auth client hooks
│   ├── db.ts                       # Drizzle + better-sqlite3 connection
│   ├── schema.ts                   # Drizzle schema definitions
│   └── utils.ts                    # cn() helper, nanoid, initials, color hash
├── types.ts                        # Shared TypeScript interfaces
├── middleware.ts                    # Auth middleware — protect routes
├── drizzle.config.ts
└── drizzle/                        # Migration files
```

---

## Zustand Store Shape

```typescript
interface AppState {
  // Data
  statuses: Status[];
  tickets: Ticket[];
  assignees: Assignee[];

  // UI state
  activeTicketId: string | null;       // currently dragging
  selectedTicketId: string | null;     // detail sheet open
  sortByPriority: boolean;             // view-level priority sort toggle
  filterAssigneeId: string | null;     // board-level assignee filter
  isLoading: boolean;

  // Actions
  fetchAll: () => Promise<void>;
  moveTicket: (ticketId: string, targetStatusId: string, newPosition: number) => Promise<void>;
  createTicket: (data: CreateTicketInput) => Promise<void>;
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  createStatus: (data: CreateStatusInput) => Promise<void>;
  updateStatus: (id: string, data: Partial<Status>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  reorderStatuses: (orderedIds: string[]) => Promise<void>;
  createAssignee: (data: CreateAssigneeInput) => Promise<void>;
  updateAssignee: (id: string, data: Partial<Assignee>) => Promise<void>;
  deleteAssignee: (id: string) => Promise<void>;
}
```

All mutation actions follow optimistic update pattern: update local state → fire API → rollback + `toast.error()` on failure.

---

## Interaction & UX Guidelines

- **Card click** → opens detail `Sheet`. **Card drag** → initiates drag. Use a drag handle icon (grip dots) on the left side of the card to distinguish.
- **Empty column** → dashed-border drop zone using shadcn `Card` with `border-dashed` and muted placeholder text.
- **Keyboard support**: Tab through cards, Enter to open detail, Escape to close sheets/dialogs. shadcn handles most via Radix.
- **Loading states**: shadcn `Skeleton` components for cards on initial load (3 skeletons per column).
- **Error handling**: `toast.error()` via sonner for all API errors. Never fail silently.
- **Responsive**: Board scrolls horizontally on smaller screens. Columns min-width `280px`, max-width `340px`.
- **Auth pages**: Centered card layout, minimal. Use shadcn `Card` with `CardHeader`, `CardContent`, `CardFooter`.

---

## Rules for Claude Code

1. **No placeholder code.** Every component must be fully functional. No `// TODO` unless explicitly told to defer.
2. **Type everything.** No `any`. Define interfaces in a shared `types.ts`.
3. **Optimistic updates always.** Never block UI on API response. Handle rollback with toast.
4. **Use shadcn components.** Do not build custom buttons, inputs, dialogs, or dropdowns from scratch. Always use the installed shadcn components from `@/components/ui/`.
5. **Accessible by default.** shadcn/Radix handles most a11y — don't break it. Add `aria-label` on icon-only buttons. Manage focus in sheets/dialogs.
6. **One file, one concern.** Components under 150 lines. Extract custom hooks for data fetching and mutations into `hooks/` if needed.
7. **Error boundaries.** Wrap the board in a React error boundary with a fallback UI.
8. **Use `cn()` for class merging.** Import from `@/lib/utils`. No inline styles. No raw `clsx` — always `cn()`.
9. **Consistent API error shape**: `{ error: string, details?: unknown }` with proper HTTP status codes.
10. **Auth on every API route.** Never skip session verification. Always scope queries by `session.user.id`.
11. **Database migrations via Drizzle Kit.** Use `npx drizzle-kit push` in dev. Never manually alter the DB.
12. **Better Auth tables are managed by Better Auth.** Do not manually create or modify `user`, `session`, `account`, or `verification` tables — Better Auth handles its own schema.