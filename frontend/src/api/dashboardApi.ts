import api from './axios';

export interface CashBalanceResponse {
    cash_balance: number;
}

export interface NetSavingsResponse {
    net_savings: number;
}

export interface SavingsRateResponse {
    savings_rate: number;
}

export interface NetWorthResponse {
    net_worth: number;
}

export interface DailySummaryItem {
    date: string;
    income: number;
    expense: number;
    investment: number;
    debt_paid: number;
    net: number;
}

export interface WeeklySummaryItem {
    week_start: string;
    week_end: string;
    income: number;
    expense: number;
    investment: number;
    debt_paid: number;
    net: number;
}

export interface MonthlySummaryItem {
    month: string;
    income: number;
    expense: number;
    investment: number;
    debt_paid: number;
    net_savings: number;
    cash_flow: number;
}

export interface YearlySummaryItem {
    year: number;
    income: number;
    expense: number;
    investment: number;
    debt_paid: number;
    net_savings: number;
}

export interface CategoryBreakdownItem {
    category: string;
    amount: number;
    percentage: number;
}

export interface CategoryTrendItem {
    month: string;
    amount: number;
}

export interface InvestmentTrendItem {
    month: string;
    amount: number;
    cumulative_amount: number;
}

export interface LiabilityTrendItem {
    month: string;
    outstanding_liability: number;
}

export interface LiabilitySummaryResponse {
    total_liability: number;
    total_paid: number;
    outstanding_liability: number;
    progress_percentage: number;
}

const dashboardApi = {
    getCashBalance: (startDate?: string, endDate?: string) =>
        api.get<CashBalanceResponse>('/dashboard/v2/cash-balance', { params: { start_date: startDate, end_date: endDate } }),

    getNetWorth: () =>
        api.get<NetWorthResponse>('/dashboard/v2/net-worth'),

    getNetSavings: (startDate?: string, endDate?: string) =>
        api.get<NetSavingsResponse>('/dashboard/v2/net-savings', { params: { start_date: startDate, end_date: endDate } }),

    getSavingsRate: (startDate?: string, endDate?: string) =>
        api.get<SavingsRateResponse>('/dashboard/v2/savings-rate', { params: { start_date: startDate, end_date: endDate } }),

    getDailySummary: (startDate?: string, endDate?: string) =>
        api.get<DailySummaryItem[]>('/dashboard/v2/daily', { params: { start_date: startDate, end_date: endDate } }),

    getWeeklySummary: (startDate?: string, endDate?: string) =>
        api.get<WeeklySummaryItem[]>('/dashboard/v2/weekly', { params: { start_date: startDate, end_date: endDate } }),

    getMonthlySummary: (startDate?: string, endDate?: string) =>
        api.get<MonthlySummaryItem[]>('/dashboard/v2/monthly', { params: { start_date: startDate, end_date: endDate } }),

    getYearlySummary: () =>
        api.get<YearlySummaryItem[]>('/dashboard/v2/yearly'),

    getCategoryBreakdown: (startDate?: string, endDate?: string) =>
        api.get<CategoryBreakdownItem[]>('/dashboard/v2/category-breakdown', { params: { start_date: startDate, end_date: endDate } }),

    getCategoryTrend: (category: string) =>
        api.get<CategoryTrendItem[]>('/dashboard/v2/category-trend', { params: { category } }),

    getInvestmentTrend: () =>
        api.get<InvestmentTrendItem[]>('/dashboard/v2/investment-trend'),

    getLiabilityTrend: () =>
        api.get<LiabilityTrendItem[]>('/dashboard/v2/liability-trend'),

    getLiabilitySummary: () =>
        api.get<LiabilitySummaryResponse>('/dashboard/v2/liability-summary'),
};

export default dashboardApi;
