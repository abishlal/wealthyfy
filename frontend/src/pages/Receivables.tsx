import React from 'react';
import FriendBalances from '../components/FriendBalances';

// Receivables is powered by the FriendTransaction ledger.
// The old separate Receivable table was never populated by the expense flow.
const Receivables: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Friend Balances & Receivables</h2>
                <p className="text-gray-500 text-sm mt-1">Track money owed to you and debts from shared expenses.</p>
            </div>
            <FriendBalances />
        </div>
    );
};

export default Receivables;
