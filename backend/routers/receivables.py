from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from database import get_db
from schemas.schemas import Receivable, ReceivableCreate, ReceivableUpdate
from services.receivable_service import ReceivableService
from auth import get_current_user, User

router = APIRouter(
    prefix="/receivables",
    tags=["receivables"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[Receivable])
async def read_receivables(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReceivableService(db, current_user.id)
    return await service.get_receivables(skip, limit)


@router.get("/{receivable_id}", response_model=Receivable)
async def read_receivable(
    receivable_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReceivableService(db, current_user.id)
    db_receivable = await service.get_receivable(receivable_id)
    if db_receivable is None:
        raise HTTPException(status_code=404, detail="Receivable not found")
    return db_receivable


@router.put("/{receivable_id}", response_model=Receivable)
async def update_receivable(
    receivable_id: UUID,
    receivable: ReceivableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReceivableService(db, current_user.id)
    db_receivable = await service.update_receivable(receivable_id, receivable)
    if db_receivable is None:
        raise HTTPException(status_code=404, detail="Receivable not found")
    return db_receivable


@router.delete("/{receivable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receivable(
    receivable_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReceivableService(db, current_user.id)
    await service.delete_receivable(receivable_id)
