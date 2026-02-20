from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from models.models import (
    Expense,
    Income,
    Investment,
    Liability,
    LiabilityPayment,
    LookupValue,
)


class FinancialEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_total(
        self,
        model,
        column,
        date_column,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> float:
        query = select(func.sum(column))
        if start_date and end_date:
            query = query.where(date_column.between(start_date, end_date))
        result = await self.db.execute(query)
        return float(result.scalar() or 0)

    async def calculate_cash_balance(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, float]:
        total_income = await self._get_total(
            Income, Income.amount, Income.date, start_date, end_date
        )
        total_expense = await self._get_total(
            Expense, Expense.amount, Expense.purchase_date, start_date, end_date
        )
        total_investment = await self._get_total(
            Investment, Investment.amount, Investment.date, start_date, end_date
        )
        total_liability_paid = await self._get_total(
            LiabilityPayment,
            LiabilityPayment.amount,
            LiabilityPayment.payment_date,
            start_date,
            end_date,
        )

        cash_balance = (
            total_income - total_expense - total_investment - total_liability_paid
        )
        return {"cash_balance": float(cash_balance)}

    async def calculate_net_savings(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, float]:
        total_income = await self._get_total(
            Income, Income.amount, Income.date, start_date, end_date
        )
        total_expense = await self._get_total(
            Expense, Expense.amount, Expense.purchase_date, start_date, end_date
        )
        total_investment = await self._get_total(
            Investment, Investment.amount, Investment.date, start_date, end_date
        )
        total_liability_paid = await self._get_total(
            LiabilityPayment,
            LiabilityPayment.amount,
            LiabilityPayment.payment_date,
            start_date,
            end_date,
        )

        net_savings = (
            total_income - total_expense - total_investment - total_liability_paid
        )
        return {"net_savings": float(net_savings)}

    async def calculate_savings_rate(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, float]:
        total_income = await self._get_total(
            Income, Income.amount, Income.date, start_date, end_date
        )
        net_savings_data = await self.calculate_net_savings(start_date, end_date)
        net_savings = float(net_savings_data["net_savings"])

        savings_rate = float(net_savings / total_income) if total_income > 0 else 0.0
        return {"savings_rate": savings_rate}

    async def calculate_net_worth(self) -> Dict[str, float]:
        cash_balance_data = await self.calculate_cash_balance()
        cash = float(cash_balance_data["cash_balance"])

        total_investments = await self._get_total(
            Investment, Investment.amount, Investment.date
        )

        liability_summary = await self.calculate_liability_summary()
        outstanding_liability = float(liability_summary["outstanding_liability"])

        net_worth = cash + total_investments - outstanding_liability
        return {"net_worth": float(net_worth)}

    async def calculate_daily_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        async def get_daily_totals(model, amount_col, date_col):
            query = select(
                date_col.label("date"), func.sum(amount_col).label("total")
            ).group_by(date_col)
            if start_date and end_date:
                query = query.where(date_col.between(start_date, end_date))
            result = await self.db.execute(query)
            return {row.date: float(row.total) for row in result}

        income_daily = await get_daily_totals(Income, Income.amount, Income.date)
        expense_daily = await get_daily_totals(
            Expense, Expense.amount, Expense.purchase_date
        )
        investment_daily = await get_daily_totals(
            Investment, Investment.amount, Investment.date
        )
        liability_daily = await get_daily_totals(
            LiabilityPayment, LiabilityPayment.amount, LiabilityPayment.payment_date
        )

        all_dates = sorted(
            set(
                list(income_daily.keys())
                + list(expense_daily.keys())
                + list(investment_daily.keys())
                + list(liability_daily.keys())
            )
        )

        summary = []
        for d in all_dates:
            inc = income_daily.get(d, 0.0)
            exp = expense_daily.get(d, 0.0)
            inv = investment_daily.get(d, 0.0)
            deb = liability_daily.get(d, 0.0)
            summary.append(
                {
                    "date": d,
                    "income": inc,
                    "expense": exp,
                    "investment": inv,
                    "liability_paid": deb,
                    "net": inc - exp - inv - deb,
                }
            )
        return summary

    async def calculate_weekly_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        async def get_weekly(model, amount_col, date_col):
            query = select(
                func.date_trunc("week", date_col).label("week_start"),
                func.sum(amount_col).label("total"),
            ).group_by(text("week_start"))
            if start_date and end_date:
                query = query.where(date_col.between(start_date, end_date))
            result = await self.db.execute(query)
            return {row.week_start.date(): float(row.total) for row in result}

        income_weekly = await get_weekly(Income, Income.amount, Income.date)
        expense_weekly = await get_weekly(
            Expense, Expense.amount, Expense.purchase_date
        )
        investment_weekly = await get_weekly(
            Investment, Investment.amount, Investment.date
        )
        liability_weekly = await get_weekly(
            LiabilityPayment, LiabilityPayment.amount, LiabilityPayment.payment_date
        )

        all_weeks = sorted(
            set(
                list(income_weekly.keys())
                + list(expense_weekly.keys())
                + list(investment_weekly.keys())
                + list(liability_weekly.keys())
            )
        )

        summary = []

        for ws in all_weeks:
            inc = income_weekly.get(ws, 0.0)
            exp = expense_weekly.get(ws, 0.0)
            inv = investment_weekly.get(ws, 0.0)
            deb = liability_weekly.get(ws, 0.0)
            summary.append(
                {
                    "week_start": ws,
                    "week_end": ws + timedelta(days=6),
                    "income": inc,
                    "expense": exp,
                    "investment": inv,
                    "liability_paid": deb,
                    "net": inc - exp - inv - deb,
                }
            )
        return summary

    async def calculate_monthly_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        async def get_monthly(model, amount_col, date_col):
            query = select(
                func.to_char(date_col, "YYYY-MM").label("month"),
                func.sum(amount_col).label("total"),
            ).group_by(text("month"))
            if start_date and end_date:
                query = query.where(date_col.between(start_date, end_date))
            result = await self.db.execute(query)
            return {row.month: float(row.total) for row in result}

        income_monthly = await get_monthly(Income, Income.amount, Income.date)
        expense_monthly = await get_monthly(
            Expense, Expense.amount, Expense.purchase_date
        )
        investment_monthly = await get_monthly(
            Investment, Investment.amount, Investment.date
        )
        liability_monthly = await get_monthly(
            LiabilityPayment, LiabilityPayment.amount, LiabilityPayment.payment_date
        )

        all_months = sorted(
            set(
                list(income_monthly.keys())
                + list(expense_monthly.keys())
                + list(investment_monthly.keys())
                + list(liability_monthly.keys())
            )
        )

        summary = []
        for m in all_months:
            inc = income_monthly.get(m, 0.0)
            exp = expense_monthly.get(m, 0.0)
            inv = investment_monthly.get(m, 0.0)
            deb = liability_monthly.get(m, 0.0)
            summary.append(
                {
                    "month": m,
                    "income": inc,
                    "expense": exp,
                    "investment": inv,
                    "liability_paid": deb,
                    "net_savings": inc - exp - inv - deb,
                    "cash_flow": inc - exp - inv - deb,
                }
            )
        return summary

    async def calculate_yearly_summary(self) -> List[Dict[str, Any]]:
        async def get_yearly(model, amount_col, date_col):
            query = select(
                func.extract("year", date_col).label("year_val"),
                func.sum(amount_col).label("total"),
            ).group_by(text("year_val"))
            result = await self.db.execute(query)
            return {int(row.year_val): float(row.total) for row in result}

        income_yearly = await get_yearly(Income, Income.amount, Income.date)
        expense_yearly = await get_yearly(
            Expense, Expense.amount, Expense.purchase_date
        )
        investment_yearly = await get_yearly(
            Investment, Investment.amount, Investment.date
        )
        liability_yearly = await get_yearly(
            LiabilityPayment, LiabilityPayment.amount, LiabilityPayment.payment_date
        )

        all_years = sorted(
            set(
                list(income_yearly.keys())
                + list(expense_yearly.keys())
                + list(investment_yearly.keys())
                + list(liability_yearly.keys())
            )
        )

        summary = []
        for y in all_years:
            inc = income_yearly.get(y, 0.0)
            exp = expense_yearly.get(y, 0.0)
            inv = investment_yearly.get(y, 0.0)
            deb = liability_yearly.get(y, 0.0)
            summary.append(
                {
                    "year": y,
                    "income": inc,
                    "expense": exp,
                    "investment": inv,
                    "liability_paid": deb,
                    "net_savings": inc - exp - inv - deb,
                }
            )
        return summary

    async def calculate_category_breakdown(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        # Join with LookupValue to get category name
        query = (
            select(
                LookupValue.value.label("category"),
                func.sum(Expense.amount).label("total"),
            )
            .join(LookupValue, Expense.category_id == LookupValue.id)
            .group_by(LookupValue.value)
        )
        if start_date and end_date:
            query = query.where(Expense.purchase_date.between(start_date, end_date))

        result = await self.db.execute(query)
        data = [
            {
                "category": row.category,
                "amount": float(row.total),
            }
            for row in result
        ]

        total_sum = sum(item["amount"] for item in data)
        for item in data:
            item["percentage"] = (
                float((item["amount"] / total_sum * 100)) if total_sum > 0 else 0.0
            )

        return sorted(data, key=lambda x: x["amount"], reverse=True)

    async def calculate_category_trend(self, category: str) -> List[Dict[str, Any]]:
        # Join with LookupValue to filter by category name
        query = (
            select(
                func.to_char(Expense.purchase_date, "YYYY-MM").label("month"),
                func.sum(Expense.amount).label("amount"),
            )
            .join(LookupValue, Expense.category_id == LookupValue.id)
            .where(LookupValue.value == category)
            .group_by(text("month"))
            .order_by(text("month"))
        )

        result = await self.db.execute(query)
        return [{"month": row.month, "amount": float(row.amount)} for row in result]

    async def calculate_investment_trend(self) -> List[Dict[str, Any]]:
        query = (
            select(
                func.to_char(Investment.date, "YYYY-MM").label("month"),
                func.sum(Investment.amount).label("amount"),
            )
            .group_by(text("month"))
            .order_by(text("month"))
        )

        result = await self.db.execute(query)
        data = []
        cumulative = 0.0
        for row in result:
            cumulative += float(row.amount)
            data.append(
                {
                    "month": row.month,
                    "amount": float(row.amount),
                    "cumulative_amount": cumulative,
                }
            )
        return data

    async def calculate_liability_trend(self) -> List[Dict[str, Any]]:
        total_initial_liability_query = select(func.sum(Liability.original_amount))
        total_initial_liability = float(
            (await self.db.execute(total_initial_liability_query)).scalar() or 0
        )

        payments_query = (
            select(
                func.to_char(LiabilityPayment.payment_date, "YYYY-MM").label("month"),
                func.sum(LiabilityPayment.amount).label("paid"),
            )
            .group_by(text("month"))
            .order_by(text("month"))
        )

        payments_result = await self.db.execute(payments_query)

        data = []
        cumulative_paid = 0.0
        for row in payments_result:
            cumulative_paid += float(row.paid)
            data.append(
                {
                    "month": row.month,
                    "outstanding_liability": total_initial_liability - cumulative_paid,
                }
            )
        return data

    async def calculate_liability_summary(self) -> Dict[str, Any]:
        total_liability_query = select(func.sum(Liability.original_amount))
        total_paid_query = select(func.sum(LiabilityPayment.amount))

        total_liability = float(
            (await self.db.execute(total_liability_query)).scalar() or 0
        )
        total_paid = float((await self.db.execute(total_paid_query)).scalar() or 0)

        outstanding_liability = total_liability - total_paid
        progress_percentage = (
            float((total_paid / total_liability * 100)) if total_liability > 0 else 0.0
        )

        return {
            "total_liability": total_liability,
            "total_paid": total_paid,
            "outstanding_liability": outstanding_liability,
            "progress_percentage": progress_percentage,
        }
