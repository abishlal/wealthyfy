from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
import io
from database import get_db
from schemas.schemas import (
    Liability,
    LiabilityCreate,
    LiabilityUpdate,
    LiabilityPayment,
    LiabilityPaymentCreate,
)
from services.liability_service import LiabilityService
from services.export_service import ExportService
from auth import get_current_user, User

router = APIRouter(
    prefix="/liabilities",
    tags=["liabilities"],
    responses={404: {"description": "Not found"}},
)


@router.get("/export")
async def export_liabilities(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Export all liabilities to CSV"""
    service = LiabilityService(db, current_user.id)
    liabilities = await service.get_liabilities()

    fields = [
        "liabilities_type.value",
        "lender.value",
        "liability_name",
        "original_amount",
        "interest_rate",
        "emi_amount",
        "start_date",
        "term_months",
    ]
    csv_data = ExportService.to_csv(liabilities, fields)

    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=liabilities.csv"},
    )


@router.post("/", response_model=Liability, status_code=status.HTTP_201_CREATED)
async def create_liability(
    liability: LiabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = LiabilityService(db, current_user.id)
    return await service.create_liability(liability)


@router.get("/", response_model=List[Liability])
async def read_liabilities(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    service = LiabilityService(db, current_user.id)
    return await service.get_liabilities()


@router.put("/{liability_id}", response_model=Liability)
async def update_liability(
    liability_id: UUID,
    data: LiabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = LiabilityService(db, current_user.id)
    updated = await service.update_liability(liability_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Liability not found")
    return updated


@router.post(
    "/payments",
    response_model=LiabilityPayment,
    status_code=status.HTTP_201_CREATED,
)
async def create_liability_payment(
    payment: LiabilityPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = LiabilityService(db, current_user.id)
    return await service.create_payment(payment)


@router.get("/{liability_id}/payments", response_model=List[LiabilityPayment])
async def get_liability_payments(
    liability_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = LiabilityService(db, current_user.id)
    return await service.get_payments_by_liability(liability_id)


@router.get("/payments", response_model=List[LiabilityPayment])
async def get_all_liability_payments(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get all liability payments"""
    service = LiabilityService(db, current_user.id)
    # The service method needs to return consistent data with schema
    # The schema for LiabilityPayment doesn't strictly include liability name unless extended.
    # For now, let's return the basic payment list.
    return await service.get_all_payments_grouped()
