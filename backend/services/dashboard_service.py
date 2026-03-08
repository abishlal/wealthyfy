from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, desc
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from models.models import (
    Expense,
    Income,
    Liability,
    LiabilityPayment,
    Investment,
    LookupValue,
    FriendTransaction,
)


class DashboardService:
    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id

    async def get_daily_dashboard(self, target_date: date) -> Dict[str, Any]:
        # total_expense
        expense_result = await self.db.execute(
            select(func.sum(Expense.amount))
            .where(Expense.user_id == self.user_id)
            .where(Expense.purchase_date == target_date)
        )
        total_expense = expense_result.scalar() or 0

        # expenses_by_category
        cat_result = await self.db.execute(
            select(LookupValue.value, func.sum(Expense.amount))
            .join(LookupValue, Expense.category_id == LookupValue.id)
            .where(Expense.user_id == self.user_id)
            .where(Expense.purchase_date == target_date)
            .group_by(LookupValue.value)
        )
        expenses_by_category = {row[0]: row[1] for row in cat_result.all()}

        # total_income
        income_result = await self.db.execute(
            select(func.sum(Income.amount))
            .where(Income.user_id == self.user_id)
            .where(Income.date == target_date)
        )
        total_income = income_result.scalar() or 0

        # total_investment
        investment_result = await self.db.execute(
            select(func.sum(Investment.amount))
            .where(Investment.user_id == self.user_id)
            .where(Investment.date == target_date)
        )
        total_investment = investment_result.scalar() or 0

        # total_liability_paid
        liability_result = await self.db.execute(
            select(func.sum(LiabilityPayment.amount))
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(Liability.user_id == self.user_id)
            .where(LiabilityPayment.payment_date == target_date)
        )
        total_liability_paid = liability_result.scalar() or 0

        # total_receivable_received
        receiv_res = await self.db.execute(
            select(func.sum(FriendTransaction.amount))
            .where(FriendTransaction.user_id == self.user_id)
            .where(FriendTransaction.date == target_date)
            .where(FriendTransaction.direction == "you_owe_friend")
        )
        total_receivable_received = receiv_res.scalar() or 0

        # Calculate net: Income + ReceivableReceived - Expense - Investment - Liability Paid
        net = (
            total_income
            + total_receivable_received
            - total_expense
            - total_investment
            - total_liability_paid
        )

        return {
            "date": target_date,
            "total_expense": total_expense,
            "expenses_by_category": expenses_by_category,
            "total_income": total_income,
            "total_receivable_received": total_receivable_received,
            "total_investment": total_investment,
            "total_liability_paid": total_liability_paid,
            "net": net,
        }

    async def get_weekly_dashboard(
        self, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        # total_expense
        expense_result = await self.db.execute(
            select(func.sum(Expense.amount))
            .where(Expense.user_id == self.user_id)
            .where(Expense.purchase_date.between(start_date, end_date))
        )
        total_expense = expense_result.scalar() or 0

        # category_breakdown
        cat_result = await self.db.execute(
            select(LookupValue.value, func.sum(Expense.amount))
            .join(LookupValue, Expense.category_id == LookupValue.id)
            .where(Expense.user_id == self.user_id)
            .where(Expense.purchase_date.between(start_date, end_date))
            .group_by(LookupValue.value)
        )
        category_breakdown = {row[0]: row[1] for row in cat_result.all()}

        # total_income
        income_result = await self.db.execute(
            select(func.sum(Income.amount))
            .where(Income.user_id == self.user_id)
            .where(Income.date.between(start_date, end_date))
        )
        total_income = income_result.scalar() or 0

        # total_investment
        investment_result = await self.db.execute(
            select(func.sum(Investment.amount))
            .where(Investment.user_id == self.user_id)
            .where(Investment.date.between(start_date, end_date))
        )
        total_investment = investment_result.scalar() or 0

        # total_liability_paid
        liability_result = await self.db.execute(
            select(func.sum(LiabilityPayment.amount))
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(Liability.user_id == self.user_id)
            .where(LiabilityPayment.payment_date.between(start_date, end_date))
        )
        total_liability_paid = liability_result.scalar() or 0

        # Calculate net
        net = total_income - total_expense - total_investment - total_liability_paid

        return {
            "week_start": start_date,
            "week_end": end_date,
            "total_expense": total_expense,
            "category_breakdown": category_breakdown,
            "total_income": total_income,
            "total_investment": total_investment,
            "total_liability_paid": total_liability_paid,
            "net": net,
        }

    async def get_monthly_dashboard(self, year: int, month: int) -> Dict[str, Any]:
        # Helper to filter by month
        def filter_month(column):
            return (extract("year", column) == year) & (
                extract("month", column) == month
            )

        # total_income
        income_result = await self.db.execute(
            select(func.sum(Income.amount))
            .where(Income.user_id == self.user_id)
            .where(filter_month(Income.date))
        )
        total_income = income_result.scalar() or 0

        # total_expense
        expense_result = await self.db.execute(
            select(func.sum(Expense.amount))
            .where(Expense.user_id == self.user_id)
            .where(filter_month(Expense.purchase_date))
        )
        total_expense = expense_result.scalar() or 0

        # total_investment
        inv_result = await self.db.execute(
            select(func.sum(Investment.amount))
            .where(Investment.user_id == self.user_id)
            .where(filter_month(Investment.date))
        )
        total_investment = inv_result.scalar() or 0

        # total_liability_paid
        liability_result = await self.db.execute(
            select(func.sum(LiabilityPayment.amount))
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(Liability.user_id == self.user_id)
            .where(filter_month(LiabilityPayment.payment_date))
        )
        total_liability_paid = liability_result.scalar() or 0

        # category_breakdown
        cat_result = await self.db.execute(
            select(LookupValue.value, func.sum(Expense.amount))
            .join(LookupValue, Expense.category_id == LookupValue.id)
            .where(Expense.user_id == self.user_id)
            .where(filter_month(Expense.purchase_date))
            .group_by(LookupValue.value)
        )
        category_breakdown = {row[0]: row[1] for row in cat_result.all()}

        net_savings = (
            total_income - total_expense - total_investment - total_liability_paid
        )

        return {
            "month": f"{year}-{month:02d}",
            "total_income": total_income,
            "total_expense": total_expense,
            "total_investment": total_investment,
            "total_liability_paid": total_liability_paid,
            "net_savings": net_savings,
            "category_breakdown": category_breakdown,
        }

    async def get_summary_dashboard(self) -> Dict[str, Any]:
        # Totals (Lifetime)
        total_income = (
            await self.db.execute(
                select(func.sum(Income.amount)).where(Income.user_id == self.user_id)
            )
        ).scalar() or 0
        total_expense = (
            await self.db.execute(
                select(func.sum(Expense.amount)).where(Expense.user_id == self.user_id)
            )
        ).scalar() or 0
        total_investments = (
            await self.db.execute(
                select(func.sum(Investment.amount)).where(
                    Investment.user_id == self.user_id
                )
            )
        ).scalar() or 0
        total_liability_paid = (
            await self.db.execute(
                select(func.sum(LiabilityPayment.amount))
                .join(Liability, LiabilityPayment.liability_id == Liability.id)
                .where(Liability.user_id == self.user_id)
            )
        ).scalar() or 0

        # Outstanding Liability
        # Use total_payable_amount (principal + interest) if set, else fall back to original_amount
        total_liability_principal = (
            await self.db.execute(
                select(
                    func.sum(
                        func.coalesce(
                            Liability.total_payable_amount, Liability.original_amount
                        )
                    )
                ).where(Liability.user_id == self.user_id)
            )
        ).scalar() or 0
        total_outstanding_liability = total_liability_principal - total_liability_paid

        # Outstanding Receivable
        total_receiv_owed = (
            await self.db.execute(
                select(func.sum(FriendTransaction.amount)).where(
                    FriendTransaction.user_id == self.user_id,
                    FriendTransaction.direction == "friend_owes_you",
                )
            )
        ).scalar() or 0
        total_receiv_received = (
            await self.db.execute(
                select(func.sum(FriendTransaction.amount)).where(
                    FriendTransaction.user_id == self.user_id,
                    FriendTransaction.direction == "you_owe_friend",
                )
            )
        ).scalar() or 0
        total_outstanding_receivable = total_receiv_owed - total_receiv_received

        # Liquid Cash = actual money in hand
        # Income earned + friend repayments received - personal expenses - EMI paid - investments
        # Note: receivables_created is NOT subtracted — it is tracked separately as outstanding_receivable
        cash_on_hand = (
            total_income
            + total_receiv_received
            - total_expense
            - total_liability_paid
            - total_investments
        )
        net_worth = (
            cash_on_hand
            + total_investments
            + total_outstanding_receivable
            - total_outstanding_liability
        )

        # Monthly Trends (Last 12 months)
        # We need to group by year-month.
        today = date.today()
        start_date = today.replace(day=1) - timedelta(days=365)  # Approx

        # Expense Trend
        expense_trend_result = await self.db.execute(
            select(
                func.date_trunc("month", Expense.purchase_date).label("month"),
                func.sum(Expense.amount),
            )
            .where(Expense.user_id == self.user_id, Expense.purchase_date >= start_date)
            .group_by("month")
            .order_by("month")
        )
        expense_trend = [
            {"month": row[0].strftime("%Y-%m"), "amount": row[1]}
            for row in expense_trend_result.all()
        ]

        return {
            "total_income": total_income,
            "total_expense": total_expense,
            "total_investments": total_investments,
            "total_liability_paid": total_liability_paid,
            "total_outstanding_liability": total_outstanding_liability,
            "total_outstanding_receivable": total_outstanding_receivable,
            "net_worth": net_worth,
            "expense_trend": expense_trend,
            "monthly_trend": [
                "TODO: Comprehensive monthly breakdown"
            ],  # Placeholder for more complex trend
        }

    # ===== Phase 2: Financial Metrics =====

    async def get_cashflow_summary(self) -> Dict[str, Any]:
        """Calculate cash flow summary (lifetime totals)"""
        total_income = (
            await self.db.execute(
                select(func.sum(Income.amount)).where(Income.user_id == self.user_id)
            )
        ).scalar() or 0
        total_expense = (
            await self.db.execute(
                select(func.sum(Expense.amount)).where(Expense.user_id == self.user_id)
            )
        ).scalar() or 0
        total_investment = (
            await self.db.execute(
                select(func.sum(Investment.amount)).where(
                    Investment.user_id == self.user_id
                )
            )
        ).scalar() or 0
        total_liability_paid = (
            await self.db.execute(
                select(func.sum(LiabilityPayment.amount))
                .join(Liability, LiabilityPayment.liability_id == Liability.id)
                .where(Liability.user_id == self.user_id)
            )
        ).scalar() or 0

        total_receiv_received = (
            await self.db.execute(
                select(func.sum(FriendTransaction.amount)).where(
                    FriendTransaction.user_id == self.user_id,
                    FriendTransaction.direction == "you_owe_friend",
                )
            )
        ).scalar() or 0
        total_receiv_owed = (
            await self.db.execute(
                select(func.sum(FriendTransaction.amount)).where(
                    FriendTransaction.user_id == self.user_id,
                    FriendTransaction.direction == "friend_owes_you",
                )
            )
        ).scalar() or 0

        cash_in = total_income + total_receiv_received
        # receivables_created (total_owed) is NOT a cash outflow — money friends owe you
        # is tracked separately as outstanding_receivable, not deducted from liquid cash
        cash_out = total_expense + total_investment + total_liability_paid
        net_cash_flow = cash_in - cash_out

        return {
            "cash_in": cash_in,
            "total_income": total_income,
            "receivables_received": total_receiv_received,
            "cash_out": cash_out,
            "total_expense": total_expense,
            "total_investment": total_investment,
            "total_liability_paid": total_liability_paid,
            "receivables_created": total_receiv_owed,
            "net_cash_flow": net_cash_flow,
            "outstanding_receivable": total_receiv_owed - total_receiv_received,
        }

    async def get_net_savings(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Calculate net savings for a date range, or lifetime if no dates provided"""
        # Build queries with optional date filtering
        income_query = select(func.sum(Income.amount)).where(
            Income.user_id == self.user_id
        )
        expense_query = select(func.sum(Expense.amount)).where(
            Expense.user_id == self.user_id
        )
        investment_query = select(func.sum(Investment.amount)).where(
            Investment.user_id == self.user_id
        )
        liability_query = (
            select(func.sum(LiabilityPayment.amount))
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(Liability.user_id == self.user_id)
        )

        if start_date and end_date:
            income_query = income_query.where(Income.date.between(start_date, end_date))
            expense_query = expense_query.where(
                Expense.purchase_date.between(start_date, end_date)
            )
            investment_query = investment_query.where(
                Investment.date.between(start_date, end_date)
            )
            liability_query = liability_query.where(
                LiabilityPayment.payment_date.between(start_date, end_date)
            )

        total_income = (await self.db.execute(income_query)).scalar() or 0
        total_expense = (await self.db.execute(expense_query)).scalar() or 0
        total_investment = (await self.db.execute(investment_query)).scalar() or 0
        total_liability_paid = (await self.db.execute(liability_query)).scalar() or 0

        net_savings = (
            total_income - total_expense - total_investment - total_liability_paid
        )

        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_income": total_income,
            "total_expense": total_expense,
            "total_investment": total_investment,
            "total_liability_paid": total_liability_paid,
            "net_savings": net_savings,
        }

    async def get_net_worth(self) -> Dict[str, Any]:
        """Calculate net worth: Cash Balance + Investments - Outstanding Liability"""
        total_income = (
            await self.db.execute(
                select(func.sum(Income.amount)).where(Income.user_id == self.user_id)
            )
        ).scalar() or 0
        total_expense = (
            await self.db.execute(
                select(func.sum(Expense.amount)).where(Expense.user_id == self.user_id)
            )
        ).scalar() or 0
        total_investments = (
            await self.db.execute(
                select(func.sum(Investment.amount)).where(
                    Investment.user_id == self.user_id
                )
            )
        ).scalar() or 0
        total_liability_paid = (
            await self.db.execute(
                select(func.sum(LiabilityPayment.amount))
                .join(Liability, LiabilityPayment.liability_id == Liability.id)
                .where(Liability.user_id == self.user_id)
            )
        ).scalar() or 0
        # Use total_payable_amount (principal + interest) if set, else fall back to original_amount
        total_liability_principal = (
            await self.db.execute(
                select(
                    func.sum(
                        func.coalesce(
                            Liability.total_payable_amount, Liability.original_amount
                        )
                    )
                ).where(Liability.user_id == self.user_id)
            )
        ).scalar() or 0

        # Cash balance = Income - Expense - Liability Paid - Investment
        cash_balance = (
            total_income - total_expense - total_liability_paid - total_investments
        )

        # Outstanding liability (based on total repayable amount, not just principal)
        outstanding_liability = total_liability_principal - total_liability_paid

        # Net worth = Cash + Investments - Outstanding Liability
        net_worth = cash_balance + total_investments - outstanding_liability

        return {
            "cash_balance": cash_balance,
            "total_investments": total_investments,
            "outstanding_liability": outstanding_liability,
            "net_worth": net_worth,
        }

    # ===== Phase 3: Category & Account Breakdowns =====

    async def get_category_breakdown(self, year: int, month: int) -> Dict[str, float]:
        """Get category-wise expense breakdown for a specific month"""

        def filter_month(column):
            return (extract("year", column) == year) & (
                extract("month", column) == month
            )

        cat_result = await self.db.execute(
            select(LookupValue.value, func.sum(Expense.amount))
            .join(LookupValue, Expense.category_id == LookupValue.id)
            .where(Expense.user_id == self.user_id)
            .where(filter_month(Expense.purchase_date))
            .group_by(LookupValue.value)
        )
        return {row[0]: float(row[1]) for row in cat_result.all()}

    async def _get_trend(
        self,
        model: Any,
        date_column: Any,
        group_by: str = "month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Generic trend calculation method"""

        if group_by == "day":
            date_label = "date"
            group_func = date_column
        elif group_by == "week":
            date_label = "week"
            group_func = func.date_trunc("week", date_column)
        else:  # month
            date_label = "month"
            group_func = func.date_trunc("month", date_column)

        query = select(group_func.label(date_label), func.sum(model.amount))

        if start_date and end_date:
            query = query.where(
                model.user_id == self.user_id, date_column.between(start_date, end_date)
            )
        else:
            if model == LiabilityPayment:
                query = query.join(
                    Liability, LiabilityPayment.liability_id == Liability.id
                )
                query = query.where(Liability.user_id == self.user_id)
            else:
                query = query.where(model.user_id == self.user_id)

        query = query.group_by(date_label).order_by(date_label)

        result = await self.db.execute(query)

        trend_data = []
        for row in result.all():
            d = row[0]
            if group_by == "day":
                formatted_date = d.isoformat()
            elif group_by == "week":
                formatted_date = d.strftime("%Y-%m-%d")
            else:
                formatted_date = d.strftime("%Y-%m")

            trend_data.append({date_label: formatted_date, "amount": float(row[1])})

        return trend_data

    async def get_expense_trend(
        self,
        group_by: str = "month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get expense trend"""
        return await self._get_trend(
            Expense, Expense.purchase_date, group_by, start_date, end_date
        )

    async def get_income_trend(
        self,
        group_by: str = "month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get income trend"""
        return await self._get_trend(
            Income, Income.date, group_by, start_date, end_date
        )

    async def get_investment_trend(
        self,
        group_by: str = "month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get investment trend"""
        return await self._get_trend(
            Investment, Investment.date, group_by, start_date, end_date
        )

    async def get_liability_payment_trend(
        self,
        group_by: str = "month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get liability payment trend"""
        return await self._get_trend(
            LiabilityPayment,
            LiabilityPayment.payment_date,
            group_by,
            start_date,
            end_date,
        )

    async def get_account_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get summary of expenses and income by account (lifetime or range)"""
        # Expenses by account
        exp_q = (
            select(LookupValue.value, func.sum(Expense.amount))
            .join(LookupValue, Expense.account_id == LookupValue.id)
            .where(Expense.user_id == self.user_id)
            .group_by(LookupValue.value)
        )
        inc_q = (
            select(LookupValue.value, func.sum(Income.amount))
            .join(LookupValue, Income.account_id == LookupValue.id)
            .where(Income.user_id == self.user_id)
            .group_by(LookupValue.value)
        )

        if start_date and end_date:
            exp_q = exp_q.where(Expense.purchase_date.between(start_date, end_date))
            inc_q = inc_q.where(Income.date.between(start_date, end_date))

        expense_result = await self.db.execute(exp_q)
        expense_by_account = {row[0]: float(row[1]) for row in expense_result.all()}

        income_result = await self.db.execute(inc_q)
        income_by_account = {row[0]: float(row[1]) for row in income_result.all()}

        # Combine all accounts
        all_accounts = set(expense_by_account.keys()) | set(income_by_account.keys())
        account_summary = {}
        for account in all_accounts:
            income = income_by_account.get(account, 0)
            expense = expense_by_account.get(account, 0)
            account_summary[account] = {
                "income": income,
                "expense": expense,
                "net": income - expense,
            }

        return account_summary

    async def get_investment_breakdown(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, float]:
        """Get investment breakdown by type (lifetime or range)"""
        query = (
            select(LookupValue.value, func.sum(Investment.amount))
            .join(LookupValue, Investment.investment_type_id == LookupValue.id)
            .where(Investment.user_id == self.user_id)
            .group_by(LookupValue.value)
        )
        if start_date and end_date:
            query = query.where(Investment.date.between(start_date, end_date))

        result = await self.db.execute(query)
        return {row[0]: float(row[1]) for row in result.all()}

    async def get_liability_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get comprehensive liability summary (lifetime or range)"""
        # Build queries
        liability_q = select(func.sum(Liability.original_amount)).where(
            Liability.user_id == self.user_id
        )
        payment_q = (
            select(func.sum(LiabilityPayment.amount))
            .join(Liability, LiabilityPayment.liability_id == Liability.id)
            .where(Liability.user_id == self.user_id)
        )

        if start_date and end_date:
            # For liability summary, date filtering is tricky because loans exist over time.
            # Usually, people want to see payments made in a range.
            # We'll treat start/end primarily for payments, but original_amount is usually total.
            # However, matching Excel logic, we'll keep principal as total and filter payments.
            payment_q = payment_q.where(
                LiabilityPayment.payment_date.between(start_date, end_date)
            )

        total_liability = (await self.db.execute(liability_q)).scalar() or 0
        total_paid = (await self.db.execute(payment_q)).scalar() or 0
        outstanding = total_liability - total_paid
        progress_percent = (
            (total_paid / total_liability * 100) if total_liability > 0 else 0
        )
        progress_percent = float(progress_percent)

        liabilities_result = await self.db.execute(
            select(
                Liability.id, Liability.liability_name, Liability.original_amount
            ).where(Liability.user_id == self.user_id)
        )
        liabilities = liabilities_result.all()

        liability_details = []
        for liability_id, loan_name, original_amount in liabilities:
            paid_q = (
                select(func.sum(LiabilityPayment.amount))
                .join(Liability, LiabilityPayment.liability_id == Liability.id)
                .where(Liability.user_id == self.user_id)
                .where(LiabilityPayment.liability_id == liability_id)
            )
            if start_date and end_date:
                paid_q = paid_q.where(
                    LiabilityPayment.payment_date.between(start_date, end_date)
                )

            paid_result = await self.db.execute(paid_q)
            paid_amount = paid_result.scalar() or 0
            remaining = original_amount - paid_amount
            liability_progress = (
                (paid_amount / original_amount * 100) if original_amount > 0 else 0
            )

            liability_details.append(
                {
                    "liability_name": liability_name,
                    "original_amount": float(original_amount),
                    "paid_amount": float(paid_amount),
                    "remaining": float(remaining),
                    "progress_percent": float(round(liability_progress, 2)),
                }
            )

        return {
            "total_liability": float(total_liability),
            "total_paid": float(total_paid),
            "outstanding": float(outstanding),
            "progress_percent": float(round(progress_percent, 2)),
            "liabilities": liability_details,
        }
