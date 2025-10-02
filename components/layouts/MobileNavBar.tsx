
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Home, LayoutGrid, ClipboardList, Crosshair, User } from 'lucide-react';

const MobileNavBar: React.FC = () => {
    return (
        <nav className="mobile-nav md:hidden no-print">
            <ReactRouterDOM.NavLink
                to="/onboarding/submissions"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <LayoutGrid className="h-6 w-6" />
                <span>Data sheet</span>
            </ReactRouterDOM.NavLink>
            <ReactRouterDOM.NavLink
                to="/leaves/dashboard"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <Crosshair className="h-6 w-6" />
                <span>Tracker</span>
            </ReactRouterDOM.NavLink>
            
            <ReactRouterDOM.NavLink
                to="/onboarding"
                end
                className={({ isActive }) => `mobile-nav-home-btn ${isActive ? 'active' : ''}`}
            >
                <Home className="h-8 w-8" />
            </ReactRouterDOM.NavLink>

            <ReactRouterDOM.NavLink
                to="/onboarding/tasks"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <ClipboardList className="h-6 w-6" />
                <span>Tasks</span>
            </ReactRouterDOM.NavLink>
             <ReactRouterDOM.NavLink
                to="/profile"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <User className="h-6 w-6" />
                <span>Profile</span>
            </ReactRouterDOM.NavLink>
        </nav>
    );
};

export default MobileNavBar;
