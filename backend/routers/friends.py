from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from database import get_db
from auth import get_current_user, User
from schemas.schemas import (
    Friend,
    FriendCreate,
    FriendTransaction,
    FriendTransactionCreate,
    FriendTransactionUpdate,
    FriendBalance,
    FriendLedgerEntry,
)
from services.friend_service import FriendService

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("/", response_model=List[Friend])
async def get_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    return await service.get_friends()


@router.post("/", response_model=Friend)
async def create_friend(
    friend: FriendCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    return await service.create_friend(friend)


@router.delete("/{friend_id}")
async def delete_friend(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    return await service.delete_friend(friend_id)


@router.get("/balances", response_model=List[FriendBalance])
async def get_all_balances(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    return await service.get_friend_balances()


@router.get("/{friend_id}/balance", response_model=FriendBalance)
async def get_friend_balance(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    balance = await service.get_friend_balance(friend_id)
    if not balance:
        raise HTTPException(status_code=404, detail="Friend not found")
    return balance


@router.get("/{friend_id}/ledger", response_model=List[FriendLedgerEntry])
async def get_friend_ledger(
    friend_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    return await service.get_friend_ledger(friend_id)


@router.post("/{friend_id}/transactions", response_model=FriendTransaction)
async def create_transaction(
    friend_id: UUID,
    transaction: FriendTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if friend_id != transaction.friend_id:
        raise HTTPException(status_code=400, detail="ID mismatch")
    service = FriendService(db, current_user.id)
    return await service.create_transaction(transaction)


@router.put("/transactions/{transaction_id}", response_model=FriendTransaction)
async def update_transaction(
    transaction_id: UUID,
    transaction: FriendTransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    updated = await service.update_transaction(transaction_id, transaction)
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FriendService(db, current_user.id)
    success = await service.delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": "success"}
