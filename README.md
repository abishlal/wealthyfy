# Personal Finance Tracker

A comprehensive personal finance management system designed to provide deep insights into your financial health. This application helps you track spending, manage debts, plan for the future, and visualize your net worth trends.

## 🚀 Quick Start

The fastest way to get both the backend and frontend running is using the provided batch files (Windows):

1. **Run Backend**: Double-click `run_backend.bat` 
   - *Requires [uv](https://github.com/astral-sh/uv) installed.*
   - Automatically handles dependencies, syncs the environment, and starts the FastAPI server.
2. **Run Frontend**: Double-click `run_frontend.bat`
   - *Requires Node.js installed.*
   - Installs NPM packages and starts the Vite development server.

---

## 🛠️ Technology Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), PostgreSQL with [AsyncSQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html), [Alembic](https://alembic.sqlalchemy.org/) for migrations, [Pydantic](https://docs.pydantic.dev/) for validation, and [uv](https://github.com/astral-sh/uv) for package management.
- **Frontend**: [React](https://reactjs.org/) (Vite), [TypeScript](https://www.typescriptlang.org/), [TailwindCSS](https://tailwindcss.com/) for styling, and [Recharts](https://recharts.org/) for interactive financial visualizations.

---

## ✨ Features

- **📊 Advanced Dashboards**:
  - **Main Dashboard**: High-level overview of liquid cash, net worth, and monthly trends.
  - **Daily Overview**: Granular tracking of daily spending and income.
  - **Monthly Dashboard**: Comprehensive monthly breakdown and comparisons.
- **💸 Expense & Income Tracking**: Detail-oriented logging with customizable categories and historical views.
- **🏦 Liability Management**: Track loans, mortgages, and debts with integrated payment history and progress tracking.
- **💰 Budgeting**: Set and monitor budgets across different categories to stay on top of your financial goals.
- **📈 Projections (Planning)**: Financial engine that projects your net worth and future balances based on current data and expected growth.
- **🤝 Friends & Receivables**: Manage money owed to you or by you in social circles.
- **📈 Investment Tracking**: Monitor various asset classes and their performance over time.
- **⚙️ Settings**: Manage categories, export data to Excel, and configure system preferences.

---

## ⚙️ Manual Setup & Development

### Backend

1. **Install uv**: Follow instructions at [astral.sh/uv](https://astral.sh/uv).
2. **Setup environment**:
   ```bash
   cd backend
   uv sync
   ```
3. **Database Configuration**: 
   - Create a `.env` file in the `backend` directory.
   - Set `DATABASE_URL`: `postgresql+asyncpg://user:password@localhost/finance_tracker`
4. **Migrations**: 
   ```bash
   uv run alembic upgrade head
   ```
5. **Run Development Server**:
   ```bash
   uv run uvicorn main:app --reload
   ```
   *Docs available at `http://localhost:8000/docs`.*

### Frontend

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   *App available at `http://localhost:5173`.*

### Authentication

Authentication is disabled by default for ease of local development. To enable it using Authentik, set these variables in your `.env` file (Docker) or in the respective per-service `.env` files (local dev):

| Variable | Description |
|---|---|
| `ENABLE_AUTH` / `VITE_ENABLE_AUTH` | Set to `true` to enforce login |
| `AUTHENTIK_ISSUER` / `VITE_AUTHENTIK_ISSUER` | Your Authentik application issuer URL |
| `AUTHENTIK_CLIENT_ID` / `VITE_AUTHENTIK_CLIENT_ID` | Your Authentik application client ID |

### Docker

Deploy the entire stack (backend + frontend + PostgreSQL) with Docker Compose.

#### 1. Configure environment

Copy the example file and fill in your values:
```bash
cp env.example .env
```

```env
# .env — root-level, read automatically by Docker Compose
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=finance_tracker

DATABASE_URL=postgresql+asyncpg://postgres:your_secure_password@db:5432/finance_tracker
AUTHENTIK_ISSUER=https://auth.yourdomain.com/application/o/wealthyfy/
AUTHENTIK_CLIENT_ID=your_client_id
ENABLE_AUTH=true

VITE_API_BASE_URL=http://localhost:8000
VITE_AUTHENTIK_ISSUER=https://auth.yourdomain.com/application/o/wealthyfy
VITE_AUTHENTIK_CLIENT_ID=your_client_id
VITE_ENABLE_AUTH=true
```

> **Note:** `.env` is git-ignored and never committed. Only `env.example` (with empty values) is tracked.

#### 2. Start the stack

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

#### 3. Clean rebuild (after changing dependencies or DB credentials)

```bash
# Removes all containers AND volumes (fresh DB, fresh node_modules)
docker compose down -v
docker compose up --build
```

---

## 📂 Project Structure

```text
├── backend         # FastAPI application with financial engine
│   ├── alembic     # Database migration scripts
│   ├── models      # SQLAlchemy database models
│   ├── routers     # API endpoints grouped by feature
│   ├── services    # Business logic & financial calculations
│   └── schemas     # Pydantic data validation schemas
├── frontend        # React + Vite + TypeScript
│   ├── src/api     # Backend API integration
│   ├── src/pages   # Feature-specific pages (Dashboard, Expenses, etc.)
│   └── src/components # Reusable UI elements
└── *.bat           # Windows automation scripts
```
