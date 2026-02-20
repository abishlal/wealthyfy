import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Wallet, TrendingUp, IndianRupee, CreditCard, Activity, Heart, Target, HandCoins } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardSummary {
    total_income: number;
    total_expense: number;
    total_investments: number;
    total_liability_paid: number;
    total_outstanding_liability: number;
    total_outstanding_receivable: number;
    net_worth: number;
    expense_trend: { month: string; amount: number }[];
}

interface CashFlow {
    cash_in: number;
    cash_out: number;
    total_income: number;
    receivables_received: number;
    total_expense: number;
    total_investment: number;
    total_liability_paid: number;
    receivables_created: number;
    net_cash_flow: number;
}

interface InvestmentBreakdown {
    [type: string]: number;
}

interface BudgetStatus {
    category: string;
    budgeted: number;
    actual: number;
    percent_used: number;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const Dashboard: React.FC = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
    const [investmentBreakdown, setInvestmentBreakdown] = useState<InvestmentBreakdown | null>(null);
    const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
    const [savingsRate, setSavingsRate] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [summaryRes, cashFlowRes, , investmentRes, budgetRes, savingsRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/cashflow'),
                    api.get(`/dashboard/monthly/category-breakdown?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`),
                    api.get('/dashboard/investment-breakdown'),
                    api.get(`/dashboard/v2/budget-vs-actual?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
                    api.get('/dashboard/v2/savings-rate')
                ]);

                setSummary(summaryRes.data);
                setCashFlow(cashFlowRes.data);
                setInvestmentBreakdown(investmentRes.data);
                setBudgets(budgetRes.data);
                setSavingsRate(savingsRes.data.savings_rate * 100);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return <div className="text-center py-10">Syncing Financial Data...</div>;
    if (!summary) return <div className="text-center py-10">Error loading dashboard data.</div>;

    const investmentData = investmentBreakdown ? Object.entries(investmentBreakdown).map(([name, value]) => ({ name, value })) : [];

    // Preparation for Cash Flow Chart
    const cashFlowData = cashFlow ? [
        {
            name: 'Cash In',
            'Income': cashFlow.total_income,
            'Settlements': cashFlow.receivables_received,
        },
        {
            name: 'Cash Out',
            'Personal': cashFlow.total_expense,
            'Investments': cashFlow.total_investment,
            'Debt': cashFlow.total_liability_paid,
            'Owed by Others': cashFlow.receivables_created,
        }
    ] : [];

    return (
        <div className="space-y-8 pb-10">
            {/* Header with Quick Insights */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Pulse</h2>
                    <p className="text-gray-500 font-medium">Real-time status of your financial ecosystem.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        <div>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase block">Savings Rate</span>
                            <span className="text-lg font-black text-indigo-900">{savingsRate.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <Heart className="w-5 h-5 text-emerald-600" />
                        <div>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Financial Health</span>
                            <span className="text-lg font-black text-emerald-900">Stable</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
                <MetricCard
                    title="Liquid Cash"
                    amount={(cashFlow?.net_cash_flow || 0)}
                    icon={<Wallet className="text-indigo-600 w-4 h-4 md:w-5 md:h-5" />}
                    color="indigo"
                    trend="Actual"
                />
                <MetricCard
                    title="Investments"
                    amount={summary.total_investments}
                    icon={<TrendingUp className="text-emerald-600 w-4 h-4 md:w-5 md:h-5" />}
                    color="emerald"
                    trend="Growth"
                />
                <MetricCard
                    title="Liabilities"
                    amount={summary.total_outstanding_liability}
                    icon={<CreditCard className="text-rose-600 w-4 h-4 md:w-5 md:h-5" />}
                    color="rose"
                    trend="Debt"
                />
                <MetricCard
                    title="Receivables"
                    amount={summary.total_outstanding_receivable}
                    icon={<HandCoins className="text-amber-600 w-4 h-4 md:w-5 md:h-5" />}
                    color="amber"
                    trend="Recov."
                />
                <MetricCard
                    title="Net Worth"
                    amount={summary.net_worth}
                    icon={<IndianRupee className="text-blue-600 w-4 h-4 md:w-5 md:h-5" />}
                    color="blue"
                    trend="Wealth"
                />
            </div>

            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Cash Flow vs Expense Trend */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Income vs. Spend Distribution</h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lifetime Analysis</span>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer>
                                <BarChart data={cashFlowData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(val: any) => `₹${val.toLocaleString()}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar dataKey="Income" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Settlements" stackId="a" fill="#34d399" radius={[8, 8, 0, 0]} />

                                    <Bar dataKey="Personal" stackId="b" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Investments" stackId="b" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Debt" stackId="b" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Owed by Others" stackId="b" fill="#ec4899" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Monthly Expense Trajectory</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer>
                                <LineChart data={summary.expense_trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                                    <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. Side Panel Insights */}
                <div className="space-y-8">
                    {/* Budget Adherence */}
                    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-400" />
                                Budget Pulse
                            </h3>
                            <Link to="/budgets" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest">Manage</Link>
                        </div>
                        <div className="space-y-6">
                            {budgets.length > 0 ? budgets.slice(0, 3).map((b, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-gray-400 font-bold truncate w-24">{b.category}</span>
                                        <span className={b.percent_used > 100 ? 'text-rose-400 font-black' : 'text-indigo-300'}>{b.percent_used.toFixed(0)}% Used</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${b.percent_used > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min(100, b.percent_used)}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No budgets active for this month.</p>
                            )}
                        </div>
                    </div>

                    {/* Investment Breakdown */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Investment Mix</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={investmentData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {investmentData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Action / Planning Insight */}
                    <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="font-bold mb-2">Ready for the Future?</h4>
                            <p className="text-sm text-indigo-100 mb-4 leading-relaxed">Based on your recent savings, you can reach your retirement goal 2 years earlier. Check the new advisor module.</p>
                            <Link to="/planning" className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-black hover:bg-indigo-50 transition shadow-lg">Try Planning Tool</Link>
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-10">
                            <Activity className="w-24 h-24" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, amount, icon, color, trend }: { title: string, amount: number, icon: any, color: string, trend: string }) => {
    const colorClasses: { [key: string]: string } = {
        indigo: 'border-indigo-500 bg-indigo-50 text-indigo-600 font-bold',
        emerald: 'border-emerald-500 bg-emerald-50 text-emerald-600 font-bold',
        rose: 'border-rose-500 bg-rose-50 text-rose-600 font-bold',
        amber: 'border-amber-500 bg-amber-50 text-amber-600 font-bold',
        blue: 'border-blue-500 bg-blue-50 text-blue-600 font-bold',
    };

    const classes = colorClasses[color] || colorClasses.indigo;
    const [border, bgContent, text] = classes.split(' ');

    return (
        <div className={`bg-white p-3 md:p-6 rounded-2xl shadow-xl border-b-4 ${border} group hover:-translate-y-1 transition-transform duration-300`}>
            <div className="flex justify-between items-start mb-2 md:mb-4">
                <div className={`p-2 md:p-3 rounded-xl ${bgContent} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${text} ${bgContent} px-2 py-0.5 rounded-full whitespace-nowrap`}>{trend}</span>
            </div>
            <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{title}</p>
            <p className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">₹{Math.abs(amount).toLocaleString()}</p>
        </div>
    );
};

export default Dashboard;
