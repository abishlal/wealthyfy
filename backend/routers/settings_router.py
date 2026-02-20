from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import LookupValue
from typing import List, Dict
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/settings", tags=["Settings"])


class LookupValueCreate(BaseModel):
    value: str


class LookupValueUpdate(BaseModel):
    value: str
    is_active: bool


class LookupValueResponse(BaseModel):
    id: UUID
    type: str
    value: str
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/types", response_model=List[str])
async def get_lookup_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LookupValue.type).distinct())
    return [row[0] for row in result.all()]


@router.get("/{type_name}", response_model=List[LookupValueResponse])
async def get_lookup_values_by_type(type_name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LookupValue)
        .where(LookupValue.type == type_name, LookupValue.is_active == True)
        .order_by(LookupValue.display_order)
    )
    return result.scalars().all()


@router.post("/{type_name}", response_model=LookupValueResponse)
async def create_lookup_value(
    type_name: str, lookup: LookupValueCreate, db: AsyncSession = Depends(get_db)
):
    # Calculate next display order
    result = await db.execute(
        select(LookupValue.display_order)
        .where(LookupValue.type == type_name)
        .order_by(LookupValue.display_order.desc())
        .limit(1)
    )
    max_order = result.scalar()
    next_order = (max_order or 0) + 1

    new_lookup = LookupValue(
        type=type_name, value=lookup.value, display_order=next_order
    )
    db.add(new_lookup)
    await db.commit()
    await db.refresh(new_lookup)
    return new_lookup


@router.put("/{id}", response_model=LookupValueResponse)
async def update_lookup_value(
    id: UUID, lookup: LookupValueUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(LookupValue).where(LookupValue.id == id))
    existing_lookup = result.scalar_one_or_none()
    if not existing_lookup:
        raise HTTPException(status_code=404, detail="Lookup value not found")

    existing_lookup.value = lookup.value
    existing_lookup.is_active = lookup.is_active
    await db.commit()
    await db.refresh(existing_lookup)
    return existing_lookup


@router.delete("/{id}")
async def delete_lookup_value(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LookupValue).where(LookupValue.id == id))
    existing_lookup = result.scalar_one_or_none()
    if not existing_lookup:
        raise HTTPException(status_code=404, detail="Lookup value not found")

    existing_lookup.is_active = False  # Soft delete
    await db.commit()
    return {"message": "Lookup value deleted successfully"}


@router.get("", response_model=Dict[str, List[LookupValueResponse]])
async def get_all_lookup_values_grouped(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LookupValue)
        .where(LookupValue.is_active == True)
        .order_by(LookupValue.type, LookupValue.display_order)
    )
    lookups = result.scalars().all()
    grouped = {}
    for lookup in lookups:
        if lookup.type not in grouped:
            grouped[lookup.type] = []
        grouped[lookup.type].append(lookup)
    return grouped
