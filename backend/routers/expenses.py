from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
import io
from database import get_db
from schemas.schemas import Expense, ExpenseCreate
from services.expense_service import ExpenseService
from services.export_service import ExportService
from auth import get_current_user, User

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"],
    responses={404: {"description": "Not found"}},
)


@router.get("/export")
async def export_expenses(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Export all expenses to CSV"""
    service = ExpenseService(db, current_user.id)
    expenses = await service.get_expenses(limit=10000)  # Get all

    fields = [
        "purchase_date",
        "item",
        "amount",
        "category.value",
        "account.value",
        "notes",
    ]
    csv_data = ExportService.to_csv(expenses, fields)

    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )


@router.post("/", response_model=Expense, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ExpenseService(db, current_user.id)
    return await service.create_expense(expense)


@router.get("/", response_model=List[Expense])
async def read_expenses(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ExpenseService(db, current_user.id)
    return await service.get_expenses(skip, limit)


@router.get("/{expense_id}", response_model=Expense)
async def read_expense(
    expense_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ExpenseService(db, current_user.id)
    db_expense = await service.get_expense(expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense


@router.put("/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: UUID,
    expense: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ExpenseService(db, current_user.id)
    db_expense = await service.get_expense(expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return await service.update_expense(expense_id, expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ExpenseService(db, current_user.id)
    db_expense = await service.get_expense(expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    await service.delete_expense(expense_id)
