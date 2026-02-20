from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from models.models import Budget
from schemas.schemas import BudgetCreate
from uuid import UUID


class BudgetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_budget(self, budget: BudgetCreate):
        db_budget = Budget(**budget.dict())
        self.db.add(db_budget)
        await self.db.commit()
        await self.db.refresh(db_budget)
        return db_budget

    async def get_budgets(self, month: int = None, year: int = None):
        query = select(Budget)
        if month:
            query = query.where(Budget.month == month)
        if year:
            query = query.where(Budget.year == year)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_budget(self, budget_id: UUID):
        result = await self.db.execute(select(Budget).filter(Budget.id == budget_id))
        return result.scalars().first()

    async def update_budget(self, budget_id: UUID, budget_data: BudgetCreate):
        query = (
            update(Budget).where(Budget.id == budget_id).values(**budget_data.dict())
        )
        query = query.execution_options(synchronize_session="fetch")
        await self.db.execute(query)
        await self.db.commit()
        return await self.get_budget(budget_id)

    async def delete_budget(self, budget_id: UUID):
        query = delete(Budget).where(Budget.id == budget_id)
        await self.db.execute(query)
        await self.db.commit()
