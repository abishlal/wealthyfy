import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import settingsApi, { type LookupValue } from '../api/settingsApi';
import { Plus, X, Download, IndianRupee, PieChart, Activity } from 'lucide-react';

interface Investment {
    id: string;
    date: string;
    investment_type_id: string;
    amount: number;
    institution_id: string;
    notes?: string;
}

const InvestmentsPage: React.FC = () => {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [investmentTypes, setInvestmentTypes] = useState<LookupValue[]>([]);
    const [institutions, setInstitutions] = useState<LookupValue[]>([]);
    const [typeMap, setTypeMap] = useState<Record<string, string>>({});
    const [instMap, setInstMap] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        investment_type_id: '',
        amount: '',
        institution_id: '',
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, typesRes, instRes] = await Promise.all([
                api.get('/investments/'),
                settingsApi.getLookupValuesByType('investment_type'),
                settingsApi.getLookupValuesByType('institution')
            ]);

            // Sort investments by date desc
            const sortedInvestments = invRes.data.sort((a: Investment, b: Investment) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setInvestments(sortedInvestments);
            setInvestmentTypes(typesRes);
            setInstitutions(instRes);

            const tMap: Record<string, string> = {};
            typesRes.forEach(t => tMap[t.id] = t.value);
            setTypeMap(tMap);

            const iMap: Record<string, string> = {};
            instRes.forEach(i => iMap[i.id] = i.value);
            setInstMap(iMap);
        } catch (error) {
            console.error("Failed to fetch investments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const summary = React.useMemo(() => {
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const count = investments.length;
        // Group by type
        const byType: Record<string, number> = {};
        investments.forEach(inv => {
            const typeName = typeMap[inv.investment_type_id] || 'Unknown';
            byType[typeName] = (byType[typeName] || 0) + inv.amount;
        });
        const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

        return { totalInvested, count, topType: topType ? topType[0] : 'N/A' };
    }, [investments, typeMap]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, amount: parseFloat(formData.amount) };
            await api.post('/investments/', payload);
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving investment", error);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            investment_type_id: investmentTypes.length > 0 ? investmentTypes[0].id : '',
            amount: '',
            institution_id: institutions.length > 0 ? institutions[0].id : '',
            notes: ''
        });
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Investments Portfolio</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`${api.defaults.baseURL}/investments/export`, '_blank')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Investment
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Invested</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{summary.totalInvested.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                            <IndianRupee size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-gray-900">{summary.count}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Top Asset Class</p>
                            <h3 className="text-xl font-bold text-gray-900 truncate">{summary.topType}</h3>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                            <PieChart size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Investments Grid (Optional - maybe just use table for history) */}
            {/* Let's use a Table for Transaction History as requested */}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {investments.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instMap[inv.institution_id] || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                            {typeMap[inv.investment_type_id] || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">₹{(inv.amount || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{inv.notes}</td>
                                </tr>
                            ))}
                            {investments.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No investments recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add New Investment</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select required value={formData.investment_type_id} onChange={(e) => setFormData({ ...formData, investment_type_id: e.target.value })} className="mt-1 block w-full border p-2 rounded-md">
                                    <option value="" disabled>Select Type</option>
                                    {investmentTypes.map(t => <option key={t.id} value={t.id}>{t.value}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Institution</label>
                                <select required value={formData.institution_id} onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })} className="mt-1 block w-full border p-2 rounded-md">
                                    <option value="" disabled>Select Institution</option>
                                    {institutions.map(i => <option key={i.id} value={i.id}>{i.value}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700">Amount</label><input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>

                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-purple-600 rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentsPage;
