from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from services.financial_engine import FinancialEngine
from datetime import date
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/dashboard/v2", tags=["Dashboard V2"])


@router.get("/cash-balance")
async def get_cash_balance(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_cash_balance(start_date, end_date)


@router.get("/net-worth")
async def get_net_worth(db: AsyncSession = Depends(get_db)):
    engine = FinancialEngine(db)
    return await engine.calculate_net_worth()


@router.get("/net-savings")
async def get_net_savings(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_net_savings(start_date, end_date)


@router.get("/savings-rate")
async def get_savings_rate(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_savings_rate(start_date, end_date)


@router.get("/daily")
async def get_daily(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_daily_summary(start_date, end_date)


@router.get("/weekly")
async def get_weekly(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_weekly_summary(start_date, end_date)


@router.get("/monthly")
async def get_monthly(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_monthly_summary(start_date, end_date)


@router.get("/yearly")
async def get_yearly(db: AsyncSession = Depends(get_db)):
    engine = FinancialEngine(db)
    return await engine.calculate_yearly_summary()


@router.get("/category-breakdown")
async def get_category_breakdown(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_category_breakdown(start_date, end_date)


@router.get("/category-trend")
async def get_category_trend(
    category: str = Query(..., description="The category to get the trend for"),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_category_trend(category)


@router.get("/investment-trend")
async def get_investment_trend(db: AsyncSession = Depends(get_db)):
    engine = FinancialEngine(db)
    return await engine.calculate_investment_trend()


@router.get("/liability-trend")
async def get_liability_trend(db: AsyncSession = Depends(get_db)):
    engine = FinancialEngine(db)
    return await engine.calculate_liability_trend()


@router.get("/liability-summary")
async def get_liability_summary(db: AsyncSession = Depends(get_db)):
    engine = FinancialEngine(db)
    return await engine.calculate_liability_summary()


@router.get("/budget-vs-actual")
async def get_budget_vs_actual(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=3000),
    db: AsyncSession = Depends(get_db),
):
    engine = FinancialEngine(db)
    return await engine.calculate_budget_vs_actual(month, year)
