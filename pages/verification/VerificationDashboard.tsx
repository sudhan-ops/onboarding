

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import type { OnboardingData } from '../../types';
import StatusChip from '../../components/ui/StatusChip';
import Button from '../../components/ui/Button';
// FIX: Switched from a namespace import to a named import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { Search, Eye, Download, Send, CheckCircle, XCircle, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import PortalSyncStatusChip from '../../components/ui/PortalSyncStatusChip';
import Toast from '../../components/ui/Toast';

const VerificationDashboard: React.FC = () => {
    const [submissions, setSubmissions] = useState<OnboardingData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const navigate = ReactRouterDOM.useNavigate();

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        try {
            // FIX: Corrected API call from getVerificationSubmissions to getVerificationSubmissions
            const data = await api.getVerificationSubmissions(statusFilter === 'all' ? undefined : statusFilter);
            setSubmissions(data);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s =>
            (s.personal.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             s.personal.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             s.personal.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
             // FIX: Property 'site' does not exist on type 'OnboardingData'. Use 'organizationName' instead.
             s.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [submissions, searchTerm]);
    
    const handleAction = async (action: 'approve' | 'reject', id: string) => {
        const originalSubmissions = [...submissions];
        
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action === 'approve' ? 'verified' : 'rejected', portalSyncStatus: action === 'approve' ? 'pending_sync' : undefined } : s));

        try {
            // FIX: Expected 2 arguments, but got 3. The API only accepts id and action.
            if (action === 'approve') {
                await api.verifySubmission(id);
            } else {
                await api.requestChanges(id, 'Changes requested by admin.');
            }
        } catch (error) {
            console.error(`Failed to ${action} submission`, error);
            setSubmissions(originalSubmissions);
        }
    };

    const handleSync = async (id: string) => {
        setSyncingId(id);
        try {
            const { status } = await api.syncPortals(id);
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, portalSyncStatus: status } : s));
            if (status === 'synced') {
                 setToast({ message: 'Portals synced successfully!', type: 'success' });
            } else {
                 setToast({ message: 'Portal sync failed. Please try again.', type: 'error' });
            }
        } catch (error) {
             setToast({ message: 'An error occurred during sync.', type: 'error' });
        } finally {
            setSyncingId(null);
        }
    };

    const filterTabs = ['all', 'pending', 'verified', 'rejected'];

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <h2 className="text-2xl font-bold text-primary-text mb-6">Onboarding Forms</h2>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full sm:w-auto border-b border-border">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {filterTabs.map(tab => (
                             <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`${
                                statusFilter === tab
                                    ? 'border-accent text-accent-dark'
                                    : 'border-transparent text-muted hover:text-primary-text hover:border-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize`}
                             >
                                {tab}
                             </button>
                        ))}
                    </nav>
                </div>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, ID, site..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-page">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Employee</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Site</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Portal Sync</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-10 text-muted">Loading submissions...</td></tr>
                        ) : filteredSubmissions.length === 0 ? (
                             <tr><td colSpan={5} className="text-center py-10 text-muted">No submissions found.</td></tr>
                        ) : (
                            filteredSubmissions.map((s) => (
                                <tr key={s.id} className={s.requiresManualVerification ? 'bg-orange-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {s.requiresManualVerification && (
                                                // FIX: Wrapped icon in a span to correctly apply the title attribute. Lucide icons do not accept a 'title' prop.
                                                <span title="Manual verification required due to data mismatch.">
                                                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                                                </span>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-primary-text">{s.personal.firstName} {s.personal.lastName}</div>
                                                <div className="text-sm text-muted">{s.personal.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* FIX: Property 'site' does not exist on type 'OnboardingData'. Use 'organizationName' instead. */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{s.organizationName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusChip status={s.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <PortalSyncStatusChip status={s.portalSyncStatus} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <Button variant="icon" size="sm" onClick={() => navigate(`/onboarding/add/personal?id=${s.id}`)} title="View Details" aria-label={`View details for ${s.personal.firstName}`}><Eye className="h-4 w-4" /></Button>
                                            <Button variant="icon" size="sm" onClick={() => navigate(`/onboarding/pdf/${s.id}`)} title="Download Forms" aria-label={`Download forms for ${s.personal.firstName}`}><FileText className="h-4 w-4" /></Button>
                                            {s.status === 'pending' && (
                                                <>
                                                 <Button variant="icon" size="sm" onClick={() => handleAction('approve', s.id!)} title="Verify" aria-label={`Verify submission for ${s.personal.firstName}`}><CheckCircle className="h-4 w-4 text-green-600"/></Button>
                                                 <Button variant="icon" size="sm" onClick={() => handleAction('reject', s.id!)} title="Request Changes" aria-label={`Request changes for ${s.personal.firstName}`}><XCircle className="h-4 w-4 text-red-600"/></Button>
                                                </>
                                            )}
                                            {s.status === 'verified' && (s.portalSyncStatus === 'pending_sync' || s.portalSyncStatus === 'failed') && (
                                                 <Button variant="outline" size="sm" onClick={() => handleSync(s.id!)} isLoading={syncingId === s.id} title="Push data to government portals">
                                                    {syncingId !== s.id && <Send className="h-4 w-4 mr-1"/>}
                                                    Sync Portals
                                                </Button>
                                            )}
                                        </div>
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

export default VerificationDashboard;