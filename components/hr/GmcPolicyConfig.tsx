


import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useSettingsStore } from '../../store/settingsStore';
import type { GmcPolicySettings } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Toast from '../ui/Toast';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Save, Upload, Download, FileText } from 'lucide-react';

const CSV_HEADERS = ['Applicability', 'OptInDisclaimer', 'CoverageDetails', 'OptOutDisclaimer', 'RequireAlternateInsurance', 'CollectProvider', 'CollectStartDate', 'CollectEndDate', 'CollectExtentOfCover'];

const initialGmcPolicy: GmcPolicySettings = {
  applicability: 'Optional - Opt-in Default', optInDisclaimer: '', coverageDetails: '',
  optOutDisclaimer: '', requireAlternateInsurance: false, collectProvider: false,
  collectStartDate: false, collectEndDate: false, collectExtentOfCover: false
};

const toCSV = (data: GmcPolicySettings): string => {
    const headers = CSV_HEADERS.join(',');
    const values = CSV_HEADERS.map(header => {
        const key = header.charAt(0).toLowerCase() + header.slice(1);
        let val = data[key as keyof GmcPolicySettings];
        if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    });
    return [headers, values.join(',')].join('\n');
};

const fromCSV = (csvText: string): Partial<GmcPolicySettings> => {
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    if (lines.length < 2) throw new Error("CSV file must have a header and at least one data row.");
    
    const headers = lines[0].split(',').map(h => h.trim());
    const values = lines[1].match(/(?<=,|^)(?:"(?:[^"]|"")*"|[^,]*)/g) || [];

    const data: Partial<GmcPolicySettings> = {};
    headers.forEach((header, index) => {
        const key = (header.charAt(0).toLowerCase() + header.slice(1)) as keyof GmcPolicySettings;
        let value = (values[index] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
        }
        
        if (key === 'applicability') {
            data[key] = value as GmcPolicySettings['applicability'];
        } else if (typeof initialGmcPolicy[key] === 'boolean') {
            (data[key] as any) = value.toLowerCase() === 'true';
        } else {
            (data[key] as any) = value;
        }
    });
    return data;
};


const Checkbox: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, ...props }) => (
    <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent" {...props} />
        {label}
    </label>
);

export const GmcPolicyConfig: React.FC = () => {
    const { gmcPolicy, updateGmcPolicySettings } = useSettingsStore();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const importRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, control, watch, reset, formState: { isDirty } } = useForm<GmcPolicySettings>({
        defaultValues: gmcPolicy,
    });
    
    useEffect(() => {
        reset(gmcPolicy);
    }, [gmcPolicy, reset]);

    const requireAlternateInsurance = watch('requireAlternateInsurance');
    const isGmcMandatory = watch('applicability') === 'Mandatory';

    const handleSave = (data: GmcPolicySettings) => {
        updateGmcPolicySettings(data);
        setToast({ message: 'GMC policy settings saved.', type: 'success' });
    };

    const handleExport = () => {
        const csvData = toCSV(gmcPolicy);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'gmc_policy_settings.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const csvString = CSV_HEADERS.join(',');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'gmc_policy_template.csv');
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
                reset(parsedData);
                setToast({ message: 'Settings imported. Review and save.', type: 'success' });
            } catch (error: any) {
                setToast({ message: error.message || 'Failed to import CSV.', type: 'error' });
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <form onSubmit={handleSubmit(handleSave)} className="bg-card p-6 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <input type="file" ref={importRef} className="hidden" accept=".csv" onChange={handleFileImport} />

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-semibold text-primary-text">Group Medical Cover (GMC) Policy</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button type="button" variant="outline" onClick={handleDownloadTemplate}><FileText className="mr-2 h-4 w-4" /> Template</Button>
                    <Button type="button" variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button type="button" variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                    <Button type="submit" disabled={!isDirty}><Save className="mr-2 h-4 w-4" /> Save</Button>
                </div>
            </div>

            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Select label="GMC Applicability" {...register('applicability')} disabled={isGmcMandatory}>
                        <option>Mandatory</option>
                        <option>Optional - Opt-in Default</option>
                        <option>Optional - Opt-out Default</option>
                    </Select>
                     <Input label="Coverage Details" placeholder="e.g. Spouse and two children" {...register('coverageDetails')} />
                </div>

                <fieldset className="border p-4 rounded-lg space-y-4">
                    <legend className="px-2 font-semibold">Opt-In Details</legend>
                    <div>
                         <label className="block text-sm font-medium text-muted">Opt-In Disclaimer</label>
                         <textarea {...register('optInDisclaimer')} rows={4} className="mt-1 form-input" />
                         <p className="text-xs text-muted mt-1">This message is shown when an employee chooses to opt in to the GMC plan.</p>
                    </div>
                </fieldset>

                 <fieldset className="border p-4 rounded-lg space-y-4">
                    <legend className="px-2 font-semibold">Opt-Out Details</legend>
                    <div>
                         <label className="block text-sm font-medium text-muted">Opt-Out Disclaimer</label>
                         <textarea {...register('optOutDisclaimer')} rows={4} className="mt-1 form-input" />
                         <p className="text-xs text-muted mt-1">This message is shown when an employee chooses to opt out of the GMC plan.</p>
                    </div>
                     <Controller
                        name="requireAlternateInsurance"
                        control={control}
                        render={({ field }) => (
                           <ToggleSwitch
                                id="requireAlternateInsurance"
                                label="Require Proof of Alternate Insurance for Opt-Out"
                                description="If enabled, employees opting out must provide details of their existing insurance."
                                checked={field.value}
                                onChange={field.onChange}
                            />
                        )}
                     />
                     <div className={`pl-6 border-l-2 ml-2 space-y-3 transition-opacity ${!requireAlternateInsurance ? 'opacity-50 pointer-events-none' : ''}`}>
                        <p className="text-sm font-medium">Collect the following details:</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            <Controller name="collectProvider" control={control} render={({ field }) => <Checkbox label="Insurance Provider" checked={field.value} onChange={field.onChange} />} />
                            <Controller name="collectStartDate" control={control} render={({ field }) => <Checkbox label="Policy Start Date" checked={field.value} onChange={field.onChange} />} />
                            <Controller name="collectEndDate" control={control} render={({ field }) => <Checkbox label="Policy End Date" checked={field.value} onChange={field.onChange} />} />
                            <Controller name="collectExtentOfCover" control={control} render={({ field }) => <Checkbox label="Extent of Cover" checked={field.value} onChange={field.onChange} />} />
                        </div>
                     </div>
                </fieldset>
            </div>
        </form>
    );
};
