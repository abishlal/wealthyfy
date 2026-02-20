from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from models.models import Receivable
from schemas.schemas import ReceivableCreate, ReceivableUpdate
from uuid import UUID


class ReceivableService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_receivable(self, receivable: ReceivableCreate):
        db_receivable = Receivable(**receivable.dict())
        self.db.add(db_receivable)
        await self.db.commit()
        await self.db.refresh(db_receivable)
        return db_receivable

    async def get_receivables(self, skip: int = 0, limit: int = 100):
        result = await self.db.execute(
            select(Receivable)
            .order_by(Receivable.date.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_receivable(self, receivable_id: UUID):
        result = await self.db.execute(
            select(Receivable).filter(Receivable.id == receivable_id)
        )
        return result.scalars().first()

    async def update_receivable(
        self, receivable_id: UUID, receivable_data: ReceivableUpdate
    ):
        db_receivable = await self.get_receivable(receivable_id)
        if not db_receivable:
            return None

        update_data = receivable_data.dict(exclude_unset=True)

        # Calculate status if amount_received is updated
        if "amount_received" in update_data:
            new_received = update_data["amount_received"]
            if new_received >= db_receivable.total_owed:
                update_data["status"] = "settled"
            elif new_received > 0:
                update_data["status"] = "partial"
            else:
                update_data["status"] = "pending"

        query = (
            update(Receivable)
            .where(Receivable.id == receivable_id)
            .values(**update_data)
        )
        await self.db.execute(query)
        await self.db.commit()
        return await self.get_receivable(receivable_id)

    async def delete_receivable(self, receivable_id: UUID):
        query = delete(Receivable).where(Receivable.id == receivable_id)
        await self.db.execute(query)
        await self.db.commit()
