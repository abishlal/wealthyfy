from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
import io
from database import get_db
from schemas.schemas import Investment, InvestmentCreate
from services.investment_service import InvestmentService
from services.export_service import ExportService
from auth import get_current_user, User

router = APIRouter(
    prefix="/investments",
    tags=["investments"],
    responses={404: {"description": "Not found"}},
)


@router.get("/export")
async def export_investments(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Export all investments to CSV"""
    service = InvestmentService(db, current_user.id)
    investments = await service.get_investments(limit=10000)

    fields = [
        "date",
        "investment_type.value",
        "institution.value",
        "amount",
        "notes",
    ]
    csv_data = ExportService.to_csv(investments, fields)

    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=investments.csv"},
    )


@router.post("/", response_model=Investment, status_code=status.HTTP_201_CREATED)
async def create_investment(
    investment: InvestmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db, current_user.id)
    return await service.create_investment(investment)


@router.get("/", response_model=List[Investment])
async def read_investments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvestmentService(db, current_user.id)
    return await service.get_investments(skip, limit)
