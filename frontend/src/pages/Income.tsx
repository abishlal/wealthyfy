import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import settingsApi, { type LookupValue } from '../api/settingsApi';
import { Plus, Trash, Edit, X, Download } from 'lucide-react';

interface Income {
    id: string;
    date: string;
    income_source_id: string;
    description?: string;
    amount: number;
    account_id: string;
    notes?: string;
}

const IncomePage: React.FC = () => {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incomeSources, setIncomeSources] = useState<LookupValue[]>([]);
    const [accounts, setAccounts] = useState<LookupValue[]>([]);
    const [incomeSourceMap, setIncomeSourceMap] = useState<Record<string, string>>({});
    const [accountMap, setAccountMap] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        income_source_id: '',
        description: '',
        amount: '',
        account_id: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [incomesRes, sourcesRes, accountsRes] = await Promise.all([
                api.get('/income/'),
                settingsApi.getLookupValuesByType('income_source'),
                settingsApi.getLookupValuesByType('account')
            ]);

            setIncomes(incomesRes.data);
            setIncomeSources(sourcesRes);
            setAccounts(accountsRes);

            const sourceMap: Record<string, string> = {};
            sourcesRes.forEach(s => sourceMap[s.id] = s.value);
            setIncomeSourceMap(sourceMap);

            const accMap: Record<string, string> = {};
            accountsRes.forEach(a => accMap[a.id] = a.value);
            setAccountMap(accMap);

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
                await api.put(`/income/${editingId}`, payload);
            } else {
                await api.post('/income/', payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving income", error);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            income_source_id: incomeSources.length > 0 ? incomeSources[0].id : '',
            description: '',
            amount: '',
            account_id: accounts.length > 0 ? accounts[0].id : '',
            notes: ''
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this income record?")) {
            try {
                await api.delete(`/income/${id}`);
                fetchData();
            } catch (error) {
                console.error("Error deleting income", error);
            }
        }
    };

    const openEditModal = (income: Income) => {
        setEditingId(income.id);
        setFormData({
            date: income.date,
            income_source_id: income.income_source_id,
            description: income.description || '',
            amount: income.amount.toString(),
            account_id: income.account_id,
            notes: income.notes || ''
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingId(null);
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Income</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`${api.defaults.baseURL}/income/export`, '_blank')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Income
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {incomes.map((income) => (
                            <tr key={income.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{income.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {incomeSourceMap[income.income_source_id] || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{income.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {accountMap[income.account_id] || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">₹{income.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(income)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(income.id)} className="text-red-600 hover:text-red-900"><Trash size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {incomes.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No income records found.</td>
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
                            <h3 className="text-lg font-bold">{editingId ? 'Edit Income' : 'Add New Income'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Source</label>
                                <select
                                    required
                                    value={formData.income_source_id}
                                    onChange={(e) => setFormData({ ...formData, income_source_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                >
                                    <option value="" disabled>Select Source</option>
                                    {incomeSources.map(s => <option key={s.id} value={s.id}>{s.value}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomePage;
