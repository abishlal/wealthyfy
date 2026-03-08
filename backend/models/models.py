from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    ForeignKey,
    Text,
    DECIMAL,
    DateTime,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base


class LookupValue(Base):
    __tablename__ = "lookup_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    value = Column(String, nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "type", "value", name="uix_user_type_value"),
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    purchase_date = Column(Date, nullable=False, index=True)
    item = Column(String, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)

    category_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )
    account_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )

    notes = Column(Text, nullable=True)

    category = relationship("LookupValue", foreign_keys=[category_id])
    account = relationship("LookupValue", foreign_keys=[account_id])


class Income(Base):
    __tablename__ = "income"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    date = Column(Date, nullable=False, index=True)

    income_source_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )
    account_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )

    description = Column(String, nullable=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    notes = Column(Text, nullable=True)

    income_source = relationship("LookupValue", foreign_keys=[income_source_id])
    account = relationship("LookupValue", foreign_keys=[account_id])


class Liability(Base):
    __tablename__ = "liabilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)

    liabilities_type_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )
    lender_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )

    liability_name = Column(String, nullable=True)  # Optional descriptive name
    original_amount = Column(DECIMAL(10, 2), nullable=False)
    interest_rate = Column(Float, nullable=False)
    emi_amount = Column(DECIMAL(10, 2), nullable=False)
    total_payable_amount = Column(
        DECIMAL(10, 2), nullable=True
    )  # manual or auto: emi * term_months
    start_date = Column(Date, nullable=False)
    term_months = Column(Integer, nullable=False)
    due_day = Column(Integer, nullable=True)

    liabilities_type = relationship("LookupValue", foreign_keys=[liabilities_type_id])
    lender = relationship("LookupValue", foreign_keys=[lender_id])

    payments = relationship(
        "LiabilityPayment", back_populates="liability", cascade="all, delete-orphan"
    )


class LiabilityPayment(Base):
    __tablename__ = "liability_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    liability_id = Column(
        UUID(as_uuid=True), ForeignKey("liabilities.id"), nullable=False
    )
    payment_date = Column(Date, nullable=False, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)

    liability = relationship("Liability", back_populates="payments")


class Investment(Base):
    __tablename__ = "investments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    investment_type_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )
    institution_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )

    amount = Column(DECIMAL(10, 2), nullable=False)
    notes = Column(Text, nullable=True)

    investment_type = relationship("LookupValue", foreign_keys=[investment_type_id])
    institution = relationship("LookupValue", foreign_keys=[institution_id])


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    category_id = Column(
        UUID(as_uuid=True), ForeignKey("lookup_values.id"), nullable=False
    )
    amount = Column(DECIMAL(10, 2), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)

    category = relationship("LookupValue", foreign_keys=[category_id])


class Receivable(Base):
    __tablename__ = "receivables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    date = Column(Date, nullable=False, index=True)

    person_name = Column(String, nullable=False)
    total_owed = Column(DECIMAL(10, 2), nullable=False)
    amount_received = Column(DECIMAL(10, 2), default=0)

    status = Column(String, default="pending")  # pending, partial, settled

    # Reference to the shared expense that created this receivable
    reference_type = Column(String, nullable=True)  # e.g., "shared_expense"
    reference_id = Column(UUID(as_uuid=True), nullable=True)

    notes = Column(Text, nullable=True)


class Friend(Base):
    __tablename__ = "friends"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class FriendTransaction(Base):
    __tablename__ = "friend_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    friend_id = Column(UUID(as_uuid=True), ForeignKey("friends.id"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    direction = Column(String, nullable=False)  # friend_owes_you, you_owe_friend
    reference_type = Column(String, nullable=True)  # expense, manual, settlement
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    description = Column(String, nullable=True)
    date = Column(Date, nullable=False, index=True)
    is_settlement = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    friend = relationship("Friend")
