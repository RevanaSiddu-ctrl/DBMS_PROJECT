# SQLVault — SQL-Powered Database Version Control System

> **DBMS Mini Project** | Git-Inspired Version Control for Relational Databases

---

## 📌 Project Overview
**SQLVault** is a version control system designed specifically for relational databases. While Git tracks line-by-line modifications across source code files, SQLVault tracks row-level modifications (`INSERT`, `UPDATE`, `DELETE`) across database tables.

The core version-control engine is built directly inside **PostgreSQL** using:
- **Triggers (`AFTER INSERT / UPDATE / DELETE`):** Intercept record mutations automatically.
- **Transactions & PL/pgSQL:** Guarantee ACID compliance for staging and committing changes.
- **JSONB Snapshots:** Store before (`old_data`) and after (`new_data`) state deltas.
- **Relational Tables:** Maintain immutable commit logs, historical record versions, and rollback capability.

---

## 📁 Repository Structure

```text
DBMS_PROJECT/
├── SQLVault/
│   ├── database/             # Revan's SQL Engine
│   │   ├── schema.sql        # Core DDL (users, repos, branches, commits, change_sets, pending_changes, record_versions)
│   │   ├── constraints.sql   # Data integrity & payload validation rules
│   │   ├── indexes.sql       # Query performance indexes
│   │   ├── students.sql      # Demo table under version control
│   │   ├── functions/        # PL/pgSQL procedures (track_changes, create_commit, rollback, etc.)
│   │   ├── triggers/         # Row triggers on demo tables
│   │   ├── views/            # SQL Views for commit history & repository summaries
│   │   └── seed/             # Test scripts & sample seed data
│   │
│   ├── backend/              # Node.js + Express REST API
│   │   ├── src/
│   │   │   ├── db.js         # PostgreSQL connection pool (SSL-ready) & transaction helper
│   │   │   ├── app.js        # Express app configuration & middleware
│   │   │   ├── server.js     # Server entrypoint (Port 5000)
│   │   │   └── scripts/
│   │   │       ├── test-db.js # Verifies database connectivity and table inventory
│   │   │       └── migrate.js # Automatically applies SQL files to the database
│   │   ├── .env.example      # Environment variables template
│   │   └── package.json      # Express & pg dependencies
│   │
│   └── frontend/             # Web Dashboard (Pending Phase 3)
└── README.md
```

---

## 👥 Team Responsibilities

| Member | Primary Focus | Areas of Ownership |
| :--- | :--- | :--- |
| **Revan Siddu** | **Database & SQL Engine** | Schema architecture, constraints, PL/pgSQL triggers, commit procedures, diff functions, and rollback logic. |
| **Nivas** | **Backend & Frontend** | Node.js Express REST APIs, Supabase connectivity, staging endpoints, commit routes, and web dashboard UI. |

---

## 🚀 Getting Started (For Teammates)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- Access to the team's **Supabase PostgreSQL** database.

### 2. Configure Environment Variables
Inside `SQLVault/backend`:
```bash
cp .env.example .env
```
Fill in the `DATABASE_URL` with your Supabase connection string.

### 3. Install Dependencies & Verify Connection
```bash
cd SQLVault/backend
npm install
npm run test:db
```
The script will test the connection and report whether all 8 SQLVault tables exist.

### 4. Running Migrations (Applying new SQL files)
Whenever new `.sql` scripts are added to `database/`, apply them to Supabase in one command:
```bash
npm run migrate
```

### 5. Start the Development Server
```bash
npm run dev
```
The backend server runs on `http://localhost:5000`. You can check server health at:
- `http://localhost:5000/api/health`

### 6. Run Phase 2 Integration Tests
```bash
npm run test:phase2
```
Tests repository creation, student mutations, automatic trigger delta capture, commit creation, and commit history against Supabase.

---

## 🔌 REST API Endpoints (Phase 2)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server and database connectivity check |
| `GET` | `/api/repositories` | List all repositories |
| `POST` | `/api/repositories` | Create a repository with default `main` branch |
| `GET` | `/api/students?repo_id=:id` | Fetch current student records |
| `POST` | `/api/students` | Insert student row (triggers automatic change tracking) |
| `PUT` | `/api/students/:id` | Update student details (triggers diff capture) |
| `DELETE` | `/api/students/:id` | Delete student row (triggers deletion capture) |
| `GET` | `/api/changes/pending?repo_id=:id` | View uncommitted changes (Git Status) |
| `POST` | `/api/commits` | Atomically commit pending changes to history (Git Commit) |
| `GET` | `/api/commits?repo_id=:id` | View commit history timeline (Git Log) |
| `GET` | `/api/commits/:id` | Inspect commit details and recorded row versions |
| `GET` | `/api/commits/diff?from=:c1&to=:c2` | Compare two commits (Git Diff) |
| `POST` | `/api/commits/:id/rollback` | Revert student records to target historical commit |

---

## 🔄 Current Project Status
- [x] **Database Schema & Constraints:** Applied to Supabase.
- [x] **Automatic Change Tracking Triggers:** Active on `students` table.
- [x] **Backend Infrastructure:** Node.js, Express, connection pool, and migration runner initialized.
- [x] **Backend Phase 2:** REST API endpoints for Repositories, Student CRUD, Staging, Commits, and Rollback (Complete & Tested).
- [ ] **Frontend Phase 3:** Web Dashboard, staging view, diff visualizer, and rollback UI.
