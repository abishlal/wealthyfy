from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from database import get_db
from schemas.schemas import Budget, BudgetCreate
from services.budget_service import BudgetService
from auth import get_current_user, User

router = APIRouter(
    prefix="/budgets",
    tags=["budgets"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=Budget, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db, current_user.id)
    return await service.create_budget(budget)


@router.get("/", response_model=List[Budget])
async def read_budgets(
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None, ge=2000, le=3000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db, current_user.id)
    return await service.get_budgets(month=month, year=year)


@router.get("/{budget_id}", response_model=Budget)
async def read_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db, current_user.id)
    db_budget = await service.get_budget(budget_id)
    if db_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return db_budget


@router.put("/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: UUID,
    budget: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db, current_user.id)
    db_budget = await service.get_budget(budget_id)
    if db_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return await service.update_budget(budget_id, budget)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = BudgetService(db, current_user.id)
    db_budget = await service.get_budget(budget_id)
    if db_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    await service.delete_budget(budget_id)
