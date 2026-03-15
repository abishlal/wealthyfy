import React, { useState, useEffect } from 'react';
import friendsApi, { type Friend, type FriendBalance, type FriendLedgerEntry } from '../api/friendsApi';
import { IndianRupee, Send, UserPlus, ArrowUpCircle, ArrowDownCircle, History, X, Plus, Pencil, Trash2 } from 'lucide-react';

const FriendBalances: React.FC = () => {
    const [balances, setBalances] = useState<FriendBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState<FriendBalance | null>(null);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [ledger, setLedger] = useState<FriendLedgerEntry[]>([]);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);

    // Add Lent Modal State
    const [isAddLentModalOpen, setIsAddLentModalOpen] = useState(false);
    const [allFriends, setAllFriends] = useState<Friend[]>([]);
    const [lentFormData, setLentFormData] = useState({
        friend_id: '',
        new_friend_name: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        direction: 'friend_owes_you' as 'friend_owes_you' | 'you_owe_friend'
    });

    // Edit Transaction Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<FriendLedgerEntry | null>(null);
    const [editFormData, setEditFormData] = useState({
        amount: '',
        description: '',
        date: '',
        direction: 'friend_owes_you' as 'friend_owes_you' | 'you_owe_friend'
    });

    useEffect(() => {
        fetchBalances();
        fetchAllFriends();
    }, []);

    const fetchBalances = async () => {
        try {
            setLoading(true);
            const data = await friendsApi.getBalances();
            const formattedData = data.map(b => ({
                ...b,
                net_balance: Number(b.net_balance),
                you_owe: Number(b.you_owe),
                you_are_owed: Number(b.you_are_owed)
            }));
            setBalances(formattedData);
        } catch (error) {
            console.error('Failed to fetch friend balances', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFriends = async () => {
        try {
            const data = await friendsApi.getFriends();
            setAllFriends(data);
        } catch (error) {
            console.error('Failed to fetch friends', error);
        }
    };

    const handleSettle = async () => {
        if (!selectedFriend) return;

        try {
            await friendsApi.createTransaction(selectedFriend.friend_id, {
                friend_id: selectedFriend.friend_id,
                amount: Math.abs(selectedFriend.net_balance),
                direction: selectedFriend.net_balance > 0 ? 'you_owe_friend' : 'friend_owes_you',
                description: 'Settlement',
                date: new Date().toISOString().split('T')[0],
                is_settlement: true,
                reference_type: 'settlement'
            });

            setIsSettleModalOpen(false);
            fetchBalances();
            if (isLedgerOpen && selectedFriend) {
                const updatedLedger = await friendsApi.getLedger(selectedFriend.friend_id);
                setLedger(updatedLedger);
            }
        } catch (error) {
            console.error('Failed to settle', error);
        }
    };

    const handleAddLent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let friendId = lentFormData.friend_id;

            // 1. If choosing to add a new friend
            if (friendId === 'NEW') {
                if (!lentFormData.new_friend_name.trim()) return;
                const newFriend = await friendsApi.createFriend(lentFormData.new_friend_name);
                friendId = newFriend.id;
                await fetchAllFriends(); // Refresh list
            }

            if (!friendId) return;

            // 2. Create the transaction
            await friendsApi.createTransaction(friendId, {
                friend_id: friendId,
                amount: parseFloat(lentFormData.amount),
                direction: lentFormData.direction,
                description: lentFormData.description,
                date: lentFormData.date,
                is_settlement: false,
                reference_type: 'manual'
            });

            // 3. Reset and Close
            setIsAddLentModalOpen(false);
            setLentFormData({
                friend_id: '',
                new_friend_name: '',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                direction: 'friend_owes_you'
            });
            fetchBalances();
        } catch (error) {
            console.error('Failed to add lent transaction', error);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction || !selectedFriend) return;

        try {
            await friendsApi.updateTransaction(editingTransaction.id, {
                amount: parseFloat(editFormData.amount),
                description: editFormData.description,
                date: editFormData.date,
                direction: editFormData.direction
            });

            setIsEditModalOpen(false);
            fetchBalances();
            const updatedLedger = await friendsApi.getLedger(selectedFriend.friend_id);
            setLedger(updatedLedger);
        } catch (error) {
            console.error('Failed to update transaction', error);
        }
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!selectedFriend || !window.confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await friendsApi.deleteTransaction(transactionId);
            fetchBalances();
            const updatedLedger = await friendsApi.getLedger(selectedFriend.friend_id);
            setLedger(updatedLedger);
        } catch (error) {
            console.error('Failed to delete transaction', error);
        }
    };

    const openEditModal = (tx: FriendLedgerEntry) => {
        setEditingTransaction(tx);
        setEditFormData({
            amount: tx.amount.toString(),
            description: tx.description || '',
            date: tx.date,
            direction: tx.direction as 'friend_owes_you' | 'you_owe_friend'
        });
        setIsEditModalOpen(true);
    };

    const openLedger = async (friend: FriendBalance) => {
        try {
            setSelectedFriend(friend);
            const data = await friendsApi.getLedger(friend.friend_id);
            const formattedData = data.map(tx => ({
                ...tx,
                amount: Number(tx.amount),
                running_balance: Number(tx.running_balance)
            }));
            setLedger(formattedData);
            setIsLedgerOpen(true);
        } catch (error) {
            console.error('Failed to fetch ledger', error);
        }
    };

    const totalYouOwe = balances.reduce((acc, curr) => acc + curr.you_owe, 0);
    const totalYouAreOwed = balances.reduce((acc, curr) => acc + curr.you_are_owed, 0);
    const netPosition = totalYouAreOwed - totalYouOwe;

    if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading settlement data...</div>;

    return (
        <div className="space-y-6 font-sans">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Owed to You</p>
                    <div className="flex items-center gap-1 text-emerald-700 font-black text-lg">
                        <IndianRupee size={16} />
                        {totalYouAreOwed}
                    </div>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">You Owe</p>
                    <div className="flex items-center gap-1 text-rose-700 font-black text-lg">
                        <IndianRupee size={16} />
                        {totalYouOwe}
                    </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Net Position</p>
                    <div className="flex items-center gap-1 text-indigo-700 font-black text-lg">
                        <IndianRupee size={16} />
                        {netPosition}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-500" />
                        Settlement Ledger
                    </h2>
                    <button
                        onClick={() => setIsAddLentModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                    >
                        <Plus size={14} />
                        Add Lent
                    </button>
                </div>

                <div className="space-y-3">
                    {balances.length === 0 ? (
                        <p className="text-gray-400 text-center py-8 text-sm font-bold bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 uppercase tracking-widest">No Active Debts</p>
                    ) : (
                        balances.map((balance) => (
                            <div key={balance.friend_id} className="group relative bg-gray-50 rounded-2xl p-4 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                                <div className="flex items-center justify-between">
                                    <div className="cursor-pointer" onClick={() => openLedger(balance)}>
                                        <p className="font-black text-gray-800 uppercase tracking-wider text-xs mb-1">{balance.friend_name}</p>
                                        <div className={`flex items-center gap-1 font-black text-base ${balance.net_balance > 0 ? 'text-emerald-600' : balance.net_balance < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                                            <IndianRupee size={12} strokeWidth={3} />
                                            {Math.abs(balance.net_balance)}
                                            <span className="text-[10px] uppercase ml-1 opacity-70">
                                                {balance.net_balance > 0 ? 'Owes you' : balance.net_balance < 0 ? 'You owe' : 'Settled'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openLedger(balance)}
                                            className="p-2 bg-white text-gray-400 rounded-xl hover:text-indigo-600 hover:bg-white shadow-sm transition-all"
                                            title="History"
                                        >
                                            <History size={18} />
                                        </button>
                                        {balance.net_balance !== 0 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedFriend(balance);
                                                    setIsSettleModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                            >
                                                <Send size={14} />
                                                Settle
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Lent Modal */}
            {isAddLentModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 scale-in-center overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">Record Lent</h3>
                            <button onClick={() => setIsAddLentModalOpen(false)} className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddLent} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Friend</label>
                                <select
                                    required
                                    value={lentFormData.friend_id}
                                    onChange={(e) => setLentFormData({ ...lentFormData, friend_id: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                >
                                    <option value="">Select Friend</option>
                                    {allFriends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    <option value="NEW">+ Add New Friend</option>
                                </select>
                            </div>

                            {lentFormData.friend_id === 'NEW' && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">New Friend Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter name"
                                        value={lentFormData.new_friend_name}
                                        onChange={(e) => setLentFormData({ ...lentFormData, new_friend_name: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Direction</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLentFormData({ ...lentFormData, direction: 'friend_owes_you' })}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${lentFormData.direction === 'friend_owes_you' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                    >
                                        Lent to Friend
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLentFormData({ ...lentFormData, direction: 'you_owe_friend' })}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${lentFormData.direction === 'you_owe_friend' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                    >
                                        Borrowed from Friend
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            required
                                            placeholder="0.00"
                                            value={lentFormData.amount}
                                            onChange={(e) => setLentFormData({ ...lentFormData, amount: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-8 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={lentFormData.date}
                                        onChange={(e) => setLentFormData({ ...lentFormData, date: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Description</label>
                                <textarea
                                    placeholder="What was this for?"
                                    value={lentFormData.description}
                                    onChange={(e) => setLentFormData({ ...lentFormData, description: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none min-h-[80px]"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddLentModalOpen(false)}
                                    className="flex-1 px-4 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-4 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all"
                                >
                                    Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Transaction Modal */}
            {isEditModalOpen && editingTransaction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 scale-in-center overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">Edit Transaction</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Direction</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditFormData({ ...editFormData, direction: 'friend_owes_you' })}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${editFormData.direction === 'friend_owes_you' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                    >
                                        Lent to Friend
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditFormData({ ...editFormData, direction: 'you_owe_friend' })}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${editFormData.direction === 'you_owe_friend' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                    >
                                        Borrowed from Friend
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            required
                                            placeholder="0.00"
                                            value={editFormData.amount}
                                            onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-8 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={editFormData.date}
                                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Description</label>
                                <textarea
                                    placeholder="What was this for?"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none min-h-[80px]"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-4 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                                >
                                    Update Transaction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ledger Modal */}
            {isLedgerOpen && selectedFriend && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-8 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Transaction History</h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedFriend.friend_name}</p>
                            </div>
                            <button onClick={() => setIsLedgerOpen(false)} className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {ledger.map((tx, idx) => (
                                <div key={idx} className="group flex gap-4 items-start p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all">
                                    <div className={`p-3 rounded-full ${tx.direction === 'friend_owes_you' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {tx.direction === 'friend_owes_you' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <p className="font-black text-gray-800 text-sm">{tx.description || 'Transaction'}</p>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                                    <button
                                                        onClick={() => openEditModal(tx)}
                                                        className="text-[10px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1 hover:text-indigo-700"
                                                    >
                                                        <Pencil size={10} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(tx.id)}
                                                        className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1 hover:text-rose-700"
                                                    >
                                                        <Trash2 size={10} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="font-black text-gray-900 border-b-2 border-indigo-100">₹{tx.amount}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            <span>{tx.date} • {tx.reference_type}</span>
                                            <span className="text-indigo-400">Bal: ₹{tx.running_balance}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {ledger.length === 0 && <p className="text-center text-gray-400 font-black py-12 uppercase tracking-widest">No history available</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Settle Modal */}
            {isSettleModalOpen && selectedFriend && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
                        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 shadow-inner">
                            <Send size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Settle Balance?</h3>
                        <p className="text-gray-500 font-medium mb-8">
                            This will record a settlement transaction to bring the debt with <span className="text-indigo-600 font-black tracking-wide">{selectedFriend.friend_name}</span> to zero.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-2xl mb-8 flex justify-between items-center shadow-inner">
                            <span className="text-xs font-black uppercase text-gray-400">Total Settlement</span>
                            <span className="text-xl font-black text-indigo-600">₹{Math.abs(selectedFriend.net_balance)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsSettleModalOpen(false)}
                                className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSettle}
                                className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                            >
                                Settle Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FriendBalances;
