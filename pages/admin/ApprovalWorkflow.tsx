
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { User, UserRole } from '../../types';
import { Loader2, Save } from 'lucide-react';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

type UserWithManager = User & { managerName?: string };

const ApprovalWorkflow: React.FC = () => {
    const [users, setUsers] = useState<UserWithManager[]>([]);
    const [finalConfirmationRole, setFinalConfirmationRole] = useState<UserRole>('hr');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersData, settingsData] = await Promise.all([
                api.getUsersWithManagers(),
                api.getApprovalWorkflowSettings()
            ]);
            setUsers(usersData);
            setFinalConfirmationRole(settingsData.finalConfirmationRole);
        } catch (error) {
            setToast({ message: 'Failed to load workflow data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleManagerChange = (userId: string, managerId: string) => {
        setUsers(currentUsers =>
            currentUsers.map(u => u.id === userId ? { ...u, reportingManagerId: managerId || undefined } : u)
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // In a real app, you might want to only send changed users
            await Promise.all(users.map(u => api.updateUserReportingManager(u.id, u.reportingManagerId || null)));
            await api.updateApprovalWorkflowSettings(finalConfirmationRole);
            setToast({ message: 'Workflow saved successfully!', type: 'success' });
            fetchData(); // re-fetch to confirm names
        } catch (error) {
            setToast({ message: 'Failed to save workflow.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const allRoles: UserRole[] = ['admin', 'hr', 'operation_manager'];

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            <AdminPageHeader title="Leave Approval Workflow">
                <Button onClick={handleSave} isLoading={isSaving}><Save className="mr-2 h-4 w-4" /> Save Workflow</Button>
            </AdminPageHeader>

            <section className="mb-8">
                <h3 className="text-lg font-semibold text-primary-text mb-2">Final Confirmation Step</h3>
                <p className="text-sm text-muted mb-4">Select the role responsible for the final confirmation of a leave request after it has been approved by the reporting manager chain.</p>
                <div className="max-w-xs">
                     <Select label="Final Confirmation Role" id="final-approver" value={finalConfirmationRole} onChange={e => setFinalConfirmationRole(e.target.value as UserRole)}>
                        {allRoles.map(role => <option key={role} value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </Select>
                </div>
            </section>

            <section>
                 <h3 className="text-lg font-semibold text-primary-text mb-2">Reporting Structure</h3>
                 <p className="text-sm text-muted mb-4">For each employee, assign a reporting manager. Leave requests will be sent to this manager for first-level approval.</p>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-page">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Reporting Manager</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr><td colSpan={3} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted"/></td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-3 font-medium">{user.name}</td>
                                        <td className="px-4 py-3 text-muted">{user.role.replace(/_/g, ' ')}</td>
                                        <td className="px-4 py-3">
                                            <Select label="" id={`manager-for-${user.id}`} value={user.reportingManagerId || ''} onChange={e => handleManagerChange(user.id, e.target.value)}>
                                                <option value="">None (Reports to Final Approver)</option>
                                                {users.filter(m => m.id !== user.id).map(manager => (
                                                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                                                ))}
                                            </Select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
};

export default ApprovalWorkflow;
