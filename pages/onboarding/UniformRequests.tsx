import React from 'react';
import { Shirt } from 'lucide-react';

const UniformRequests: React.FC = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Shirt className="h-16 w-16 text-gray-500 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Uniform Requests</h1>
            <p className="text-gray-400 max-w-sm">
                This page will allow you to view and manage uniform requests for different sites.
            </p>
        </div>
    );
};

export default UniformRequests;
