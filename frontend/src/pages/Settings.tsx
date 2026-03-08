import React, { useState, useEffect } from 'react';
import settingsApi, { type LookupValue } from '../api/settingsApi';
import friendsApi, { type Friend } from '../api/friendsApi';
import { UserMinus, Settings, Users } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const [lookupTypes, setLookupTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [lookupValues, setLookupValues] = useState<LookupValue[]>([]);
    const [newValue, setNewValue] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    // Friend State
    const [friends, setFriends] = useState<Friend[]>([]);
    const [newFriendName, setNewFriendName] = useState('');
    const [activeTab, setActiveTab] = useState<'lookups' | 'friends'>('lookups');

    useEffect(() => {
        fetchLookupTypes();
        fetchFriends();
    }, []);

    useEffect(() => {
        if (selectedType) {
            fetchLookupValues(selectedType);
        }
    }, [selectedType]);

    const fetchFriends = async () => {
        try {
            const data = await friendsApi.getFriends();
            setFriends(data);
        } catch (error) {
            console.error("Failed to fetch friends", error);
        }
    };

    const fetchLookupTypes = async () => {
        try {
            const types = await settingsApi.getLookupTypes();
            setLookupTypes(types);
            if (types.length > 0 && !selectedType) {
                setSelectedType(types[0]);
            }
        } catch (error) {
            console.error("Failed to fetch lookup types", error);
        }
    };

    const fetchLookupValues = async (type: string) => {
        try {
            const values = await settingsApi.getLookupValuesByType(type);
            setLookupValues(values);
        } catch (error) {
            console.error("Failed to fetch lookup values", error);
        }
    };

    const handleAddValue = async () => {
        if (!newValue.trim()) return;
        try {
            await settingsApi.createLookupValue(selectedType, { value: newValue });
            setNewValue('');
            fetchLookupValues(selectedType);
        } catch (error) {
            console.error("Failed to add value", error);
        }
    };

    const handleUpdateValue = async (id: string, isActive: boolean) => {
        if (!editingValue.trim()) return;
        try {
            await settingsApi.updateLookupValue(id, { value: editingValue, is_active: isActive });
            setEditingId(null);
            setEditingValue('');
            fetchLookupValues(selectedType);
        } catch (error) {
            console.error("Failed to update value", error);
        }
    };

    const handleDeleteValue = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this value?")) return;
        try {
            await settingsApi.deleteLookupValue(id);
            fetchLookupValues(selectedType);
        } catch (error) {
            console.error("Failed to delete value", error);
        }
    };

    const handleAddFriend = async () => {
        if (!newFriendName.trim()) return;
        try {
            await friendsApi.createFriend(newFriendName);
            setNewFriendName('');
            fetchFriends();
        } catch (error) {
            console.error("Failed to add friend", error);
        }
    };

    const handleDeleteFriend = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this friend? This will also delete all transaction history with them.")) return;
        try {
            await friendsApi.deleteFriend(id);
            fetchFriends();
        } catch (error) {
            console.error("Failed to delete friend", error);
        }
    };

    const startEditing = (val: LookupValue) => {
        setEditingId(val.id);
        setEditingValue(val.value);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingValue('');
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                    <Settings className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Configuration</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('lookups')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'lookups' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                >
                    <Settings className="w-4 h-4" />
                    Categories & Values
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                >
                    <Users className="w-4 h-4" />
                    Friend Management
                </button>
            </div>

            {activeTab === 'lookups' ? (
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar for Types */}
                    <div className="w-full md:w-1/3 space-y-2">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Metadata Categories</h2>
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                            {lookupTypes.map((type) => (
                                <button
                                    key={type}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${selectedType === type ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    {type.replace(/_/g, ' ').toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content for Values */}
                    <div className="w-full md:w-2/3">
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                            <h2 className="text-xl font-black text-gray-800 mb-6">
                                Manage {selectedType.replace(/_/g, ' ')}
                            </h2>

                            <div className="flex gap-3 mb-8">
                                <input
                                    type="text"
                                    className="flex-grow bg-gray-50 border-0 rounded-2xl px-5 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder={`Add new ${selectedType.replace(/_/g, ' ')}...`}
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                                />
                                <button
                                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                    onClick={handleAddValue}
                                >
                                    Add
                                </button>
                            </div>

                            <div className="space-y-3">
                                {lookupValues.map((val) => (
                                    <div key={val.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                        {editingId === val.id ? (
                                            <div className="flex gap-2 flex-grow">
                                                <input
                                                    type="text"
                                                    className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex-grow font-medium"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    autoFocus
                                                />
                                                <button
                                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold"
                                                    onClick={() => handleUpdateValue(val.id, val.is_active)}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold"
                                                    onClick={cancelEditing}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-bold text-gray-700">{val.value}</span>
                                                <div className="flex gap-4">
                                                    <button
                                                        className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors"
                                                        onClick={() => startEditing(val)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="text-sm font-bold text-gray-400 hover:text-rose-600 transition-colors"
                                                        onClick={() => handleDeleteValue(val.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 text-indigo-500" />
                            <h2 className="text-2xl font-black text-gray-800">Mutual Settlement Friends</h2>
                        </div>
                        <p className="text-gray-500 mb-8 font-medium">Add friends you frequently split expenses with or borrow/lend money from.</p>

                        <div className="flex gap-3 mb-8">
                            <input
                                type="text"
                                className="flex-grow bg-gray-50 border-0 rounded-2xl px-5 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Enter friend's name..."
                                value={newFriendName}
                                onChange={(e) => setNewFriendName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                            />
                            <button
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                onClick={handleAddFriend}
                            >
                                Add Friend
                            </button>
                        </div>

                        <div className="space-y-3">
                            {friends.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                                    <p className="text-gray-400 font-bold italic text-sm">No friends added yet.</p>
                                </div>
                            ) : (
                                friends.map((friend) => (
                                    <div key={friend.id} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">
                                                {friend.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-800">{friend.name}</span>
                                        </div>
                                        <button
                                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            onClick={() => handleDeleteFriend(friend.id)}
                                            title="Delete Friend"
                                        >
                                            <UserMinus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
