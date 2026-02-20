import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import settingsApi, { type LookupValue } from '../api/settingsApi';
import { Plus, Trash, Edit, X, Download } from 'lucide-react';

interface Expense {
    id: string;
    purchase_date: string;
    item: string;
    amount: number;
    category_id: string;
    account_id: string;
    notes?: string;
}

const Expenses: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState<LookupValue[]>([]);
    const [accounts, setAccounts] = useState<LookupValue[]>([]);
    const [categoryIdMap, setCategoryIdMap] = useState<Record<string, string>>({});
    const [accountIdMap, setAccountIdMap] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        purchase_date: new Date().toISOString().split('T')[0],
        item: '',
        amount: '',
        category_id: '',
        account_id: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, categoriesRes, accountsRes] = await Promise.all([
                api.get('/expenses/'),
                settingsApi.getLookupValuesByType('expense_category'),
                settingsApi.getLookupValuesByType('account')
            ]);

            setExpenses(expensesRes.data);
            setCategories(categoriesRes);
            setAccounts(accountsRes);

            // Create Maps
            const catMap: Record<string, string> = {};
            categoriesRes.forEach(c => catMap[c.id] = c.value);
            setCategoryIdMap(catMap);

            const accMap: Record<string, string> = {};
            accountsRes.forEach(a => accMap[a.id] = a.value);
            setAccountIdMap(accMap);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, amount: parseFloat(formData.amount) };
            if (editingId) {
                await api.put(`/expenses/${editingId}`, payload);
            } else {
                await api.post('/expenses/', payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
            resetForm();
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error saving expense", error);
        }
    };

    const resetForm = () => {
        setFormData({
            purchase_date: new Date().toISOString().split('T')[0],
            item: '',
            amount: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            account_id: accounts.length > 0 ? accounts[0].id : '',
            notes: ''
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchData();
            } catch (error) {
                console.error("Error deleting expense", error);
            }
        }
    };

    const openEditModal = (expense: Expense) => {
        setEditingId(expense.id);
        setFormData({
            purchase_date: expense.purchase_date,
            item: expense.item,
            amount: expense.amount.toString(),
            category_id: expense.category_id,
            account_id: expense.account_id,
            notes: expense.notes || ''
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingId(null);
        resetForm();
        setIsModalOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`${api.defaults.baseURL}/expenses/export`, '_blank')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Expense
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map((expense) => (
                            <tr key={expense.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.purchase_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.item}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100">
                                        {categoryIdMap[expense.category_id] || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {accountIdMap[expense.account_id] || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">₹{expense.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(expense)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900"><Trash size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No expenses recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.purchase_date}
                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Item</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.item}
                                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account</label>
                                    <select
                                        required
                                        value={formData.account_id}
                                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    >
                                        <option value="" disabled>Select Account</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.value}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.value}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
