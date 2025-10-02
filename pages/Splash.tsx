
import React, { useEffect } from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/ui/Logo';

const Splash: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const { user, isInitialized } = useAuthStore();

    useEffect(() => {
        const redirect = () => {
            if (isInitialized) {
                if (user) {
                    const homeRoute = getHomeRoute(user);
                    navigate(homeRoute, { replace: true });
                } else {
                    navigate('/auth/login', { replace: true });
                }
            }
        };

        // Give a moment for the splash screen to be visible
        const timer = setTimeout(redirect, 10000);

        return () => clearTimeout(timer);
    }, [user, isInitialized, navigate]);
    
    // Helper to determine home route, copied from App.tsx to avoid circular dependency
    const getHomeRoute = (user: any) => {
        if (!user) return "/auth/login";
        switch (user.role) {
            case 'admin': return "/verification/dashboard";
            case 'hr': return "/hr/entities";
            case 'developer': return "/developer/api";
            case 'operation_manager': return "/operations/dashboard";
            case 'site_manager': return "/site/dashboard";
            case 'field_officer': return "/onboarding";
            default: return "/auth/login";
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-page p-4">
            <Logo className="h-16 mb-8 splash-logo" />
        </div>
    );
};

export default Splash;
