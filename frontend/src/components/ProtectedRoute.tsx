import { Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';

const ProtectedRoute = () => {
    const auth = useAuth();

    useEffect(() => {
        if (!auth.isLoading && !auth.error && !auth.isAuthenticated) {
            auth.signinRedirect();
        }
    }, [auth.isLoading, auth.error, auth.isAuthenticated, auth]);

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
