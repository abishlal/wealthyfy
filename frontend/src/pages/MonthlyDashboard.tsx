import React, { useState, useEffect } from 'react';
import dashboardApi from '../api/dashboardApi';
import type { MonthlySummaryItem, CategoryBreakdownItem } from '../api/dashboardApi';
import { Calendar, TrendingUp, TrendingDown, Wallet, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const MonthlyDashboard: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [summary, setSummary] = useState<MonthlySummaryItem | null>(null);
    const [categories, setCategories] = useState<CategoryBreakdownItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMonthlyData = async (date: Date) => {
        setLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
        // Last day of month
        const lastDay = new Date(year, month, 0).getDate();
        const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        try {
            const [summaryRes, categoryRes] = await Promise.all([
                dashboardApi.getMonthlySummary(startOfMonth, endOfMonth),
                dashboardApi.getCategoryBreakdown(startOfMonth, endOfMonth)
            ]);

            // Find the specific month in the summary array
            const currentMonthStr = `${year}-${month.toString().padStart(2, '0')}`;
            const monthData = summaryRes.data.find(item => item.month === currentMonthStr) || {
                month: currentMonthStr,
                income: 0,
                expense: 0,
                investment: 0,
                debt_paid: 0,
                net_savings: 0,
                cash_flow: 0
            };

            setSummary(monthData);
            setCategories(categoryRes.data);
        } catch (error) {
            console.error("Error fetching monthly data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyData(selectedDate);
    }, [selectedDate]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    const monthName = selectedDate.toLocaleString('default', { month: 'long' });
    const year = selectedDate.getFullYear();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Monthly Dashboard: {monthName} {year}
                </h2>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm border">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 font-semibold text-gray-700 min-w-[120px] text-center">
                        {monthName} {year}
                    </span>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Monthly Income</p>
                                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                        ₹{(summary?.income || 0).toLocaleString()}
                                    </h3>
                                </div>
                                <TrendingUp className="text-green-500 w-8 h-8 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-red-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Monthly Expenses</p>
                                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                        ₹{(summary?.expense || 0).toLocaleString()}
                                    </h3>
                                </div>
                                <TrendingDown className="text-red-500 w-8 h-8 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Investments</p>
                                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                        ₹{(summary?.investment || 0).toLocaleString()}
                                    </h3>
                                </div>
                                <Wallet className="text-blue-500 w-8 h-8 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Debt Payments</p>
                                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                        ₹{(summary?.debt_paid || 0).toLocaleString()}
                                    </h3>
                                </div>
                                <CreditCard className="text-purple-500 w-8 h-8 opacity-20" />
                            </div>
                        </div>

                        <div className={`bg-white p-6 rounded-xl shadow-md border-t-4 ${(summary?.net_savings || 0) >= 0 ? 'border-teal-500' : 'border-orange-500'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Net Savings</p>
                                    <h3 className={`text-2xl font-bold mt-1 ${(summary?.net_savings || 0) >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>
                                        ₹{(summary?.net_savings || 0).toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Category Breakdown Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                Expense Breakdown
                            </h3>
                            <div style={{ width: '100%', height: 350 }}>
                                {categories.length > 0 ? (
                                    <ResponsiveContainer>
                                        <BarChart data={categories} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="category" type="category" width={100} />
                                            <Tooltip formatter={(value: any) => `₹${(value || 0).toLocaleString()}`} />
                                            <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 italic">
                                        No expenses recorded for this month.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
                            <h3 className="text-lg font-semibold mb-6">Top Categories</h3>
                            <div className="space-y-4">
                                {categories.map((cat, idx) => (
                                    <div key={cat.category} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                            <span className="text-sm font-bold text-gray-900">₹{cat.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${cat.percentage}%`,
                                                    backgroundColor: COLORS[idx % COLORS.length]
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-right text-[10px] text-gray-400 mt-0.5">{cat.percentage.toFixed(1)}%</p>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-gray-400 text-center py-10">Nothing to show</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MonthlyDashboard;
