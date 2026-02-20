from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update, func
from models.models import Liability, LiabilityPayment
from schemas.schemas import LiabilityCreate, LiabilityPaymentCreate
from uuid import UUID


class LiabilityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_liability(self, liability: LiabilityCreate):
        db_liability = Liability(**liability.dict())
        self.db.add(db_liability)
        await self.db.commit()
        await self.db.refresh(db_liability)
        return db_liability

    async def get_liabilities(self):
        # We need to calculate total_paid, outstanding_amount, remaining_term
        result = await self.db.execute(select(Liability))
        liabilities = result.scalars().all()

        liability_responses = []
        for liability in liabilities:
            # Calculate total paid
            total_paid_result = await self.db.execute(
                select(func.sum(LiabilityPayment.amount)).where(
                    LiabilityPayment.liability_id == liability.id
                )
            )
            total_paid = total_paid_result.scalar() or 0

            outstanding_amount = liability.original_amount - total_paid

            # Simple remaining term logic
            if liability.emi_amount > 0:
                remaining_term = int(outstanding_amount / liability.emi_amount)
            else:
                remaining_term = 0

            liability.total_paid = total_paid
            liability.outstanding_amount = outstanding_amount
            liability.remaining_term = remaining_term
            liability_responses.append(liability)

        return liability_responses

    async def create_payment(self, payment: LiabilityPaymentCreate):
        db_payment = LiabilityPayment(**payment.dict())
        self.db.add(db_payment)
        await self.db.commit()
        await self.db.refresh(db_payment)
        return db_payment

    async def get_payments_by_liability(self, liability_id: UUID):
        result = await self.db.execute(
            select(LiabilityPayment)
            .where(LiabilityPayment.liability_id == liability_id)
            .order_by(LiabilityPayment.payment_date.desc())
        )
        return result.scalars().all()

    async def get_all_payments_grouped(self):
        # Allow fetching all payments with liability details
        # This might be better handled by a joined query
        result = await self.db.execute(
            select(LiabilityPayment, Liability.liability_name)
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .order_by(LiabilityPayment.payment_date.desc())
        )
        return result.all()
