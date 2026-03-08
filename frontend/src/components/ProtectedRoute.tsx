import { Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';

const ProtectedRoute = () => {
    const auth = useAuth();
    const enableAuth = import.meta.env.VITE_ENABLE_AUTH === 'true';

    useEffect(() => {
        if (enableAuth && !auth.isLoading && !auth.error && !auth.isAuthenticated) {
            auth.signinRedirect();
        }
    }, [auth.isLoading, auth.error, auth.isAuthenticated, auth, enableAuth]);

    if (!enableAuth) {
        return <Outlet />;
    }

    if (auth.isLoading) {
        return <div>Loading authentication...</div>;
    }

    if (auth.error) {
        return <div>Oops... {auth.error.message}</div>;
    }

    if (!auth.isAuthenticated) {
        return <div>Redirecting to login...</div>;
    }


    return <Outlet />;
};

export default ProtectedRoute;
