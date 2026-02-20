from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal


# Expense Schemas
class ExpenseBase(BaseModel):
    purchase_date: date
    item: str
    amount: Decimal
    category_id: UUID
    account_id: UUID
    notes: Optional[str] = None

    # Shared Expense fields
    is_shared: Optional[bool] = False
    total_people: Optional[int] = 1
    friend_shares: Optional[dict] = None  # { "Friend Name": amount }


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: UUID
    timestamp: datetime

    class Config:
        from_attributes = True


# Income Schemas
class IncomeBase(BaseModel):
    date: date
    income_source_id: UUID
    account_id: UUID
    description: Optional[str] = None
    amount: Decimal
    notes: Optional[str] = None


class IncomeCreate(IncomeBase):
    pass


class Income(IncomeBase):
    id: UUID
    timestamp: datetime

    class Config:
        from_attributes = True


# Liability Schemas
class LiabilityBase(BaseModel):
    liabilities_type_id: UUID
    lender_id: UUID
    liability_name: Optional[str] = None
    original_amount: Decimal
    interest_rate: float
    emi_amount: Decimal
    start_date: date
    term_months: int


class LiabilityCreate(LiabilityBase):
    pass


class Liability(LiabilityBase):
    id: UUID
    # Calculated fields will be handled in service/response
    total_paid: Optional[Decimal] = None
    outstanding_amount: Optional[Decimal] = None
    remaining_term: Optional[int] = None

    class Config:
        from_attributes = True


class LiabilityPaymentBase(BaseModel):
    liability_id: UUID
    payment_date: date
    amount: Decimal


class LiabilityPaymentCreate(LiabilityPaymentBase):
    pass


class LiabilityPayment(LiabilityPaymentBase):
    id: UUID

    class Config:
        from_attributes = True


# Investment Schemas
class InvestmentBase(BaseModel):
    date: date
    investment_type_id: UUID
    institution_id: UUID
    amount: Decimal
    notes: Optional[str] = None


class InvestmentCreate(InvestmentBase):
    pass


class Investment(InvestmentBase):
    id: UUID

    class Config:
        from_attributes = True


# Budget Schemas
class BudgetBase(BaseModel):
    category_id: UUID
    amount: Decimal
    month: int
    year: int


class BudgetCreate(BudgetBase):
    pass


class Budget(BudgetBase):
    id: UUID

    class Config:
        from_attributes = True


# Receivable Schemas
class ReceivableBase(BaseModel):
    date: date
    person_name: str
    total_owed: Decimal
    amount_received: Decimal = Decimal("0")
    status: str = "pending"
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    notes: Optional[str] = None


class ReceivableCreate(ReceivableBase):
    pass


class ReceivableUpdate(BaseModel):
    amount_received: Decimal
    status: Optional[str] = None
    notes: Optional[str] = None


class Receivable(ReceivableBase):
    id: UUID
    timestamp: datetime

    class Config:
        from_attributes = True
