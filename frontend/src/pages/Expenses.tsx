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
    is_shared?: boolean;
    total_people?: number;
}

interface FriendShare {
    name: string;
    amount: string;
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
        notes: '',
        is_shared: false,
        total_paid: '',
        friends: [] as FriendShare[]
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
                const friend_shares: Record<string, number> = {};
                if (formData.is_shared) {
                    formData.friends.forEach(f => {
                        if (f.name && f.amount) {
                            friend_shares[f.name] = parseFloat(f.amount);
                        }
                    });
                }

                await api.post('/expenses/', {
                    ...payload,
                    is_shared: formData.is_shared,
                    total_people: formData.is_shared ? formData.friends.length + 1 : 1,
                    friend_shares: formData.is_shared ? friend_shares : null
                });
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
            notes: '',
            is_shared: false,
            total_paid: '',
            friends: [] as FriendShare[]
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
            notes: expense.notes || '',
            is_shared: false, // Edit for shared not fully implemented in backend yet, keep as simple expense for edit
            total_paid: expense.amount.toString(),
            friends: []
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
                <div className="flex w-full sm:w-auto gap-2">
                    <button
                        onClick={() => window.open(`${api.defaults.baseURL}/expenses/export`, '_blank')}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Download size={18} /> <span className="hidden xs:inline">Export</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{expense.purchase_date}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[150px]">{expense.item}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-gray-100">
                                        {categoryIdMap[expense.category_id] || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {accountIdMap[expense.account_id] || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">₹{expense.amount}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => openEditModal(expense)} className="text-indigo-600 hover:text-indigo-900"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900"><Trash size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No expenses recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
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

                            {/* Shared Expense Toggle */}
                            {!editingId && (
                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_shared"
                                            checked={formData.is_shared}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setFormData({
                                                    ...formData,
                                                    is_shared: isChecked,
                                                    total_paid: isChecked ? formData.amount : '',
                                                    friends: isChecked ? [{ name: '', amount: '' }] : []
                                                });
                                            }}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_shared" className="text-sm font-medium text-gray-700">This is a shared expense</label>
                                    </div>

                                    {formData.is_shared && (
                                        <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Total Amount Paid</label>
                                                <input
                                                    type="number"
                                                    value={formData.total_paid}
                                                    onChange={(e) => {
                                                        const total = e.target.value;
                                                        const totalNum = parseFloat(total) || 0;
                                                        const peopleCount = formData.friends.length + 1;
                                                        const share = (totalNum / peopleCount).toFixed(2);

                                                        setFormData({
                                                            ...formData,
                                                            total_paid: total,
                                                            amount: share,
                                                            friends: formData.friends.map(f => ({ ...f, amount: share }))
                                                        });
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Split with Friends</label>
                                                {formData.friends.map((friend, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Friend Name"
                                                            value={friend.name}
                                                            onChange={(e) => {
                                                                const newFriends = [...formData.friends];
                                                                newFriends[index].name = e.target.value;
                                                                setFormData({ ...formData, friends: newFriends });
                                                            }}
                                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Amount"
                                                            value={friend.amount}
                                                            readOnly
                                                            className="w-24 rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm border p-2"
                                                        />
                                                        {formData.friends.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newFriends = formData.friends.filter((_, i) => i !== index);
                                                                    const totalNum = parseFloat(formData.total_paid) || 0;
                                                                    const share = (totalNum / (newFriends.length + 1)).toFixed(2);
                                                                    setFormData({
                                                                        ...formData,
                                                                        friends: newFriends.map(f => ({ ...f, amount: share })),
                                                                        amount: share
                                                                    });
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFriends = [...formData.friends, { name: '', amount: '' }];
                                                        const totalNum = parseFloat(formData.total_paid) || 0;
                                                        const share = (totalNum / (newFriends.length + 1)).toFixed(2);
                                                        setFormData({
                                                            ...formData,
                                                            friends: newFriends.map(f => ({ ...f, amount: share })),
                                                            amount: share
                                                        });
                                                    }}
                                                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
                                                >
                                                    + Add Friend
                                                </button>
                                            </div>

                                            <div className="text-sm font-bold border-t pt-2 mt-2">
                                                Your Share: ₹{formData.amount}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

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
