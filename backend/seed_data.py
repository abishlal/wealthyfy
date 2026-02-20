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


async def ensure_default_data():
    print("Checking and ensuring default data...")
    async with SessionLocal() as db:
        for type_name, values in INITIAL_DATA.items():
            # Check if any values exist for this type
            result = await db.execute(
                select(LookupValue).where(LookupValue.type == type_name)
            )
            existing_values = result.scalars().all()
            existing_val_set = {v.value for v in existing_values}

            for i, value in enumerate(values):
                if value not in existing_val_set:
                    print(f"Adding default {type_name}: {value}")
                    lookup = LookupValue(
                        id=uuid.uuid4(),
                        type=type_name,
                        value=value,
                        display_order=i,
                        is_active=True,
                    )
                    db.add(lookup)
        await db.commit()
    print("Default data check complete.")


async def main():
    # Only use reset_database if specifically called for full reset
    # For normal startup, we use ensure_default_data
    await ensure_default_data()


if __name__ == "__main__":
    asyncio.run(main())
