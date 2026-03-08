from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import datetime as dt
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
    who_paid: str = "me"  # me, friend, split
    split_type: Optional[str] = "none"  # none, full, split
    friend_id: Optional[UUID] = None
    friend_share: Optional[Decimal] = Decimal("0")
    total_amount: Optional[Decimal] = None


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
    total_payable_amount: Optional[Decimal] = (
        None  # manual override; auto = emi * term_months
    )
    start_date: date
    term_months: int
    due_day: Optional[int] = None


class LiabilityCreate(LiabilityBase):
    pass


class LiabilityUpdate(BaseModel):
    liability_name: Optional[str] = None
    lender_id: Optional[UUID] = None
    liabilities_type_id: Optional[UUID] = None
    original_amount: Optional[Decimal] = None
    interest_rate: Optional[float] = None
    emi_amount: Optional[Decimal] = None
    term_months: Optional[int] = None
    total_payable_amount: Optional[Decimal] = None
    start_date: Optional[date] = None
    due_day: Optional[int] = None


class Liability(LiabilityBase):
    id: UUID
    # Calculated / derived fields
    total_payable_amount: Optional[Decimal] = None
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


# Friend Schemas
class FriendBase(BaseModel):
    name: str
    is_active: bool = True


class FriendCreate(FriendBase):
    pass


class Friend(FriendBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FriendTransactionBase(BaseModel):
    friend_id: UUID
    amount: Decimal
    direction: str  # friend_owes_you, you_owe_friend
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    description: Optional[str] = None
    date: date
    is_settlement: bool = False


class FriendTransactionCreate(FriendTransactionBase):
    pass


class FriendTransactionUpdate(BaseModel):
    friend_id: Optional[UUID] = None
    amount: Optional[Decimal] = None
    direction: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    description: Optional[str] = None
    date: Optional[dt.date] = None
    is_settlement: Optional[bool] = None


class FriendTransaction(FriendTransactionBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class FriendBalance(BaseModel):
    friend_id: UUID
    friend_name: str
    net_balance: Decimal
    you_owe: Decimal
    you_are_owed: Decimal


class FriendLedgerEntry(BaseModel):
    id: UUID
    date: date
    reference_type: str
    amount: Decimal
    direction: str
    description: Optional[str]
    running_balance: Decimal
