from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from models.models import Income
from schemas.schemas import IncomeCreate
from uuid import UUID


class IncomeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_income(self, income: IncomeCreate):
        db_income = Income(**income.dict())
        self.db.add(db_income)
        await self.db.commit()
        await self.db.refresh(db_income)
        return db_income

    async def get_incomes(self, skip: int = 0, limit: int = 100):
        result = await self.db.execute(select(Income).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_income(self, income_id: UUID):
        result = await self.db.execute(select(Income).filter(Income.id == income_id))
        return result.scalars().first()

    async def update_income(self, income_id: UUID, income_data: IncomeCreate):
        query = (
            update(Income).where(Income.id == income_id).values(**income_data.dict())
        )
        query = query.execution_options(synchronize_session="fetch")
        await self.db.execute(query)
        await self.db.commit()
        return await self.get_income(income_id)

    async def delete_income(self, income_id: UUID):
        query = delete(Income).where(Income.id == income_id)
        await self.db.execute(query)
        await self.db.commit()
