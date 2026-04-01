from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from models.models import Investment
from schemas.schemas import InvestmentCreate, InvestmentUpdate
from uuid import UUID


class InvestmentService:
    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id

    async def create_investment(self, investment: InvestmentCreate):
        db_investment = Investment(**investment.dict(), user_id=self.user_id)
        self.db.add(db_investment)
        await self.db.commit()
        await self.db.refresh(db_investment)
        return db_investment

    async def get_investments(self, skip: int = 0, limit: int = 100):
        result = await self.db.execute(
            select(Investment)
            .filter(Investment.user_id == self.user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_investment(self, investment_id: UUID, data: InvestmentUpdate):
        result = await self.db.execute(
            select(Investment).filter(
                Investment.id == investment_id, Investment.user_id == self.user_id
            )
        )
        db_investment = result.scalar_one_or_none()
        if not db_investment:
            return None

        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_investment, field, value)

        await self.db.commit()

        # Re-fetch to avoid lazy-load issues in async context
        result = await self.db.execute(
            select(Investment).filter(Investment.id == investment_id)
        )
        return result.scalar_one_or_none()

    async def delete_investment(self, investment_id: UUID):
        result = await self.db.execute(
            select(Investment).filter(
                Investment.id == investment_id, Investment.user_id == self.user_id
            )
        )
        db_investment = result.scalar_one_or_none()
        if not db_investment:
            return False
        await self.db.delete(db_investment)
        await self.db.commit()
        return True
