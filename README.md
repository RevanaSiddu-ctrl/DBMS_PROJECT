# SQLVault — SQL-Powered Database Version Control System

> **DBMS Mini Project** | Git-Inspired Version Control for Relational Databases
> **PRD Version:** 1.0 | **Team Size:** 2 | **Status:** ✅ Complete (MVP + Advanced Features)

---

## 📌 Project Overview

**SQLVault** is a version control system designed specifically for relational databases. While Git tracks line-by-line modifications across source code files, SQLVault tracks row-level modifications (`INSERT`, `UPDATE`, `DELETE`) across database tables — capturing *who* changed *what* and *when*, with full rollback capability.

The core version-control engine is built directly inside **PostgreSQL** using:
- **Triggers (`AFTER INSERT / UPDATE / DELETE`):** Intercept record mutations automatically.
- **Transactions & PL/pgSQL functions:** Guarantee ACID compliance for staging and committing changes.
- **JSONB Snapshots:** Store before (`old_data`) and after (`new_data`) state deltas per row.
- **Relational Tables:** Maintain immutable commit logs, historical record versions, branch heads, and rollback capability.
- **SQL Views:** Dashboard-ready commit history and repository summary.

---

## 📁 Repository Structure

```text
DBMS_PROJECT/
├── SQLVault/
│   ├── database/                   # Revan Siddu — SQL Engine
│   │   ├── schema.sql              # Core DDL (users, repos, branches, commits, change_sets, pending_changes, record_versions)
│   │   ├── constraints.sql         # Data integrity & payload validation rules
│   │   ├── indexes.sql             # Query performance indexes
│   │   ├── students.sql            # Demo table under version control
│   │   ├── functions/
│   │   │   ├── track_changes.sql   # set_change_context() + track_changes() trigger fn
│   │   │   ├── create_repository.sql # Atomic repo + main branch + change set setup
│   │   │   ├── create_commit.sql   # Atomic commit: pending_changes → record_versions
│   │   │   ├── compare_versions.sql  # Side-by-side diff between two commits
│   │   │   ├── rollback_version.sql  # Revert data to a previous commit state
│   │   │   └── branch_operations.sql # create_branch, list_branches, merge_branch
│   │   ├── triggers/
│   │   │   ├── trigger_setup.sql   # Idempotent trigger installation
│   │   │   ├── track_insert.sql    # AFTER INSERT trigger on students
│   │   │   ├── track_update.sql    # AFTER UPDATE trigger on students
│   │   │   └── track_delete.sql    # AFTER DELETE trigger on students
│   │   ├── views/
│   │   │   ├── commit_history.sql  # v_commit_history — git log view
│   │   │   └── repository_summary.sql # v_repository_summary — dashboard view
│   │   └── seed/
│   │       ├── sample_data.sql     # Initial student seed data
│   │       └── test_change_tracking.sql # Trigger verification queries
│   │
│   ├── backend/                    # Nivas — Node.js + Express REST API
│   │   ├── src/
│   │   │   ├── db.js               # PostgreSQL connection pool (SSL-ready) + transaction helper
│   │   │   ├── app.js              # Express app: middleware, routes, error handler
│   │   │   ├── server.js           # Server entrypoint (Port 5000)
│   │   │   ├── controllers/
│   │   │   │   ├── repositoryController.js  # Repository CRUD
│   │   │   │   ├── studentController.js     # Student CRUD with auto-tracking
│   │   │   │   ├── commitController.js      # Commit lifecycle + rollback
│   │   │   │   └── queryController.js       # Universal SQL runner
│   │   │   ├── routes/
│   │   │   │   ├── index.js                 # Route aggregator
│   │   │   │   ├── repositoryRoutes.js
│   │   │   │   ├── studentRoutes.js
│   │   │   │   ├── commitRoutes.js
│   │   │   │   └── queryRoutes.js
│   │   │   ├── services/
│   │   │   │   └── contextService.js        # Change-set lifecycle management
│   │   │   └── scripts/
│   │   │       ├── migrate.js       # Applies SQL files to the database
│   │   │       ├── test-db.js       # DB connectivity + table inventory check
│   │   │       └── test-phase2.js   # Integration test suite (Phase 2)
│   │   ├── .env.example             # Environment variables template
│   │   └── package.json
│   │
│   └── frontend/                   # Nivas — React + TypeScript Web Dashboard
│       ├── src/
│       │   ├── App.tsx              # Full-screen SQL editor + version control UI
│       │   ├── index.css            # Complete dark-theme stylesheet
│       │   └── main.tsx             # React entrypoint
│       ├── index.html
│       ├── vite.config.ts           # Vite + proxy config (proxies /api → port 5000)
│       └── package.json
│
├── start.bat                        # Windows quick-start script
├── start.sh                         # macOS/Linux quick-start script
└── README.md
```

---

## 👥 Team Responsibilities

| Member | Primary Focus | Areas of Ownership |
| :--- | :--- | :--- |
| **Revan Siddu** | **Database & SQL Engine** | Schema architecture, constraints, PL/pgSQL triggers, `track_changes()`, `create_commit()`, `compare_versions()`, `rollback_version()`, branching functions, views, and indexes. |
| **Nivas** | **Backend & Frontend** | Node.js Express REST APIs, Supabase connectivity, `contextService`, all controller/route modules, React dashboard, SQL editor, staging panel, commit history UI, rollback interface. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- Access to a **PostgreSQL** database (Supabase recommended — free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/RevanaSiddu-ctrl/DBMS_PROJECT.git DBMS
cd DBMS
git checkout data-base-implemantaion
```

### 2. Set Up the Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the files in this order:
   ```
   SQLVault/database/schema.sql
   SQLVault/database/constraints.sql
   SQLVault/database/indexes.sql
   SQLVault/database/students.sql        ← creates demo table + installs triggers
   SQLVault/database/functions/track_changes.sql
   SQLVault/database/functions/create_repository.sql
   SQLVault/database/functions/create_commit.sql
   SQLVault/database/functions/compare_versions.sql
   SQLVault/database/functions/rollback_version.sql
   SQLVault/database/functions/branch_operations.sql
   SQLVault/database/views/commit_history.sql
   SQLVault/database/views/repository_summary.sql
   SQLVault/database/seed/sample_data.sql   ← (optional) seed demo data
   ```

### 3. Configure Environment Variables

```bash
cp SQLVault/backend/.env.example SQLVault/backend/.env
```

Edit `SQLVault/backend/.env` and fill in your Supabase connection string:
```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

### 4. Quick Start (Windows)

```bat
.\start.bat
```

### 4. Quick Start (macOS / Linux)

```bash
chmod +x start.sh && ./start.sh
```

### 5. Manual Start

**Backend:**
```bash
cd SQLVault/backend
npm install
npm run dev        # → http://localhost:5000/api/health
```

**Frontend:**
```bash
cd SQLVault/frontend
npm install
npm run dev        # → http://localhost:3000
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server and database connectivity check |
| `GET` | `/api/repositories` | List all repositories |
| `POST` | `/api/repositories` | Create a repository with default `main` branch |
| `GET` | `/api/repositories/:id` | Get repository details |
| `GET` | `/api/students?repo_id=:id` | Fetch current student records |
| `POST` | `/api/students` | Insert student row (triggers automatic change tracking) |
| `PUT` | `/api/students/:id` | Update student details (triggers diff capture) |
| `DELETE` | `/api/students/:id` | Delete student row (triggers deletion capture) |
| `GET` | `/api/changes/pending?repo_id=:id` | View uncommitted changes (like `git status`) |
| `POST` | `/api/commits` | Atomically commit pending changes (like `git commit`) |
| `GET` | `/api/commits?repo_id=:id` | View commit history timeline (like `git log`) |
| `GET` | `/api/commits/:id` | Inspect commit details and recorded row versions |
| `GET` | `/api/commits/diff?from=:c1&to=:c2` | Compare two commits (like `git diff`) |
| `POST` | `/api/commits/:id/rollback` | Revert student records to a historical commit |
| `POST` | `/api/query` | Universal SQL runner (mutations run in context-aware transactions) |

---

## 🗄️ DBMS Concepts Demonstrated

| Concept | Where Applied |
| :--- | :--- |
| Relational schema design | `schema.sql` — 8 normalized tables |
| Primary & foreign keys | All tables with cascade/restrict rules |
| Normalization | Users, Repos, Branches, Commits, Change Sets separated |
| SQL queries & joins | All controllers, views |
| CHECK constraints | `constraints.sql` — status enum, non-empty values |
| Triggers | `track_insert/update/delete.sql` — AFTER row triggers |
| Stored functions | All files in `database/functions/` |
| Transactions & ACID | `db.withTransaction()`, `commitController.js` |
| SQL Views | `v_commit_history`, `v_repository_summary` |
| Indexing | `indexes.sql` — 10 performance indexes |
| Concurrency control | `FOR UPDATE` locks in `create_commit()` and `ensureChangeContext()` |
| JSONB | `old_data` / `new_data` columns for schema-agnostic snapshots |

---

## ✅ Current Project Status

- [x] **Database Schema & Constraints:** 8 tables, complete FK graph, CHECK constraints.
- [x] **Automatic Change Tracking Triggers:** Active on `students` — captures INSERT/UPDATE/DELETE.
- [x] **PL/pgSQL Functions:** `create_repository`, `create_commit`, `compare_versions`, `rollback_version`, `branch_operations` — all fully implemented.
- [x] **SQL Views:** `v_commit_history` and `v_repository_summary` defined.
- [x] **Backend REST API:** 15 endpoints covering full version-control lifecycle.
- [x] **Frontend Dashboard:** Full-screen SQL editor, schema graph, staging panel, commit history, diff viewer, rollback UI.
- [x] **Branching Support:** `create_branch`, `list_branches`, `merge_branch` (Advanced Feature).

---

*SQLVault — Track Every Change. Preserve Every Version.*
