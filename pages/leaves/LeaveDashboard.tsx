
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import type { LeaveBalance, LeaveRequest, LeaveType, LeaveRequestStatus } from '../../types';
import { Loader2, Plus, LifeBuoy, FileText, Globe2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Select from '../../components/ui/Select';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import DatePicker from '../../components/ui/DatePicker';

// --- Reusable Components ---

const LeaveBalanceCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-card p-4 rounded-xl flex items-center gap-4 border border-border">
        <div className="bg-accent-light p-3 rounded-full">
            <Icon className="h-6 w-6 text-accent-dark" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-primary-text">{value}</p>
        </div>
    </div>
);

const LeaveStatusChip: React.FC<{ status: LeaveRequestStatus }> = ({ status }) => {
    const styles: Record<LeaveRequestStatus, string> = {
        pending_manager_approval: 'bg-yellow-100 text-yellow-800',
        pending_hr_confirmation: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };
    const text = status.replace(/_/g, ' ');
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status]}`}>{text}</span>;
};


// --- Leave Application Modal ---

const leaveSchema = yup.object({
    leaveType: yup.string<LeaveType>().oneOf(['Earned', 'Sick', 'Floating']).required('Leave type is required'),
    reason: yup.string().required('Reason is required').min(10, 'Reason must be at least 10 characters'),
    dayOption: yup.string<'full' | 'half'>().when(['leaveType', 'startDate', 'endDate'], {
        is: (leaveType: LeaveType, startDate: string, endDate: string) => leaveType === 'Earned' && startDate === endDate,
        then: schema => schema.oneOf(['full', 'half']).required('Please select full or half day for single-day earned leaves'),
        otherwise: schema => schema.optional().nullable(),
    }),
    startDate: yup.string().required('Start date is required')
      .test('not-in-past', 'Start date cannot be in the past', function(value) {
        if (!value) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(value.replace(/-/g, '/')) >= today;
      }),
    endDate: yup.string().required('End date is required')
        .test('is-after-start', 'End date cannot be before start date', function (value) {
            const { startDate } = this.parent;
            if (!startDate || !value) return true;
            return new Date(value.replace(/-/g, '/')) >= new Date(startDate.replace(/-/g, '/'));
        }),
}).defined();

interface LeaveFormInputs {
    leaveType: LeaveType;
    reason: string;
    dayOption?: 'full' | 'half' | null;
    startDate: string;
    endDate: string;
}

const LeaveFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}> = ({ isOpen, onClose, onSubmitSuccess }) => {
    const { user } = useAuthStore();
    const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<LeaveFormInputs>({
        resolver: yupResolver(leaveSchema),
        defaultValues: { leaveType: 'Earned', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') }
    });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const watchLeaveType = watch('leaveType');
    const watchStartDate = watch('startDate');
    const watchEndDate = watch('endDate');
    const isSingleDayEarnedLeave = watchLeaveType === 'Earned' && watchStartDate === watchEndDate;

    const onSubmit: SubmitHandler<LeaveFormInputs> = async (data) => {
        if (!user) return;
        try {
            await api.submitLeaveRequest({ userName: user.name, userId: user.id, ...data });
            setToast({ message: 'Leave request submitted successfully!', type: 'success' });
            setTimeout(() => {
                onClose();
                onSubmitSuccess();
            }, 1500);
        } catch (error) {
            setToast({ message: 'Failed to submit request.', type: 'error' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
            <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-lg m-4 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-primary-text mb-4">Apply for Leave</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Controller name="leaveType" control={control} render={({ field }) => (
                        <Select label="Leave Type" {...field} error={errors.leaveType?.message}>
                            <option value="Earned">Earned Leave</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Floating">Floating Holiday</option>
                        </Select>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller name="startDate" control={control} render={({ field }) => <DatePicker label="Start Date" id="startDate" {...field} error={errors.startDate?.message} />} />
                        <Controller name="endDate" control={control} render={({ field }) => <DatePicker label="End Date" id="endDate" {...field} error={errors.endDate?.message} />} />
                    </div>
                    {isSingleDayEarnedLeave && (
                        <Controller name="dayOption" control={control} render={({ field }) => (
                             <Select label="Day Option" {...field} error={errors.dayOption?.message}>
                                <option value="">Select Option</option>
                                <option value="full">Full Day</option>
                                <option value="half">Half Day</option>
                            </Select>
                        )} />
                    )}
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-muted">Reason</label>
                        <textarea id="reason" {...register('reason')} rows={3} className={`form-input mt-1 ${errors.reason ? 'form-input--error' : ''}`} />
                        {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting}>Submit Request</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---

const LeaveDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [balance, requests] = await Promise.all([
                api.getLeaveBalancesForUser(user.id),
                api.getLeaveRequests({ userId: user.id }),
            ]);
            setLeaveBalance(balance);
            setLeaveRequests(requests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        } catch (error) {
            setToast({ message: 'Failed to load leave data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmitSuccess = () => {
        fetchData();
    };

    if (isLoading || !user || !leaveBalance) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <div className="space-y-8">
            {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
            <LeaveFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmitSuccess={handleSubmitSuccess} />
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-primary-text">Tracker</h2>
                <Button onClick={() => setIsModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Apply for Leave</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <LeaveBalanceCard title="Earned Leave" value={`${leaveBalance.earnedTotal - leaveBalance.earnedUsed} / ${leaveBalance.earnedTotal}`} icon={Globe2} />
                <LeaveBalanceCard title="Sick Leave" value={`${leaveBalance.sickTotal - leaveBalance.sickUsed} / ${leaveBalance.sickTotal}`} icon={Globe2} />
                <LeaveBalanceCard title="Floating Holiday" value={`${leaveBalance.floatingTotal - leaveBalance.floatingUsed} / ${leaveBalance.floatingTotal}`} icon={FileText} />
            </div>

            <div className="bg-card p-6 rounded-xl shadow-card">
                <h3 className="text-xl font-bold text-primary-text mb-4">Leave History</h3>
                <div>
                    <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 px-4 py-2 bg-page rounded-t-lg">
                        <p className="font-semibold text-xs uppercase text-muted">Type</p>
                        <p className="font-semibold text-xs uppercase text-muted">Dates</p>
                        <p className="font-semibold text-xs uppercase text-muted">Reason</p>
                    </div>
                    {leaveRequests.length > 0 ? (
                        <div className="divide-y sm:divide-y-0">
                        {leaveRequests.map(req => (
                            <div key={req.id} className="p-4 sm:px-4 sm:py-3">
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    {/* Mobile View: Stacked */}
                                    <div className="sm:hidden">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{req.leaveType}</p>
                                                <p className="text-sm text-muted">{format(new Date(req.startDate.replace(/-/g, '/')), 'dd MMM yy')} - {format(new Date(req.endDate.replace(/-/g, '/')), 'dd MMM yy')}</p>
                                            </div>
                                            <LeaveStatusChip status={req.status} />
                                        </div>
                                        <p className="text-sm text-muted mt-2">{req.reason}</p>
                                    </div>
                                    
                                    {/* Desktop View: Grid */}
                                    <div className="hidden sm:flex sm:items-center">
                                        <div>
                                            <p className="font-semibold">{req.leaveType}</p>
                                            <LeaveStatusChip status={req.status} />
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex sm:items-center text-sm text-muted">
                                        <span>{format(new Date(req.startDate.replace(/-/g, '/')), 'dd MMM yy')} - {format(new Date(req.endDate.replace(/-/g, '/')), 'dd MMM yy')}</span>
                                    </div>
                                    <div className="hidden sm:flex sm:items-center text-sm text-muted">
                                        <p className="truncate">{req.reason}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-muted text-center py-8">No leave history found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveDashboard;
