import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser, loading, isMfaEnabled } = useAuth();
    const location = useLocation();

    console.log('🛡️ [ProtectedRoute] Check:', {
        path: location.pathname,
        loading,
        hasUser: !!currentUser,
        isMfaEnabled
    });

    if (loading) {
        console.log('⏳ [ProtectedRoute] Loading...');
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!currentUser) {
        console.log('🔒 [ProtectedRoute] No user, redirecting to /login');
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Force MFA enrollment
    if (!isMfaEnabled && location.pathname !== '/profile') {
        console.log('⚠️ [ProtectedRoute] MFA not enabled, redirecting to /profile');
        return <Navigate to="/profile" state={{ mfaRequired: true }} replace />;
    }

    console.log('✅ [ProtectedRoute] Access granted');
    return <>{children}</>;
}
