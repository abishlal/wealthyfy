from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
import io
from database import get_db
from schemas.schemas import Income, IncomeCreate
from services.income_service import IncomeService
from services.export_service import ExportService
from auth import get_current_user, User

router = APIRouter(
    prefix="/income",
    tags=["income"],
    responses={404: {"description": "Not found"}},
)


@router.get("/export")
async def export_income(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Export all income to CSV"""
    service = IncomeService(db, current_user.id)
    income_list = await service.get_incomes(limit=10000)

    fields = [
        "date",
        "income_source.value",
        "amount",
        "account.value",
        "description",
        "notes",
    ]
    csv_data = ExportService.to_csv(income_list, fields)

    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=income.csv"},
    )


@router.post("/", response_model=Income, status_code=status.HTTP_201_CREATED)
async def create_income(
    income: IncomeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IncomeService(db, current_user.id)
    return await service.create_income(income)


@router.get("/", response_model=List[Income])
async def read_incomes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IncomeService(db, current_user.id)
    return await service.get_incomes(skip, limit)


@router.get("/{income_id}", response_model=Income)
async def read_income(
    income_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IncomeService(db, current_user.id)
    db_income = await service.get_income(income_id)
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    return db_income


@router.put("/{income_id}", response_model=Income)
async def update_income(
    income_id: UUID,
    income: IncomeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IncomeService(db, current_user.id)
    db_income = await service.get_income(income_id)
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    return await service.update_income(income_id, income)


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income(
    income_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IncomeService(db, current_user.id)
    db_income = await service.get_income(income_id)
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    await service.delete_income(income_id)
