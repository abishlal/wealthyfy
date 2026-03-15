import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import settingsApi, { type LookupValue } from '../api/settingsApi';
import friendsApi, { type Friend } from '../api/friendsApi';
import { Plus, Trash, Edit, X, Download, User, Users2, Receipt, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';

interface Expense {
    id: string;
    purchase_date: string;
    item: string;
    amount: number;
    category_id: string;
    account_id: string;
    notes?: string;
}

interface SplitFriend {
    friend_id: string;
    amount: string;      // friend's share amount
    who_paid: 'me' | 'friend';  // who physically paid
}

const Expenses: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState<LookupValue[]>([]);
    const [accounts, setAccounts] = useState<LookupValue[]>([]);
    const [availableFriends, setAvailableFriends] = useState<Friend[]>([]);
    const [categoryIdMap, setCategoryIdMap] = useState<Record<string, string>>({});
    const [accountIdMap, setAccountIdMap] = useState<Record<string, string>>({});

    const defaultForm = {
        purchase_date: new Date().toISOString().split('T')[0],
        item: '',
        category_id: '',
        account_id: '',
        notes: '',
        total_amount: '',
    };

    const [formData, setFormData] = useState(defaultForm);
    const [isSplit, setIsSplit] = useState(false);
    // Your share (only relevant in split mode; otherwise = total_amount)
    // List of per-friend splits
    const [splitFriends, setSplitFriends] = useState<SplitFriend[]>([
        { friend_id: '', amount: '', who_paid: 'me' }
    ]);

    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [expensesRes, categoriesRes, accountsRes, friendsRes] = await Promise.all([
                api.get('/expenses/'),
                settingsApi.getLookupValuesByType('expense_category'),
                settingsApi.getLookupValuesByType('account'),
                friendsApi.getFriends()
            ]);

            setExpenses(expensesRes.data);
            setCategories(categoriesRes);
            setAccounts(accountsRes);
            setAvailableFriends(friendsRes);

            const catMap: Record<string, string> = {};
            categoriesRes.forEach(c => catMap[c.id] = c.value);
            setCategoryIdMap(catMap);

            const accMap: Record<string, string> = {};
            accountsRes.forEach(a => accMap[a.id] = a.value);
            setAccountIdMap(accMap);

        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Derived split calculations ---
    const totalAmount = parseFloat(formData.total_amount) || 0;
    const friendsTotal = splitFriends.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
    // my share = total - all friend shares (auto-computed when split)
    const computedMyShare = isSplit ? Math.max(0, totalAmount - friendsTotal) : totalAmount;
    const isBalanced = isSplit ? Math.abs(computedMyShare + friendsTotal - totalAmount) < 0.01 : true;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSplit && !isBalanced) {
            alert('Shares do not add up to total amount. Please fix before saving.');
            return;
        }

        try {
            if (isSplit) {
                // Construct splits array
                const splits = splitFriends
                    .filter(sf => sf.friend_id !== '')
                    .map(sf => ({
                        friend_id: sf.friend_id,
                        friend_share: parseFloat(sf.amount) || 0,
                        who_paid: sf.who_paid
                    }));

                const payload = {
                    ...formData,
                    amount: computedMyShare,
                    total_amount: totalAmount,
                    who_paid: 'split', // Indicates shared expense
                    split_type: 'split',
                    splits: splits
                };

                if (editingId) {
                    await api.put(`/expenses/${editingId}`, payload);
                } else {
                    await api.post('/expenses/', payload);
                }
            } else {
                // Solo expense
                const payload = {
                    ...formData,
                    amount: totalAmount,
                    total_amount: totalAmount,
                    who_paid: 'me',
                    split_type: 'none',
                    friend_id: null,
                    friend_share: 0,
                };
                if (editingId) {
                    await api.put(`/expenses/${editingId}`, payload);
                } else {
                    await api.post('/expenses/', payload);
                }
            }

            setIsModalOpen(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving expense", error);
        }
    };

    const resetForm = () => {
        setFormData({
            purchase_date: new Date().toISOString().split('T')[0],
            item: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            account_id: accounts.length > 0 ? accounts[0].id : '',
            notes: '',
            total_amount: '',
        });
        setIsSplit(false);
        setSplitFriends([{ friend_id: '', amount: '', who_paid: 'me' }]);
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
            category_id: expense.category_id,
            account_id: expense.account_id,
            notes: expense.notes || '',
            total_amount: expense.amount.toString(),
        });
        setIsSplit(false);
        setSplitFriends([{ friend_id: '', amount: '', who_paid: 'me' }]);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingId(null);
        resetForm();
        setIsModalOpen(true);
    };

    // When total amount changes in split mode, auto-distribute evenly
    const handleTotalAmountChange = (val: string) => {
        setFormData({ ...formData, total_amount: val });
        if (isSplit) {
            const total = parseFloat(val) || 0;
            const count = splitFriends.length + 1; // +1 for "me"
            const equally = (total / count).toFixed(2);
            setSplitFriends(splitFriends.map(sf => ({ ...sf, amount: equally })));
        }
    };

    // Switch to split mode: auto-distribute equally
    const enableSplit = () => {
        const total = parseFloat(formData.total_amount) || 0;
        const count = splitFriends.length + 1;
        const equally = (total / count).toFixed(2);
        setSplitFriends(splitFriends.map(sf => ({ ...sf, amount: equally })));
        setIsSplit(true);
    };

    const addFriendRow = () => {
        const total = parseFloat(formData.total_amount) || 0;
        const newCount = splitFriends.length + 1 + 1; // new friends + me
        const equally = total > 0 ? (total / newCount).toFixed(2) : '';
        setSplitFriends([
            ...splitFriends.map(sf => ({ ...sf, amount: equally })),
            { friend_id: '', amount: equally, who_paid: 'me' as const }
        ]);
    };

    const removeFriendRow = (idx: number) => {
        const updated = splitFriends.filter((_, i) => i !== idx);
        setSplitFriends(updated.length > 0 ? updated : [{ friend_id: '', amount: '', who_paid: 'me' }]);
        if (updated.length === 0) setIsSplit(false);
    };

    const updateFriendRow = (idx: number, field: keyof SplitFriend, value: string) => {
        setSplitFriends(splitFriends.map((sf, i) => i === idx ? { ...sf, [field]: value } : sf));
    };

    // Evenly distribute total among all parties
    const distributeEvenly = () => {
        const total = parseFloat(formData.total_amount) || 0;
        const count = splitFriends.length + 1; // friends + me
        const share = (total / count).toFixed(2);
        setSplitFriends(splitFriends.map(sf => ({ ...sf, amount: share })));
    };

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
                        className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
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
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[92vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-xl transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: Total Amount + Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Bill Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.total_amount}
                                        onChange={(e) => handleTotalAmountChange(e.target.value)}
                                        className="block w-full rounded-xl bg-gray-50 border-0 px-4 py-3 font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        className="block w-full rounded-xl bg-gray-50 border-0 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Item Name */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.item}
                                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                    className="block w-full rounded-xl bg-gray-50 border-0 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="What did you buy?"
                                />
                            </div>

                            {/* Category + Account */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        required
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="block w-full rounded-xl bg-gray-50 border-0 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    >
                                        <option value="" disabled>Select</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.value}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Account</label>
                                    <select
                                        required
                                        value={formData.account_id}
                                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                        className="block w-full rounded-xl bg-gray-50 border-0 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    >
                                        <option value="" disabled>Select</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.value}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Expense Type Toggle */}
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Expense Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsSplit(false); setSplitFriends([{ friend_id: '', amount: '', who_paid: 'me' }]); }}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${!isSplit
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${!isSplit ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                            <User size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-black uppercase tracking-wide">Just Me</div>
                                            <div className="text-[10px] font-medium opacity-60 mt-0.5">Solo expense</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={enableSplit}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSplit
                                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${isSplit ? 'bg-violet-100' : 'bg-gray-100'}`}>
                                            <Users2 size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-black uppercase tracking-wide">Split with Friends</div>
                                            <div className="text-[10px] font-medium opacity-60 mt-0.5">Shared expense</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Split Panel */}
                            {isSplit && (
                                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden">
                                    {/* Header */}
                                    <div className="px-5 py-3 bg-violet-100/60 border-b border-violet-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Receipt size={14} className="text-violet-500" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-violet-600">Split Details</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={distributeEvenly}
                                            className="text-[10px] font-black uppercase tracking-widest text-violet-500 hover:text-violet-700 bg-white px-2 py-1 rounded-lg border border-violet-100 transition-all"
                                        >
                                            Distribute Evenly
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        {/* My share display */}
                                        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-violet-100 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                                    <User size={14} className="text-indigo-600" />
                                                </div>
                                                <span className="text-xs font-black text-gray-700 uppercase tracking-wide">My Share</span>
                                            </div>
                                            <span className="font-black text-indigo-700 text-base">
                                                {computedMyShare > 0 ? `₹${computedMyShare.toFixed(2)}` : '—'}
                                            </span>
                                        </div>

                                        {/* Friend rows */}
                                        <div className="space-y-3">
                                            {splitFriends.map((sf, idx) => {
                                                const friendName = availableFriends.find(f => f.id === sf.friend_id)?.name || null;
                                                return (
                                                    <div key={idx} className="bg-white rounded-xl border border-violet-100 shadow-sm overflow-hidden">
                                                        {/* Friend row header */}
                                                        <div className="flex items-center gap-3 px-4 py-3 border-b border-violet-50">
                                                            <div className="p-1.5 bg-violet-100 rounded-lg">
                                                                <User size={14} className="text-violet-600" />
                                                            </div>
                                                            <select
                                                                required
                                                                value={sf.friend_id}
                                                                onChange={(e) => updateFriendRow(idx, 'friend_id', e.target.value)}
                                                                className="flex-1 bg-transparent text-xs font-black text-gray-700 outline-none appearance-none cursor-pointer"
                                                            >
                                                                <option value="" disabled>Choose a friend...</option>
                                                                {availableFriends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                            </select>
                                                            {splitFriends.length > 1 && (
                                                                <button type="button" onClick={() => removeFriendRow(idx)} className="text-gray-300 hover:text-rose-500 transition-colors">
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Amount + Who paid */}
                                                        <div className="grid grid-cols-2 gap-0 divide-x divide-violet-50">
                                                            <div className="px-4 py-3">
                                                                <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">Their Share (₹)</div>
                                                                <input
                                                                    type="number"
                                                                    value={sf.amount}
                                                                    onChange={(e) => updateFriendRow(idx, 'amount', e.target.value)}
                                                                    className="w-full bg-transparent font-black text-gray-800 text-sm outline-none placeholder-gray-300"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div className="px-4 py-3">
                                                                <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1.5">Who paid the bill?</div>
                                                                <div className="flex bg-violet-50 rounded-lg p-0.5 gap-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateFriendRow(idx, 'who_paid', 'me')}
                                                                        className={`flex-1 py-1 rounded text-[9px] font-black uppercase transition-all ${sf.who_paid === 'me' ? 'bg-violet-600 text-white shadow' : 'text-gray-400'}`}
                                                                    >Me</button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateFriendRow(idx, 'who_paid', 'friend')}
                                                                        className={`flex-1 py-1 rounded text-[9px] font-black uppercase transition-all ${sf.who_paid === 'friend' ? 'bg-violet-600 text-white shadow' : 'text-gray-400'}`}
                                                                    >Friend</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Summary line */}
                                                        {sf.friend_id && sf.amount && (
                                                            <div className="px-4 py-2 bg-violet-50/50 border-t border-violet-50 text-[10px] font-bold text-violet-500 italic">
                                                                {sf.who_paid === 'me'
                                                                    ? `${friendName || 'Friend'} owes you ₹${parseFloat(sf.amount).toFixed(2)}`
                                                                    : `You owe ${friendName || 'Friend'} ₹${parseFloat(sf.amount).toFixed(2)}`
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Add another friend */}
                                        <button
                                            type="button"
                                            onClick={addFriendRow}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-violet-200 text-violet-400 hover:border-violet-400 hover:text-violet-600 transition-all text-xs font-black uppercase tracking-widest"
                                        >
                                            <PlusCircle size={14} /> Add Another Friend
                                        </button>

                                        {/* Balance summary */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div className={`flex items-center gap-1.5 text-[11px] font-black ${isBalanced ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {isBalanced
                                                    ? <><CheckCircle size={13} /> Balanced</>
                                                    : <><AlertCircle size={13} /> {`₹${Math.abs(totalAmount - friendsTotal - computedMyShare).toFixed(2)} unaccounted`}</>
                                                }
                                            </div>
                                            {totalAmount > 0 && (
                                                <span className="text-[10px] text-gray-400 font-bold">
                                                    {`My: ₹${computedMyShare.toFixed(2)} + Friends: ₹${friendsTotal.toFixed(2)} = ₹${(computedMyShare + friendsTotal).toFixed(2)}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes <span className="font-normal normal-case">(optional)</span></label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="block w-full rounded-xl bg-gray-50 border-0 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Any extra details..."
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
                                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-xs">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
