import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import settingsApi, { type LookupValue } from '../api/settingsApi';
import { Plus, IndianRupee, X, Download, TrendingDown, CreditCard } from 'lucide-react';

interface Liability {
    id: string;
    liability_name: string;
    lender_id: string;
    liabilities_type_id: string;
    original_amount: number;
    interest_rate: number;
    emi_amount: number;
    start_date: string;
    term_months: number;
    total_paid: number;
    outstanding_amount: number;
    remaining_term: number;
}

interface LiabilityPayment {
    id: string;
    liability_id: string;
    payment_date: string;
    amount: number;
    liability?: Liability;
}

const LiabilitiesPage: React.FC = () => {
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [payments, setPayments] = useState<LiabilityPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedLiabilityId, setSelectedLiabilityId] = useState<string | null>(null);
    const [lenders, setLenders] = useState<LookupValue[]>([]);
    const [liabilitiesTypes, setLiabilitiesTypes] = useState<LookupValue[]>([]);
    const [lenderMap, setLenderMap] = useState<Record<string, string>>({});
    const [liabilitiesTypeMap, setLiabilitiesTypeMap] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        liability_name: '',
        lender_id: '',
        liabilities_type_id: '',
        original_amount: '',
        interest_rate: '',
        emi_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        term_months: ''
    });

    const [paymentData, setPaymentData] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        amount: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [liabilitiesRes, paymentsRes, allLookups] = await Promise.all([
                api.get('/liabilities/'),
                api.get('/liabilities/payments'),
                settingsApi.getAllLookupValues()
            ]);

            setLiabilities(liabilitiesRes.data);
            setPayments(paymentsRes.data);

            const lendersRes = allLookups['lender'] || [];
            const liabilitiesTypesRes = allLookups['liabilities_type'] || allLookups['liability_type'] || allLookups['loan_type'] || [];

            setLenders(lendersRes);
            setLiabilitiesTypes(liabilitiesTypesRes);

            const lMap: Record<string, string> = {};
            lendersRes.forEach(l => lMap[l.id] = l.value);
            setLenderMap(lMap);

            const ltMap: Record<string, string> = {};
            liabilitiesTypesRes.forEach(t => ltMap[t.id] = t.value);
            setLiabilitiesTypeMap(ltMap);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const summary = React.useMemo(() => {
        const totalLiability = liabilities.reduce((sum, l) => sum + (l.original_amount || 0), 0);
        const totalPaid = liabilities.reduce((sum, l) => sum + (l.total_paid || 0), 0);
        const outstanding = totalLiability - totalPaid;
        const progress = totalLiability > 0 ? (totalPaid / totalLiability) * 100 : 0;
        return { totalLiability, totalPaid, outstanding, progress };
    }, [liabilities]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                original_amount: parseFloat(formData.original_amount),
                interest_rate: parseFloat(formData.interest_rate),
                emi_amount: parseFloat(formData.emi_amount),
                term_months: parseInt(formData.term_months)
            };
            await api.post('/liabilities/', payload);
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving liability", error);
        }
    };

    const resetForm = () => {
        setFormData({
            liability_name: '',
            lender_id: '',
            liabilities_type_id: '',
            original_amount: '',
            interest_rate: '',
            emi_amount: '',
            start_date: new Date().toISOString().split('T')[0],
            term_months: ''
        });
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLiabilityId) return;
        try {
            const payload = {
                liability_id: selectedLiabilityId,
                payment_date: paymentData.payment_date,
                amount: parseFloat(paymentData.amount)
            };
            await api.post('/liabilities/payments', payload);
            setIsPaymentModalOpen(false);
            setPaymentData({
                payment_date: new Date().toISOString().split('T')[0],
                amount: ''
            });
            fetchData();
        } catch (error) {
            console.error("Error recording payment", error);
        }
    };

    const openPaymentModal = (liability: Liability) => {
        setSelectedLiabilityId(liability.id);
        setIsPaymentModalOpen(true);
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    }

    const getLiabilityName = (id: string) => {
        const liability = liabilities.find(l => l.id === id);
        return liability ? liability.liability_name : 'Unknown Liability';
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Liabilities & Debt</h2>
                <div className="flex w-full sm:w-auto gap-2">
                    <button
                        onClick={() => window.open(`${api.defaults.baseURL}/liabilities/export`, '_blank')}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Download size={18} /> <span className="hidden xs:inline">Export</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex-1 sm:flex-none bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Total Liability</p>
                            <h3 className="text-lg md:text-2xl font-black text-gray-900">₹{summary.totalLiability.toLocaleString()}</h3>
                        </div>
                        <div className="hidden sm:block p-3 bg-red-100 rounded-full text-red-600">
                            <IndianRupee size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Total Paid</p>
                            <h3 className="text-lg md:text-2xl font-black text-gray-900">₹{summary.totalPaid.toLocaleString()}</h3>
                        </div>
                        <div className="hidden sm:block p-3 bg-green-100 rounded-full text-green-600">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Outstanding</p>
                            <h3 className="text-lg md:text-2xl font-black text-gray-900">₹{summary.outstanding.toLocaleString()}</h3>
                        </div>
                        <div className="hidden sm:block p-3 bg-orange-100 rounded-full text-orange-600">
                            <CreditCard size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Progress</p>
                            <h3 className="text-lg md:text-2xl font-black text-gray-900">{summary.progress.toFixed(0)}%</h3>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 relative">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray={`${summary.progress}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Liabilities Grid */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Active Liabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liabilities.map((liability) => (
                        <div key={liability.id} className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-500 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{liability.liability_name}</h3>
                                        <p className="text-sm text-gray-500">{lenderMap[liability.lender_id] || 'Unknown'} ({liabilitiesTypeMap[liability.liabilities_type_id] || 'Unknown'})</p>
                                    </div>
                                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">{liability.interest_rate}% Interest</span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Original Amount:</span>
                                        <span className="font-medium">₹{(liability.original_amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Outstanding:</span>
                                        <span className="font-bold text-red-600">₹{(liability.outstanding_amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Paid So Far:</span>
                                        <span className="font-medium text-green-600">₹{(liability.total_paid || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min((liability.total_paid / liability.original_amount) * 100, 100)}% ` }}></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => openPaymentModal(liability)}
                                className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors mt-4"
                            >
                                <IndianRupee size={16} /> Record Payment
                            </button>
                        </div>
                    ))}
                    {liabilities.length === 0 && !loading && (
                        <div className="col-span-full text-center py-10 text-gray-500">No liabilities recorded.</div>
                    )}
                </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Payment History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liability</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.payment_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getLiabilityName(payment.liability_id)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">+₹{payment.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No payments recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Liability Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add New Liability</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700">Liability Name</label><input type="text" required value={formData.liability_name} onChange={(e) => setFormData({ ...formData, liability_name: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lender</label>
                                    <select
                                        required
                                        value={formData.lender_id}
                                        onChange={(e) => setFormData({ ...formData, lender_id: e.target.value })}
                                        className="mt-1 block w-full border p-2 rounded-md"
                                    >
                                        <option value="">Select Lender</option>
                                        {lenders.map(l => <option key={l.id} value={l.id}>{l.value}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Liabilities Type</label>
                                    <select
                                        required
                                        value={formData.liabilities_type_id}
                                        onChange={(e) => setFormData({ ...formData, liabilities_type_id: e.target.value })}
                                        className="mt-1 block w-full border p-2 rounded-md"
                                    >
                                        <option value="">Select Type</option>
                                        {liabilitiesTypes.map(t => <option key={t.id} value={t.id}>{t.value}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">Original Amount</label><input type="number" step="0.01" required value={formData.original_amount} onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label><input type="number" step="0.01" required value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">EMI Amount</label><input type="number" step="0.01" required value={formData.emi_amount} onChange={(e) => setFormData({ ...formData, emi_amount: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Term (Months)</label><input type="number" required value={formData.term_months} onChange={(e) => setFormData({ ...formData, term_months: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700">Start Date</label><input type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>

                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-red-600 rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Record Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700">Payment Date</label><input type="date" required value={paymentData.payment_date} onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Amount</label><input type="number" step="0.01" required value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="mt-1 block w-full border p-2 rounded-md" /></div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="mr-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md">Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiabilitiesPage;
