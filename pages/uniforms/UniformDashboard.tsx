import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import type { Organization, MasterGentsUniforms, GentsPantsSize, GentsShirtSize, MasterLadiesUniforms, LadiesPantsSize, LadiesShirtSize, UniformRequest, UniformRequestItem } from '../../types';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toast from '../../components/ui/Toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { Loader2, Plus, Shirt, Eye, Edit, Trash2, X, ChevronDown, Save } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../../components/ui/Modal';

type UniformFormData = {
    siteId: string;
    gender: 'Gents' | 'Ladies';
    pantsQuantities: Record<string, number | null>;
    shirtsQuantities: Record<string, number | null>;
};

const UniformStatusChip: React.FC<{ status: UniformRequest['status'] }> = ({ status }) => {
    const styles: Record<UniformRequest['status'], string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Issued': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status]}`}>{status}</span>;
};

const UniformSizeTable: React.FC<{
    title: string;
    sizes: (GentsPantsSize | GentsShirtSize | LadiesPantsSize | LadiesShirtSize)[];
    // FIX: Changed key type to string to allow any property from GentsPantsSize or GentsShirtSize, resolving type errors.
    headers: { key: string, label: string }[];
    control: any;
    quantityType: 'pantsQuantities' | 'shirtsQuantities';
}> = ({ title, sizes, headers, control, quantityType }) => {
    const fits = Array.from(new Set(sizes.map(s => s.fit)));
    // FIX: Fix sorting logic for both numeric and non-numeric sizes and resolve type error.
    const sizeKeys = Array.from(new Set(sizes.map(s => s.size))).sort((a,b) => {
        const numA = parseInt(String(a));
        const numB = parseInt(String(b));
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return String(a).localeCompare(String(b));
    });

    return (
        <div className="overflow-x-auto border rounded-lg">
            <h4 className="p-3 font-semibold bg-page border-b">{title}</h4>
            <table className="min-w-full text-sm">
                <thead className="bg-page">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted">Size</th>
                        {headers.map(h => <th key={String(h.key)} className="px-3 py-2 text-left font-medium text-muted">{h.label}</th>)}
                        <th className="px-3 py-2 text-left font-medium text-muted w-24">Quantity</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {sizeKeys.map(size => (
                        <React.Fragment key={size}>
                            {fits.map((fit, fitIndex) => {
                                const sizeForFit = sizes.find(s => s.size === size && s.fit === fit);
                                if (!sizeForFit) return null;
                                return (
                                    <tr key={sizeForFit.id}>
                                        {fitIndex === 0 && <td rowSpan={fits.filter(f => sizes.some(s => s.size === size && s.fit === f)).length} className="px-3 py-2 align-middle font-semibold border-r">{size}</td>}
                                        {headers.map(h => <td key={String(h.key)} className="px-3 py-2">{(sizeForFit as any)[h.key]}</td>)}
                                        <td className="px-3 py-2">
                                            <Controller
                                                name={`${quantityType}.${sizeForFit.id}`}
                                                control={control}
                                                render={({ field }) => <Input aria-label={`Quantity for ${title} size ${size} ${fit}`} type="number" {...field} value={field.value || ''} onChange={e => field.onChange(parseInt(e.target.value) || null)} className="!py-1.5" />}
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const UniformRequestForm: React.FC<{
    onSave: (data: UniformRequest) => void,
    onCancel: () => void,
    sites: Organization[],
    masterUniforms: { gents: MasterGentsUniforms, ladies: MasterLadiesUniforms },
    initialData?: UniformRequest | null,
}> = ({ onSave, onCancel, sites, masterUniforms, initialData }) => {
    const { register, control, handleSubmit, watch, reset } = useForm<UniformFormData>({
        defaultValues: { siteId: '', gender: 'Gents', pantsQuantities: {}, shirtsQuantities: {} }
    });

    const gender = watch('gender');

    useEffect(() => {
        if (initialData) {
            const pantsQuantities: Record<string, number | null> = {};
            const shirtsQuantities: Record<string, number | null> = {};
            initialData.items.forEach(item => {
                if (item.category === 'Pants') {
                    pantsQuantities[item.sizeId] = item.quantity;
                } else {
                    shirtsQuantities[item.sizeId] = item.quantity;
                }
            });
            reset({
                siteId: initialData.siteId,
                gender: initialData.gender,
                pantsQuantities,
                shirtsQuantities
            });
        } else {
            reset({ siteId: '', gender: 'Gents', pantsQuantities: {}, shirtsQuantities: {} });
        }
    }, [initialData, reset]);

    const onSubmit = (data: UniformFormData) => {
        const site = sites.find(s => s.id === data.siteId);
        if (!site) return;

        const allSizes = gender === 'Gents' 
            ? [...masterUniforms.gents.pants, ...masterUniforms.gents.shirts]
            : [...masterUniforms.ladies.pants, ...masterUniforms.ladies.shirts];

        const items: UniformRequestItem[] = [];
        
        for (const [sizeId, quantity] of Object.entries(data.pantsQuantities)) {
            if (quantity && quantity > 0) {
                const sizeInfo = allSizes.find(s => s.id === sizeId);
                if (sizeInfo) items.push({ sizeId, quantity, category: 'Pants', sizeLabel: sizeInfo.size, fit: sizeInfo.fit });
            }
        }
        for (const [sizeId, quantity] of Object.entries(data.shirtsQuantities)) {
            if (quantity && quantity > 0) {
                const sizeInfo = allSizes.find(s => s.id === sizeId);
                if (sizeInfo) items.push({ sizeId, quantity, category: 'Shirts', sizeLabel: sizeInfo.size, fit: sizeInfo.fit });
            }
        }

        const request: UniformRequest = {
            id: initialData?.id || `new_${Date.now()}`,
            siteId: data.siteId,
            siteName: site.shortName,
            gender: data.gender,
            requestedDate: initialData?.requestedDate || new Date().toISOString(),
            status: initialData?.status || 'Pending',
            items: items,
        };
        onSave(request);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card p-6 rounded-xl shadow-card my-6 animate-fade-in-down">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary-text">{initialData ? 'Edit' : 'New'} Uniform Request</h3>
                <Button type="button" variant="icon" onClick={onCancel} aria-label="Close form"><X /></Button>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="Select Site" {...register('siteId')} required>
                        <option value="">-- Select a Site --</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.shortName}</option>)}
                    </Select>
                    <Select label="Select Uniform Type" {...register('gender')}>
                        <option>Gents</option>
                        <option>Ladies</option>
                    </Select>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {gender === 'Gents' ? (
                        <>
                            <UniformSizeTable title="Gents' Pants" sizes={masterUniforms.gents.pants} headers={[{key:'length',label:'L'},{key:'waist',label:'W'},{key:'hip',label:'H'},{key:'fit',label:'Fit'}]} control={control} quantityType="pantsQuantities" />
                            <UniformSizeTable title="Gents' Shirts" sizes={masterUniforms.gents.shirts} headers={[{key:'length',label:'L'},{key:'sleeves',label:'S'},{key:'chest',label:'C'},{key:'fit',label:'Fit'}]} control={control} quantityType="shirtsQuantities" />
                        </>
                    ) : (
                         <>
                            <UniformSizeTable title="Ladies' Pants" sizes={masterUniforms.ladies.pants} headers={[{key:'length',label:'L'},{key:'waist',label:'W'},{key:'hip',label:'H'},{key:'fit',label:'Fit'}]} control={control} quantityType="pantsQuantities" />
                            {/* FIX: Added missing label properties to headers to match type definition */}
                            <UniformSizeTable title="Ladies' Shirts" sizes={masterUniforms.ladies.shirts} headers={[{key:'length',label:'L'},{key:'sleeves',label:'S'},{key:'bust',label:'B'},{key:'shoulder',label:'Sh'},{key:'fit',label:'Fit'}]} control={control} quantityType="shirtsQuantities" />
                        </>
                    )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Request</Button>
                </div>
            </div>
        </form>
    );
};

const UniformDashboard: React.FC = () => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [requests, setRequests] = useState<UniformRequest[]>([]);
    const [sites, setSites] = useState<Organization[]>([]);
    const [masterUniforms, setMasterUniforms] = useState<{ gents: MasterGentsUniforms, ladies: MasterLadiesUniforms } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editingRequest, setEditingRequest] = useState<UniformRequest | null>(null);
    const [deletingRequest, setDeletingRequest] = useState<UniformRequest | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reqs, sitesData, gentsData, ladiesData] = await Promise.all([
                api.getUniformRequests(),
                api.getOrganizations(),
                api.getMasterGentsUniforms(),
                api.getMasterLadiesUniforms(),
            ]);
            setRequests(reqs);
            setSites(sitesData);
            setMasterUniforms({ gents: gentsData, ladies: ladiesData });
        } catch (e) {
            setToast({ message: 'Failed to load uniform data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNewRequest = () => {
        setEditingRequest(null);
        setView('form');
    };

    const handleEdit = (request: UniformRequest) => {
        setEditingRequest(request);
        setView('form');
    };
    
    const handleSave = async (data: UniformRequest) => {
        try {
            if (data.id.startsWith('new_')) {
                await api.submitUniformRequest(data);
                setToast({ message: 'New request submitted.', type: 'success' });
            } else {
                await api.updateUniformRequest(data);
                setToast({ message: 'Request updated.', type: 'success' });
            }
            setView('list');
            fetchData();
        } catch (e) {
             setToast({ message: 'Failed to save request.', type: 'error' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingRequest) return;
        try {
            await api.deleteUniformRequest(deletingRequest.id);
            setToast({ message: 'Request deleted.', type: 'success' });
            setDeletingRequest(null);
            fetchData();
        } catch (e) {
            setToast({ message: 'Failed to delete request.', type: 'error' });
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
             <Modal isOpen={!!deletingRequest} onClose={() => setDeletingRequest(null)} onConfirm={handleConfirmDelete} title="Confirm Deletion">
                Are you sure you want to delete this uniform request? This cannot be undone.
            </Modal>
            
            <AdminPageHeader title="Uniform Management">
                {view === 'list' && <Button onClick={handleNewRequest}><Plus className="mr-2 h-4 w-4" /> New Uniform Request</Button>}
            </AdminPageHeader>

            {view === 'form' && masterUniforms && (
                <UniformRequestForm
                    onSave={handleSave}
                    onCancel={() => setView('list')}
                    sites={sites}
                    masterUniforms={masterUniforms}
                    initialData={editingRequest}
                />
            )}
            
            {view === 'list' && (
                <div className="overflow-x-auto border border-border rounded-lg bg-card">
                    <table className="min-w-full text-sm">
                        <thead className="bg-page">
                             <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted">Site Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted">Gender</th>
                                <th className="px-4 py-3 text-left font-medium text-muted">Requested Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-4 py-3 font-medium">{req.siteName}</td>
                                    <td className="px-4 py-3 text-muted">{req.gender}</td>
                                    <td className="px-4 py-3 text-muted">{format(new Date(req.requestedDate), 'dd MMM, yyyy')}</td>
                                    <td className="px-4 py-3"><UniformStatusChip status={req.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button variant="icon" size="sm" onClick={() => handleEdit(req)} title="Edit Request"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="icon" size="sm" onClick={() => setDeletingRequest(req)} title="Delete Request"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {requests.length === 0 && <p className="text-center p-8 text-muted">No uniform requests found.</p>}
                </div>
            )}
        </div>
    );
};

export default UniformDashboard;