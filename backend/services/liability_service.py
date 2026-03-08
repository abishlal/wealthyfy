from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update, func
from models.models import Liability, LiabilityPayment
from schemas.schemas import LiabilityCreate, LiabilityUpdate, LiabilityPaymentCreate
from uuid import UUID
from decimal import Decimal


class LiabilityService:
    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id

    async def create_liability(self, liability: LiabilityCreate):
        data = liability.dict()
        # Auto-calculate total_payable_amount if not provided manually
        if not data.get("total_payable_amount"):
            data["total_payable_amount"] = (
                Decimal(str(data["emi_amount"])) * data["term_months"]
            )
        db_liability = Liability(**data, user_id=self.user_id)
        self.db.add(db_liability)
        await self.db.commit()
        await self.db.refresh(db_liability)
        return db_liability

    async def update_liability(self, liability_id: UUID, data: LiabilityUpdate):
        result = await self.db.execute(
            select(Liability).filter(
                Liability.id == liability_id, Liability.user_id == self.user_id
            )
        )
        db_liability = result.scalar_one_or_none()
        if not db_liability:
            return None

        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_liability, field, value)

        # If total_payable_amount not explicitly set, recalculate from emi * months
        if "total_payable_amount" not in update_data:
            emi = Decimal(str(db_liability.emi_amount))
            months = db_liability.term_months
            db_liability.total_payable_amount = emi * months

        await self.db.commit()
        await self.db.refresh(db_liability)
        return db_liability

    async def get_liabilities(self):
        result = await self.db.execute(
            select(Liability).filter(Liability.user_id == self.user_id)
        )
        liabilities = result.scalars().all()

        liability_responses = []
        for liability in liabilities:
            # Calculate total paid
            total_paid_result = await self.db.execute(
                select(func.sum(LiabilityPayment.amount)).where(
                    LiabilityPayment.liability_id == liability.id
                )
            )
            total_paid = total_paid_result.scalar() or Decimal("0")

            # Use stored total_payable_amount or fallback to emi * term_months
            if liability.total_payable_amount is None:
                liability.total_payable_amount = (
                    Decimal(str(liability.emi_amount)) * liability.term_months
                )

            outstanding_amount = liability.total_payable_amount - total_paid

            # Remaining term based on outstanding / emi
            if liability.emi_amount and liability.emi_amount > 0:
                remaining_term = max(0, int(outstanding_amount / liability.emi_amount))
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
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(
                LiabilityPayment.liability_id == liability_id,
                Liability.user_id == self.user_id,
            )
            .order_by(LiabilityPayment.payment_date.desc())
        )
        return result.scalars().all()

    async def get_all_payments_grouped(self):
        # Allow fetching all payments with liability details
        result = await self.db.execute(
            select(LiabilityPayment)
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(Liability.user_id == self.user_id)
            .order_by(LiabilityPayment.payment_date.desc())
        )
        return result.scalars().all()
