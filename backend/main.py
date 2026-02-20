from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import (
    expenses,
    income,
    income,
    liability,
    investment,
    dashboard,
    dashboard_router,
    settings_router,
)

app = FastAPI(title="Personal Finance Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    import asyncio
    from seed_data import ensure_default_data

    max_retries = 20
    retry_delay = 2

    for i in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            await ensure_default_data()
            print("Database connected and initialized.")
            return
        except Exception as e:
            if i < max_retries - 1:
                print(
                    f"Database connection attempt {i+1} failed. Retrying in {retry_delay}s..."
                )
                await asyncio.sleep(retry_delay)
            else:
                print("Could not connect to database after several attempts.")
                raise e


app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(liability.router)
app.include_router(investment.router)
app.include_router(dashboard.router)
app.include_router(dashboard_router.router)
app.include_router(settings_router.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Personal Finance Tracker API"}
