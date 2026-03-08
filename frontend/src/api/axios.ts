import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically inject the token on every request
api.interceptors.request.use((config) => {
    const enableAuth = import.meta.env.VITE_ENABLE_AUTH === 'true';
    if (!enableAuth) {
        return config;
    }

    // Find the oidc-client-ts key in localStorage (it's dynamic based on authority and client_id)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('oidc.user')) {
            const val = localStorage.getItem(key);
            if (val) {
                try {
                    const parsed = JSON.parse(val);
                    if (parsed && parsed.access_token) {
                        config.headers.Authorization = `Bearer ${parsed.access_token}`;
                        break;
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
    return config;
});


export default api;
