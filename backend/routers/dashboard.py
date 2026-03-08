from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List
from datetime import date
from database import get_db
from auth import get_current_user, User
from services.dashboard_service import DashboardService

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    responses={404: {"description": "Not found"}},
)


@router.get("/daily", response_model=Dict[str, Any])
async def get_daily_dashboard(
    target_date: date = Query(default=date.today()), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    service = DashboardService(db, current_user.id)
    return await service.get_daily_dashboard(target_date)


@router.get("/weekly", response_model=Dict[str, Any])
async def get_weekly_dashboard(
    start_date: date, end_date: date, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    service = DashboardService(db, current_user.id)
    return await service.get_weekly_dashboard(start_date, end_date)


@router.get("/monthly", response_model=Dict[str, Any])
async def get_monthly_dashboard(
    year: int = Query(..., ge=2000, le=3000),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.id)
    return await service.get_monthly_dashboard(year, month)


@router.get("/summary", response_model=Dict[str, Any])
async def get_summary_dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DashboardService(db, current_user.id)
    return await service.get_summary_dashboard()


# ===== Phase 2: Financial Metrics Endpoints =====


@router.get("/cashflow", response_model=Dict[str, Any])
async def get_cashflow(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get cash flow summary (cash in, cash out, net cash flow)"""
    service = DashboardService(db, current_user.id)
    return await service.get_cashflow_summary()


@router.get("/net-savings", response_model=Dict[str, Any])
async def get_net_savings(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get net savings for a date range or lifetime if no dates provided"""
    service = DashboardService(db, current_user.id)
    return await service.get_net_savings(start_date, end_date)


@router.get("/net-worth", response_model=Dict[str, Any])
async def get_net_worth(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get net worth calculation (cash balance + investments - outstanding debt)"""
    service = DashboardService(db, current_user.id)
    return await service.get_net_worth()


# ===== Phase 3: Category & Account Breakdown Endpoints =====


@router.get("/monthly/category-breakdown", response_model=Dict[str, float])
async def get_category_breakdown(
    year: int = Query(..., ge=2000, le=3000),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get category-wise expense breakdown for a specific month"""
    service = DashboardService(db, current_user.id)
    return await service.get_category_breakdown(year, month)


@router.get("/expense-trend", response_model=List[Dict[str, Any]])
async def get_expense_trend(
    group_by: str = Query("month", pattern="^(day|week|month)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get expense trend grouped by day, week, or month"""
    service = DashboardService(db, current_user.id)
    return await service.get_expense_trend(group_by, start_date, end_date)


@router.get("/income-trend", response_model=List[Dict[str, Any]])
async def get_income_trend(
    group_by: str = Query("month", pattern="^(day|week|month)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get income trend grouped by day, week, or month"""
    service = DashboardService(db, current_user.id)
    return await service.get_income_trend(group_by, start_date, end_date)


@router.get("/investment-trend", response_model=List[Dict[str, Any]])
async def get_investment_trend(
    group_by: str = Query("month", pattern="^(day|week|month)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get investment trend grouped by day, week, or month"""
    service = DashboardService(db, current_user.id)
    return await service.get_investment_trend(group_by, start_date, end_date)


@router.get("/liability-payment-trend", response_model=List[Dict[str, Any]])
async def get_liability_payment_trend(
    group_by: str = Query("month", pattern="^(day|week|month)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get liability payment trend grouped by day, week, or month"""
    service = DashboardService(db, current_user.id)
    return await service.get_liability_payment_trend(group_by, start_date, end_date)


@router.get("/account-summary", response_model=Dict[str, Any])
async def get_account_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get account-wise summary of income and expenses"""
    service = DashboardService(db, current_user.id)
    return await service.get_account_summary(start_date, end_date)


@router.get("/investment-breakdown", response_model=Dict[str, float])
async def get_investment_breakdown(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get investment breakdown by type"""
    service = DashboardService(db, current_user.id)
    return await service.get_investment_breakdown(start_date, end_date)


@router.get("/liability-summary", response_model=Dict[str, Any])
async def get_liability_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get comprehensive liability summary with individual liability progress"""
    service = DashboardService(db, current_user.id)
    return await service.get_liability_summary(start_date, end_date)
