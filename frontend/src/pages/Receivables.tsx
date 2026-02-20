import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { CheckCircle, Clock, IndianRupee, User, Info } from 'lucide-react';

interface Receivable {
    id: string;
    date: string;
    person_name: string;
    total_owed: number;
    amount_received: number;
    status: string;
    notes?: string;
    reference_id?: string;
}

const Receivables: React.FC = () => {
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReceivables = async () => {
        setLoading(true);
        try {
            const response = await api.get('/receivables/');
            setReceivables(response.data);
        } catch (error) {
            console.error("Failed to fetch receivables", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, []);

    const markAsReceived = async (id: string, amount: number) => {
        try {
            await api.put(`/receivables/${id}`, { amount_received: amount });
            fetchReceivables();
        } catch (error) {
            console.error("Error updating receivable", error);
        }
    };

    const totalOutstanding = receivables
        .filter(r => r.status !== 'settled')
        .reduce((acc, r) => acc + (r.total_owed - r.amount_received), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Receivables</h2>
                    <p className="text-gray-500 text-sm">Track money owed to you.</p>
                </div>
                <div className="w-full sm:w-auto bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-xl flex items-center gap-4">
                    <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                        <IndianRupee size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase block tracking-wider">Total Owed</span>
                        <span className="text-xl md:text-2xl font-black text-amber-900">₹{totalOutstanding.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Owed</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {receivables.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{r.date}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <User size={14} className="text-gray-400" />
                                    {r.person_name}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">₹{r.total_owed}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">₹{r.amount_received}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {r.status === 'settled' ? (
                                        <span className="flex items-center gap-1 text-green-600 font-bold">
                                            <CheckCircle size={14} /> Settled
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                                            <Clock size={14} /> {r.status === 'partial' ? 'Partial' : 'Pending'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {r.status !== 'settled' && (
                                        <button
                                            onClick={() => markAsReceived(r.id, r.total_owed)}
                                            className="text-white bg-green-600 px-3 py-1 rounded-md hover:bg-green-700 text-xs font-bold transition-colors whitespace-nowrap"
                                        >
                                            Settle
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {receivables.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 italic">
                                    <div className="flex flex-col items-center">
                                        <Info size={40} className="text-gray-200 mb-3" />
                                        <p className="max-w-[200px] mx-auto">No receivables found. Use "Shared Expense" in Expense form to create one.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Receivables;
