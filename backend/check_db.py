import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine
from database import DATABASE_URL, SessionLocal
from models.models import LookupValue


async def check():
    async with SessionLocal() as db:
        result = await db.execute(select(LookupValue.type).distinct())
        types = result.scalars().all()
        print(f"TYPES_START")
        print(f"Types found: {types}")

        for t in types:
            res = await db.execute(
                select(LookupValue).where(
                    LookupValue.type == t, LookupValue.is_active == True
                )
            )
            values = [v.value for v in res.scalars().all()]
            print(f"Values for {t}: {values}")
        print(f"TYPES_END")


if __name__ == "__main__":
    asyncio.run(check())
