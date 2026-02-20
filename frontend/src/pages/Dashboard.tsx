import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, IndianRupee, PiggyBank, CreditCard } from 'lucide-react';

interface DashboardSummary {
    total_income: number;
    total_expense: number;
    total_investments: number;
    total_liability_paid: number;
    total_outstanding_liability: number;
    net_worth: number;
    expense_trend: { month: string; amount: number }[];
}

interface CashFlow {
    cash_in: number;
    cash_out: number;
    net_cash_flow: number;
}

interface CategoryBreakdown {
    [category: string]: number;
}

interface InvestmentBreakdown {
    [type: string]: number;
}

interface LiabilityDetail {
    loan_name: string;
    original_amount: number;
    paid_amount: number;
    remaining: number;
    progress_percent: number;
}

interface LiabilitySummary {
    total_liability: number;
    total_paid: number;
    outstanding_liability: number;
    progress_percent: number;
    liabilities: LiabilityDetail[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const Dashboard: React.FC = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
    const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown | null>(null);
    const [investmentBreakdown, setInvestmentBreakdown] = useState<InvestmentBreakdown | null>(null);
    const [liabilitySummary, setLiabilitySummary] = useState<LiabilitySummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Fetch all dashboard data in parallel
                const [summaryRes, cashFlowRes, categoryRes, investmentRes, liabilityRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/cashflow'),
                    api.get(`/dashboard/monthly/category-breakdown?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`),
                    api.get('/dashboard/investment-breakdown'),
                    api.get('/dashboard/v2/liability-summary')
                ]);

                setSummary(summaryRes.data);
                setCashFlow(cashFlowRes.data);
                setCategoryBreakdown(categoryRes.data);
                setInvestmentBreakdown(investmentRes.data);
                setLiabilitySummary(liabilityRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return <div className="text-center py-10">Loading Dashboard...</div>;
    if (!summary) return <div className="text-center py-10">Error loading dashboard data.</div>;

    // Prepare data for pie charts
    const categoryData = categoryBreakdown ? Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })) : [];
    const investmentData = investmentBreakdown ? Object.entries(investmentBreakdown).map(([name, value]) => ({ name, value })) : [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800"> Overview</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Income</p>
                            <p className="text-2xl font-bold text-gray-800">₹{(summary.total_income || 0).toLocaleString()}</p>
                        </div>
                        <TrendingUp className="text-green-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-800">₹{(summary.total_expense || 0).toLocaleString()}</p>
                        </div>
                        <TrendingDown className="text-red-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Investments</p>
                            <p className="text-2xl font-bold text-gray-800">₹{(summary.total_investments || 0).toLocaleString()}</p>
                        </div>
                        <Wallet className="text-blue-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Net Worth</p>
                            <p className="text-2xl font-bold text-gray-800">₹{(summary.net_worth || 0).toLocaleString()}</p>
                        </div>
                        <IndianRupee className="text-purple-500 w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Trend */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Monthly Expense Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={summary.expense_trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Expense" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                {categoryData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Expense by Category (This Month)</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Investment Breakdown & Liability Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Investment Breakdown */}
                {investmentData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Investment Breakdown</h3>
                        <div className="space-y-3">
                            {investmentData.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b pb-2">
                                    <span className="text-gray-700 font-medium">{item.name}</span>
                                    <span className="text-lg font-bold text-blue-600">₹{(item.value || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Liability Summary */}
                {liabilitySummary && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Liability Summary
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Total Liability</span>
                                <span className="font-semibold">₹{(liabilitySummary.total_liability || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Total Paid</span>
                                <span className="font-semibold text-green-600">₹{(liabilitySummary.total_paid || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Outstanding</span>
                                <span className="font-semibold text-red-500">₹{(liabilitySummary.outstanding_liability || 0).toLocaleString()}</span>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                    <span className="text-sm font-medium text-gray-700">{Number(liabilitySummary.progress_percent || 0).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${liabilitySummary.progress_percent || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
