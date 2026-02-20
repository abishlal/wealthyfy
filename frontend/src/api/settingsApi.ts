import api from './axios';

export interface LookupValue {
    id: string;
    type: string;
    value: string;
    display_order: number;
    is_active: boolean;
}

export interface LookupValueCreate {
    value: string;
}

export interface LookupValueUpdate {
    value: string;
    is_active: boolean;
}

const settingsApi = {
    getLookupTypes: async (): Promise<string[]> => {
        const response = await api.get('/settings/types');
        return response.data;
    },

    getLookupValuesByType: async (type: string): Promise<LookupValue[]> => {
        const response = await api.get(`/settings/${type}`);
        return response.data;
    },

    createLookupValue: async (type: string, data: LookupValueCreate): Promise<LookupValue> => {
        const response = await api.post(`/settings/${type}`, data);
        return response.data;
    },

    updateLookupValue: async (id: string, data: LookupValueUpdate): Promise<LookupValue> => {
        const response = await api.put(`/settings/${id}`, data);
        return response.data;
    },

    deleteLookupValue: async (id: string): Promise<void> => {
        await api.delete(`/settings/${id}`);
    },

    getAllLookupValues: async (): Promise<Record<string, LookupValue[]>> => {
        const response = await api.get('/settings');
        return response.data;
    }
};

export default settingsApi;
