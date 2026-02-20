import React, { useState, useEffect } from 'react';
import settingsApi, { type LookupValue } from '../api/settingsApi';

const SettingsPage: React.FC = () => {
    const [lookupTypes, setLookupTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [lookupValues, setLookupValues] = useState<LookupValue[]>([]);
    const [newValue, setNewValue] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    useEffect(() => {
        fetchLookupTypes();
    }, []);

    useEffect(() => {
        if (selectedType) {
            fetchLookupValues(selectedType);
        }
    }, [selectedType]);

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

    const startEditing = (val: LookupValue) => {
        setEditingId(val.id);
        setEditingValue(val.value);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingValue('');
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>

            <div className="flex flex-col md:flex-row gap-4">
                {/* Sidebar for Types */}
                <div className="w-full md:w-1/4 bg-gray-100 p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Categories</h2>
                    <ul>
                        {lookupTypes.map((type) => (
                            <li
                                key={type}
                                className={`cursor-pointer p-2 rounded mb-1 ${selectedType === type ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                                onClick={() => setSelectedType(type)}
                            >
                                {type.replace('_', ' ').toUpperCase()}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content for Values */}
                <div className="w-full md:w-3/4 bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">
                        Manage {selectedType.replace('_', ' ')}
                    </h2>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="border p-2 rounded flex-grow"
                            placeholder="Add new value..."
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                        />
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            onClick={handleAddValue}
                        >
                            Add
                        </button>
                    </div>

                    <ul>
                        {lookupValues.map((val) => (
                            <li key={val.id} className="flex items-center justify-between border-b p-2">
                                {editingId === val.id ? (
                                    <div className="flex gap-2 flex-grow">
                                        <input
                                            type="text"
                                            className="border p-1 rounded flex-grow"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                        />
                                        <button
                                            className="bg-blue-500 text-white px-2 py-1 rounded"
                                            onClick={() => handleUpdateValue(val.id, val.is_active)}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="bg-gray-500 text-white px-2 py-1 rounded"
                                            onClick={cancelEditing}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span>{val.value}</span>
                                        <div className="flex gap-2">
                                            <button
                                                className="text-blue-500 hover:underline"
                                                onClick={() => startEditing(val)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-red-500 hover:underline"
                                                onClick={() => handleDeleteValue(val.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
