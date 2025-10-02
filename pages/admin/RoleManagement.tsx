

import React from 'react';
import { usePermissionsStore } from '../../store/permissionsStore';
import type { UserRole, Permission } from '../../types';
import { ShieldCheck, Check, X } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const allPermissions: { key: Permission; name: string; description: string }[] = [
    { key: 'view_all_submissions', name: 'View All Submissions', description: 'Access the main dashboard to view all employee submissions.' },
    { key: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete user accounts.' },
    // FIX: Changed permission key to 'manage_sites' and name to 'Manage Sites' to align with the Permission type and application consistency.
    { key: 'manage_sites', name: 'Manage Sites', description: 'Create, edit, and delete organizations/sites.' },
    { key: 'view_entity_management', name: 'View Entity Management', description: 'Access the HR dashboard for managing company entities.' },
    { key: 'view_developer_settings', name: 'Developer Settings', description: 'Access API settings and other developer tools.' },
    { key: 'view_operations_dashboard', name: 'Operations Dashboard', description: 'View the operations management dashboard.' },
    { key: 'view_site_dashboard', name: 'Site Dashboard', description: 'View the dashboard for a specific site/organization.' },
    { key: 'create_enrollment', name: 'Create Enrollment', description: 'Access the multi-step form to onboard new employees.' },
    { key: 'manage_roles_and_permissions', name: 'Manage Roles & Permissions', description: 'Access this page to edit role permissions.' },
    { key: 'manage_attendance_rules', name: 'Manage Attendance Rules', description: 'Set work hours, holidays, and leave allocations.' },
    { key: 'view_own_attendance', name: 'View Own Attendance', description: 'Allows users to see their own attendance records.' },
    { key: 'view_all_attendance', name: 'View All Attendance', description: 'Allows users to see attendance records for all employees.' },
    { key: 'apply_for_leave', name: 'Apply for Leave', description: 'Allows users to request time off.' },
    { key: 'manage_leave_requests', name: 'Manage Leave Requests', description: 'Approve or reject leave requests for employees.' },
    { key: 'manage_approval_workflow', name: 'Manage Approval Workflow', description: 'Set up reporting managers for leave approvals.' },
    { key: 'download_attendance_report', name: 'Download Attendance Report', description: 'Generate and download attendance reports in CSV format.' },
    { key: 'manage_tasks', name: 'Manage Tasks', description: 'Create, assign, and manage all organizational tasks, including escalations.' },
    { key: 'manage_policies', name: 'Manage Policies', description: 'Create and manage company policies.' },
    { key: 'manage_insurance', name: 'Manage Insurance', description: 'Create and manage company insurance plans.' },
];

const allRoles: UserRole[] = ['admin', 'hr', 'developer', 'operation_manager', 'site_manager', 'field_officer'];

const getRoleName = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const RoleManagement: React.FC = () => {
    const { permissions, setRolePermissions } = usePermissionsStore();

    const handlePermissionChange = (role: UserRole, permission: Permission, checked: boolean) => {
        const currentPermissions = permissions[role] || [];
        const newPermissions = checked
            ? [...currentPermissions, permission]
            : currentPermissions.filter(p => p !== permission);
        setRolePermissions(role, newPermissions);
    };

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            <AdminPageHeader title="Role & Permission Management" />
            <p className="text-muted text-sm -mt-4 mb-6">
                Assign permissions to user roles. Changes are saved automatically. <span className="font-semibold text-red-600">Warning:</span> Modifying the Admin role can lead to being locked out of system features.
            </p>
            
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-page">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-primary-text">Permission</th>
                            {allRoles.map(role => (
                                <th key={role} scope="col" className="px-4 py-3 text-center font-bold text-primary-text w-40">{getRoleName(role)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {allPermissions.map(permission => (
                            <tr key={permission.key}>
                                <td className="px-4 py-4">
                                    <div className="font-semibold text-primary-text">{permission.name}</div>
                                    <div className="text-xs text-muted">{permission.description}</div>
                                </td>
                                {allRoles.map(role => {
                                    const isChecked = permissions[role]?.includes(permission.key);
                                    const isDisabled = (role === 'admin' && (permission.key === 'manage_roles_and_permissions' || permission.key === 'manage_approval_workflow'));
                                    const title = isDisabled ? "Admin must have permission to manage roles." : "";

                                    return (
                                        <td key={role} className="px-4 py-4 text-center align-middle">
                                            <div className="flex justify-center">
                                                <label className={`relative flex items-center justify-center w-5 h-5 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={isChecked}
                                                        onChange={(e) => handlePermissionChange(role, permission.key, e.target.checked)}
                                                        disabled={isDisabled}
                                                        title={title}
                                                    />
                                                    <span className={`w-5 h-5 bg-white border border-gray-300 rounded flex items-center justify-center 
                                                                        peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-accent-dark 
                                                                        peer-checked:border-accent
                                                                        ${isDisabled ? 'opacity-50' : ''}`}>
                                                        {isChecked ? (
                                                            <Check className="w-4 h-4 text-accent" />
                                                        ) : (
                                                            <X className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </span>
                                                </label>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoleManagement;