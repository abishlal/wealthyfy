import React, { useState } from 'react';
import api from '../api/axios';
import { Calendar, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DailyData {
    date: string;
    total_expense: number;
    expenses_by_category: { [key: string]: number };
    total_income: number;
    total_investment: number;
    total_debt_paid: number;
    net: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const DailyOverview: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState<DailyData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDailyData = async (date: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/dashboard/daily?target_date=${date}`);
            setDailyData(response.data);
        } catch (error) {
            console.error("Error fetching daily data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        fetchDailyData(newDate);
    };

    React.useEffect(() => {
        fetchDailyData(selectedDate);
    }, []);

    const categoryData = dailyData?.expenses_by_category
        ? Object.entries(dailyData.expenses_by_category).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Daily Overview
                </h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">Select Date:</label>
                    <input
                        id="date-picker"
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {loading && <div className="text-center py-10">Loading...</div>}

            {!loading && dailyData && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Income</p>
                                    <p className="text-lg font-black text-green-800">₹{(dailyData.total_income || 0).toLocaleString()}</p>
                                </div>
                                <TrendingUp className="text-green-600 w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-sm border border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Expense</p>
                                    <p className="text-lg font-black text-red-800">₹{(dailyData.total_expense || 0).toLocaleString()}</p>
                                </div>
                                <TrendingDown className="text-red-600 w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Invest.</p>
                                    <p className="text-lg font-black text-blue-800">₹{(dailyData.total_investment || 0).toLocaleString()}</p>
                                </div>
                                <Wallet className="text-blue-600 w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Debt</p>
                                    <p className="text-lg font-black text-purple-800">₹{(dailyData.total_debt_paid || 0).toLocaleString()}</p>
                                </div>
                                <CreditCard className="text-purple-600 w-5 h-5" />
                            </div>
                        </div>

                        <div className={`col-span-2 lg:col-span-1 bg-gradient-to-br ${dailyData.net >= 0 ? 'from-teal-50 to-teal-100 border-teal-200' : 'from-orange-50 to-orange-100 border-orange-200'} p-4 rounded-xl shadow-sm border`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${dailyData.net >= 0 ? 'text-teal-700' : 'text-orange-700'}`}>Net</p>
                                    <p className={`text-lg font-black ${dailyData.net >= 0 ? 'text-teal-800' : 'text-orange-800'}`}>₹{(dailyData.net || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {categoryData.length > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4">Expense by Category</h3>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ₹${value}`}
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

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Category Details</h3>
                            <div className="space-y-3">
                                {categoryData.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            ></div>
                                            <span className="text-gray-700 font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-lg font-bold text-gray-800">₹{(item.value || 0).toLocaleString()}</span>
                                    </div>
                                ))}
                                {categoryData.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">No expenses for this date</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DailyOverview;
