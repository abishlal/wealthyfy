import os
import gspread
from google.oauth2.service_account import Credentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models.models import Expense, Income, Liability, LiabilityPayment, Investment

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

class GoogleSheetsService:
    @staticmethod
    def get_client() -> gspread.client.Client:
        creds_path = os.path.join(os.path.dirname(__file__), "..", "credentials.json")
        if not os.path.exists(creds_path):
            raise FileNotFoundError("credentials.json not found in the backend directory. Please refer to the implementation plan for setup instructions.")
        
        creds = Credentials.from_service_account_file(creds_path, scopes=SCOPES)
        return gspread.authorize(creds)

    @classmethod
    async def export_to_sheet(cls, db: AsyncSession, user_id: str):
        sheet_id = os.environ.get("GOOGLE_SHEET_ID_BACKUP")
        if not sheet_id:
            raise ValueError("GOOGLE_SHEET_ID_BACKUP environment variable is not set. Please add it to your .env file.")

        client = cls.get_client()
        spreadsheet = client.open_by_key(sheet_id)

        def get_or_create_worksheet(title):
            try:
                return spreadsheet.worksheet(title)
            except gspread.exceptions.WorksheetNotFound:
                return spreadsheet.add_worksheet(title=title, rows=1000, cols=20)

        # 1. Export Liabilities (Debts List)
        res = await db.execute(
            select(Liability)
            .where(Liability.user_id == user_id)
            .options(selectinload(Liability.liabilities_type), selectinload(Liability.lender))
        )
        liabilities = res.scalars().all()
        ws_liabilities = get_or_create_worksheet("Debts List")
        ws_liabilities.clear()
        data_liab = [["Start Date", "Loan Type", "Lender", "Original Amount", "Interest Rate", "Tenure (Months)", "EMI", "", "", "", "", "Due Day"]]
        for lib in liabilities:
            data_liab.append([
                str(lib.start_date) if lib.start_date else "",
                lib.liabilities_type.value if lib.liabilities_type else "",
                lib.lender.value if lib.lender else "",
                float(lib.original_amount),
                lib.interest_rate,
                lib.term_months,
                float(lib.emi_amount),
                "", "", "", "",
                lib.due_day or ""
            ])
        if len(data_liab) > 1:
            ws_liabilities.update(values=data_liab, range_name="A1")

        # 2. Export Liability Payments (Debt)
        res = await db.execute(
            select(LiabilityPayment)
            .join(Liability)
            .where(Liability.user_id == user_id)
            .options(
                selectinload(LiabilityPayment.liability).selectinload(Liability.liabilities_type),
                selectinload(LiabilityPayment.liability).selectinload(Liability.lender)
            )
        )
        payments = res.scalars().all()
        ws_payments = get_or_create_worksheet("Debt")
        ws_payments.clear()
        data_pmt = [["", "Date", "", "Loan Type", "Lender", "Amount"]]
        for pmt in payments:
            data_pmt.append([
                "",
                str(pmt.payment_date) if pmt.payment_date else "",
                "",
                pmt.liability.liabilities_type.value if pmt.liability and pmt.liability.liabilities_type else "",
                pmt.liability.lender.value if pmt.liability and pmt.liability.lender else "",
                float(pmt.amount)
            ])
        if len(data_pmt) > 1:
            ws_payments.update(values=data_pmt, range_name="A1")

        # 3. Export Income
        res = await db.execute(
            select(Income)
            .where(Income.user_id == user_id)
            .options(selectinload(Income.income_source))
        )
        incomes = res.scalars().all()
        ws_income = get_or_create_worksheet("Income")
        ws_income.clear()
        data_inc = [["", "Date", "Source", "Description", "Amount"]]
        for inc in incomes:
            data_inc.append([
                "",
                str(inc.date) if inc.date else "",
                inc.income_source.value if inc.income_source else "",
                inc.description or "",
                float(inc.amount)
            ])
        if len(data_inc) > 1:
            ws_income.update(values=data_inc, range_name="A1")
            
        # 4. Export Expenses
        res = await db.execute(
            select(Expense)
            .where(Expense.user_id == user_id)
            .options(selectinload(Expense.category))
        )
        expenses = res.scalars().all()
        ws_expenses = get_or_create_worksheet("Expenses")
        ws_expenses.clear()
        data_exp = [["", "Date", "Item", "Amount", "Category"]]
        for exp in expenses:
            data_exp.append([
                "",
                str(exp.purchase_date) if exp.purchase_date else "",
                exp.item or "",
                float(exp.amount),
                exp.category.value if exp.category else ""
            ])
        if len(data_exp) > 1:
            ws_expenses.update(values=data_exp, range_name="A1")

        # 5. Export Investments
        res = await db.execute(
            select(Investment)
            .where(Investment.user_id == user_id)
            .options(selectinload(Investment.investment_type))
        )
        investments = res.scalars().all()
        ws_investments = get_or_create_worksheet("Investment")
        ws_investments.clear()
        data_inv = [["", "Date", "Type", "Amount"]]
        for inv in investments:
            data_inv.append([
                "",
                str(inv.date) if inv.date else "",
                inv.investment_type.value if inv.investment_type else "",
                float(inv.amount)
            ])
        if len(data_inv) > 1:
            ws_investments.update(values=data_inv, range_name="A1")

        return True
