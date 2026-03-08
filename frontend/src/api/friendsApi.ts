import api from './axios';

export interface Friend {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

export interface FriendBalance {
    friend_id: string;
    friend_name: string;
    net_balance: number;
    you_owe: number;
    you_are_owed: number;
}

export interface FriendTransaction {
    id: string;
    friend_id: string;
    amount: number;
    direction: 'friend_owes_you' | 'you_owe_friend';
    reference_type?: 'expense' | 'manual' | 'settlement';
    reference_id?: string;
    description?: string;
    date: string;
    is_settlement: boolean;
}

export interface FriendLedgerEntry {
    id: string;
    date: string;
    reference_type: string;
    amount: number;
    direction: string;
    description?: string;
    running_balance: number;
}

const friendsApi = {
    getFriends: async () => {
        const response = await api.get<Friend[]>('/friends/');
        return response.data;
    },

    createFriend: async (name: string) => {
        const response = await api.post<Friend>('/friends/', { name });
        return response.data;
    },

    deleteFriend: async (id: string) => {
        await api.delete(`/friends/${id}`);
    },

    getBalances: async () => {
        const response = await api.get<FriendBalance[]>('/friends/balances');
        return response.data;
    },

    getFriendBalance: async (id: string) => {
        const response = await api.get<FriendBalance>(`/friends/${id}/balance`);
        return response.data;
    },

    getLedger: async (id: string) => {
        const response = await api.get<FriendLedgerEntry[]>(`/friends/${id}/ledger`);
        return response.data;
    },

    createTransaction: async (friendId: string, transaction: Omit<FriendTransaction, 'id' | 'user_id'>) => {
        const response = await api.post<FriendTransaction>(`/friends/${friendId}/transactions`, transaction);
        return response.data;
    },

    updateTransaction: async (transactionId: string, transaction: Partial<Omit<FriendTransaction, 'id'>>) => {
        const response = await api.put<FriendTransaction>(`/friends/transactions/${transactionId}`, transaction);
        return response.data;
    },

    deleteTransaction: async (transactionId: string) => {
        await api.delete(`/friends/transactions/${transactionId}`);
    }
};

export default friendsApi;
