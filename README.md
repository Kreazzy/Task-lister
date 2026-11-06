# Soneri Bank Limited (SBL) — IT Operations Task & Shift Handover Management Portal

> **Enterprise IT Operations Task Checklist, Shift Handover Verification, Custom Role Governance, and Productivity Analytics Portal.**  
> Built for banking data center operators, shift supervisors, audit teams, and operations management.

---

## 📋 Table of Contents
1. [Overview & Purpose](#-overview--purpose)
2. [Key Architecture & Technology Stack](#-key-architecture--technology-stack)
3. [Features & What Works](#-features--what-works)
   - [Shift Checklist & SOP Execution](#1-shift-checklist--sop-execution)
   - [Dual-Control Authorization (Maker-Checker / 4-Eyes Principle)](#2-dual-control-authorization-maker-checker--4-eyes-principle)
   - [Shift Category & Master SOP Task Catalog](#3-shift-category--master-sop-task-catalog)
   - [Multi-Tier Staff & Custom Role Governance](#4-multi-tier-staff--custom-role-governance)
   - [Control Panel: Theming, Branding & Dark Mode](#5-control-panel-theming-branding--dark-mode)
   - [Shift Analytics & Visual Graphs](#6-shift-analytics--visual-graphs)
   - [Ultra-Compact Print Engine (1–2 Pages Max)](#7-ultra-compact-print-engine-12-pages-max)
   - [Data Portability & Resilience](#8-data-portability--resilience)
4. [What Does Not / Architectural Scope ("What Not")](#-what-does-not--architectural-scope-what-not)
5. [Default User Credentials & Security Roles](#-default-user-credentials--security-roles)
6. [Operational Workflows](#-operational-workflows)
   - [Shift Execution & Inputer Workflow](#a-shift-execution--inputer-workflow)
   - [Supervisor Verification (Auth) Workflow](#b-supervisor-verification-auth-workflow)
   - [Creating Custom Operational Roles](#c-creating-custom-operational-roles)
   - [SOP Reordering & Adding Tasks](#d-sop-reordering--adding-tasks)
   - [Shift Handover Email / Report Generation](#e-shift-handover-email--report-generation)
7. [Installation, Development & Production Deployment](#-installation-development--production-deployment)
8. [Project File Structure](#-project-file-structure)

---

## 🏦 Overview & Purpose

In 24/7 Core Banking IT Operations (T24, Swift, NACTA, ATM Switches, RTGS, and EOD batch execution), shift teams must adhere strictly to Standard Operating Procedures (SOPs). 

This portal migrates legacy single-HTML task checklists into a modern, resilient, multi-user web application providing:
- Guaranteed **100 contiguous banking SOP tasks** spanning all core operational shifts.
- **Dual-control authorization** enforcing the regulatory **4-Eyes Principle** (Maker-Checker).
- Granular **Role-Based Access Control (RBAC)** with dynamic **Custom Role creation**.
- Instant **1–2 page print optimization** for physical signing and regulatory shift archiving.
- Live **Light / Dark mode** and enterprise corporate branding.

---

## 💻 Key Architecture & Technology Stack

- **Frontend**: React 19 (Functional Components, Hooks, Context API)
- **Language**: TypeScript with strict types
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom selector-based `@custom-variant dark` support
- **Icons**: Lucide React
- **Full-Stack Backend**: Express.js with Vite middleware integration in development and bundled static serving in production
- **Bundler & Compiler**: Vite 8 & esbuild with Node.js ESM bundling (`--bundle --packages=external`)
- **Persistence**: Double-layer persistence:
  1. Backend `data/db.json` with live 3-second multi-user polling sync via `/api/sync` and `/api/data`.
  2. Client-side self-healing browser cache (`localStorage`) enabling offline operation on static deployments (e.g. Netlify/Vercel).

---

## ✨ Features & What Works

### 1. Shift Checklist & SOP Execution
- **100 Contiguous Standard Tasks**: Catalog covers all 100 master operational tasks (`#1` through `#100`) without gaps:
  - `morn`: Tasks #1 to #17 (Morning System Initialization, Rates Download, Core Connectivity)
  - `daily`: Tasks #18 to #52 (Day Shift Core Banking, CUTOFF, Pre-COB Database Backups, Swift)
  - `night`: Tasks #53 to #87 (COB Execution, Post-COB Backups, Tape Archiving, Reports)
  - `weekly`: Tasks #88 to #92 (Weekend Full Tape DB Backups and AGOB Verification)
  - `monthly`: Tasks #93 to #100 (SOM / EOM Tax Routines, KIBOR Rate Tables, Compliance Archives)
- **One-Click Check & Timestamp**: Clicking a task automatically records the current execution timestamp and the active operator's initials.
- **Sequential Drag-and-Drop**: Drag tasks up or down within a section. Moving a task dynamically renumbers serial numbers sequentially so visual ordering matches SOP execution.
- **Shift Date Browser**: View and inspect any previous day's shift records or jump back to live today. Historical dates display a distinctive amber alert banner to prevent accidental edits.
- **Filter & Search**: Instant real-time search across task name, serial number, nature (Daily, Weekly, Monthly), time window, profile category, or technical notes.

### 2. Dual-Control Authorization (Maker-Checker / 4-Eyes Principle)
- Supports regulatory banking compliance requiring two separate individuals for high-risk operations:
  - **Inputer (`init`)**: Frontline Operation Officer who carries out the routine.
  - **Authorizer / Verifier (`auth`)**: Shift Supervisor or Operations Manager who reviews logs and confirms success.
- Supervisors and Managers get dedicated **"Quick Verify" (Auth)** action buttons on completed tasks.

### 3. Shift Category & Master SOP Task Catalog
- **Category Management**:
  - Add custom operational categories (e.g., *Disaster Recovery Drills, ATM Switch Maintenance*).
  - Edit category titles and short descriptive scopes directly via modal dialogs.
  - Reorder categories up or down.
  - Delete categories with safety guardrails (at least 1 category must always remain).
- **Task Management**:
  - Add new tasks with nature, time window, profile category, and technical instructions.
  - Edit existing tasks in-place.
  - Delete individual tasks with confirmation dialogs.
- **Sync 100 Master Tasks**: One-click catalog reconciliation button that automatically audits and restores any missing standard SOP tasks without wiping shift checkmarks.

### 4. Multi-Tier Staff & Custom Role Governance
- **5 Built-in Banking Roles**:
  1. **Administrator (`admin`)**: Unrestricted governance over users, roles, categories, master SOP tasks, portal theming, and system resets.
  2. **Operation Officer (`operator`)**: Frontline duty focused exclusively on checklist execution, timestamping, and input initials.
  3. **Shift Supervisor (`supervisor`)**: Responsible for dual-verification (`auth`), shift sign-off, SLA review, and handover reports.
  4. **Audit & Compliance (`auditor`)**: Read-only oversight for inspecting historical shifts, SLA breaches, and export logs.
  5. **Operations Manager (`manager`)**: High-level operational governance, dual-control authorization, and productivity analytics.
- **Custom Role Builder**:
  - Administrators can create bespoke custom roles (e.g. *Database Administrator, Network Operations Officer, DR Coordinator*).
  - Assign custom badge colors (Purple, Emerald, Blue, Amber, Indigo, Cyan, Rose, Slate).
  - Granularly toggle 8 distinct permissions:
    - View Checklist
    - Execute Tasks (Inputer)
    - Dual Verification (Authorizer)
    - Manage SOP Tasks & SLAs
    - Manage Shift Categories
    - Manage Staff & Roles
    - View Analytics & Reports
    - Configure Portal Themes & Branding
  - Safety checks prevent deleting roles that currently have assigned staff members.

### 5. Control Panel: Theming, Branding & Dark Mode
- **Selector-Based Dark Mode**:
  - Instant toggle between crisp light mode and deep contrast dark mode (`.dark` on `html` and `body`).
  - Toggle button accessible from the header bar, the floating sidebar, the settings modal, and the login screen.
- **Color Theme Selector**:
  - 6 Banking Presets: *Soneri Blue, Islamic Emerald, Royal Indigo, Corporate Amber, Midnight Dark, Crimson Ruby*.
  - **Live HEX Color Picker**: Choose any custom corporate hexadecimal color code (`--primary-color`).
- **Branding & Identity Customization**:
  - Upload a custom corporate bank logo (via file upload / Base64 or image URL) with fallback to default Soneri Shield.
  - Custom Portal Title, Subtitle, and Data Center/Branch location.
  - Custom institutional footer disclaimer.
  - Toggle right-alignment of the version badge (`IT Ops V5.2`).

### 6. Shift Analytics & Visual Graphs
- **7-Day Trend Chart**: Interactive daily completion bar chart comparing completed vs. scheduled tasks.
- **Shift Timeline Phase Progress**: Visual progress bars per shift category (*Morning, Daily, Evening/Night, Weekly, Monthly*).
- **Operator Workload Distribution**: Team member cards detailing individual task execution counts and supervisor verification stamps.

### 7. Ultra-Compact Print Engine (1–2 Pages Max)
- Print stylesheet (`@media print`) engineered specifically to compress large checklists into **1 to 2 pages maximum**:
  - Automatically strips away floating buttons, navigation tabs, search inputs, modal triggers, and admin action buttons.
  - Formats an executive Bank Operations SOP Header with live date, shift time window, operator/supervisor sign-off blocks, and completion metrics.
  - Uses tight 8pt typography and condensed table borders fitting 50+ rows cleanly per page.

### 8. Data Portability & Resilience
- **JSON Backup & Restore**: Export full database snapshots (tasks, categories, users, custom roles, history, and portal settings) as JSON and restore on demand.
- **Email / Excel Formatted Export**: Generates clean HTML and TSV summaries ready to paste directly into Microsoft Outlook or Excel for management shift handover emails.

---

## ⚠️ What Does Not / Architectural Scope ("What Not")

| Feature | Current Scope / Workaround |
| :--- | :--- |
| **Direct SMTP Mail Dispatch** | The portal generates pre-formatted tabular HTML summaries ready to copy-paste into Outlook or Webmail. It does not send raw SMTP socket packets directly from the browser, avoiding the need for exposed mail server credentials. |
| **Real-time WebSockets** | The app utilizes 3-second background polling via the Express `/api/data` backend. This ensures reliable synchronization across multiple browser tabs without requiring complex WebSocket proxy setups. |
| **Multi-Device Sync on Static Hosts (Netlify/Vercel)** | When deployed to purely static hosting (without Node.js running), client state persists in browser `localStorage`. To enable live multi-user collaboration across separate physical workstations, run the app using the included Express server (`node dist-server/server.js` or Cloud Run/Docker). |
| **External Database Engines** | The application uses an embedded atomic file-based database (`data/db.json`). It does not require installing external PostgreSQL or MySQL instances. |

---

## 🔑 Default User Credentials & Security Roles

On initial startup, the portal requires authentication before granting access. Use these registered staff profiles or log in with the administrator PIN:

| Staff Name | Staff ID / Initials | Role | Department | Default PIN | Access Privileges |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **Waqar Ahmed** | `WA` | Administrator | IT Operations Directorate | `admin123` | Full control over checklists, users, custom roles, categories, and settings. |
| **Ali Raza** | `AR` | Operation Officer | Core Banking Shift A | `1234` | Checklist execution, timestamping, inputer initials stamping. |
| **Kashif Siddiqui** | `KS` | Shift Supervisor | Operations Supervision | `1234` | Dual-control verification (`auth`), SLA monitoring, analytics reports. |
| **Farhan Sheikh** | `FS` | Audit & Compliance | Internal IT Audit | `1234` | Read-only inspection of shift records, audit trail, export reports. |
| **Nasir Iqbal** | `NI` | Operations Manager | IT Operations Management | `1234` | High-level governance, dual-control sign-off, analytics oversight. |

> 💡 **Master Override**: The PIN `admin123` acts as a master administrative override to log in as Administrator from the login screen.

---

## 🔄 Operational Workflows

### A. Shift Execution & Inputer Workflow
1. Open the portal and select your staff profile on the **Restricted Operations Authentication** screen.
2. Enter your 4-digit PIN.
3. Under the **Checklist** tab, locate your assigned task (e.g. `#19 CUTOFF EMAIL` or `#24 Pre COB DB BACKUP`).
4. Check the task checkbox:
   - The checklist automatically marks the item as `DONE`.
   - The current time (e.g. `17:02`) is recorded.
   - Your registered initials (e.g. `AR`) are stamped into the **Init** column.

### B. Supervisor Verification (Auth) Workflow
1. When a task requires supervisor verification (Maker-Checker):
2. Log in as a user with verification privileges (`supervisor`, `manager`, or `admin`).
3. Completed tasks show an active **Sign Auth** or initials input in the **Auth (Checker)** column.
4. Click the button to stamp your supervisor initials (e.g. `KS`), verifying that the routine was completed in compliance with bank SOPs.

### C. Creating Custom Operational Roles
1. Log in as **Administrator**.
2. Navigate to the **Staff & Roles** tab and select the **Custom Roles & Permissions** sub-tab.
3. Click **Create Custom Role**.
4. Enter the Role Title (e.g., *Lead Database Engineer*), description, and select a badge color.
5. Check the exact permissions required (e.g., View Checklist, Execute Tasks, Dual Verification, Manage Tasks).
6. Click **Create Role**.
7. Go to **Staff Roster**, click **Add Staff Member**, and select the new custom role from the dropdown.

### D. SOP Reordering & Adding Tasks
1. Under **Categories & SOP**:
   - To reorder tasks: Hover over the task row, grab the grip handle, and drag it to the desired position. The sequence numbers (#Sr) renumber automatically.
   - To add a task: Click **Add SOP Task**, specify the nature (Daily, Weekly, etc.), time window (e.g. `7:00 PM`), task title, and technical profile.
   - To verify the master catalog: Click **Sync 100 Master Tasks** to audit and ensure all 100 bank standard items are loaded.

### E. Shift Handover Email / Report Generation
1. Click the **Mail** icon in the header or floating quick-actions bar.
2. Review the live shift completion percentage, failed/pending items, and sign-off summary.
3. Click **Copy Formatted Summary** to copy the clean HTML email table.
4. Open Microsoft Outlook or your webmail client, press `Ctrl+V` (or `Cmd+V`), and send the handover report to incoming shift personnel and management.
5. Click the **Printer** icon to print the 1–2 page signed copy for physical archive binders.

---

## 🚀 Installation, Development & Production Deployment

### Prerequisites
- Node.js version 20.x or 22.x
- npm version 9.x or higher

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd soneri-bank-task-dashboard
npm install
```

### 2. Development Mode
Runs the Express full-stack server with Vite middleware mounted on port 3000:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Production Build & Bundling
Compiles the React frontend via Vite and bundles the Node.js server using `esbuild`:
```bash
npm run build
```
This produces:
- `dist/` — Optimized production frontend assets.
- `dist-server/server.js` — Self-contained Node.js server bundle with all local modules included.

### 4. Run Production Server
```bash
npm run start
```
The server will start listening on `http://0.0.0.0:3000` (or the port specified by the `PORT` environment variable).

### 5. Cloud Run / Docker Deployment
The project is container-ready. When deploying to Google Cloud Run or Docker:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📁 Project File Structure

```
├── data/
│   └── db.json                    # Persistent backend storage (tasks, users, roles, history)
├── dist/                          # Production Vite frontend build output
├── dist-server/
│   └── server.js                  # Bundled production Express server
├── src/
│   ├── components/
│   │   ├── modals/
│   │   │   ├── AuthModal.tsx             # Staff credential switch modal
│   │   │   ├── BackupModal.tsx           # JSON backup & restore modal
│   │   │   ├── ConfirmModal.tsx          # Destructive action confirmations
│   │   │   ├── EmailExportModal.tsx      # Email / Excel handover summary modal
│   │   │   ├── NoticeModal.tsx           # Notification alert dialog
│   │   │   ├── PortalSettingsModal.tsx   # Colors, themes, branding & logo settings
│   │   │   └── TaskEditModal.tsx         # Add & edit SOP task modal
│   │   ├── AnalyticsView.tsx             # 7-day trend chart, phase meters & staff breakdown
│   │   ├── CategoryManagerView.tsx       # Shift category manager & SOP catalog editor
│   │   ├── ChecklistView.tsx             # Daily shift checklist table & execution engine
│   │   ├── Header.tsx                    # Executive banner, navigation & dark mode toggle
│   │   ├── LoginScreen.tsx               # Security authentication gate & staff profile picker
│   │   └── UserManagerView.tsx           # Staff roster & custom role governance
│   ├── context/
│   │   ├── AuthContext.tsx               # RBAC, custom roles & session state
│   │   ├── HistoryContext.tsx            # Shift timestamps, init/auth stamps & daily records
│   │   ├── SettingsContext.tsx           # Dark mode, themes & portal branding
│   │   └── TaskContext.tsx               # Master SOP tasks, categories & catalog sync
│   ├── data/
│   │   └── defaultData.ts                # 100 master banking SOP tasks & default roles/users
│   ├── types/
│   │   └── index.ts                      # TypeScript interfaces & type definitions
│   ├── App.tsx                           # Main application layout, routing & sync
│   ├── index.css                         # Tailwind v4 directives & ultra-compact print CSS
│   └── main.tsx                          # React DOM client entry point
├── server.ts                             # Express server & Vite development middleware
├── package.json                          # Scripts & dependencies
├── tsconfig.json                         # TypeScript configuration
└── vite.config.ts                        # Vite configuration
```

---

## 🔒 Security & Banking Compliance Notice

This portal is intended for authorized bank operations personnel only. All shift modifications, timestamps, operator initials, and supervisor authorizations are logged into the operational shift history. Standard compliance procedures require daily shift sign-offs to be archived and reconciled against Core Banking System (T24/EOD) protocol logs.
