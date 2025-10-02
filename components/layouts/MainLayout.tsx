
import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { User, LogOut, LayoutDashboard, FileText, Settings, Users, Briefcase, ChevronDown, Building, ClipboardList, ShieldCheck, Menu, X, ChevronsLeft, ChevronsRight, Clock, Crosshair, ClipboardCheck as ClipboardCheckIcon, ListTodo, Bell, FileBadge, ShieldHalf, ClipboardEdit, Shirt, ArrowLeft, Receipt, ChevronUp, Map } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import Logo from '../ui/Logo';
import type { Permission } from '../../types';
import NotificationBell from '../notifications/NotificationBell';
import { useNotificationStore } from '../../store/notificationStore';
import Button from '../ui/Button';
import { useUiSettingsStore } from '../../store/uiSettingsStore';
import MobileNavBar from './MobileNavBar';
import Modal from '../ui/Modal';

interface NavLinkConfig {
  to: string;
  label: string;
  icon: React.ElementType;
  permission: Permission;
}

const allNavLinks: NavLinkConfig[] = [
  { to: '/verification/dashboard', label: 'All Submissions', icon: LayoutDashboard, permission: 'view_all_submissions' },
  { to: '/developer/api', label: 'API Settings', icon: Settings, permission: 'view_developer_settings' },
  { to: '/admin/approval-workflow', label: 'Approval Workflow', icon: ClipboardList, permission: 'manage_approval_workflow' },
  { to: '/attendance/dashboard', label: 'Attendance', icon: Clock, permission: 'view_own_attendance' },
  { to: '/hr/attendance-settings', label: 'Attendance Rules', icon: Settings, permission: 'manage_attendance_rules' },
  { to: '/hr/entities', label: 'Client Management', icon: ClipboardList, permission: 'view_entity_management' },
  { to: '/hr/enrollment-rules', label: 'Enrollment Rules', icon: ClipboardEdit, permission: 'manage_enrollment_rules' },
  { to: '/hr/field-officer-tracking', label: 'Field Officer Tracking', icon: Map, permission: 'view_field_officer_tracking' },
  { to: '/hr/policies-and-insurance', label: 'Insurance Management', icon: ShieldHalf, permission: 'manage_insurance' },
  { to: '/billing/summary', label: 'Invoice Summary', icon: Receipt, permission: 'view_invoice_summary' },
  { to: '/hr/leave-management', label: 'Leave Management', icon: ClipboardCheckIcon, permission: 'manage_leave_requests' },
  { to: '/onboarding', label: 'New Enrollment', icon: FileText, permission: 'create_enrollment' },
  { to: '/operations/dashboard', label: 'Operations', icon: Briefcase, permission: 'view_operations_dashboard' },
  { to: '/admin/roles', label: 'Role Management', icon: ShieldCheck, permission: 'manage_roles_and_permissions' },
  { to: '/site/dashboard', label: 'Site Dashboard', icon: LayoutDashboard, permission: 'view_site_dashboard' },
  { to: '/admin/sites', label: 'Site Management', icon: Building, permission: 'manage_sites' },
  { to: '/tasks', label: 'Task Management', icon: ListTodo, permission: 'manage_tasks' },
  { to: '/uniforms', label: 'Uniform Management', icon: Shirt, permission: 'manage_uniforms' },
  { to: '/admin/users', label: 'User Management', icon: Users, permission: 'manage_users' },
];

const SidebarContent: React.FC<{ isCollapsed: boolean, onLinkClick?: () => void }> = ({ isCollapsed, onLinkClick }) => {
    const { user } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const availableNavLinks = user ? allNavLinks
      .filter(link => permissions[user.role]?.includes(link.permission))
      .sort((a, b) => a.label.localeCompare(b.label))
      : [];

    return (
        <div className="flex flex-col h-full">
            <div className={`p-4 border-b border-border flex justify-center h-11 items-center transition-all duration-300 flex-shrink-0`}>
                {isCollapsed ? (
                    <ShieldCheck className="h-8 w-8 text-accent"/>
                ) : (
                    <Logo />
                )}
            </div>
            <nav className="px-2 py-4 space-y-1 flex-1 overflow-y-auto">
                {availableNavLinks.map(link => (
                    <ReactRouterDOM.NavLink
                        key={link.to}
                        to={link.to}
                        onClick={onLinkClick}
                        className={({ isActive }) => 
                            `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ease-in-out ${isCollapsed ? 'justify-center' : ''} ${
                                isActive 
                                ? 'bg-accent text-white shadow-md' 
                                : 'text-muted hover:bg-accent hover:text-white'
                            }`
                        }
                        title={isCollapsed ? link.label : undefined}
                    >
                        <link.icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span>{link.label}</span>}
                    </ReactRouterDOM.NavLink>
                ))}
            </nav>
        </div>
    );
};


const MainLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const { fetchNotifications } = useNotificationStore();
    const { autoScrollOnHover } = useUiSettingsStore();
    const navigate = ReactRouterDOM.useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const location = ReactRouterDOM.useLocation();
    
    const pageScrollIntervalRef = useRef<number | null>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showScrollButtons, setShowScrollButtons] = useState(false);
    
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isFieldOfficer = user?.role === 'field_officer';
    const isMobileOfficerExperience = isFieldOfficer && isMobile;

    const isMobileOfficerFlowPage = location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/leaves/dashboard');
    const isMobileOfficerFlow = isMobileOfficerExperience && isMobileOfficerFlowPage;
    
    const showMobileNavBar = isMobileOfficerFlow;

    useEffect(() => {
        if (isMobileOfficerFlow) {
            document.body.classList.add('field-officer-dark-theme');
        } else {
            document.body.classList.remove('field-officer-dark-theme');
        }
        // Cleanup function
        return () => {
            document.body.classList.remove('field-officer-dark-theme');
        };
    }, [isMobileOfficerFlow]);
    
    useEffect(() => {
      if (user) {
        fetchNotifications();
      }
    }, [user, fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const stopPageScrolling = useCallback(() => {
        if (pageScrollIntervalRef.current) {
            clearInterval(pageScrollIntervalRef.current);
            pageScrollIntervalRef.current = null;
        }
    }, []);

    const handleScroll = useCallback(() => {
        const mainEl = mainContentRef.current;
        if (mainEl) {
            const isScrollable = mainEl.scrollHeight > mainEl.clientHeight;
            setShowScrollButtons(isScrollable);
            setScrollPosition(mainEl.scrollTop);
        }
    }, []);


    useEffect(() => {
        const mainEl = mainContentRef.current;
        mainEl?.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        
        handleScroll();

        return () => {
            mainEl?.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            stopPageScrolling();
        };
    }, [handleScroll, stopPageScrolling]);

    const handleScrollUp = useCallback(() => {
        mainContentRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    }, []);

    const handleScrollDown = useCallback(() => {
        mainContentRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }, []);

    const startPageScrolling = useCallback((direction: 'up' | 'down') => {
        stopPageScrolling();
        const handler = direction === 'up' ? handleScrollUp : handleScrollDown;
        handler();
        pageScrollIntervalRef.current = window.setInterval(handler, 300);
    }, [handleScrollUp, handleScrollDown, stopPageScrolling]);

    const getRoleName = (role: string) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    const handleLogoutClick = () => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = async () => {
        setIsLogoutModalOpen(false);
        await logout();
        navigate('/auth/login');
    };

    return (
        <div className={`flex h-screen bg-page ${isMobileOfficerFlow ? 'p-0' : 'p-8 gap-8'}`}>
            <Modal
              isOpen={isLogoutModalOpen}
              onClose={() => setIsLogoutModalOpen(false)}
              onConfirm={handleConfirmLogout}
              title="Confirm Log Out"
            >
              Are you sure you want to log out?
            </Modal>
            {/* Sidebar (hidden for mobile enrollment view) */}
            {!isMobileOfficerFlow && (
                <>
                    {/* Desktop Sidebar */}
                    <aside className={`hidden md:flex md:flex-col md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-card rounded-2xl shadow-card`}>
                        <SidebarContent isCollapsed={isSidebarCollapsed} />
                        <div className="flex-shrink-0 px-2 pt-2 border-t border-border mt-auto">
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="w-full flex items-center justify-center p-2 rounded-lg text-muted hover:bg-page transition-colors"
                                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {isSidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                            </button>
                        </div>
                    </aside>

                    {/* Mobile Sidebar & Backdrop */}
                    {isMobileMenuOpen && (
                        <>
                            <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true"></div>
                            <aside 
                                className="fixed inset-y-0 left-0 w-64 bg-card z-40 transform transition-transform duration-300 ease-in-out md:hidden rounded-r-2xl shadow-lg"
                                style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
                            >
                                 <SidebarContent isCollapsed={false} onLinkClick={() => setIsMobileMenuOpen(false)} />
                            </aside>
                        </>
                    )}
                </>
            )}
            
            <div className={`flex-1 flex flex-col ${isMobileOfficerFlow ? '' : 'bg-card rounded-2xl shadow-card'}`}>
                {/* Top Header (not shown for mobile enrollment) */}
                {!isMobileOfficerFlow && (
                    <header className="bg-card border-b border-border z-30 flex-shrink-0">
                        <div className="px-4 sm:px-6 lg:px-8">
                             <div className="flex items-center h-11">
                                <div className="flex-none w-10">
                                    {isFieldOfficer ? (
                                        <Button variant="icon" onClick={() => navigate(-1)} aria-label="Go back">
                                            <ArrowLeft className="h-5 w-5 text-primary-text" />
                                        </Button>
                                    ) : (
                                        <div className="md:hidden">
                                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-primary-text hover:bg-page focus:outline-none">
                                                <span className="sr-only">Open main menu</span>
                                                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 flex justify-center min-w-0 px-2">
                                    {isFieldOfficer && <Logo className="h-8" />}
                                </div>

                                <div className="flex-none flex justify-end w-auto min-w-10">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <NotificationBell />
                                        {user && (
                                            <div className="relative" ref={userMenuRef}>
                                                <button
                                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-page transition-colors"
                                                    aria-expanded={isUserMenuOpen}
                                                    aria-haspopup="true"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center">
                                                        <User className="h-5 w-5 text-accent-dark" />
                                                    </div>
                                                    <div className="text-left hidden sm:block">
                                                        <span className="text-sm font-semibold">{user.name}</span>
                                                        <span className="text-xs text-muted block">{getRoleName(user.role)}</span>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted" />
                                                </button>

                                                {isUserMenuOpen && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-card border border-border py-1 z-40 animate-fade-in-down">
                                                        <ReactRouterDOM.Link
                                                            to="/profile"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center px-4 py-2 text-sm text-primary-text hover:bg-page"
                                                        >
                                                            <User className="mr-2 h-4 w-4" />
                                                            Profile
                                                        </ReactRouterDOM.Link>
                                                        {user && permissions[user.role]?.includes('apply_for_leave') && (
                                                            <ReactRouterDOM.Link
                                                                to="/leaves/dashboard"
                                                                onClick={() => setIsUserMenuOpen(false)}
                                                                className="flex items-center px-4 py-2 text-sm text-primary-text hover:bg-page"
                                                            >
                                                                <Crosshair className="mr-2 h-4 w-4" />
                                                                Tracker
                                                            </ReactRouterDOM.Link>
                                                        )}
                                                        <button
                                                            onClick={handleLogoutClick}
                                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-page"
                                                        >
                                                            <LogOut className="mr-2 h-4 w-4" />
                                                            Log Out
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* Main Content */}
                <main ref={mainContentRef} className={`flex-1 bg-page ${showMobileNavBar ? 'pb-20' : ''} ${!isMobileOfficerFlow ? 'overflow-y-auto' : ''}`}>
                    <div className={isMobileOfficerFlow ? 'h-full' : 'p-4 sm:p-6 lg:p-8'}>
                        <ReactRouterDOM.Outlet />
                    </div>
                </main>
                
                {showMobileNavBar && <MobileNavBar />}
            </div>
             {/* Scroll-to-top/bottom buttons */}
            {showScrollButtons && !isMobileOfficerFlow && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 no-print">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="!rounded-full !p-2 shadow-lg"
                        onClick={handleScrollUp}
                        onMouseEnter={autoScrollOnHover ? () => startPageScrolling('up') : undefined}
                        onMouseLeave={stopPageScrolling}
                        disabled={scrollPosition <= 0}
                        aria-label="Scroll Up"
                    >
                        <ChevronUp className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="!rounded-full !p-2 shadow-lg"
                        onClick={handleScrollDown}
                        onMouseEnter={autoScrollOnHover ? () => startPageScrolling('down') : undefined}
                        onMouseLeave={stopPageScrolling}
                        disabled={mainContentRef.current ? Math.ceil(mainContentRef.current.clientHeight + scrollPosition) >= mainContentRef.current.scrollHeight : false}
                        aria-label="Scroll Down"
                    >
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MainLayout;