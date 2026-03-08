import asyncio
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base, SessionLocal
from models.models import LookupValue

# Define initial data
INITIAL_DATA = {
    "expense_category": [
        "Bills",
        "Subscriptions",
        "Entertainment",
        "Food & Drink",
        "Groceries",
        "Health & Wellbeing",
        "Other",
        "Shopping",
        "Transport",
        "Travel",
        "Home rent",
        "Credit Card Bill",
        "Cosmetics and Personal Care",
        "Gifts",
    ],
    "income_source": ["Salary", "Income from pervious month", "lent/expense back"],
    "liabilities_type": ["Personal Loan", "Debt"],
    "investment_type": ["Mutual Funds", "Stocks", "Savings", "RD", "Others"],
    "account": ["Savings Account"],
    "institution": ["ICICI", "HDFC"],
    "lender": ["HDFC", "ICICI"],
}


async def reset_database():
    print("Resetting database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database reset complete.")


async def seed_user_data(db: AsyncSession, user_id: str):
    """Seed default data for a specific user if they don't have it."""
    print(f"Checking and ensuring default data for user: {user_id}...")
    for type_name, values in INITIAL_DATA.items():
        # Check if any values exist for this type for this specific user
        result = await db.execute(
            select(LookupValue).where(
                LookupValue.type == type_name, LookupValue.user_id == user_id
            )
        )
        existing_values = result.scalars().all()
        existing_val_set = {v.value for v in existing_values}

        for i, value in enumerate(values):
            if value not in existing_val_set:
                print(f"Adding default {type_name}: {value} for user {user_id}")
                lookup = LookupValue(
                    id=uuid.uuid4(),
                    type=type_name,
                    value=value,
                    display_order=i,
                    is_active=True,
                    user_id=user_id,
                )
                db.add(lookup)
    await db.commit()


async def ensure_default_data():
    print("Running global default data check...")
    async with SessionLocal() as db:
        # 1. Always ensure "system" user has default data
        await seed_user_data(db, "system")

        # 2. Find all unique user_ids that exist in the system and ensure they have default data
        # We check multiple tables to find all active users
        from models.models import Expense, Income, Liability, Investment

        user_ids = set()
        for model in [Expense, Income, Liability, Investment]:
            result = await db.execute(select(model.user_id).distinct())
            user_ids.update(result.scalars().all())

        print(f"Found {len(user_ids)} unique users to check: {user_ids}")
        for user_id in user_ids:
            if user_id != "system":
                await seed_user_data(db, user_id)

    print("Global default data check complete.")


async def main():
    # Only use reset_database if specifically called for full reset
    # For normal startup, we use ensure_default_data
    await ensure_default_data()


if __name__ == "__main__":
    asyncio.run(main())
