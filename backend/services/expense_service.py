from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from models.models import Expense
from schemas.schemas import ExpenseCreate
from uuid import UUID


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_expense(self, expense: ExpenseCreate):
        db_expense = Expense(**expense.dict())
        self.db.add(db_expense)
        await self.db.commit()
        await self.db.refresh(db_expense)
        return db_expense

    async def get_expenses(self, skip: int = 0, limit: int = 100):
        result = await self.db.execute(select(Expense).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_expense(self, expense_id: UUID):
        result = await self.db.execute(select(Expense).filter(Expense.id == expense_id))
        return result.scalars().first()

    async def update_expense(self, expense_id: UUID, expense_data: ExpenseCreate):
        query = (
            update(Expense)
            .where(Expense.id == expense_id)
            .values(**expense_data.dict())
        )
        query = query.execution_options(synchronize_session="fetch")
        await self.db.execute(query)
        await self.db.commit()
        return await self.get_expense(expense_id)

    async def delete_expense(self, expense_id: UUID):
        query = delete(Expense).where(Expense.id == expense_id)
        await self.db.execute(query)
        await self.db.commit()
