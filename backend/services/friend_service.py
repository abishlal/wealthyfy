from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, case
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from models.models import Friend, FriendTransaction
from schemas.schemas import (
    FriendCreate,
    FriendTransactionCreate,
    FriendTransactionUpdate,
    FriendBalance,
    FriendLedgerEntry,
)


class FriendService:
    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id

    async def get_friends(self) -> List[Friend]:
        result = await self.db.execute(
            select(Friend)
            .where(Friend.user_id == self.user_id, Friend.is_active == True)
            .order_by(Friend.name)
        )
        return list(result.scalars().all())

    async def create_friend(self, friend_data: FriendCreate) -> Friend:
        db_friend = Friend(user_id=self.user_id, name=friend_data.name, is_active=True)
        self.db.add(db_friend)
        await self.db.commit()
        await self.db.refresh(db_friend)
        return db_friend

    async def delete_friend(self, friend_id: UUID) -> bool:
        # Check if friend has transactions
        result = await self.db.execute(
            select(func.count(FriendTransaction.id)).where(
                FriendTransaction.friend_id == friend_id,
                FriendTransaction.user_id == self.user_id,
            )
        )
        if result.scalar() > 0:
            # Soft delete only if has transactions
            result = await self.db.execute(
                Friend.__table__.update()
                .where(Friend.id == friend_id, Friend.user_id == self.user_id)
                .values(is_active=False)
            )
        else:
            # Hard delete if no transactions
            result = await self.db.execute(
                delete(Friend).where(
                    Friend.id == friend_id, Friend.user_id == self.user_id
                )
            )
        await self.db.commit()
        return True

    async def get_friend_balances(self) -> List[FriendBalance]:
        friends = await self.get_friends()
        balances = []

        for friend in friends:
            balance_data = await self.get_friend_balance(friend.id)
            if balance_data:
                balances.append(balance_data)

        return balances

    async def get_friend_balance(self, friend_id: UUID) -> Optional[FriendBalance]:
        friend_result = await self.db.execute(
            select(Friend).where(Friend.id == friend_id, Friend.user_id == self.user_id)
        )
        friend = friend_result.scalar_one_or_none()
        if not friend:
            return None

        # Net Amount = friend_owes_you (+) - you_owe_friend (-)
        result = await self.db.execute(
            select(
                func.sum(
                    case(
                        (
                            FriendTransaction.direction == "friend_owes_you",
                            FriendTransaction.amount,
                        ),
                        (
                            FriendTransaction.direction == "you_owe_friend",
                            -FriendTransaction.amount,
                        ),
                        else_=0,
                    )
                ).label("net_balance"),
                func.sum(
                    case(
                        (
                            FriendTransaction.direction == "you_owe_friend",
                            FriendTransaction.amount,
                        ),
                        else_=0,
                    )
                ).label("you_owe"),
                func.sum(
                    case(
                        (
                            FriendTransaction.direction == "friend_owes_you",
                            FriendTransaction.amount,
                        ),
                        else_=0,
                    )
                ).label("you_are_owed"),
            ).where(
                FriendTransaction.friend_id == friend_id,
                FriendTransaction.user_id == self.user_id,
            )
        )
        row = result.fetchone()

        return FriendBalance(
            friend_id=friend.id,
            friend_name=friend.name,
            net_balance=row.net_balance or Decimal("0"),
            you_owe=row.you_owe or Decimal("0"),
            you_are_owed=row.you_are_owed or Decimal("0"),
        )

    async def create_transaction(
        self, transaction_data: FriendTransactionCreate
    ) -> FriendTransaction:
        db_transaction = FriendTransaction(
            user_id=self.user_id,
            friend_id=transaction_data.friend_id,
            amount=transaction_data.amount,
            direction=transaction_data.direction,
            reference_type=transaction_data.reference_type,
            reference_id=transaction_data.reference_id,
            description=transaction_data.description,
            date=transaction_data.date,
            is_settlement=transaction_data.is_settlement,
        )
        self.db.add(db_transaction)
        await self.db.commit()
        await self.db.refresh(db_transaction)
        return db_transaction

    async def update_transaction(
        self, transaction_id: UUID, transaction_data: FriendTransactionUpdate
    ) -> Optional[FriendTransaction]:
        result = await self.db.execute(
            select(FriendTransaction).where(
                FriendTransaction.id == transaction_id,
                FriendTransaction.user_id == self.user_id,
            )
        )
        db_transaction = result.scalar_one_or_none()
        if not db_transaction:
            return None

        update_data = transaction_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_transaction, key, value)

        await self.db.commit()
        await self.db.refresh(db_transaction)
        return db_transaction

    async def delete_transaction(self, transaction_id: UUID) -> bool:
        result = await self.db.execute(
            delete(FriendTransaction).where(
                FriendTransaction.id == transaction_id,
                FriendTransaction.user_id == self.user_id,
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_friend_ledger(self, friend_id: UUID) -> List[FriendLedgerEntry]:
        result = await self.db.execute(
            select(FriendTransaction)
            .where(
                FriendTransaction.friend_id == friend_id,
                FriendTransaction.user_id == self.user_id,
            )
            .order_by(FriendTransaction.date.asc(), FriendTransaction.created_at.asc())
        )
        transactions = result.scalars().all()

        ledger = []
        running_balance = Decimal("0")

        for tx in transactions:
            change = tx.amount if tx.direction == "friend_owes_you" else -tx.amount
            running_balance += change
            ledger.append(
                FriendLedgerEntry(
                    id=tx.id,
                    date=tx.date,
                    reference_type=tx.reference_type or "manual",
                    amount=tx.amount,
                    direction=tx.direction,
                    description=tx.description,
                    running_balance=running_balance,
                )
            )

        # Return reversed for UI (newest first) but with correct running balance calculation
        return ledger[::-1]
