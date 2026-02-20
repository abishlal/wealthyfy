# Personal Finance Tracker

A complete personal finance tracking web application logic.

## Technology Stack

- **Backend**: FastAPI, PostgreSQL (AsyncSQLAlchemy), Alembic, Pydantic.
- **Frontend**: React (Vite), TypeScript, TailwindCSS, Recharts.

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js & npm
- PostgreSQL database (or update `DATABASE_URL` in `backend/.env`)

### Backend Setup

1. Navigate to `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create `.env` file with `DATABASE_URL`. Default is `postgresql+asyncpg://user:password@localhost/finance_tracker`.
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`. Swagger UI at `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

### Docker Setup

1. Ensure Docker Desktop is running.
2. Run the application stack:
   ```bash
   docker-compose up --build
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:8000`
   - Database: `postgres://postgres:password@localhost:5432/finance_tracker`

## Features

- **Dashboard**: Daily, Weekly, Monthly summaries and trends.
- **Expenses**: Track expenses with categories.
- **Income**: Track income sources.
- **Debts**: Track loans and repayments.
- **Investments**: Track various investment types.
