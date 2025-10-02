
import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { OrganizationDetails, Organization } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormHeader from '../../components/onboarding/FormHeader';
import DatePicker from '../../components/ui/DatePicker';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const organizationDetailsSchema = yup.object({
    designation: yup.string().required('Designation is required'),
    department: yup.string().required('Department is required'),
    reportingManager: yup.string().optional(),
    organizationId: yup.string().required('Organization is required'),
    organizationName: yup.string().required(),
    joiningDate: yup.string().required('Joining date is required'),
    workType: yup.string<OrganizationDetails['workType']>().oneOf(['Full-time', 'Part-time', 'Contract', '']).required('Work type is required'),
    site: yup.string().optional(),
}).defined();

interface OutletContext {
  onValidated: () => Promise<void>;
}

const OrganizationDetails: React.FC = () => {
    const { onValidated } = ReactRouterDOM.useOutletContext<OutletContext>();
    const { user } = useAuthStore();
    const { data, updateOrganization } = useOnboardingStore();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const { register, handleSubmit, formState: { errors }, control, watch, setValue, reset } = useForm<OrganizationDetails>({
        // FIX: Provide explicit generic type to yupResolver to fix type inference issues.
        resolver: yupResolver<OrganizationDetails>(organizationDetailsSchema),
        defaultValues: data.organization,
    });
    
    const selectedOrgId = watch('organizationId');
    const isOrgPreselected = !!data.organization.organizationId;
    const isMobileView = user?.role === 'field_officer' && isMobile;

    useEffect(() => {
        api.getOrganizations().then(setOrganizations);
    }, []);

    useEffect(() => {
        // Sync form with global store data, which might have been pre-filled
        reset(data.organization);
    }, [data.organization, reset]);


    useEffect(() => {
        const selectedOrg = organizations.find(o => o.id === selectedOrgId);
        if (selectedOrg) {
            setValue('organizationName', selectedOrg.shortName);
        }
    }, [selectedOrgId, organizations, setValue]);


    const onSubmit: SubmitHandler<OrganizationDetails> = async (formData) => {
        updateOrganization(formData);
        await onValidated();
    };

    if (isMobileView) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} id="organization-form">
                 <div className="space-y-6">
                    <p className="text-sm text-gray-400">Provide the employment details for the new employee within the organization.</p>
                    <select {...register('organizationId')} className="fo-select fo-select-arrow" disabled={isOrgPreselected}>
                        <option value="">Select Organization</option>
                        {organizations.map(org => <option key={org.id} value={org.id}>{org.shortName}</option>)}
                    </select>
                    {errors.organizationId && <p className="mt-1 text-xs text-red-500">{errors.organizationId.message}</p>}

                    <input placeholder="Designation" {...register('designation')} readOnly className="fo-input bg-gray-700/50 cursor-not-allowed" />
                    <input placeholder="Department" {...register('department')} readOnly className="fo-input bg-gray-700/50 cursor-not-allowed" />
                    <input placeholder="Reporting Manager" {...register('reportingManager')} className="fo-input" />

                    <Controller name="joiningDate" control={control} render={({ field }) => (
                         <input type="date" {...field} className="fo-input" />
                    )} />
                    {errors.joiningDate && <p className="mt-1 text-xs text-red-500">{errors.joiningDate.message}</p>}

                    <select {...register('workType')} className="fo-select fo-select-arrow">
                        <option value="">Select Work Type</option>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                    </select>
                    {errors.workType && <p className="mt-1 text-xs text-red-500">{errors.workType.message}</p>}
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="organization-form">
            <FormHeader title="Organization Details" subtitle="Your employment details within the organization." />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select label="Organization / Client" id="organizationId" error={errors.organizationId?.message} registration={register('organizationId')} disabled={isOrgPreselected}>
                    <option value="">Select Organization</option>
                    {organizations.map(org => <option key={org.id} value={org.id}>{org.shortName}</option>)}
                </Select>
                <Input
                    label="Designation"
                    id="designation"
                    error={errors.designation?.message}
                    registration={register('designation')}
                    readOnly
                    className="bg-page cursor-not-allowed"
                />
                <Input
                    label="Department"
                    id="department"
                    error={errors.department?.message}
                    registration={register('department')}
                    readOnly
                    className="bg-page cursor-not-allowed"
                />
                <Input label="Reporting Manager" id="reportingManager" error={errors.reportingManager?.message} registration={register('reportingManager')} />
                <Controller name="joiningDate" control={control} render={({ field }) => (
                    <DatePicker label="Joining Date" id="joiningDate" error={errors.joiningDate?.message} value={field.value} onChange={field.onChange} />
                 )} />
                <Select label="Work Type" id="workType" error={errors.workType?.message} registration={register('workType')}>
                    <option value="">Select Work Type</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                </Select>
            </div>
        </form>
    );
};

export default OrganizationDetails;
