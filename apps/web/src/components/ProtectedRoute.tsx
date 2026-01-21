import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UI_ROUTES } from '@smm/shared';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, token } = useAuthStore();
    const location = useLocation();

    // If no token, redirect to login
    if (!token && !isAuthenticated) {
        return <Navigate to={UI_ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
