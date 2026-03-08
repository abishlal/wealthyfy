import api from './axios';

export const setupAxiosInterceptors = (token: string | null) => {
    // Clear existing interceptors first to avoid duplicates if this is called multiple times
    api.interceptors.request.clear();

    if (token) {
        api.interceptors.request.use((config) => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }
};
