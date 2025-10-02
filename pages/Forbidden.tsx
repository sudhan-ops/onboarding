

import React from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

const Forbidden: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-page">
            <div className="text-center p-8 bg-card rounded-xl shadow-card max-w-lg mx-auto">
                <div className="flex justify-center mb-4">
                    <ShieldAlert className="h-16 w-16 text-red-500" />
                </div>
                <h1 className="text-4xl font-bold text-primary-text">Access Denied</h1>
                <p className="mt-4 text-lg text-muted">
                    You do not have the necessary permissions to view this page.
                </p>
                <p className="mt-2 text-sm text-muted">
                    Please contact your administrator if you believe this is an error.
                </p>
                <Button onClick={() => navigate('/auth/login')} className="mt-8">
                    Go to Login
                </Button>
            </div>
        </div>
    );
};

export default Forbidden;