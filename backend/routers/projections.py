from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from auth import get_current_user, User
from services.projection_engine import ProjectionEngine
from datetime import date
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/planning", tags=["Financial Planning"])


@router.get("/net-worth-projection")
async def get_net_worth_projection(
    years: int = Query(10, ge=1, le=50),
    growth_rate: float = Query(7.0, ge=0, le=30),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    engine = ProjectionEngine(db, current_user.id)
    return await engine.get_net_worth_projection(years, growth_rate)


@router.get("/goal-feasibility")
async def get_goal_feasibility(
    target_amount: float = Query(...),
    target_date: date = Query(...),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    engine = ProjectionEngine(db, current_user.id)
    return await engine.calculate_goal_feasibility(target_amount, target_date)


@router.get("/retirement-estimate")
async def get_retirement_estimate(
    current_age: int = Query(30, ge=18, le=100),
    retirement_age: int = Query(60, ge=18, le=100),
    expected_return: float = Query(8.0, ge=0, le=30),
    inflation: float = Query(6.0, ge=0, le=20),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    engine = ProjectionEngine(db, current_user.id)
    return await engine.estimate_retirement(
        current_age, retirement_age, expected_return, inflation
    )


@router.get("/simulate")
async def simulate_scenario(
    event_type: str = Query(..., pattern="^(emergency_withdrawal|loan_prepayment)$"),
    amount: float = Query(...),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    engine = ProjectionEngine(db, current_user.id)
    return await engine.simulate_scenario(event_type, amount)
