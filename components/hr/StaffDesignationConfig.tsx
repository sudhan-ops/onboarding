
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '../../services/api';
import type { SiteStaffDesignation } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Toast from '../ui/Toast';
import { Loader2, Plus, Trash2, Save, Upload, Download, FileText } from 'lucide-react';

const CSV_HEADERS = ['Department', 'Designation', 'PermanentId', 'TemporaryId', 'MonthlySalary'];

const toCSV = (data: SiteStaffDesignation[]): string => {
    const header = CSV_HEADERS.join(',');
    const rows = data.map(row => 
        [row.department, row.designation, row.permanentId, row.temporaryId, row.monthlySalary]
        .map(val => {
            const strVal = String(val ?? '');
            if (strVal.includes(',')) return `"${strVal}"`;
            return strVal;
        }).join(',')
    );
    return [header, ...rows].join('\n');
};

const fromCSV = (csvText: string): Partial<SiteStaffDesignation>[] => {
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    if (!CSV_HEADERS.every(h => headers.includes(h))) {
        throw new Error('CSV is missing required headers.');
    }

    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Partial<SiteStaffDesignation> = {};
        headers.forEach((header, index) => {
            if (header === 'Department') row.department = values[index];
            if (header === 'Designation') row.designation = values[index];
            if (header === 'PermanentId') row.permanentId = values[index];
            if (header === 'TemporaryId') row.temporaryId = values[index];
            if (header === 'MonthlySalary') row.monthlySalary = parseFloat(values[index]) || undefined;
        });
        return row;
    });
};

const StaffDesignationConfig: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const importRef = useRef<HTMLInputElement>(null);

    const { register, control, handleSubmit, reset, watch } = useForm<{ designations: SiteStaffDesignation[] }>({
        defaultValues: { designations: [] }
    });
    const { fields, append, remove, replace } = useFieldArray({ control, name: "designations" });

    useEffect(() => {
        setIsLoading(true);
        api.getSiteStaffDesignations()
            .then(data => reset({ designations: data }))
            .catch(() => setToast({ message: 'Failed to load data.', type: 'error' }))
            .finally(() => setIsLoading(false));
    }, [reset]);
    
    const watchedFields = watch("designations");

    const groupedDesignations = useMemo(() => {
        // FIX: Guard against watchedFields not being an array to prevent runtime errors.
        if (!Array.isArray(watchedFields)) {
            return {};
        }
        return watchedFields.reduce((acc, field, index) => {
            const department = field.department || 'Uncategorized';
            if (!acc[department]) {
                acc[department] = [];
            }
            acc[department].push({ ...field, originalIndex: index });
            return acc;
        }, {} as Record<string, (SiteStaffDesignation & { originalIndex: number })[]>);
    }, [watchedFields]);

    const handleAddRow = () => {
        append({ id: `new_${Date.now()}`, department: '', designation: '', permanentId: '', temporaryId: '', monthlySalary: undefined });
    };

    const handleSave = async (data: { designations: SiteStaffDesignation[] }) => {
        try {
            await api.updateSiteStaffDesignations(data.designations);
            setToast({ message: 'Configuration saved successfully.', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to save configuration.', type: 'error' });
        }
    };
    
    const handleExport = () => {
        // FIX: Add a type guard to ensure `watchedFields` is an array before processing it.
        if (!Array.isArray(watchedFields) || watchedFields.length === 0) {
            setToast({ message: 'No data to export.', type: 'error' });
            return;
        }
        const csvData = toCSV(watchedFields);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'site_staff_designations.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const csvString = CSV_HEADERS.join(',');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'site_staff_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsedData = fromCSV(text);
                const newSeries = parsedData.map(d => ({
                    id: `imported_${Date.now()}_${Math.random()}`,
                    department: d.department || '',
                    designation: d.designation || '',
                    permanentId: d.permanentId || '',
                    temporaryId: d.temporaryId || '',
                    monthlySalary: d.monthlySalary ? parseFloat(String(d.monthlySalary)) : undefined,
                }));
                replace(newSeries);
                setToast({ message: `Imported ${newSeries.length} records.`, type: 'success' });
            } catch (error: any) {
                setToast({ message: error.message || 'Failed to import CSV.', type: 'error' });
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <form onSubmit={handleSubmit(handleSave)} className="bg-card p-6 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <input type="file" ref={importRef} className="hidden" accept=".csv" onChange={handleFileImport} />

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-semibold text-primary-text">Site Staff Designation & ID Series</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button type="button" variant="outline" onClick={handleDownloadTemplate}><FileText className="mr-2 h-4 w-4" /> Template</Button>
                    <Button type="button" variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button type="button" variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save</Button>
                </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-page">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted">Department</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Designation</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Permanent Staff - ID</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Temporary/Contract Staff - ID</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Monthly Salary (Gross)</th>
                            <th className="px-4 py-3 text-left font-medium text-muted"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {Object.entries(groupedDesignations).map(([department, items]) => (
                            <React.Fragment key={department}>
                                {/* FIX: Ensure items is an array before calling map and accessing length */}
                                {Array.isArray(items) && items.map((item, itemIndex) => (
                                    <tr key={item.id}>
                                        {itemIndex === 0 && (
                                            <td className="px-4 py-2 align-top" rowSpan={items.length}>
                                                <Input aria-label={`Department for ${department}`} id={`designations.${item.originalIndex}.department`} {...register(`designations.${item.originalIndex}.department`)} className="font-semibold" />
                                            </td>
                                        )}
                                        <td className="px-4 py-2"><Input aria-label={`Designation for ${department}`} id={`designations.${item.originalIndex}.designation`} {...register(`designations.${item.originalIndex}.designation`)} /></td>
                                        <td className="px-4 py-2"><Input aria-label={`Permanent ID for ${item.designation}`} id={`designations.${item.originalIndex}.permanentId`} {...register(`designations.${item.originalIndex}.permanentId`)} /></td>
                                        <td className="px-4 py-2"><Input aria-label={`Temporary ID for ${item.designation}`} id={`designations.${item.originalIndex}.temporaryId`} {...register(`designations.${item.originalIndex}.temporaryId`)} /></td>
                                        <td className="px-4 py-2"><Input type="number" aria-label={`Monthly Salary for ${item.designation}`} id={`designations.${item.originalIndex}.monthlySalary`} {...register(`designations.${item.originalIndex}.monthlySalary`, { valueAsNumber: true })} /></td>
                                        <td className="px-4 py-2 text-right">
                                            <Button type="button" variant="icon" size="sm" onClick={() => remove(item.originalIndex)} aria-label={`Remove ${item.designation}`} title={`Remove ${item.designation}`}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <Button type="button" onClick={handleAddRow} variant="outline" className="mt-4"><Plus className="mr-2 h-4 w-4" /> Add Designation</Button>
        </form>
    );
};

export default StaffDesignationConfig;