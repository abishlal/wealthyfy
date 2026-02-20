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
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base


class LookupValue(Base):
    __tablename__ = "lookup_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False, index=True)
    value = Column(String, nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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
    start_date = Column(Date, nullable=False)
    term_months = Column(Integer, nullable=False)

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
