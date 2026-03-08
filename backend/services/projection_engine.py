from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from services.financial_engine import FinancialEngine


class ProjectionEngine:
    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.engine = FinancialEngine(db, user_id)

    async def get_net_worth_projection(
        self, years: int, annual_growth_rate: float = 7.0
    ) -> List[Dict[str, Any]]:
        """
        Projects net worth over X years assuming:
        1. Current assets grow at annual_growth_rate
        2. Current liabilities are paid down via EMI
        3. Monthly savings (current avg) are invested
        """
        # Get current state
        net_worth_data = await self.engine.calculate_net_worth()
        current_net_worth = net_worth_data["net_worth"]

        # Get current savings (avg of last 3 months)
        monthly_summary = await self.engine.calculate_monthly_summary()
        recent_savings = (
            [m["net_savings"] for m in monthly_summary[-3:]] if monthly_summary else [0]
        )
        avg_monthly_savings = (
            sum(recent_savings) / len(recent_savings) if recent_savings else 0
        )

        # Get liability details to simulate payoff
        liability_summary = await self.engine.calculate_liability_summary()
        total_outstanding = liability_summary["outstanding_liability"]

        projections = []
        monthly_growth = (1 + (annual_growth_rate / 100)) ** (1 / 12)

        # Simple projection (Yearly steps for simplicity)
        for year in range(0, years + 1):
            if year == 0:
                assets = (
                    current_net_worth + total_outstanding
                )  # Separate assets from liabilities
                liabilities = total_outstanding
            else:
                # Add monthly savings and compound
                # Year end assets = current_assets * (1+r) + savings * ((1+r)-1)/r
                # (Formula for future value of ordinary annuity)
                prev_assets = projections[-1]["assets"]
                assets = prev_assets * (1 + (annual_growth_rate / 100)) + (
                    avg_monthly_savings * 12
                )

                # Simplified liability reduction
                # In reality, this depends on EMI, but we'll assume linear reduction for now
                # or until we implement individual loan payoff simulation
                prev_liabs = projections[-1]["liabilities"]
                # Assuming avg EMI paydown
                liabilities = max(
                    0, prev_liabs - (avg_monthly_savings * 0.2 * 12)
                )  # arbitrary 20% of savings to debt

            projections.append(
                {
                    "year": date.today().year + year,
                    "assets": round(assets, 2),
                    "liabilities": round(liabilities, 2),
                    "net_worth": round(assets - liabilities, 2),
                }
            )

        return projections

    async def calculate_goal_feasibility(
        self, target_amount: float, target_date: date
    ) -> Dict[str, Any]:
        """Calculates if a goal is reachable and how much more effort is needed."""
        months_to_goal = (target_date.year - date.today().year) * 12 + (
            target_date.month - date.today().month
        )
        if months_to_goal <= 0:
            return {"status": "date_passed", "message": "Goal date has already passed."}

        net_worth_data = await self.engine.calculate_net_worth()
        current_liquid_assets = net_worth_data["net_worth"]  # Simplified

        needed = target_amount - current_liquid_assets
        if needed <= 0:
            return {
                "status": "reached",
                "message": "You already have enough for this goal!",
            }

        monthly_required = needed / months_to_goal

        # Compare with avg savings
        monthly_summary = await self.engine.calculate_monthly_summary()
        recent_savings = (
            [m["net_savings"] for m in monthly_summary[-3:]] if monthly_summary else [0]
        )
        avg_monthly_savings = (
            sum(recent_savings) / len(recent_savings) if recent_savings else 0
        )

        on_track = avg_monthly_savings >= monthly_required

        return {
            "status": "on_track" if on_track else "behind",
            "needed_amount": round(needed, 2),
            "monthly_required": round(monthly_required, 2),
            "current_avg_savings": round(avg_monthly_savings, 2),
            "shortfall": round(max(0, monthly_required - avg_monthly_savings), 2),
            "months_to_goal": months_to_goal,
        }

    async def estimate_retirement(
        self,
        current_age: int,
        retirement_age: int,
        expected_return: float = 8.0,
        inflation: float = 6.0,
    ) -> Dict[str, Any]:
        """Estimates if user can retire by given age."""
        # Get current annual expenses
        monthly_summary = await self.engine.calculate_monthly_summary()
        avg_monthly_expense = (
            sum([m["expense"] for m in monthly_summary[-6:]])
            / min(6, len(monthly_summary))
            if monthly_summary
            else 0
        )
        annual_expense = avg_monthly_expense * 12

        # Rule of 25: Retirement Corpus = 25 * Annual Expense (adjusted for inflation)
        years_to_retirement = retirement_age - current_age
        future_annual_expense = annual_expense * (
            (1 + (inflation / 100)) ** years_to_retirement
        )
        target_corpus = future_annual_expense * 25

        # Current corpus
        net_worth_data = await self.engine.calculate_net_worth()
        current_corpus = net_worth_data["net_worth"]

        # Future value of current corpus
        real_return = expected_return - inflation
        future_corpus = current_corpus * (
            (1 + (real_return / 100)) ** years_to_retirement
        )

        # Future benefit of monthly savings
        avg_monthly_savings = (
            sum([m["net_savings"] for m in monthly_summary[-6:]])
            / min(6, len(monthly_summary))
            if monthly_summary
            else 0
        )
        future_savings_value = (
            (avg_monthly_savings * 12)
            * (((1 + (real_return / 100)) ** years_to_retirement) - 1)
            / (real_return / 100)
            if real_return != 0
            else (avg_monthly_savings * 12 * years_to_retirement)
        )

        total_future_corpus = future_corpus + future_savings_value

        return {
            "target_corpus": round(target_corpus, 2),
            "estimated_corpus": round(total_future_corpus, 2),
            "on_track": total_future_corpus >= target_corpus,
            "shortfall": round(max(0, target_corpus - total_future_corpus), 2),
            "years_left": years_to_retirement,
        }

    async def simulate_scenario(self, event_type: str, amount: float) -> Dict[str, Any]:
        """Simulates impact of emergency withdrawal or loan prepayment."""
        if event_type == "emergency_withdrawal":
            # Impact on 10-year net worth
            impact_10y = amount * ((1 + 0.07) ** 10)  # assuming a missed 7% growth
            return {
                "immediate_impact": -amount,
                "impact_at_10y": -round(impact_10y, 2),
                "description": f"Taking out ₹{amount:,} now will reduce your 10-year net worth by approx ₹{round(impact_10y, 2):,} (assuming 7% return).",
            }
        elif event_type == "loan_prepayment":
            # Find a loan with high interest? For now just generic
            interest_saved = amount * 0.12 * 5  # assume 12% interest saved over 5 years
            return {
                "immediate_impact": -amount,
                "interest_saved_approx": round(interest_saved, 2),
                "description": f"Paying extra ₹{amount:,} towards your loan could save you approximately ₹{round(interest_saved, 2):,} in interest over the next 5 years.",
            }
        return {"error": "Unknown event type"}
