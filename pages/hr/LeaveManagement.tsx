import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { LeaveRequest, LeaveRequestStatus } from '../../types';
import { Loader2, Check, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const StatusChip: React.FC<{ status: LeaveRequestStatus }> = ({ status }) => {
    const styles: Record<LeaveRequestStatus, string> = {
        pending_manager_approval: 'bg-yellow-100 text-yellow-800',
        pending_hr_confirmation: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };
    const text = status.replace(/_/g, ' ');
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status]}`}>{text}</span>;
};

const LeaveManagement: React.FC = () => {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<LeaveRequestStatus | 'all'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch requests for the current user to approve, plus those pending HR confirmation if user is HR/Admin
            const data = await api.getLeaveRequests({ 
                forApproverId: user.id,
                status: filter === 'all' ? undefined : filter
            });
            setRequests(data);
        } catch (error) {
            setToast({ message: 'Failed to load leave requests.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user, filter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (id: string, action: 'approve' | 'reject' | 'confirm') => {
        if (!user) return;
        setActioningId(id);
        try {
            switch(action) {
                case 'approve':
                    await api.approveLeaveRequest(id, user.id);
                    break;
                case 'reject':
                    await api.rejectLeaveRequest(id, user.id);
                    break;
                case 'confirm':
                    await api.confirmLeaveByHR(id, user.id);
                    break;
            }
            setToast({ message: `Request actioned successfully.`, type: 'success' });
            fetchData(); // Refresh the list
        } catch (error) {
            setToast({ message: 'Failed to update request.', type: 'error' });
        } finally {
            setActioningId(null);
        }
    };
    
    const filterTabs: Array<LeaveRequestStatus | 'all'> = ['pending_manager_approval', 'pending_hr_confirmation', 'approved', 'rejected', 'all'];

    const ActionButtons: React.FC<{ request: LeaveRequest }> = ({ request }) => {
        if (!user || request.status === 'approved' || request.status === 'rejected') return null;

        const isMyTurn = request.currentApproverId === user.id;

        if (isMyTurn) {
            if (request.status === 'pending_manager_approval') {
                return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="icon" onClick={() => handleAction(request.id, 'approve')} disabled={actioningId === request.id} title="Approve" aria-label="Approve request"><Check className="h-4 w-4 text-green-600"/></Button>
                        <Button size="sm" variant="icon" onClick={() => handleAction(request.id, 'reject')} disabled={actioningId === request.id} title="Reject" aria-label="Reject request"><X className="h-4 w-4 text-red-600"/></Button>
                    </div>
                );
            }
            if (request.status === 'pending_hr_confirmation' && (user.role === 'hr' || user.role === 'admin')) {
                 return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="icon" onClick={() => handleAction(request.id, 'confirm')} disabled={actioningId === request.id} title="Confirm & Finalize" aria-label="Confirm and finalize request"><Check className="h-4 w-4 text-blue-600"/></Button>
                        <Button size="sm" variant="icon" onClick={() => handleAction(request.id, 'reject')} disabled={actioningId === request.id} title="Reject" aria-label="Reject request"><X className="h-4 w-4 text-red-600"/></Button>
                    </div>
                );
            }
        }
        return null;
    };


    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <h2 className="text-2xl font-bold text-primary-text mb-6">Leave Approval Inbox</h2>

            <div className="w-full sm:w-auto border-b border-border mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {filterTabs.map(tab => (
                         <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`${filter === tab ? 'border-accent text-accent-dark' : 'border-transparent text-muted hover:text-primary-text'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize`}
                         >
                            {tab.replace(/_/g, ' ')}
                         </button>
                    ))}
                </nav>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-page">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Employee</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Dates</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Reason</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                         {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted"/></td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-muted">No requests found for this filter.</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-4 py-3 font-medium">{req.userName}</td>
                                    <td className="px-4 py-3 text-muted">{req.leaveType} {req.dayOption && `(${req.dayOption})`}</td>
                                    <td className="px-4 py-3 text-muted">{format(new Date(req.startDate.replace(/-/g, '/')), 'dd MMM')} - {format(new Date(req.endDate.replace(/-/g, '/')), 'dd MMM')}</td>
                                    <td className="px-4 py-3 text-muted max-w-xs truncate">{req.reason}</td>
                                    <td className="px-4 py-3"><StatusChip status={req.status} /></td>
                                    <td className="px-4 py-3">
                                        <ActionButtons request={req} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManagement;