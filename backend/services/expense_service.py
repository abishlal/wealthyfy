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
        expense_data = expense.dict()
        is_shared = expense_data.pop("is_shared", False)
        total_people = expense_data.pop("total_people", 1)
        friend_shares = expense_data.pop("friend_shares", None)

        # Create the expense record (user's share)
        db_expense = Expense(**expense_data)
        self.db.add(db_expense)
        await self.db.flush()  # Get ID before commit if needed

        # If it's a shared expense, create receivables for friends
        if is_shared and friend_shares:
            from models.models import Receivable

            for person, amount in friend_shares.items():
                receivable = Receivable(
                    date=db_expense.purchase_date,
                    person_name=person,
                    total_owed=amount,
                    amount_received=0,
                    status="pending",
                    reference_type="shared_expense",
                    reference_id=db_expense.id,
                )
                self.db.add(receivable)

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
