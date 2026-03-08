import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Target, AlertCircle, CheckCircle2, Save, Trash2 } from 'lucide-react';

interface Category {
    id: string;
    value: string;
}

interface BudgetVsActual {
    category: string;
    budgeted: number;
    actual: number;
    remaining: number;
    percent_used: number;
}

const Budgets: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<BudgetVsActual[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Form state
    const [targetCategoryId, setTargetCategoryId] = useState('');
    const [targetAmount, setTargetAmount] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, budgetsRes] = await Promise.all([
                api.get('/settings/expense_category'),
                api.get(`/dashboard/v2/budget-vs-actual?month=${selectedMonth}&year=${selectedYear}`)
            ]);
            setCategories(categoriesRes.data);
            setBudgets(budgetsRes.data);
        } catch (error) {
            console.error("Error fetching budget data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleSaveBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // First check if a budget already exists for this category/month/year
            // For simplicity, we'll try to get all budgets and find if one exists
            const allBudgetsRes = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}`);
            const existingBudget = allBudgetsRes.data.find((b: any) => b.category_id === targetCategoryId);

            const budgetData = {
                category_id: targetCategoryId,
                amount: parseFloat(targetAmount),
                month: selectedMonth,
                year: selectedYear
            };

            if (existingBudget) {
                await api.put(`/budgets/${existingBudget.id}`, budgetData);
            } else {
                await api.post('/budgets/', budgetData);
            }

            setTargetAmount('');
            setTargetCategoryId('');
            fetchData();
        } catch (error) {
            console.error("Error saving budget:", error);
            alert("Failed to save budget");
        }
    };

    const handleDeleteBudget = async (categoryName: string) => {
        if (!window.confirm(`Delete budget for ${categoryName}?`)) return;

        try {
            const allBudgetsRes = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}`);
            const cat = categories.find(c => c.value === categoryName);
            if (!cat) return;

            const budgetToDelete = allBudgetsRes.data.find((b: any) => b.category_id === cat.id);
            if (budgetToDelete) {
                await api.delete(`/budgets/${budgetToDelete.id}`);
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
        }
    };

    if (loading && budgets.length === 0) return <div className="text-center py-10">Loading Budgets...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    Budgets
                </h2>

                <div className="flex w-full sm:w-auto gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="flex-1 sm:flex-none p-2 border rounded-lg shadow-sm text-sm font-medium"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="flex-1 sm:flex-none p-2 border rounded-lg shadow-sm text-sm font-medium"
                    >
                        {[2024, 2025, 2026].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Set Budget Form */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Set Category Budget</h3>
                <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                        <select
                            required
                            value={targetCategoryId}
                            onChange={(e) => setTargetCategoryId(e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm"
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Monthly Limit (₹)</label>
                        <input
                            type="number"
                            required
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm"
                            placeholder="e.g. 5000"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-bold mt-auto"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </form>
            </div>

            {/* Budget Progress List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {budgets.map((budget, index) => {
                    const isOver = budget.percent_used > 100;
                    const isNear = budget.percent_used > 85 && budget.percent_used <= 100;

                    return (
                        <div key={index} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border-t-4 border-blue-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-black text-base md:text-lg text-gray-800 tracking-tight">{budget.category}</h4>
                                    <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        Limit: ₹{budget.budgeted.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isOver ? (
                                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                                    ) : isNear ? (
                                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                                    )}
                                    <button
                                        onClick={() => handleDeleteBudget(budget.category)}
                                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-wider">
                                    <span className="text-gray-400">Spent: <span className="text-gray-900">₹{budget.actual.toLocaleString()}</span></span>
                                    <span className={isOver ? 'text-red-500' : 'text-gray-900'}>
                                        {budget.percent_used.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-2">
                                    <div
                                        className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : isNear ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] italic font-medium text-right text-gray-500">
                                    {isOver
                                        ? `Exceeded by ₹${Math.abs(budget.remaining).toLocaleString()}`
                                        : `₹${budget.remaining.toLocaleString()} left`}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {budgets.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-lg shadow-md">
                        No budgets set for this month. Use the form above to add your first budget!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Budgets;
