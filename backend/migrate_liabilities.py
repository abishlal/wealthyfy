import asyncio
from sqlalchemy import text
from database import engine


async def migrate():
    async with engine.begin() as conn:
        print("Starting migration...")

        # Check if we need to rename loan_name to liability_name
        try:
            await conn.execute(
                text(
                    "ALTER TABLE liabilities RENAME COLUMN loan_name TO liability_name"
                )
            )
            print("Renamed loan_name to liability_name")
        except Exception as e:
            print(f"Skipped renaming loan_name: {e}")

        # Check if we need to rename loan_type_id to liabilities_type_id
        try:
            await conn.execute(
                text(
                    "ALTER TABLE liabilities RENAME COLUMN loan_type_id TO liabilities_type_id"
                )
            )
            print("Renamed loan_type_id to liabilities_type_id")
        except Exception as e:
            print(f"Skipped renaming loan_type_id: {e}")

        # Update lookup_values types
        try:
            await conn.execute(
                text(
                    "UPDATE lookup_values SET type = 'liabilities_type' WHERE type IN ('liability_type', 'loan_type')"
                )
            )
            print("Updated lookup_values types to liabilities_type")
        except Exception as e:
            print(f"Skipped updating lookup_values: {e}")

        print("Migration completed.")


if __name__ == "__main__":
    asyncio.run(migrate())
