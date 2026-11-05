# Soneri Bank Limited — IT Operations Task & Shift Management Portal

## Summary
Migrate the legacy single-file IT Operations Checklist into a modular, production-ready React application with TypeScript and Tailwind CSS. The modernized portal introduces a resilient Context API state architecture, browser local storage persistence, role-based user authentication (Operator, Verifier, Admin), dynamic category/section administration, shift pass/fail analytics with SLA tracking, and instant email/Excel and JSON backup workflows.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural parameters have been aligned based on user selections:

- **User Management & RBAC**: Implements dedicated role profiles for **Operators (Inputers)**, **Verifiers (Authors)**, and **IT Operations Admins** with secure PIN/password authentication, persistent profiles in localStorage, and fast 1-click initials/author fill.
- **Analytics & Productivity Insights**: Shift Summary Cards tracking **Daily Shift Pass/Fail status**, section completion rates, execution time compliance, pending task alerts, and print/exportable shift sign-off summaries.
- **Navigation & Workspace Architecture**: Tabbed portal layout featuring:
  1. **Operational Checklist**: Full task list with section grouping, live search, time stamp auto-population, and inline execution.
  2. **Shift Analytics & Reports**: Pass/fail breakdown, category health metrics, and audit summary.
  3. **Categories & Task Management**: Admin-only manager to add/edit/reorder sections and customize SOP tasks with conflict-free serial numbers (`Sr#`).
  4. **User Management**: Team roster administration with role assignments, active user switching, and credential controls.
- **Data Persistence**: Robust client-side localStorage schema storing `sectionsConfig`, `tasksMaster`, `historyDB` (by date), and `usersDB`, bundled together seamlessly during JSON backup download and upload.

---

## 1. Overview & Core Concept

- **What It Does**: A mission-critical IT operations management platform for bank system administrators and shift operators. It coordinates daily recurring procedures (Morning, Daily, Pre-COB/Post-COB Night, Weekly, Monthly), ensures dual-control sign-off (Inputer + Verifier), logs execution timestamps, and produces certified handover records for audit and compliance.
- **Target Audience / Persona**: IT Operations Engineers, Shift Supervisors, and Systems Administrators executing strict Core Banking System (T24, SWIFT, ATM/PSW) daily operational cycles.
- **Key Value**: Eliminates manual paper checklists and fragile single-file scripts while guaranteeing non-colliding serial numbers, historical auditing, instant shift compliance verification, and standardized handover reporting.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Shift Execution & Sign-off**:
   - Operator logs in or selects active profile.
   - Selects current shift date (or browses historical shifts via calendar picker).
   - Toggles task checkbox: system auto-captures current timestamp (`HH:MM`) and populates the logged-in Operator's initials.
   - Verifier reviews output and signs off with a single click or PIN entry.
2. **Shift Analytics & Compliance Inspection**:
   - Supervisor navigates to the **Analytics & Reports** tab.
   - Evaluates real-time pass/fail status: All required shift tasks completed $\rightarrow$ "Shift Certified Pass"; incomplete items flagged with red alerts and time estimates.
   - Generates formatted handover email or table ready to copy into Outlook or Excel.
3. **Category & Task Administration**:
   - Admin accesses protected **Categories & Tasks** panel.
   - Adds custom operational cycles (e.g., "Quarterly Disaster Recovery Drills") or modifies existing steps without breaking existing SOP serial numbers.
4. **User & Access Management**:
   - Admin registers shift staff, sets roles (Operator, Verifier, Admin), and assigns access credentials.

### Visual Identity & Theme
- **Color Palette & Discipline**:
  - Dominant Neutral: Crisp slate background (`bg-slate-50` / `bg-slate-900`) and structured cards (`bg-white` / `bg-slate-800`).
  - Banking Navy: Trustworthy institutional blue (`#1A56DB` / `bg-blue-700`) as primary brand accent.
  - Semantic Indicators: Emerald (`#059669` / `text-emerald-700`) for verified completions; Amber (`#D97706` / `text-amber-700`) for pending cutoff items; Crimson (`#DC2626` / `text-rose-700`) for overdue or incomplete runs.
- **Typography & Data Alignment**:
  - Primary UI & Headings: `Plus Jakarta Sans` or modern geometric sans-serif for clear legibility under dense operating conditions.
  - Tabular Numerals: Tabular monospace figures (`tabular-nums font-mono`) for all `Sr#`, execution timestamps (`08:30:15`), and percentage completion bars.
- **Component Styling & Layout**:
  - Clean top bar with brand wordmark ("Soneri Bank Limited - IT Operations"), live date and viewing date picker, active user badge, and view tabs.
  - Unboxed metadata with clean typographic separators (`·` or `/`) instead of repetitive pill badges.
  - Compact data grid rows with hover highlights, clear input focus rings, and zero-latency click feedback ($\le 150\text{ms}$).

---

## 3. Key Product Decisions & Trade-Offs

- **Context API vs External State Library**:
  - *Chosen Approach*: React Context API with modular custom hooks (`useTasks`, `useAuth`, `useHistory`).
  - *Why*: Eliminates bundle overhead of Redux or Zustand while providing clean, typed state distribution across tabs and components.
- **Client-Side LocalStorage with JSON Export/Import**:
  - *Chosen Approach*: Multi-key localStorage backing (`sbl_tasks_master`, `sbl_sections_config`, `sbl_history_db`, `sbl_users_db`) with transactional JSON backup bundles.
  - *Why*: Satisfies offline banking intranet requirements where external cloud databases may be restricted by security policies, while offering full data portability between machines.
- **Dual-Control Verification (Maker-Checker)**:
  - *Chosen Approach*: Dedicated Inputer and Verifier fields with authenticated user quick-fill.
  - *Why*: Mimics real-world financial banking compliance where operators cannot verify their own high-privilege tasks.
- **Preservation of SOP Serial Numbers (`Sr#`)**:
  - *Chosen Approach*: Global uniqueness validation with automatic incrementing on new additions while preserving legacy gaps and references.
  - *Why*: Bank operators frequently refer to paper manuals by specific IDs (e.g., "Task 24 Pre COB Backup").

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AppLayout & Global Providers                     │
│               [TaskContext]  [AuthContext]  [HistoryContext]           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                               ▼                               ▼
┌─────────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────────┐
│     Checklist View      │   │    Analytics & Reports    │   │  Management Consoles    │
├─────────────────────────┤   ├───────────────────────────┤   ├─────────────────────────┤
│ • Top Shift Progress    │   │ • Shift Pass/Fail KPI Card│   │ • Custom Category Mgr   │
│ • Date Switcher & Banner│   │ • Section Health Breakdown│   │ • Task SOP Editor       │
│ • Live Search & Filter  │   │ • Inputer/Verifier Audit  │   │ • User Roster & RBAC    │
│ • Dynamic Section Tables│   │ • Email/Excel Generator   │   │ • JSON Backup / Restore │
│ • Dual-Control Inputs   │   │ • Print Handover Sheet    │   │ • Reset Shift State     │
└─────────────────────────┘   └───────────────────────────┘   └─────────────────────────┘
```

### Data Models
1. **Task Model**:
   ```typescript
   interface TaskItem {
     sr: number;
     nature: string;
     time: string;
     task: string;
     profile: 'Utility' | 'Browser' | 'Prod Server' | 'Server' | 'EMAIL' | 'Validation' | 'Process' | 'DB Server' | 'Service' | 'Other';
     note?: string;
   }
   ```
2. **Section Model**:
   ```typescript
   interface SectionConfig {
     key: string;
     title: string;
     description?: string;
   }
   ```
3. **Execution Record**:
   ```typescript
   interface TaskExecution {
     checked: boolean;
     time: string;
     init: string;
     auth: string;
     completedByUserId?: string;
     verifiedByUserId?: string;
   }
   type DailyHistory = Record<string, TaskExecution>; // key: `${sectionKey}-${sr}`
   ```
4. **User & Auth Model**:
   ```typescript
   interface UserProfile {
     id: string;
     name: string;
     initials: string;
     role: 'operator' | 'verifier' | 'admin';
     pin: string;
     active: boolean;
   }
   ```

### Implementation Steps
1. **Types & Seed Data**: Port all legacy SOP master tasks and categories into typed constants with automatic localStorage initialization.
2. **Context Providers**:
   - `TaskContext`: Master task catalog and custom section configuration.
   - `HistoryContext`: Daily execution state, date navigation, and auto-save timers.
   - `AuthContext`: Active user session, user management, and permission validation.
3. **UI Components**:
   - Header with bank identity, date navigation, quick stats, and navigation tabs.
   - Shift Checklist with dynamic sections, profile badges, and dual-control input fields.
   - Shift Analytics Dashboard with pass/fail summary cards and completion metrics.
   - Category & Task Management modal/panel.
   - User Management console.
   - Email/Excel exporter modal & Backup/Restore JSON utility.
4. **Verification & Testing**: Verify complete end-to-end functionality, build integrity, and clean responsive behavior across desktop and tablet viewports.
